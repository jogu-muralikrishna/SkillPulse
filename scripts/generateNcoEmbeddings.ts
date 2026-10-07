/**
 * ============================================================================
 * SKILLPULSE NCO-2015 EMBEDDING GENERATOR & LOCAL CACHE PIPELINE
 * ============================================================================
 * Model: gemini-embedding-2
 * Output Dimensionality: 768
 * Output Target: data/derived/nco-embeddings.json
 * 
 * Behavior:
 * 1. Reads normalized NCO-2015 occupations from data/nco2015/occupations.json.
 * 2. Checks data/derived/nco-embeddings.json for existing cached embeddings.
 * 3. Identifies occupations that are already cached vs pending generation
 *    using deterministic text hashing.
 * 4. Batches pending titles with exponential backoff and rate-limit handling.
 * 5. Periodically checkpoints to disk for resumability.
 * 6. Validates vectors (768 dimensions, finite floats, code matching).
 * 7. Safely checks for GEMINI_API_KEY without leaking or hard-coding secrets.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_DIMENSIONALITY,
  NcoEmbeddingsCacheFile,
  formatOccupationForEmbedding,
  computeTextHash,
  loadCachedEmbeddings,
  saveCachedEmbeddings,
  validateEmbeddingCache,
  validateVector,
  isGeminiApiKeyAvailable,
  getGeminiClient,
  RateLimiter,
  BatchEmbeddingOptions
} from '../src/utils/embeddingService';

interface NcoOccupationInput {
  code: string;
  title: string;
  division?: string;
  subDivision?: string;
  group?: string;
  family?: string;
  classification?: string;
}

function computeFileSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function runEmbeddingPipeline() {
  console.log('================================================================');
  console.log(' SKILLPULSE NCO-2015 EMBEDDING & CACHE PIPELINE');
  console.log(` Model: ${DEFAULT_EMBEDDING_MODEL} | Dimensions: ${DEFAULT_DIMENSIONALITY}`);
  console.log('================================================================\n');

  const cataloguePath = path.resolve(process.cwd(), 'data/nco2015/occupations.json');
  const cachePath = path.resolve(process.cwd(), 'data/derived/nco-embeddings.json');

  if (!fs.existsSync(cataloguePath)) {
    throw new Error(
      `NCO-2015 catalogue file not found at ${cataloguePath}. Please run 'npm run nco:import' first.`
    );
  }

  // 1. Read catalogue and compute hash
  const rawCatalogue = fs.readFileSync(cataloguePath, 'utf-8');
  const occupations: NcoOccupationInput[] = JSON.parse(rawCatalogue);
  const catalogueSha256 = computeFileSha256(cataloguePath);
  console.log(`📋 [CATALOGUE] Loaded ${occupations.length} occupations from ${path.basename(cataloguePath)}`);
  console.log(`   SHA-256: ${catalogueSha256}\n`);

  // 2. Read or initialize cache
  let cache = loadCachedEmbeddings(cachePath);
  const isNewCache = !cache;

  if (!cache) {
    console.log(`🆕 [CACHE] No existing cache file found at ${cachePath}. Initializing new cache...`);
    cache = {
      model: DEFAULT_EMBEDDING_MODEL,
      dimensionality: DEFAULT_DIMENSIONALITY,
      catalogueVersion: 'NCO-2015',
      catalogueSource: 'data/nco2015/occupations.json',
      catalogueSha256,
      textRepresentationFormat:
        'Title: {title}\\nFamily: {family}\\nGroup: {group}\\nSub-Division: {subDivision}\\nDivision: {division}',
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalRecords: 0,
      embeddings: {}
    };
  } else {
    console.log(`📂 [CACHE] Loaded existing cache file (${Object.keys(cache.embeddings || {}).length} records).`);
    // Check if model or dimensionality changed
    if (cache.model !== DEFAULT_EMBEDDING_MODEL || cache.dimensionality !== DEFAULT_DIMENSIONALITY) {
      console.warn(
        `⚠️  [CACHE] Model or dimensionality mismatch in existing cache (${cache.model}/${cache.dimensionality} vs ${DEFAULT_EMBEDDING_MODEL}/${DEFAULT_DIMENSIONALITY}). Invalidating cache.`
      );
      cache.model = DEFAULT_EMBEDDING_MODEL;
      cache.dimensionality = DEFAULT_DIMENSIONALITY;
      cache.embeddings = {};
    }
  }

  // 3. Reconcile catalogue with cache
  const pendingOccupations: { occ: NcoOccupationInput; formattedText: string; textHash: string }[] = [];
  let reusedCount = 0;

  for (const occ of occupations) {
    const formattedText = formatOccupationForEmbedding(occ);
    const textHash = computeTextHash(formattedText);

    const existing = cache.embeddings[occ.code];
    if (
      existing &&
      existing.textHash === textHash &&
      Array.isArray(existing.vector) &&
      existing.vector.length === DEFAULT_DIMENSIONALITY
    ) {
      reusedCount++;
    } else {
      pendingOccupations.push({ occ, formattedText, textHash });
    }
  }

  console.log(`📊 [RECONCILIATION SUMMARY]`);
  console.log(`   • Total catalogue occupations : ${occupations.length}`);
  console.log(`   • Reused from existing cache  : ${reusedCount}`);
  console.log(`   • Pending embedding generation : ${pendingOccupations.length}\n`);

  // 4. If all records are cached and up to date
  if (pendingOccupations.length === 0) {
    console.log(`✅ [IDEMPOTENCY] All ${occupations.length} occupations are up-to-date in cache. No API calls required.`);
    validateAndFinish(cache, occupations, cachePath, reusedCount, 0, 0);
    return;
  }

  // 5. Check API key availability for pending records
  const apiKeyAvailable = isGeminiApiKeyAvailable();
  if (!apiKeyAvailable) {
    console.log('----------------------------------------------------------------');
    console.log('⚠️  [NOTICE] GEMINI_API_KEY is not configured in environment or .env.');
    console.log('   Generating live embeddings from Gemini API requires a valid API key.');
    console.log(`   Status: ${reusedCount} cached, ${pendingOccupations.length} pending.`);
    console.log('----------------------------------------------------------------\n');

    // Save the initialized cache file to disk so data/derived/nco-embeddings.json exists
    if (isNewCache || !fs.existsSync(cachePath)) {
      saveCachedEmbeddings(cache, cachePath);
      console.log(`💾 [INITIALIZED] Created cache file manifest at ${cachePath}`);
    }

    validateAndFinish(cache, occupations, cachePath, reusedCount, 0, 0, true);
    return;
  }

  // 6. Generate embeddings for pending records in batches
  console.log(`🚀 [GENERATING] Starting batch embedding for ${pendingOccupations.length} occupations...`);
  const BATCH_SIZE = 40; // 40 inputs per batch for smooth rate limiting
  const MAX_INPUTS_PER_MINUTE = 80; // Safety margin below the 100 requests/minute free-tier limit
  const MAX_RETRIES = 3;
  let newlyGeneratedCount = 0;
  let apiErrorsCount = 0;

  const limiter = new RateLimiter(MAX_INPUTS_PER_MINUTE);
  const ai = getGeminiClient();

  for (let i = 0; i < pendingOccupations.length; i += BATCH_SIZE) {
    const chunk = pendingOccupations.slice(i, i + BATCH_SIZE);
    const chunkTexts = chunk.map((p) => p.formattedText);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pendingOccupations.length / BATCH_SIZE);

    // Throttle via sliding window rate limiter before dispatching API call
    await limiter.acquire(chunk.length, (waitSec) => {
      console.log(
        `\n⏳ [RATE LIMITER] Waiting ${waitSec}s to maintain <= ${MAX_INPUTS_PER_MINUTE} inputs/min before batch ${batchNumber}/${totalBatches}...`
      );
    });

    let attempt = 0;
    let success = false;
    let chunkVectors: number[][] = [];

    while (!success && attempt <= MAX_RETRIES) {
      try {
        const response = await ai.models.embedContent({
          model: DEFAULT_EMBEDDING_MODEL,
          contents: chunkTexts.map((text) => ({
            parts: [{ text }]
          })),
          config: {
            outputDimensionality: DEFAULT_DIMENSIONALITY
          }
        });

        if (response.embeddings && Array.isArray(response.embeddings)) {
          chunkVectors = response.embeddings.map((e) => {
            if (!e.values) throw new Error('Missing vector values in response item');
            return e.values;
          });
        } else if ((response as any).embedding?.values && chunk.length === 1) {
          chunkVectors = [(response as any).embedding.values];
        } else {
          throw new Error('Unexpected response format from Gemini embedContent');
        }

        if (chunkVectors.length !== chunk.length) {
          throw new Error(
            `Mismatch between chunk size (${chunk.length}) and returned vectors (${chunkVectors.length})`
          );
        }

        for (const vec of chunkVectors) {
          validateVector(vec, DEFAULT_DIMENSIONALITY);
        }

        success = true;
      } catch (err: any) {
        apiErrorsCount++;
        const isRateLimit =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('QUOTA_EXHAUSTED') ||
          err?.message?.includes('quota');

        if (isRateLimit) {
          console.warn(`\n🛑 [QUOTA EXHAUSTED] Gemini API rate limit or quota reached (429 RESOURCE_EXHAUSTED).`);
          console.warn(`   Immediately checkpointing to disk and stopping without wasting retries.`);
          cache.totalRecords = Object.keys(cache.embeddings).length;
          cache.updatedAt = new Date().toISOString();
          saveCachedEmbeddings(cache, cachePath);
          console.log(
            `💾 [CHECKPOINT SAVED] Current cache: ${cache.totalRecords}/${occupations.length} records saved to ${cachePath}`
          );
          console.log(`   You can safely resume later by running 'npm run nco:embed'.\n`);
          validateAndFinish(cache, occupations, cachePath, reusedCount, newlyGeneratedCount, apiErrorsCount, false);
          return;
        }

        attempt++;
        if (attempt <= MAX_RETRIES) {
          const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(
            `   ⚠️ Batch ${batchNumber} transient failure (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${Math.round(
              backoff
            )}ms...`
          );
          await new Promise((res) => setTimeout(res, backoff));
        } else {
          cache.totalRecords = Object.keys(cache.embeddings).length;
          cache.updatedAt = new Date().toISOString();
          saveCachedEmbeddings(cache, cachePath);
          throw new Error(
            `Batch ${batchNumber} failed after ${MAX_RETRIES} retries: ${err?.message || err}. Checkpoint saved.`
          );
        }
      }
    }

    // Store returned vectors
    for (let j = 0; j < chunk.length; j++) {
      const { occ, textHash } = chunk[j];
      const vector = chunkVectors[j];
      cache.embeddings[occ.code] = {
        code: occ.code,
        textHash,
        vector
      };
      newlyGeneratedCount++;
    }

    const totalCachedNow = Object.keys(cache.embeddings).length;
    const remainingCount = occupations.length - totalCachedNow;
    const progressPercent = ((totalCachedNow / occupations.length) * 100).toFixed(1);
    const etaMinutes = Math.ceil(remainingCount / MAX_INPUTS_PER_MINUTE);

    console.log(
      `📊 [PROGRESS] ${progressPercent}% completed | Cached: ${reusedCount} | Generated: ${newlyGeneratedCount} | Remaining: ${remainingCount} | ETA: ~${etaMinutes}m`
    );
    console.log(`   Batch ${batchNumber}/${totalBatches} (${chunk.length} items) processed.`);

    // Checkpoint to disk after every batch so progress is never lost
    cache.totalRecords = totalCachedNow;
    cache.updatedAt = new Date().toISOString();
    saveCachedEmbeddings(cache, cachePath);
  }

  console.log('\n');

  // Final cache save
  cache.totalRecords = Object.keys(cache.embeddings).length;
  cache.updatedAt = new Date().toISOString();
  saveCachedEmbeddings(cache, cachePath);
  console.log(`💾 [SAVED] Updated cache at ${cachePath} (${cache.totalRecords} total records).`);

  validateAndFinish(cache, occupations, cachePath, reusedCount, newlyGeneratedCount, apiErrorsCount);
}

function validateAndFinish(
  cache: NcoEmbeddingsCacheFile,
  occupations: NcoOccupationInput[],
  cachePath: string,
  reusedCount: number,
  newlyGeneratedCount: number,
  apiErrorsCount: number,
  missingApiKeyNotice: boolean = false
) {
  console.log('\n🔎 [VALIDATION] Verifying embeddings cache...');
  const validation = validateEmbeddingCache(cache, occupations);

  if (validation.errors.length > 0) {
    console.error(`❌ Cache validation found ${validation.errors.length} issues:`);
    for (const err of validation.errors.slice(0, 10)) {
      console.error(`   - ${err}`);
    }
    if (validation.errors.length > 10) {
      console.error(`   ... and ${validation.errors.length - 10} more.`);
    }
  } else {
    console.log(`   ✅ Cache validation PASSED (${validation.totalRecords} valid vectors verified).`);
    console.log(`   ✅ Dimensionality: ${DEFAULT_DIMENSIONALITY}`);
    console.log(`   ✅ Zero duplicate NCO codes.`);
    console.log(`   ✅ All vectors contain finite numeric values.`);
  }

  console.log('\n================================================================');
  console.log(' EMBEDDING PIPELINE SUMMARY');
  console.log('================================================================');
  console.log(` • Embedding Model          : ${DEFAULT_EMBEDDING_MODEL}`);
  console.log(` • Output Dimensionality    : ${DEFAULT_DIMENSIONALITY}`);
  console.log(` • Total NCO Occupations    : ${occupations.length}`);
  console.log(` • Reused from Cache        : ${reusedCount}`);
  console.log(` • Newly Generated          : ${newlyGeneratedCount}`);
  console.log(` • API Errors / Retries     : ${apiErrorsCount}`);
  console.log(` • Cache File Location      : ${cachePath}`);
  console.log(` • Cache Status             : ${validation.valid ? 'VALID' : 'REQUIRES_ATTENTION'}`);
  if (missingApiKeyNotice) {
    console.log(` • Notice                   : GEMINI_API_KEY required for live embedding generation.`);
  }
  console.log('================================================================\n');
}

runEmbeddingPipeline().catch((err) => {
  console.error('\n❌ EMBEDDING PIPELINE FAILED:', err.message || err);
  process.exit(1);
});
