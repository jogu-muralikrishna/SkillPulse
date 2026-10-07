/**
 * ============================================================================
 * SKILLPULSE GEMINI EMBEDDING SERVICE
 * ============================================================================
 * Model: gemini-embedding-2
 * Default Dimensionality: 768
 * 
 * Capabilities:
 * 1. Embeds arbitrary text using official @google/genai SDK.
 * 2. Deterministic hierarchical text formatting for NCO-2015 occupations.
 * 3. Batch embedding with chunking, exponential backoff retries, and rate-limit handling.
 * 4. Local caching in `data/derived/nco-embeddings.json` with hash-based change detection.
 * 5. Safe API key resolution from environment without hardcoding or logging keys.
 * 6. Vector math utilities including cosine similarity and dimensional validation.
 * ============================================================================
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Load environment variables (.env if present)
dotenv.config();

export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2';
export const DEFAULT_DIMENSIONALITY = 768;

export interface EmbeddingOptions {
  model?: string;
  outputDimensionality?: number;
}

export interface BatchEmbeddingOptions extends EmbeddingOptions {
  batchSize?: number;
  delayMsBetweenBatches?: number;
  maxRetries?: number;
  maxInputsPerMinute?: number;
  onProgress?: (processed: number, total: number) => void;
}

export interface NcoEmbeddingEntry {
  code: string;
  textHash: string;
  vector: number[];
}

export interface NcoEmbeddingsCacheFile {
  model: string;
  dimensionality: number;
  catalogueVersion: string;
  catalogueSource: string;
  catalogueSha256: string;
  textRepresentationFormat: string;
  generatedAt: string;
  updatedAt: string;
  totalRecords: number;
  embeddings: Record<string, NcoEmbeddingEntry>;
}

export interface CacheValidationResult {
  valid: boolean;
  totalRecords: number;
  expectedRecords: number;
  errors: string[];
}

/**
 * Resolves the Gemini API key from environment configuration without exposing it.
 */
export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || key.trim().length === 0) {
    return null;
  }
  return key.trim();
}

/**
 * Returns true if a valid Gemini API key is configured in the environment.
 */
export function isGeminiApiKeyAvailable(): boolean {
  return getGeminiApiKey() !== null;
}

/**
 * Returns a configured GoogleGenAI instance.
 * Throws a safe, clear error if the API key is missing.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in the environment or .env file. Please configure GEMINI_API_KEY to generate embeddings.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'skillpulse/gemini-embedding-service'
      }
    }
  });
}

/**
 * Deterministic text formatting for an NCO-2015 occupation record.
 * Formats hierarchy from Title down through Division so that the embedding
 * captures full occupational semantic context.
 */
