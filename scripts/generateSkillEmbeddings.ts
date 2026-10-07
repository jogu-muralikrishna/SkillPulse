/**
 * ============================================================================
 * SKILLPULSE RAW SKILL EMBEDDING & NCO MATCHING BATCH PIPELINE
 * ============================================================================
 * Purpose:
 * 1. Extracts unique raw skill tags from `src/data/skillsTaxonomy.ts`.
 * 2. Checks `data/derived/skill-embeddings.json` for existing embeddings.
 * 3. Batch-embeds un-cached raw skills via Gemini (respecting rate limits).
 * 4. Validates 768 dimensions per vector.
 * 5. Matches each raw skill against the 3,445 NCO-2015 occupations.
 * 6. Checkpoints progress and outputs summary.
 * ============================================================================
 */

import { INITIAL_SKILL_MAPPINGS } from '../src/data/skillsTaxonomy';
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_DIMENSIONALITY,
  embedBatch,
  validateVector,
  isGeminiApiKeyAvailable,
  computeTextHash,
  RateLimiter
} from '../src/utils/embeddingService';
import {
  loadNcoIndex,
  findBestNcoMatch,
  loadSkillEmbeddingsCache,
  saveSkillEmbeddingsCache,
  MATCH_ACCEPTANCE_THRESHOLD
} from '../src/utils/ncoMatchingService';

async function run() {
  console.log('================================================================');
  console.log(' SKILLPULSE RAW SKILL EMBEDDING & NCO MATCHING PIPELINE');
  console.log(` Model: ${DEFAULT_EMBEDDING_MODEL} | Dimensions: ${DEFAULT_DIMENSIONALITY}`);
  console.log('================================================================\n');

  // 1. Extract unique raw skills
  const rawSkillList = Array.from(
    new Set(INITIAL_SKILL_MAPPINGS.map((m) => m.rawSkill.trim()))
  );
  console.log(`📋 Found ${rawSkillList.length} unique raw skill tags in skillsTaxonomy.ts.\n`);

  // 2. Load existing skill embeddings cache
  const skillCache = loadSkillEmbeddingsCache();
  const cachedCountBefore = Object.keys(skillCache.skills).length;

  const pendingSkills: string[] = [];
  let reusedCount = 0;

  for (const skill of rawSkillList) {
    const key = skill.toLowerCase();
    const entry = skillCache.skills[key];
    if (
      entry &&
      Array.isArray(entry.vector) &&
      entry.vector.length === DEFAULT_DIMENSIONALITY
    ) {
      reusedCount++;
    } else {
      pendingSkills.push(skill);
    }
  }

  console.log(`📊 [CACHE STATUS]`);
  console.log(`   • Total Unique Raw Skills : ${rawSkillList.length}`);
  console.log(`   • Already in Cache        : ${reusedCount}`);
  console.log(`   • Pending Embeddings      : ${pendingSkills.length}\n`);

  // 3. Generate embeddings for pending skills
  if (pendingSkills.length > 0) {
    if (!isGeminiApiKeyAvailable()) {
      throw new Error(
        `GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY to embed ${pendingSkills.length} pending skills.`
      );
    }

    console.log(`🚀 [GENERATING] Embedding ${pendingSkills.length} skills in batch...`);
    const rateLimiter = new RateLimiter(80);
    const BATCH_SIZE = 25; // Small batch well below 100 limit

    for (let i = 0; i < pendingSkills.length; i += BATCH_SIZE) {
      const chunk = pendingSkills.slice(i, i + BATCH_SIZE);
      await rateLimiter.acquire(chunk.length, (waitSec) => {
        console.log(`   ⏳ Rate limiter: waiting ${waitSec}s before batch...`);
      });

      const vectors = await embedBatch(chunk, {
        model: DEFAULT_EMBEDDING_MODEL,
        outputDimensionality: DEFAULT_DIMENSIONALITY,
        batchSize: chunk.length
      });

      for (let j = 0; j < chunk.length; j++) {
        const skill = chunk[j];
        const vec = vectors[j];
        validateVector(vec, DEFAULT_DIMENSIONALITY);

        skillCache.skills[skill.toLowerCase()] = {
          rawSkill: skill,
          textHash: computeTextHash(skill),
          vector: vec,
          generatedAt: new Date().toISOString()
        };
      }

      // Checkpoint
      saveSkillEmbeddingsCache(skillCache);
      console.log(`   Saved checkpoint: ${Object.keys(skillCache.skills).length} total skills in cache.`);
    }
  }

  // 4. Match against NCO-2015 index
  console.log('\n🔎 [MATCHING] Ranking against 3,445 NCO occupations...');
  const ncoIndex = loadNcoIndex();

  let acceptedCount = 0;
  let reviewCount = 0;

  console.log('\n------------------------------------------------------------------------------------------------------------------------');
  console.log(
    ` ${'Raw Skill'.padEnd(35)} | ${'NCO Code'.padEnd(10)} | ${'Confidence'.padEnd(10)} | ${'Status'.padEnd(12)} | ${'NCO Title'}`
  );
  console.log('------------------------------------------------------------------------------------------------------------------------');

  for (const skill of rawSkillList) {
    const key = skill.toLowerCase();
    const entry = skillCache.skills[key];
    const match = findBestNcoMatch(entry.vector, ncoIndex);
    const status = match.confidence >= MATCH_ACCEPTANCE_THRESHOLD ? 'accepted' : 'needs_review';

    if (status === 'accepted') acceptedCount++;
    else reviewCount++;

    const statusBadge = status === 'accepted' ? 'ACCEPTED' : 'NEEDS_REVIEW';
    console.log(
      ` ${skill.padEnd(35)} | ${match.occupation.code.padEnd(10)} | ${(match.confidence.toFixed(4)).padEnd(10)} | ${statusBadge.padEnd(12)} | ${match.occupation.title}`
    );
  }
  console.log('------------------------------------------------------------------------------------------------------------------------\n');

  console.log('================================================================');
  console.log(' BATCH SKILL MATCHING SUMMARY');
  console.log('================================================================');
  console.log(` • Total Raw Skills Evaluated : ${rawSkillList.length}`);
  console.log(` • Reused from Cache          : ${reusedCount}`);
  console.log(` • Newly Generated            : ${pendingSkills.length}`);
  console.log(` • Accepted (>= 0.75)         : ${acceptedCount}`);
  console.log(` • Needs Review (< 0.75)      : ${reviewCount}`);
  console.log(` • Total Skills Cached on Disk: ${Object.keys(skillCache.skills).length}`);
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ BATCH PIPELINE FAILED:', err.message || err);
  process.exit(1);
});
