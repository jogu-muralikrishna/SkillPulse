/**
 * ============================================================================
 * SKILLPULSE NCO-2015 SEMANTIC SKILL MATCHING SERVICE
 * ============================================================================
 * Responsibilities:
 * 1. Loads official NCO-2015 catalogue and local Gemini 768-dim embeddings cache.
 * 2. Caches raw skill query embeddings in `data/derived/skill-embeddings.json`.
 * 3. Compares raw skill embeddings against 3,445 NCO occupations via cosine similarity.
 * 4. Determines match status:
 *      confidence >= 0.75 => "accepted"
 *      confidence <  0.75 => "needs_review"
 * 5. Returns rich provenance: NCO code, title, family, actual similarity, provider, source.
 * 6. Precomputes vector norms in-memory for microsecond-scale similarity evaluation.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_DIMENSIONALITY,
  embedText,
  embedBatch,
  validateVector,
  cosineSimilarity,
  isGeminiApiKeyAvailable,
  computeTextHash
} from './embeddingService';

import { MATCH_ACCEPTANCE_THRESHOLD, classifyMatchStatus } from '../types';
export { MATCH_ACCEPTANCE_THRESHOLD, classifyMatchStatus };
export const EMBEDDING_PROVIDER = 'gemini';

export interface NcoOccupationRecord {
  code: string;
  title: string;
  division: string;
  subDivision: string;
  group: string;
  family: string;
  classification: 'NCO-2015';
  source: string;
  sourceUrl: string;
}

export interface NcoCandidateSummary {
  code: string;
  title: string;
  family: string;
  similarity: number;
  confidence?: number;
  compatibility?: number;
}

export interface NcoMatchResult {
  rawSkill: string;
  ncoCode: string;
  ncoTitle: string;
  ncoFamily: string;
  confidence: number;
  semanticConfidence: number;
  domainCompatibility?: number;
  explanation?: string;
  sector?: string;
  matchStatus: 'accepted' | 'needs_review';
  embeddingProvider: 'gemini';
  embeddingModel: 'gemini-embedding-2';
  source: string;
  sourceUrl: string;
  topCandidatesBeforeRerank?: NcoCandidateSummary[];
  topCandidatesAfterRerank?: NcoCandidateSummary[];
}

export interface SkillEmbeddingsCacheFile {
  embeddingModel: string;
  dimensionality: number;
  generatedAt: string;
  updatedAt: string;
  totalRecords: number;
  skills: Record<
    string,
    {
      rawSkill: string;
      textHash: string;
      vector: number[];
      generatedAt: string;
    }
  >;
}

export interface NcoIndexEntry {
  record: NcoOccupationRecord;
  vector: number[];
  norm: number;
}

let cachedNcoIndex: NcoIndexEntry[] | null = null;
let cachedSkillEmbeddings: SkillEmbeddingsCacheFile | null = null;

const DEFAULT_NCO_CATALOGUE_PATH = path.resolve(process.cwd(), 'data/nco2015/occupations.json');
const DEFAULT_NCO_CACHE_PATH = path.resolve(process.cwd(), 'data/derived/nco-embeddings.json');
const DEFAULT_SKILL_CACHE_PATH = path.resolve(process.cwd(), 'data/derived/skill-embeddings.json');

/**
 * Loads and indexes the NCO-2015 catalogue and embedding vectors into memory.
 * Precomputes Euclidean norms so cosine similarity is optimized to a fast dot product.
 */
