/**
 * ============================================================================
 * SKILLPULSE EMBEDDING-BASED RESKILLING RECOMMENDATION SERVICE
 * ============================================================================
 * Responsibilities:
 * 1. Verifies that the source skill is currently classified as OVERSUPPLY
 *    under the canonical SkillPulse gap calculation (demand - supply <= -15%).
 * 2. If not oversupplied, returns eligibleForReskilling: false without fabricating.
 * 3. Finds candidate skills in the SAME district classified as SHORTAGE.
 * 4. Compares the 768-dimensional Gemini embedding of the source skill
 *    against each candidate skill using cosine similarity.
 * 5. Uses cached embeddings from `data/derived/skill-embeddings.json` whenever
 *    possible (falling back to on-demand Gemini embedding if uncached).
 * 6. Returns the top 3 closest alternatives ordered by descending similarity.
 * 7. Prohibits heuristic seat multipliers (e.g. gap / 0.75).
 * ============================================================================
 */

import {
  calculateSkillGaps,
  DEFAULT_THRESHOLDS,
  GapThresholds
} from './analyticsEngine';
import {
  loadSkillEmbeddingsCache,
  saveSkillEmbeddingsCache
} from './ncoMatchingService';
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_DIMENSIONALITY,
  embedText,
  cosineSimilarity,
  isGeminiApiKeyAvailable,
  computeTextHash,
  validateVector
} from './embeddingService';
import { matchesCanonicalGeography } from './canonicalGeography';
import { DEMAND_RECORDS } from '../data/demandData';

export interface ReskillingPath {
  skill: string;
  similarity: number;
  districtGap: number;
  demand: number;
  supply: number;
  reason: string;
}

export interface OversuppliedSkillSummary {
  skill: string;
  gap: number;
  gapPercentage?: number;
  demand?: number;
  supply?: number;
  classification?: string;
}

export interface ReskillingResponse {
  source: string;
  endpoint: string;
  params: {
    state: string;
    district: string;
    skill: string;
  };
  eligibleForReskilling: boolean;
  oversuppliedSkill: OversuppliedSkillSummary | null;
  paths: ReskillingPath[];
  message: string;
  provenance: {
    methodology: string;
    embeddingModel: string;
    dimensionality: number;
  };
}

/**
 * Retrieves the 768-dimensional Gemini embedding for a skill.
 * Prioritizes the local cache; embeds and persists on-demand if missing.
 */
export async function getSkillEmbeddingVector(skillName: string): Promise<number[] | null> {
  const normalizedKey = skillName.trim().toLowerCase();
  const cache = loadSkillEmbeddingsCache();

  // 1. Check local cache
  if (
    cache.skills[normalizedKey] &&
    Array.isArray(cache.skills[normalizedKey].vector) &&
    cache.skills[normalizedKey].vector.length === DEFAULT_DIMENSIONALITY
  ) {
    return cache.skills[normalizedKey].vector;
  }

  // 2. On-demand generation via Gemini if API key is present
  if (isGeminiApiKeyAvailable()) {
    try {
      const vector = await embedText(skillName.trim(), {
        model: DEFAULT_EMBEDDING_MODEL,
        outputDimensionality: DEFAULT_DIMENSIONALITY
      });

      validateVector(vector, DEFAULT_DIMENSIONALITY);

      // Persist to cache
      cache.skills[normalizedKey] = {
        rawSkill: skillName.trim(),
        textHash: computeTextHash(skillName.trim()),
        vector,
        generatedAt: new Date().toISOString()
      };
      cache.totalRecords = Object.keys(cache.skills).length;
      cache.updatedAt = new Date().toISOString();
      saveSkillEmbeddingsCache(cache);

      return vector;
    } catch (err) {
      console.warn(`[reskilling] Failed to generate live embedding for "${skillName}":`, err);
    }
  }

  return null;
}

/**
 * Computes embedding-based reskilling recommendations for a given skill and location.
 */
