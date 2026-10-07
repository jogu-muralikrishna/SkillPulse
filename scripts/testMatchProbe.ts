/**
 * ============================================================================
 * SKILLPULSE NCO MATCHING INTEGRATION & UNIT TEST PROBE
 * ============================================================================
 * Tests:
 * 1. Deterministic unit test for cosine ranking using known orthogonal & aligned vectors.
 * 2. Live integration test with domain-aware disambiguation for:
 *    - "Python Scripting" (Top 5 before & after domain reranking)
 *    - "Python Programming"
 *    - "React.js Developer"
 *    - "SQL"
 *    - "Welding"
 *    - "Solar PV Installation"
 * ============================================================================
 */

import {
  findBestNcoMatch,
  matchSkill,
  MATCH_ACCEPTANCE_THRESHOLD,
  classifyMatchStatus,
  NcoIndexEntry,
  NcoOccupationRecord
} from '../src/utils/ncoMatchingService';
import { DEFAULT_DIMENSIONALITY } from '../src/utils/embeddingService';

function runUnitTests() {
  console.log('================================================================');
  console.log(' [UNIT TEST] Deterministic Cosine Ranking with Known Vectors');
  console.log('================================================================\n');

  // Create 3 synthetic occupations
  const occ1: NcoOccupationRecord = {
    code: '1001.0100',
    title: 'Occupation Alpha (Aligned)',
    division: 'Division 1',
    subDivision: 'Sub-Division 10',
    group: 'Group 100',
    family: 'Family 1001',
    classification: 'NCO-2015',
    source: 'Test Authority',
    sourceUrl: 'https://example.com'
  };

  const occ2: NcoOccupationRecord = {
    code: '2002.0200',
    title: 'Occupation Beta (Orthogonal)',
    division: 'Division 2',
    subDivision: 'Sub-Division 20',
    group: 'Group 200',
    family: 'Family 2002',
    classification: 'NCO-2015',
    source: 'Test Authority',
    sourceUrl: 'https://example.com'
  };

  const occ3: NcoOccupationRecord = {
    code: '3003.0300',
    title: 'Occupation Gamma (Opposite)',
    division: 'Division 3',
    subDivision: 'Sub-Division 30',
    group: 'Group 300',
    family: 'Family 3003',
    classification: 'NCO-2015',
    source: 'Test Authority',
    sourceUrl: 'https://example.com'
  };

  // Query vector: [1, 0, 0, ...]
  const queryVec = new Array(DEFAULT_DIMENSIONALITY).fill(0);
  queryVec[0] = 1.0;

  // Vec 1: [0.9, 0.1, 0, ...] (high alignment)
  const vec1 = new Array(DEFAULT_DIMENSIONALITY).fill(0);
  vec1[0] = 0.9;
  vec1[1] = 0.1;

  // Vec 2: [0, 1.0, 0, ...] (orthogonal, similarity = 0)
  const vec2 = new Array(DEFAULT_DIMENSIONALITY).fill(0);
  vec2[1] = 1.0;

  // Vec 3: [-1.0, 0, 0, ...] (opposite, similarity = -1)
  const vec3 = new Array(DEFAULT_DIMENSIONALITY).fill(0);
  vec3[0] = -1.0;

  function calcNorm(v: number[]) {
    return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  }

  const indexEntries: NcoIndexEntry[] = [
    { record: occ1, vector: vec1, norm: calcNorm(vec1) },
    { record: occ2, vector: vec2, norm: calcNorm(vec2) },
    { record: occ3, vector: vec3, norm: calcNorm(vec3) }
  ];

  const match = findBestNcoMatch(queryVec, indexEntries);

  console.log(`   Query vector matched: "${match.occupation.title}"`);
  console.log(`   Assigned Code: ${match.occupation.code}`);
  console.log(`   Cosine Similarity: ${match.confidence.toFixed(4)}`);

  if (match.occupation.code !== '1001.0100') {
    throw new Error(`Unit test failed: Expected code 1001.0100 to win, but got ${match.occupation.code}`);
  }

  if (match.confidence <= 0.95 || match.confidence > 1.0) {
    throw new Error(`Unit test failed: Expected similarity ~0.99, got ${match.confidence}`);
  }

  console.log('   ✅ Deterministic cosine ranking PASSED.\n');

  // Boundary threshold acceptance tests
  console.log('----------------------------------------------------------------');
  console.log(' [UNIT TEST] Boundary Threshold Verification (0.75 Rule)');
  console.log('----------------------------------------------------------------');

  const boundaryCases: Array<{ confidence: number; expectedStatus: 'accepted' | 'needs_review' }> = [
    { confidence: 0.7499, expectedStatus: 'needs_review' },
    { confidence: 0.7500, expectedStatus: 'accepted' },
    { confidence: 0.8000, expectedStatus: 'accepted' }
  ];

  for (const { confidence, expectedStatus } of boundaryCases) {
    const status = classifyMatchStatus(confidence);
    console.log(`   • Testing confidence ${confidence.toFixed(4)}: got '${status}' (expected '${expectedStatus}')`);
    if (status !== expectedStatus) {
      throw new Error(`Boundary test failed: confidence ${confidence} produced status '${status}', expected '${expectedStatus}'`);
    }
  }
  console.log('   ✅ Acceptance threshold boundary tests PASSED (0.7499 -> needs_review, 0.7500 -> accepted, 0.8000 -> accepted).\n');
}