export function loadNcoIndex(options?: {
  cataloguePath?: string;
  embeddingsPath?: string;
  forceReload?: boolean;
}): NcoIndexEntry[] {
  if (cachedNcoIndex && !options?.forceReload) {
    return cachedNcoIndex;
  }

  const cataloguePath = options?.cataloguePath || DEFAULT_NCO_CATALOGUE_PATH;
  const embeddingsPath = options?.embeddingsPath || DEFAULT_NCO_CACHE_PATH;

  if (!fs.existsSync(cataloguePath)) {
    throw new Error(
      `NCO-2015 catalogue not found at ${cataloguePath}. Please run 'npm run nco:import' first.`
    );
  }

  if (!fs.existsSync(embeddingsPath)) {
    throw new Error(
      `NCO-2015 embedding cache not found at ${embeddingsPath}. Please run 'npm run nco:embed' to generate embeddings first.`
    );
  }

  const rawCatalogue = fs.readFileSync(cataloguePath, 'utf-8');
  const occupations: NcoOccupationRecord[] = JSON.parse(rawCatalogue);

  const rawEmbeddings = fs.readFileSync(embeddingsPath, 'utf-8');
  const embeddingsData = JSON.parse(rawEmbeddings);

  if (embeddingsData.model !== DEFAULT_EMBEDDING_MODEL) {
    throw new Error(
      `NCO embedding cache model mismatch: expected '${DEFAULT_EMBEDDING_MODEL}', found '${embeddingsData.model}'.`
    );
  }

  if (embeddingsData.dimensionality !== DEFAULT_DIMENSIONALITY) {
    throw new Error(
      `NCO embedding cache dimensionality mismatch: expected ${DEFAULT_DIMENSIONALITY}, found ${embeddingsData.dimensionality}.`
    );
  }

  const entries: NcoIndexEntry[] = [];
  const embeddingsMap = embeddingsData.embeddings || {};

  for (const occ of occupations) {
    const entry = embeddingsMap[occ.code];
    if (entry && Array.isArray(entry.vector) && entry.vector.length === DEFAULT_DIMENSIONALITY) {
      // Calculate norm: sqrt(sum(v_i^2))
      let normSq = 0;
      for (let i = 0; i < entry.vector.length; i++) {
        normSq += entry.vector[i] * entry.vector[i];
      }
      const norm = Math.sqrt(normSq);

      entries.push({
        record: occ,
        vector: entry.vector,
        norm: norm > 0 ? norm : 1
      });
    }
  }

  if (entries.length === 0) {
    throw new Error(
      `No valid embedding vectors found in ${embeddingsPath}. Please run 'npm run nco:embed' to populate the cache.`
    );
  }

  cachedNcoIndex = entries;
  return entries;
}

/**
 * Loads the raw skill embeddings cache from disk.
 */
export function loadSkillEmbeddingsCache(filePath?: string): SkillEmbeddingsCacheFile {
  if (cachedSkillEmbeddings && !filePath) {
    return cachedSkillEmbeddings;
  }

  const targetPath = filePath || DEFAULT_SKILL_CACHE_PATH;

  if (fs.existsSync(targetPath)) {
    try {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(raw) as SkillEmbeddingsCacheFile;
      if (
        parsed.embeddingModel === DEFAULT_EMBEDDING_MODEL &&
        parsed.dimensionality === DEFAULT_DIMENSIONALITY
      ) {
        cachedSkillEmbeddings = parsed;
        return parsed;
      }
    } catch {
      // If corrupted or model mismatch, initialize new
    }
  }

  const newCache: SkillEmbeddingsCacheFile = {
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
    dimensionality: DEFAULT_DIMENSIONALITY,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalRecords: 0,
    skills: {}
  };

  cachedSkillEmbeddings = newCache;
  return newCache;
}

/**
 * Saves the raw skill embeddings cache to disk.
 */
export function saveSkillEmbeddingsCache(
  cache: SkillEmbeddingsCacheFile,
  filePath?: string
): void {
  const targetPath = filePath || DEFAULT_SKILL_CACHE_PATH;
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  cache.totalRecords = Object.keys(cache.skills).length;
  cache.updatedAt = new Date().toISOString();
  fs.writeFileSync(targetPath, JSON.stringify(cache, null, 2), 'utf-8');
  cachedSkillEmbeddings = cache;
}

/**
 * Retrieves the embedding vector for a raw skill, returning cached vector if available,
 * or requesting an embedding from Gemini and caching the result.
 */
export async function getOrGenerateSkillEmbedding(
  rawSkill: string,
  options?: { skillCachePath?: string }
): Promise<number[]> {
  const cleanSkill = rawSkill.trim();
  if (!cleanSkill) {
    throw new Error('Raw skill cannot be empty');
  }

  const cache = loadSkillEmbeddingsCache(options?.skillCachePath);
  const textHash = computeTextHash(cleanSkill);
  const cacheKey = cleanSkill.toLowerCase();

  const cached = cache.skills[cacheKey];
  if (
    cached &&
    cached.textHash === textHash &&
    Array.isArray(cached.vector) &&
    cached.vector.length === DEFAULT_DIMENSIONALITY
  ) {
    return cached.vector;
  }

  // Not in cache, must generate
  if (!isGeminiApiKeyAvailable()) {
    throw new Error(
      `GEMINI_API_KEY is not configured and no cached embedding exists for "${rawSkill}". Please configure GEMINI_API_KEY to generate embeddings.`
    );
  }

  const vector = await embedText(cleanSkill, {
    model: DEFAULT_EMBEDDING_MODEL,
    outputDimensionality: DEFAULT_DIMENSIONALITY
  });

  validateVector(vector, DEFAULT_DIMENSIONALITY);

  // Store in cache
  cache.skills[cacheKey] = {
    rawSkill: cleanSkill,
    textHash,
    vector,
    generatedAt: new Date().toISOString()
  };

  saveSkillEmbeddingsCache(cache, options?.skillCachePath);
  return vector;
}