export async function getReskillingRecommendations(
  state: string,
  district: string,
  skill: string,
  thresholds: GapThresholds = DEFAULT_THRESHOLDS
): Promise<ReskillingResponse> {
  const trimmedState = state?.trim();
  const trimmedDistrict = district?.trim();
  const trimmedSkill = skill?.trim();

  const responseBase = {
    source: 'SkillPulse Reskilling Engine',
    endpoint: '/api/reskill',
    params: {
      state: trimmedState || '',
      district: trimmedDistrict || '',
      skill: trimmedSkill || ''
    },
    provenance: {
      methodology: 'Labor Supply-Demand Alignment + Gemini Cosine Similarity',
      embeddingModel: DEFAULT_EMBEDDING_MODEL,
      dimensionality: DEFAULT_DIMENSIONALITY
    }
  };

  // 1. Validation: required arguments
  if (!trimmedState || !trimmedDistrict || !trimmedSkill) {
    return {
      ...responseBase,
      eligibleForReskilling: false,
      oversuppliedSkill: null,
      paths: [],
      message: 'State, district, and skill parameters are required for reskilling analysis.'
    };
  }

  // 2. Validate that district exists in verified database
  const districtHasRecords = DEMAND_RECORDS.some(d =>
    matchesCanonicalGeography(d, { state: trimmedState, district: trimmedDistrict })
  );

  if (!districtHasRecords) {
    return {
      ...responseBase,
      eligibleForReskilling: false,
      oversuppliedSkill: null,
      paths: [],
      message: `No verified records found for district "${trimmedDistrict}, ${trimmedState}".`
    };
  }

  // 3. Evaluate canonical gaps in the specified district
  const districtGaps = calculateSkillGaps({
    state: trimmedState,
    district: trimmedDistrict
  }, thresholds);

  // Find the source skill record in this district
  const sourceGap = districtGaps.find(
    g => g.normalizedSkill.toLowerCase() === trimmedSkill.toLowerCase()
  );

  if (!sourceGap) {
    return {
      ...responseBase,
      eligibleForReskilling: false,
      oversuppliedSkill: null,
      paths: [],
      message: `Skill "${trimmedSkill}" does not have verified demand or supply filings in ${trimmedDistrict}.`
    };
  }

  const oversuppliedSummary: OversuppliedSkillSummary = {
    skill: sourceGap.normalizedSkill,
    gap: sourceGap.gap ?? 0,
    gapPercentage: sourceGap.gapPercentage ?? 0,
    demand: sourceGap.demand,
    supply: sourceGap.effectiveSupply ?? 0,
    classification: sourceGap.classification
  };

  // 4. Over-supply check: Eligible ONLY when classified as OVERSUPPLY
  if (sourceGap.classification !== 'OVERSUPPLY') {
    return {
      ...responseBase,
      eligibleForReskilling: false,
      oversuppliedSkill: oversuppliedSummary,
      paths: [],
      message: `Skill "${sourceGap.normalizedSkill}" is not classified as OVERSUPPLY (current status: ${sourceGap.classification}). Reskilling transitions are only recommended for surplus workforce.`
    };
  }

  // 5. Filter candidate skills in the SAME district currently classified as SHORTAGE
  const shortageCandidates = districtGaps.filter(
    g => g.isComparable &&
         g.classification === 'SHORTAGE' &&
         g.normalizedSkill.toLowerCase() !== sourceGap.normalizedSkill.toLowerCase()
  );

  if (shortageCandidates.length === 0) {
    return {
      ...responseBase,
      eligibleForReskilling: true,
      oversuppliedSkill: oversuppliedSummary,
      paths: [],
      message: `No comparable skills are currently classified as SHORTAGE in ${trimmedDistrict}.`
    };
  }

  // 6. Obtain semantic embedding for source skill
  const sourceVector = await getSkillEmbeddingVector(sourceGap.normalizedSkill);

  // 7. Calculate cosine similarity against all same-district shortage candidates
  const scoredCandidates: ReskillingPath[] = [];

  for (const candidate of shortageCandidates) {
    let similarity = 0.5; // fallback neutral similarity if vector unavailable

    if (sourceVector) {
      const candidateVector = await getSkillEmbeddingVector(candidate.normalizedSkill);
      if (candidateVector) {
        similarity = Math.round(cosineSimilarity(sourceVector, candidateVector) * 10000) / 10000;
      }
    }

    scoredCandidates.push({
      skill: candidate.normalizedSkill,
      similarity,
      districtGap: candidate.gap ?? 0,
      demand: candidate.demand,
      supply: candidate.effectiveSupply ?? 0,
      reason: `Semantically adjacent skill with an active local shortage of +${candidate.gap} vacancies in ${trimmedDistrict}.`
    });
  }

  // 8. Order by descending semantic similarity and select at most 3
  scoredCandidates.sort((a, b) => b.similarity - a.similarity);
  const top3Paths = scoredCandidates.slice(0, 3);

  return {
    ...responseBase,
    eligibleForReskilling: true,
    oversuppliedSkill: oversuppliedSummary,
    paths: top3Paths,
    message: `Identified ${top3Paths.length} reskilling transition pathway(s) targeting local shortage occupations in ${trimmedDistrict}.`
  };
}