async function runIntegrationProbe() {
  console.log('================================================================');
  console.log(' [INTEGRATION PROBE] Live NCO Matching & Domain Disambiguation');
  console.log('================================================================\n');

  const testSkills = [
    { skill: 'Python Scripting', sector: 'IT-ITeS & Software' },
    { skill: 'Python Programming', sector: 'IT-ITeS & Software' },
    { skill: 'React.js Developer', sector: 'IT-ITeS & Software' },
    { skill: 'SQL', sector: 'IT-ITeS & Software' },
    { skill: 'Welding', sector: 'Manufacturing & Capital Goods' },
    { skill: 'Solar PV Installation', sector: 'Renewable Energy & Green Jobs' }
  ];

  for (const { skill, sector } of testSkills) {
    console.log('----------------------------------------------------------------');
    console.log(`🔎 Testing Skill: "${skill}" (Sector: ${sector})`);
    console.log('----------------------------------------------------------------');

    const result = await matchSkill(skill, { sector });

    if (skill === 'Python Scripting') {
      console.log('\n📊 TOP 5 CANDIDATES BEFORE DOMAIN RERANKING (Raw Cosine):');
      result.topCandidatesBeforeRerank?.slice(0, 5).forEach((c, idx) => {
        console.log(`   ${idx + 1}. [${c.code}] ${c.title} | Cosine: ${c.similarity.toFixed(4)} | ${c.family}`);
      });

      console.log('\n📊 TOP 5 CANDIDATES AFTER DOMAIN RERANKING:');
      result.topCandidatesAfterRerank?.slice(0, 5).forEach((c, idx) => {
        console.log(
          `   ${idx + 1}. [${c.code}] ${c.title} | Final: ${c.confidence?.toFixed(4)} | Raw: ${c.similarity.toFixed(4)} | Compat: ${c.compatibility} | ${c.family}`
        );
      });
      console.log('');
    }

    console.log('📊 Actual Selected Match:');
    console.log(`   • Raw Skill           : "${result.rawSkill}"`);
    console.log(`   • Target Sector       : ${result.sector}`);
    console.log(`   • NCO Code            : ${result.ncoCode}`);
    console.log(`   • NCO Title           : ${result.ncoTitle}`);
    console.log(`   • NCO Family          : ${result.ncoFamily}`);
    console.log(`   • Final Confidence    : ${result.confidence.toFixed(4)}`);
    console.log(`   • Semantic (Raw Cosine): ${result.semanticConfidence.toFixed(4)}`);
    console.log(`   • Domain Compatibility: ${result.domainCompatibility}`);
    console.log(`   • Match Status        : ${result.matchStatus}`);
    console.log(`   • Disambiguation Info : ${result.explanation}`);
    console.log(`   • Source Authority    : ${result.source}`);
    console.log(`   • Source URL          : ${result.sourceUrl}\n`);

    // Verify assertions
    if (!result.ncoCode || result.ncoCode.trim().length === 0) {
      throw new Error(`Assertion failed: NCO code is empty for "${skill}".`);
    }

    if (!result.ncoTitle || result.ncoTitle.trim().length === 0) {
      throw new Error(`Assertion failed: NCO title is empty for "${skill}".`);
    }

    if (
      typeof result.confidence !== 'number' ||
      isNaN(result.confidence) ||
      result.confidence < 0 ||
      result.confidence > 1
    ) {
      throw new Error(`Assertion failed: Invalid confidence for "${skill}": ${result.confidence}`);
    }

    if (
      typeof result.semanticConfidence !== 'number' ||
      isNaN(result.semanticConfidence) ||
      result.semanticConfidence < 0 ||
      result.semanticConfidence > 1
    ) {
      throw new Error(`Assertion failed: Invalid semantic confidence for "${skill}": ${result.semanticConfidence}`);
    }

    const expectedStatus =
      result.confidence >= MATCH_ACCEPTANCE_THRESHOLD ? 'accepted' : 'needs_review';
    if (result.matchStatus !== expectedStatus) {
      throw new Error(
        `Assertion failed: matchStatus '${result.matchStatus}' does not agree with threshold ${MATCH_ACCEPTANCE_THRESHOLD} for "${skill}" (confidence ${result.confidence})`
      );
    }

    if (!result.explanation || result.explanation.length === 0) {
      throw new Error(`Assertion failed: explanation is empty for "${skill}".`);
    }

    // Specific assertions for "Python Scripting"
    if (skill === 'Python Scripting') {
      if (result.ncoCode === '2641.0601') {
        throw new Error('Assertion failed: "Python Scripting" should NOT map to Script Writer (2641.0601)!');
      }
      if (!result.ncoCode.startsWith('251')) {
        throw new Error(
          `Assertion failed: "Python Scripting" should map to ICT Software/Programming Group 251, got ${result.ncoCode}`
        );
      }
      if (result.confidence >= MATCH_ACCEPTANCE_THRESHOLD) {
        throw new Error(
          `Assertion failed: "Python Scripting" confidence (${result.confidence}) should remain honest (< 0.75) and not manufactured.`
        );
      }
      if (result.matchStatus !== 'needs_review') {
        throw new Error(
          `Assertion failed: "Python Scripting" status should remain 'needs_review', got ${result.matchStatus}`
        );
      }
      console.log('   ✅ "Python Scripting" domain disambiguation verification PASSED (Programmer outranked Script Writer).');
    }

    // Specific assertion for "Welding"
    if (skill === 'Welding') {
      if (result.confidence < MATCH_ACCEPTANCE_THRESHOLD) {
        throw new Error(`Assertion failed: "Welding" confidence should be >= 0.75, got ${result.confidence}`);
      }
      if (result.matchStatus !== 'accepted') {
        throw new Error(`Assertion failed: "Welding" should be 'accepted', got ${result.matchStatus}`);
      }
      console.log('   ✅ "Welding" high-confidence acceptance verification PASSED.');
    }
  }

  console.log('\n================================================================');
  console.log('✅ ALL NCO DISAMBIGUATION INTEGRATION TESTS PASSED');
  console.log('================================================================\n');
}

async function main() {
  runUnitTests();
  await runIntegrationProbe();
}

main().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