/**
 * Sector-to-NCO Affinity and Conflict Rules
 * Maps economic sectors to relevant NCO-2015 Sub-Divisions (2 digits),
 * Groups (3 digits), and Families (4 digits).
 */
export interface SectorAffinityRule {
  highSubDivisions?: string[];
  highGroups?: string[];
  highFamilies?: string[];
  secondarySubDivisions?: string[];
  conflictingSubDivisions?: string[];
}

export const SECTOR_AFFINITY_RULES: Record<string, SectorAffinityRule> = {
  'it-ites & software': {
    highSubDivisions: ['25', '35'],
    highGroups: ['251', '252', '351', '352', '133', '215', '216'],
    highFamilies: [
      '2511', '2512', '2513', '2514', '2519',
      '2521', '2522', '2523', '2529',
      '3511', '3512', '3513', '3514',
      '3521', '3522', '2166'
    ],
    secondarySubDivisions: ['21', '24'],
    conflictingSubDivisions: ['26', '51', '52', '53', '54', '61', '62', '63', '71', '73', '75', '81', '83', '91', '92', '93', '94', '95', '96']
  },
  'automotive & ev technology': {
    highSubDivisions: ['72', '74', '31', '21', '83'],
    highGroups: ['723', '741', '311', '214', '821', '832', '833'],
    highFamilies: ['7231', '7412', '3115', '2144', '7233', '8211'],
    secondarySubDivisions: ['25'],
    conflictingSubDivisions: ['26', '22', '23', '51', '52', '53', '61', '62']
  },
  'electronics & semiconductors': {
    highSubDivisions: ['74', '21', '31', '82'],
    highGroups: ['742', '741', '215', '311', '821'],
    highFamilies: ['7421', '7422', '7411', '7412', '2151', '2152', '2153', '3113', '3114', '8212'],
    secondarySubDivisions: ['25', '35'],
    conflictingSubDivisions: ['26', '22', '23', '51', '52', '53', '61', '62']
  },
  'healthcare & allied medical': {
    highSubDivisions: ['22', '32', '53'],
    highGroups: ['221', '222', '223', '224', '225', '226', '321', '322', '325', '531', '532', '134'],
    secondarySubDivisions: ['21', '31'],
    conflictingSubDivisions: ['25', '26', '35', '71', '72', '73', '74', '75', '81', '82', '83']
  },
  'renewable energy & green jobs': {
    highSubDivisions: ['74', '72', '21', '31'],
    highGroups: ['742', '741', '723', '214', '215', '311'],
    highFamilies: ['7421', '7411', '7412', '2143', '2151', '3113', '7233', '7126'],
    secondarySubDivisions: ['25', '71'],
    conflictingSubDivisions: ['26', '22', '23', '51', '52', '53', '61', '62']
  },
  'manufacturing & capital goods': {
    highSubDivisions: ['72', '31', '81', '82', '21'],
    highGroups: ['721', '722', '723', '311', '313', '812', '821', '214'],
    highFamilies: ['7212', '7222', '7223', '3115', '3117', '3131', '3132', '3133', '3134', '3135', '3139', '2141', '2144'],
    secondarySubDivisions: ['74', '71'],
    conflictingSubDivisions: ['26', '22', '23', '51', '52', '53', '61', '62']
  },
  'logistics & supply chain': {
    highSubDivisions: ['13', '33', '43', '83', '93'],
    highGroups: ['132', '333', '432', '833', '933'],
    highFamilies: ['1324', '3331', '4321', '4322', '4323', '8332', '9333'],
    secondarySubDivisions: ['12', '31'],
    conflictingSubDivisions: ['22', '26', '71', '72', '74']
  },
  'construction & infrastructure': {
    highSubDivisions: ['71', '21', '31'],
    highGroups: ['711', '712', '713', '214', '216', '311', '312'],
    highFamilies: ['2161', '2162', '2165', '2142', '3112', '3123'],
    secondarySubDivisions: ['72', '74'],
    conflictingSubDivisions: ['22', '25', '26', '35', '51', '52', '53', '61', '62']
  }
};

