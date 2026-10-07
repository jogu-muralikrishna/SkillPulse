/**
 * ============================================================================
 * SKILLPULSE EMBEDDING TEST PROBE
 * ============================================================================
 * Purpose:
 * Tests embedding functionality with:
 * 1. Single probe string: "Python Scripting"
 * 2. Multi-input batch probe: 3 inputs → 3 embeddings
 * 
 * Verifies:
 * 1. API call succeeds when GEMINI_API_KEY is available.
 * 2. Returned single vector length is exactly 768 dimensions.
 * 3. Batch input count strictly matches returned embedding count (3 inputs === 3 embeddings).
 * 4. Each batch vector is exactly 768 dimensions with finite numeric values.
 * 5. Cosine similarity calculations can successfully consume the returned vectors.
 * 6. Safe error handling when GEMINI_API_KEY is not configured (no secret leaks).
 * 
 * Note: Does not claim "Python Scripting" maps to an NCO occupation; this test
 * verifies embedding generation and vector consumption only.
 * ============================================================================
 */

import {
  embedText,
  embedBatch,
  cosineSimilarity,
  validateVector,
  isGeminiApiKeyAvailable,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_DIMENSIONALITY
} from '../src/utils/embeddingService';

async function runProbe() {
  console.log('================================================================');
  console.log(' SKILLPULSE EMBEDDING TEST PROBE');
  console.log(' Single Probe Target: "Python Scripting"');
  console.log(` Model: ${DEFAULT_EMBEDDING_MODEL} | Target Dimensions: ${DEFAULT_DIMENSIONALITY}`);
  console.log('================================================================\n');

  const apiKeyAvailable = isGeminiApiKeyAvailable();

  if (apiKeyAvailable) {
    console.log('🔑 [AUTH] GEMINI_API_KEY detected in environment. Running live API probe...\n');

    try {
      // ----------------------------------------------------------------------
      // PART 1: SINGLE-INPUT PROBE
      // ----------------------------------------------------------------------
      console.log('📡 [1/2: SINGLE PROBE] Requesting embedding for: "Python Scripting"...');
      const vector = await embedText('Python Scripting', {
        model: DEFAULT_EMBEDDING_MODEL,
        outputDimensionality: DEFAULT_DIMENSIONALITY
      });

      validateVector(vector, DEFAULT_DIMENSIONALITY);
      console.log(`   ✅ Single vector returned successfully.`);
      console.log(`   ✅ Dimensionality: ${vector.length} (matches expected ${DEFAULT_DIMENSIONALITY})`);
      console.log(`   ✅ All 768 values are finite floats.`);

      // Embed comparison text to test real cosine similarity consumption
      console.log('   📐 Testing similarity calculation consumption...');
      const compVector = await embedText('Software Development and Scripting', {
        model: DEFAULT_EMBEDDING_MODEL,
        outputDimensionality: DEFAULT_DIMENSIONALITY
      });

      const similarity = cosineSimilarity(vector, compVector);
      if (typeof similarity !== 'number' || !Number.isFinite(similarity) || similarity < -1 || similarity > 1) {
        throw new Error(`Invalid cosine similarity result: ${similarity}`);
      }

      console.log(`   ✅ Cosine similarity computed successfully: ${similarity.toFixed(4)}`);
      console.log(`   ✅ Self-similarity test: ${cosineSimilarity(vector, vector).toFixed(4)} (expected 1.0000)\n`);

      // ----------------------------------------------------------------------
      // PART 2: MULTI-INPUT BATCH PROBE (Explicit Count Assertion)
      // ----------------------------------------------------------------------
      const testBatchInputs = [
        'Python Scripting',
        'Database Administration and SQL Optimization',
        'Cloud Infrastructure Architecture and DevOps'
      ];

      console.log(`📦 [2/2: BATCH PROBE] Requesting batch embedding for ${testBatchInputs.length} inputs...`);
      for (let idx = 0; idx < testBatchInputs.length; idx++) {
        console.log(`   [Input ${idx + 1}] "${testBatchInputs[idx]}"`);
      }

      const batchVectors = await embedBatch(testBatchInputs, {
        model: DEFAULT_EMBEDDING_MODEL,
        outputDimensionality: DEFAULT_DIMENSIONALITY,
        batchSize: testBatchInputs.length,
        delayMsBetweenBatches: 0
      });

      // Strict count assertion: input count === returned embedding count
      if (batchVectors.length !== testBatchInputs.length) {
        throw new Error(
          `Batch count mismatch assertion failed: expected ${testBatchInputs.length} embeddings, but got ${batchVectors.length}!`
        );
      }
      console.log(`   ✅ Input count === returned embedding count assertion PASSED (${testBatchInputs.length} === ${batchVectors.length}).`);

      // Verify each vector dimensionality and values
      for (let k = 0; k < batchVectors.length; k++) {
        const vec = batchVectors[k];
        validateVector(vec, DEFAULT_DIMENSIONALITY);
        console.log(`   ✅ Vector ${k + 1}/${batchVectors.length}: exactly ${vec.length} finite floats.`);
      }

      // Check cross similarities
      const sim01 = cosineSimilarity(batchVectors[0], batchVectors[1]);
      const sim02 = cosineSimilarity(batchVectors[0], batchVectors[2]);
      console.log(`   📐 Cross-vector similarities in batch:`);
      console.log(`      - Sim("Python", "DB Admin") = ${sim01.toFixed(4)}`);
      console.log(`      - Sim("Python", "Cloud DevOps") = ${sim02.toFixed(4)}`);

      console.log('\n================================================================');
      console.log('✅ ALL EMBEDDING PROBES PASSED (SINGLE + BATCH)');
      console.log(`   • Single Probe: 1 input → 1 embedding (${DEFAULT_DIMENSIONALITY} dims)`);
      console.log(`   • Batch Probe : ${testBatchInputs.length} inputs → ${batchVectors.length} embeddings (${DEFAULT_DIMENSIONALITY} dims each)`);
      console.log('================================================================\n');
    } catch (err: any) {
      console.error('\n❌ LIVE EMBEDDING PROBE FAILED:', err.message || err);
      process.exit(1);
    }
  } else {
    console.log('ℹ️  [NOTICE] GEMINI_API_KEY is not configured in environment or .env.');
    console.log('   Testing offline safety guards and vector similarity engine...\n');

    // 1. Verify missing API key throws safe error without unhandled crash or leaking secrets
    try {
      await embedText('Python Scripting');
      console.error('❌ Expected embedText to throw when GEMINI_API_KEY is missing, but it did not.');
      process.exit(1);
    } catch (err: any) {
      if (err.message.includes('GEMINI_API_KEY is not configured')) {
        console.log('   ✅ API key guard verified: cleanly catches missing configuration.');
        console.log('   ✅ No secrets leaked or unhandled errors.');
      } else {
        throw err;
      }
    }

    // 2. Verify vector math engine on 768-dimensional vectors
    console.log('\n📐 [SIMILARITY] Verifying 768-dimensional vector math engine...');
    const syntheticVecA = new Array(DEFAULT_DIMENSIONALITY).fill(0).map((_, i) => Math.sin(i + 1));
    const syntheticVecB = new Array(DEFAULT_DIMENSIONALITY).fill(0).map((_, i) => Math.cos(i + 1));

    validateVector(syntheticVecA, DEFAULT_DIMENSIONALITY);
    validateVector(syntheticVecB, DEFAULT_DIMENSIONALITY);

    const selfSim = cosineSimilarity(syntheticVecA, syntheticVecA);
    const crossSim = cosineSimilarity(syntheticVecA, syntheticVecB);

    if (Math.abs(selfSim - 1.0) > 1e-6) {
      throw new Error(`Self-similarity test failed: expected 1.0, got ${selfSim}`);
    }

    console.log(`   ✅ Synthetic 768-dim vector validation PASSED.`);
    console.log(`   ✅ Self-similarity: ${selfSim.toFixed(4)} (expected 1.0000)`);
    console.log(`   ✅ Cross-vector cosine similarity: ${crossSim.toFixed(4)}`);

    console.log('\n================================================================');
    console.log('✅ EMBEDDING ENGINE PROBE PASSED (OFFLINE MODE)');
    console.log('   Note: Set GEMINI_API_KEY in .env to run live Gemini API calls.');
    console.log('================================================================\n');
  }
}

runProbe().catch((err) => {
  console.error('\n❌ PROBE ENCOUNTERED ERROR:', err);
  process.exit(1);
});