export function formatOccupationForEmbedding(occ: {
  title: string;
  family?: string;
  group?: string;
  subDivision?: string;
  division?: string;
}): string {
  const lines = [
    `Title: ${occ.title.trim()}`,
    occ.family ? `Family: ${occ.family.trim()}` : '',
    occ.group ? `Group: ${occ.group.trim()}` : '',
    occ.subDivision ? `Sub-Division: ${occ.subDivision.trim()}` : '',
    occ.division ? `Division: ${occ.division.trim()}` : ''
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Computes a deterministic 16-character SHA-256 hash of a text string
 * used to detect changes in occupational hierarchy or titles.
 */
export function computeTextHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Validates that an embedding vector has the expected dimensionality and finite numeric values.
 */
export function validateVector(vector: number[], expectedDimensionality: number = DEFAULT_DIMENSIONALITY): void {
  if (!Array.isArray(vector)) {
    throw new Error('Embedding vector must be an array of numbers');
  }
  if (vector.length !== expectedDimensionality) {
    throw new Error(`Embedding dimensionality mismatch: expected ${expectedDimensionality}, got ${vector.length}`);
  }
  for (let i = 0; i < vector.length; i++) {
    const val = vector[i];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Non-finite numeric value at index ${i}: ${val}`);
    }
  }
}

/**
 * Calculates cosine similarity between two numeric vectors.
 * Returns a floating point number between -1.0 and 1.0.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimension mismatch in cosineSimilarity: ${vecA.length} vs ${vecB.length}`);
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  return dotProduct / magnitude;
}

/**
 * Embeds a single arbitrary text string using gemini-embedding-2 (768 dimensions by default).
 */
export async function embedText(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
  const model = options.model || DEFAULT_EMBEDDING_MODEL;
  const dimensionality = options.outputDimensionality || DEFAULT_DIMENSIONALITY;

  const ai = getGeminiClient();

  const response = await ai.models.embedContent({
    model,
    contents: text,
    config: {
      outputDimensionality: dimensionality
    }
  });

  let vector: number[] | undefined;
  if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
    vector = response.embeddings[0].values;
  } else if ((response as any).embedding?.values) {
    vector = (response as any).embedding.values;
  }

  if (!vector || !Array.isArray(vector)) {
    throw new Error('Gemini API returned empty or invalid embedding vector response');
  }

  validateVector(vector, dimensionality);
  return vector;
}

/**
 * Sliding window rate limiter to constrain API inputs/requests per minute.
 * Ensures that any rolling 60-second window never exceeds maxInputsPerMinute.
 */
export class RateLimiter {
  private maxInputsPerMinute: number;
  private history: Array<{ timestamp: number; count: number }> = [];

  constructor(maxInputsPerMinute: number = 80) {
    this.maxInputsPerMinute = maxInputsPerMinute;
  }

  async acquire(count: number, onWait?: (waitSeconds: number) => void): Promise<void> {
    while (true) {
      const now = Date.now();
      // Purge entries older than 60 seconds
      this.history = this.history.filter((entry) => now - entry.timestamp < 60000);
      const currentInputsInWindow = this.history.reduce((sum, entry) => sum + entry.count, 0);

      if (currentInputsInWindow + count <= this.maxInputsPerMinute) {
        this.history.push({ timestamp: Date.now(), count });
        return;
      }

      // Calculate time until oldest entry in the window expires
      const oldest = this.history[0];
      const waitMs = Math.max(500, 60000 - (now - oldest.timestamp) + 200);
      const waitSec = Math.ceil(waitMs / 1000);
      if (onWait) {
        onWait(waitSec);
      }
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

/**
 * Batch-embeds an array of text strings with chunking, backoff retries, and rate-limit handling.
 */
export async function embedBatch(
  texts: string[],
  options: BatchEmbeddingOptions = {}
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const model = options.model || DEFAULT_EMBEDDING_MODEL;
  const dimensionality = options.outputDimensionality || DEFAULT_DIMENSIONALITY;
  const batchSize = options.batchSize || 50;
  const delayMs = options.delayMsBetweenBatches ?? 200;
  const maxRetries = options.maxRetries || 3;
  const maxInputsPerMinute = options.maxInputsPerMinute ?? 80;
  const limiter = new RateLimiter(maxInputsPerMinute);

  const ai = getGeminiClient();
  const allVectors: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    let attempt = 0;
    let success = false;
    let chunkVectors: number[][] = [];

    // Throttle via sliding window rate limiter before dispatching API call
    await limiter.acquire(chunk.length);

    while (!success && attempt <= maxRetries) {
      try {
        const response = await ai.models.embedContent({
          model,
          contents: chunk.map((text) => ({
            parts: [{ text }]
          })),
          config: {
            outputDimensionality: dimensionality
          }
        });

        if (response.embeddings && Array.isArray(response.embeddings)) {
          chunkVectors = response.embeddings.map((e) => {
            if (!e.values) throw new Error('Missing values in response embedding item');
            return e.values;
          });
        } else if ((response as any).embedding?.values && chunk.length === 1) {
          chunkVectors = [(response as any).embedding.values];
        } else {
          throw new Error('Unexpected response format from batchEmbedContents');
        }

        if (chunkVectors.length !== chunk.length) {
          throw new Error(
            `Mismatch between requested chunk size (${chunk.length}) and returned embeddings (${chunkVectors.length})`
          );
        }

        for (const vec of chunkVectors) {
          validateVector(vec, dimensionality);
        }

        success = true;
      } catch (err: any) {
        const isRateLimit =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED');

        if (isRateLimit) {
          // Immediately stop and throw on quota exhaustion - do not waste retries
          throw new Error(
            `QUOTA_EXHAUSTED: Gemini API rate limit or quota exceeded (429 RESOURCE_EXHAUSTED). Stopping immediately without wasting retries.`
          );
        }

        attempt++;
        if (attempt <= maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(
            `[EmbeddingService] Batch ${Math.floor(i / batchSize) + 1} attempt ${attempt} failed. Retrying in ${Math.round(backoff)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        } else {
          throw new Error(`Batch embedding failed after ${maxRetries} retries: ${err?.message || err}`);
        }
      }
    }

    allVectors.push(...chunkVectors);

    if (options.onProgress) {
      options.onProgress(allVectors.length, texts.length);
    }

    if (i + batchSize < texts.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allVectors;
}

/**
 * Loads cached NCO embeddings from JSON file. Returns null if file does not exist.
 */
export function loadCachedEmbeddings(filePath?: string): NcoEmbeddingsCacheFile | null {
  const targetPath = filePath || path.resolve(process.cwd(), 'data/derived/nco-embeddings.json');
  if (!fs.existsSync(targetPath)) return null;

  try {
    const raw = fs.readFileSync(targetPath, 'utf-8');
    return JSON.parse(raw) as NcoEmbeddingsCacheFile;
  } catch (err) {
    console.warn(`[EmbeddingService] Failed to parse cache file at ${targetPath}:`, err);
    return null;
  }
}

/**
 * Saves NCO embeddings cache to JSON file.
 */
export function saveCachedEmbeddings(cache: NcoEmbeddingsCacheFile, filePath?: string): void {
  const targetPath = filePath || path.resolve(process.cwd(), 'data/derived/nco-embeddings.json');
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(targetPath, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Validates the contents of an NCO embeddings cache file against the occupations catalogue.
 */
export function validateEmbeddingCache(
  cache: NcoEmbeddingsCacheFile,
  catalogueOccupations: Array<{ code: string }>
): CacheValidationResult {
  const errors: string[] = [];
  const expectedCodes = new Set(catalogueOccupations.map((o) => o.code));
  const cachedCodes = Object.keys(cache.embeddings || {});

  if (cache.dimensionality !== DEFAULT_DIMENSIONALITY) {
    errors.push(`Cache dimensionality ${cache.dimensionality} !== expected ${DEFAULT_DIMENSIONALITY}`);
  }

  if (cache.model !== DEFAULT_EMBEDDING_MODEL) {
    errors.push(`Cache model '${cache.model}' !== expected '${DEFAULT_EMBEDDING_MODEL}'`);
  }

  for (const code of cachedCodes) {
    if (!expectedCodes.has(code)) {
      errors.push(`Cached code '${code}' not found in NCO-2015 occupations catalogue.`);
    }
    const entry = cache.embeddings[code];
    if (!entry || !entry.vector) {
      errors.push(`Missing embedding vector for code '${code}'.`);
      continue;
    }
    if (entry.vector.length !== cache.dimensionality) {
      errors.push(
        `Vector dimensionality mismatch for '${code}': got ${entry.vector.length}, expected ${cache.dimensionality}`
      );
    }
    for (let i = 0; i < entry.vector.length; i++) {
      if (!Number.isFinite(entry.vector[i])) {
        errors.push(`Non-finite value at index ${i} for code '${code}'`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    totalRecords: cachedCodes.length,
    expectedRecords: expectedCodes.size,
    errors
  };
}