/**
 * Parses NCO-2015 8-digit code into its constituent structural hierarchy levels.
 * Format: DDGG.xxxx (e.g. 2512.0100)
 */
export function extractNcoHierarchy(code: string): {
  division: string;
  subDivision: string;
  group: string;
  family: string;
} {
  const clean = code.trim();
  const division = clean.charAt(0);
  const subDivision = clean.substring(0, 2);
  const group = clean.substring(0, 3);
  const family = clean.split('.')[0] || clean.substring(0, 4);
  return { division, subDivision, group, family };
}

/**
 * Calculates a deterministic domain compatibility score between 0.15 and 1.0.
 * In-domain candidates evaluate to 0.90 - 1.0.
 * Neutral / unclassified candidates evaluate to 0.50.
 * Conflicting / mismatched occupations evaluate to 0.15.
 */
export function calculateDomainCompatibility(
  sector: string | undefined,
  record: NcoOccupationRecord
): number {
  if (!sector) return 1.0;
  const key = sector.toLowerCase().trim();
  const rule = SECTOR_AFFINITY_RULES[key];
  if (!rule) return 1.0;

  const { subDivision, group, family } = extractNcoHierarchy(record.code);

  if (rule.highFamilies?.includes(family)) return 1.0;
  if (rule.highGroups?.includes(group)) return 0.95;
  if (rule.highSubDivisions?.includes(subDivision)) return 0.90;
  if (rule.secondarySubDivisions?.includes(subDivision)) return 0.75;
  if (rule.conflictingSubDivisions?.includes(subDivision)) return 0.15;

  return 0.50; // Neutral default for unlisted sub-divisions
}

/**
 * Combines semantic cosine similarity and domain compatibility into a final score.
 * Formula: S_combined = S_semantic * (alpha + (1 - alpha) * C_domain)
 * With alpha = 0.70:
 * - When C_domain = 1.0 (in-domain): S_combined = S_semantic * 1.0 = S_semantic (no inflation)
 * - When C_domain = 0.15 (conflicting): S_combined = S_semantic * 0.745 (penalizes conflict)
 * Never inflates confidence beyond the raw semantic score.
 */
export function combineScores(semantic: number, compatibility: number): number {
  const alpha = 0.70;
  const multiplier = alpha + (1 - alpha) * compatibility;
  return Math.min(1.0, Math.max(0.0, semantic * multiplier));
}

/**
 * Infers sector classification from raw skill keywords when not explicitly supplied.
 */
export function inferSector(rawSkill: string): string | undefined {
  const s = rawSkill.toLowerCase();

  // IT-ITeS & Software
  if (
    /(python|javascript|typescript|react|angular|vue|node|sql|database|dba|programming|programmer|developer|software|coding|scripting|devops|cloud|aws|azure|cybersecurity|fullstack|frontend|backend|data analyst|business intelligence)/i.test(
      s
    )
  ) {
    return 'IT-ITeS & Software';
  }
  // Automotive & EV Technology
  if (/(ev\b|electric vehicle|powertrain|battery technician|adas|automotive|automobile|auto electrician)/i.test(s)) {
    return 'Automotive & EV Technology';
  }
  // Electronics & Semiconductors
  if (/(vlsi|semiconductor|smt\b|pcb\b|microelectronics|electronics|circuit|embedded)/i.test(s)) {
    return 'Electronics & Semiconductors';
  }
  // Healthcare & Allied Medical
  if (/(medical|clinical|pathology|dialysis|patient|radiology|laboratory technician|hospital|nurse|health)/i.test(s)) {
    return 'Healthcare & Allied Medical';
  }
  // Renewable Energy & Green Jobs
  if (/(solar|photovoltaic|pv\b|wind turbine|suryamitra|renewable|green energy)/i.test(s)) {
    return 'Renewable Energy & Green Jobs';
  }
  // Manufacturing & Capital Goods
  if (/(cnc\b|milling|machining|welder|welding|plc\b|scada|toolmaker|machinist|fabrication)/i.test(s)) {
    return 'Manufacturing & Capital Goods';
  }
  // Logistics & Supply Chain
  if (/(logistics|warehouse|supply chain|inventory|cold chain|freight|transport)/i.test(s)) {
    return 'Logistics & Supply Chain';
  }
  // Construction & Infrastructure
  if (/(bim\b|revit|precast|concrete|construction|building|masonry|civil engineer)/i.test(s)) {
    return 'Construction & Infrastructure';
  }

  return undefined;
}

/**
 * Compares a query vector against indexed NCO vectors, retrieves the top K candidates
 * by raw cosine similarity, and applies domain-aware disambiguation / reranking.
 */
export function findBestNcoMatch(
  queryVector: number[],
  indexEntries: NcoIndexEntry[],
  options?: {
    sector?: string;
    topK?: number;
  }
): {
  occupation: NcoOccupationRecord;
  confidence: number;
  semanticConfidence: number;
  domainCompatibility: number;
  explanation: string;
  topCandidatesBeforeRerank: NcoCandidateSummary[];
  topCandidatesAfterRerank: NcoCandidateSummary[];
} {
  if (indexEntries.length === 0) {
    throw new Error('No NCO index entries provided for matching');
  }

  validateVector(queryVector, DEFAULT_DIMENSIONALITY);

  // Compute query norm: sqrt(sum(q_i^2))
  let queryNormSq = 0;
  for (let i = 0; i < queryVector.length; i++) {
    queryNormSq += queryVector[i] * queryVector[i];
  }
  const queryNorm = Math.sqrt(queryNormSq);
  if (queryNorm === 0) {
    throw new Error('Query vector magnitude is zero');
  }

  // Calculate raw cosine similarities for all occupations
  const scored = new Array(indexEntries.length);
  for (let k = 0; k < indexEntries.length; k++) {
    const entry = indexEntries[k];
    const targetVec = entry.vector;

    let dot = 0;
    for (let i = 0; i < queryVector.length; i++) {
      dot += queryVector[i] * targetVec[i];
    }
    const similarity = dot / (queryNorm * entry.norm);
    scored[k] = { entry, similarity };
  }

  // Sort descending by raw cosine similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  const kLimit = Math.min(options?.topK || 20, scored.length);
  const topK = scored.slice(0, kLimit);

  const topCandidatesBeforeRerank: NcoCandidateSummary[] = topK.map((item) => ({
    code: item.entry.record.code,
    title: item.entry.record.title,
    family: item.entry.record.family,
    similarity: item.similarity
  }));

  // Apply domain compatibility scoring and reranking
  const sector = options?.sector;
  const reranked = topK.map((item) => {
    const compat = calculateDomainCompatibility(sector, item.entry.record);
    const combined = combineScores(item.similarity, compat);
    return {
      record: item.entry.record,
      semanticConfidence: item.similarity,
      domainCompatibility: compat,
      confidence: combined
    };
  });

  // Sort reranked candidates by combined confidence score (tie-break by raw similarity)
  reranked.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.semanticConfidence - a.semanticConfidence;
  });

  const topCandidatesAfterRerank: NcoCandidateSummary[] = reranked.map((item) => ({
    code: item.record.code,
    title: item.record.title,
    family: item.record.family,
    similarity: item.semanticConfidence,
    confidence: item.confidence,
    compatibility: item.domainCompatibility
  }));

  const winner = reranked[0];
  const rawTop = topK[0];

  let explanation: string;
  if (sector && winner.record.code !== rawTop.entry.record.code) {
    explanation = `Domain disambiguation reranked candidate from out-of-domain NCO [${rawTop.entry.record.code}] (${rawTop.entry.record.title}, similarity ${rawTop.similarity.toFixed(4)}) to in-domain NCO [${winner.record.code}] (${winner.record.title}, similarity ${winner.semanticConfidence.toFixed(4)}) under sector "${sector}".`;
  } else if (sector) {
    explanation = `Matched in-domain NCO [${winner.record.code}] (${winner.record.title}) under sector "${sector}" with semantic similarity ${winner.semanticConfidence.toFixed(4)}.`;
  } else {
    explanation = `Matched NCO [${winner.record.code}] (${winner.record.title}) by semantic cosine similarity ${winner.semanticConfidence.toFixed(4)} (neutral domain).`;
  }

  return {
    occupation: winner.record,
    confidence: winner.confidence,
    semanticConfidence: winner.semanticConfidence,
    domainCompatibility: winner.domainCompatibility,
    explanation,
    topCandidatesBeforeRerank,
    topCandidatesAfterRerank
  };
}

/**
 * Matches a raw skill string against the entire NCO-2015 catalogue.
 */
export async function matchSkill(
  rawSkill: string,
  options?: {
    sector?: string;
    topK?: number;
    cataloguePath?: string;
    ncoCachePath?: string;
    skillCachePath?: string;
  }
): Promise<NcoMatchResult> {
  const cleanSkill = rawSkill.trim();
  if (!cleanSkill) {
    throw new Error('Skill string cannot be empty');
  }

  const resolvedSector = options?.sector || inferSector(cleanSkill);

  const index = loadNcoIndex({
    cataloguePath: options?.cataloguePath,
    embeddingsPath: options?.ncoCachePath
  });

  const queryVector = await getOrGenerateSkillEmbedding(cleanSkill, {
    skillCachePath: options?.skillCachePath
  });

  const match = findBestNcoMatch(queryVector, index, {
    sector: resolvedSector,
    topK: options?.topK
  });

  const matchStatus: 'accepted' | 'needs_review' = classifyMatchStatus(match.confidence);

  return {
    rawSkill: cleanSkill,
    ncoCode: match.occupation.code,
    ncoTitle: match.occupation.title,
    ncoFamily: match.occupation.family,
    confidence: match.confidence,
    semanticConfidence: match.semanticConfidence,
    domainCompatibility: match.domainCompatibility,
    explanation: match.explanation,
    sector: resolvedSector,
    matchStatus,
    embeddingProvider: 'gemini',
    embeddingModel: 'gemini-embedding-2',
    source: match.occupation.source,
    sourceUrl: match.occupation.sourceUrl,
    topCandidatesBeforeRerank: match.topCandidatesBeforeRerank,
    topCandidatesAfterRerank: match.topCandidatesAfterRerank
  };
}

/**
 * Matches multiple raw skills in batch, reusing skill cache where possible.
 */
export async function matchSkillsBatch(
  rawSkills: string[],
  options?: {
    sector?: string;
    sectors?: Record<string, string>;
    topK?: number;
    cataloguePath?: string;
    ncoCachePath?: string;
    skillCachePath?: string;
  }
): Promise<NcoMatchResult[]> {
  const index = loadNcoIndex({
    cataloguePath: options?.cataloguePath,
    embeddingsPath: options?.ncoCachePath
  });

  const skillCache = loadSkillEmbeddingsCache(options?.skillCachePath);
  const missingSkills: string[] = [];

  for (const skill of rawSkills) {
    const key = skill.trim().toLowerCase();
    if (!skillCache.skills[key]) {
      missingSkills.push(skill.trim());
    }
  }

  // Generate missing embeddings in batch if needed
  if (missingSkills.length > 0) {
    if (!isGeminiApiKeyAvailable()) {
      throw new Error(
        `GEMINI_API_KEY is required to generate embeddings for ${missingSkills.length} un-cached skills.`
      );
    }

    const vectors = await embedBatch(missingSkills, {
      model: DEFAULT_EMBEDDING_MODEL,
      outputDimensionality: DEFAULT_DIMENSIONALITY,
      batchSize: 40
    });

    for (let i = 0; i < missingSkills.length; i++) {
      const s = missingSkills[i];
      const key = s.toLowerCase();
      skillCache.skills[key] = {
        rawSkill: s,
        textHash: computeTextHash(s),
        vector: vectors[i],
        generatedAt: new Date().toISOString()
      };
    }

    saveSkillEmbeddingsCache(skillCache, options?.skillCachePath);
  }

  const results: NcoMatchResult[] = [];
  for (const rawSkill of rawSkills) {
    const cleanSkill = rawSkill.trim();
    const key = cleanSkill.toLowerCase();
    const vector = skillCache.skills[key].vector;
    const skillSector =
      options?.sectors?.[rawSkill] || options?.sector || inferSector(cleanSkill);

    const match = findBestNcoMatch(vector, index, {
      sector: skillSector,
      topK: options?.topK
    });

    results.push({
      rawSkill: cleanSkill,
      ncoCode: match.occupation.code,
      ncoTitle: match.occupation.title,
      ncoFamily: match.occupation.family,
      confidence: match.confidence,
      semanticConfidence: match.semanticConfidence,
      domainCompatibility: match.domainCompatibility,
      explanation: match.explanation,
      sector: skillSector,
      matchStatus: classifyMatchStatus(match.confidence),
      embeddingProvider: 'gemini',
      embeddingModel: 'gemini-embedding-2',
      source: match.occupation.source,
      sourceUrl: match.occupation.sourceUrl,
      topCandidatesBeforeRerank: match.topCandidatesBeforeRerank,
      topCandidatesAfterRerank: match.topCandidatesAfterRerank
    });
  }

  return results;
}

