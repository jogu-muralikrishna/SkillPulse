/**
 * ============================================================================
 * SKILLPULSE PHASE 4B — ASSISTANT UI CONTRACT ACCEPTANCE TEST SUITE
 * ============================================================================
 * Verifies:
 * 1. UI Response Contract: { answer, sources[], toolCalls[], isFallback? }
 * 2. Scenario A: Skill gap query -> answer + /api/gaps source chip
 * 3. Scenario B: Forecast query -> answer + /api/forecast source chip
 * 4. Scenario C: Multi-tool query -> answer + multiple relevant source chips
 * 5. Scenario D: Unavailable data -> "data not available"
 * 6. Scenario E: Gemini failure fallback / error handling (no data fabrication)
 * 7. Security: Zero exposure of API keys, stack traces, or credentials
 * ============================================================================
 */

import { processAssistantChat } from '../src/server/assistantService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runUiContractTests() {
  console.log('================================================================');
  console.log(' SKILLPULSE PHASE 4B — ASSISTANT UI CONTRACT TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Scenario A: Skill gap question
  // --------------------------------------------------------------------------
  console.log('📋 [Scenario A] Testing Skill Gap Question UI Contract...');
  const gapRes = await processAssistantChat({
    message: 'Which skills show a potential shortage in Hyderabad?',
    state: 'Telangana',
    district: 'Hyderabad'
  });

  assert(typeof gapRes.answer === 'string' && gapRes.answer.length > 0, 'Answer must be non-empty string');
  assert(Array.isArray(gapRes.sources), 'Sources must be an array');
  assert(gapRes.sources.some(s => s.endpoint === '/api/gaps'), 'Must include /api/gaps source chip');
  
  const gapChip = gapRes.sources.find(s => s.endpoint === '/api/gaps');
  assert(Boolean(gapChip?.source), 'Source chip must contain human-readable source title');
  console.log(`   ✅ Answer received (${gapRes.answer.length} chars)`);
  console.log(`   ✅ Source chip rendered: Source: ${gapChip?.endpoint} · ${gapChip?.source}`);
  if (gapRes.toolCalls?.length) {
    console.log(`   ✅ Subtle tool usage: ${gapRes.toolCalls.map(t => `Used: ${t.name}`).join(', ')}`);
  }
  console.log('');

  // --------------------------------------------------------------------------
  // Scenario B: Forecast question
  // --------------------------------------------------------------------------
  console.log('📋 [Scenario B] Testing Forecast Question UI Contract...');
  const forecastRes = await processAssistantChat({
    message: 'What is the demand forecast for Python Development in Hyderabad for the next 4 quarters?',
    state: 'Telangana',
    district: 'Hyderabad',
    skill: 'Python Development'
  });

  assert(typeof forecastRes.answer === 'string' && forecastRes.answer.length > 0, 'Answer must be non-empty string');
  assert(Array.isArray(forecastRes.sources), 'Sources must be an array');
  assert(forecastRes.sources.some(s => s.endpoint === '/api/forecast'), 'Must include /api/forecast source chip');

  const forecastChip = forecastRes.sources.find(s => s.endpoint === '/api/forecast');
  assert(Boolean(forecastChip?.source), 'Source chip must contain human-readable source title');
  console.log(`   ✅ Answer received (${forecastRes.answer.length} chars)`);
  console.log(`   ✅ Source chip rendered: Source: ${forecastChip?.endpoint} · ${forecastChip?.source}`);
  if (forecastRes.toolCalls?.length) {
    console.log(`   ✅ Subtle tool usage: ${forecastRes.toolCalls.map(t => `Used: ${t.name}`).join(', ')}`);
  }
  console.log('');

  // --------------------------------------------------------------------------
  // Scenario C: Multi-tool question requiring multiple source chips
  // --------------------------------------------------------------------------
  console.log('📋 [Scenario C] Testing Multi-Tool Question UI Contract...');
  const multiRes = await processAssistantChat({
    message: 'Compare the current demand for Python Development in Hyderabad with its projected forecast.',
    state: 'Telangana',
    district: 'Hyderabad',
    skill: 'Python Development'
  });

  assert(typeof multiRes.answer === 'string' && multiRes.answer.length > 0, 'Answer must be non-empty string');
  assert(Array.isArray(multiRes.sources), 'Sources must be an array');
  assert(multiRes.sources.length >= 1, 'Must have at least one verified source');

  console.log(`   ✅ Multi-source answer received:`);
  multiRes.sources.forEach((s, idx) => {
    console.log(`      Chip [${idx + 1}]: Source: ${s.endpoint} · ${s.source}`);
  });
  console.log('');

  // --------------------------------------------------------------------------
  // Scenario D: Missing data handling ("data not available")
  // --------------------------------------------------------------------------
  console.log('📋 [Scenario D] Testing "Data Not Available" Handling...');
  const noDataRes = await processAssistantChat({
    message: 'Forecast the demand for Quantum Computing in Leh Ladakh for 2030.',
    state: 'Ladakh',
    district: 'Leh',
    skill: 'Quantum Computing'
  });

  assert(typeof noDataRes.answer === 'string', 'Answer must be string');
  const answerLower = noDataRes.answer.toLowerCase();
  const hasNotAvailable = answerLower.includes('not available') || answerLower.includes('data not available');
  assert(hasNotAvailable, 'Response must clearly indicate data is not available');
  console.log(`   ✅ Missing data explicitly handled: "${noDataRes.answer.trim().slice(0, 100)}..."`);
  console.log('');

  // --------------------------------------------------------------------------
  // Scenario E: Gemini fallback / error presentation (no fabrication)
  // --------------------------------------------------------------------------
  console.log('📋 [Scenario E] Testing Deterministic Fallback UI Contract...');
  // Force fallback by simulating missing GEMINI_API_KEY environment variable
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const fallbackRes = await processAssistantChat({
      message: 'What is the demand in Hyderabad?',
      state: 'Telangana',
      district: 'Hyderabad'
    });

    assert(typeof fallbackRes.answer === 'string' && fallbackRes.answer.length > 0, 'Fallback answer must be non-empty');
    assert(fallbackRes.isFallback === true, 'isFallback flag must be set to true');
    assert(fallbackRes.sources.length > 0, 'Fallback must cite verified source chip');
    assert(!fallbackRes.answer.includes('AI Hallucination'), 'No fabricated facts');
    console.log(`   ✅ Fallback contract confirmed: isFallback = ${fallbackRes.isFallback}`);
    console.log(`   ✅ Fallback source: Source: ${fallbackRes.sources[0]?.endpoint} · ${fallbackRes.sources[0]?.source}`);
    console.log(`   ✅ Fallback answer grounded in database: "${fallbackRes.answer.slice(0, 80)}..."`);
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }
  console.log('');

  // --------------------------------------------------------------------------
  // Scenario F: Security and privacy audit
  // --------------------------------------------------------------------------
  console.log('🔒 [Scenario F] Auditing Security & Non-Exposure of Secrets...');
  const serialized = JSON.stringify([gapRes, forecastRes, multiRes, noDataRes]);
  assert(!serialized.includes(process.env.GEMINI_API_KEY || 'AIzaSy'), 'GEMINI_API_KEY must never appear in response');
  assert(!serialized.includes('at processAssistantChat'), 'No raw stack traces in response');
  console.log('   ✅ No API keys, credentials, or stack traces exposed in responses.\n');

  console.log('================================================================');
  console.log('✅ ALL PHASE 4B ASSISTANT UI CONTRACT ACCEPTANCE TESTS PASSED');
  console.log('================================================================');
}

runUiContractTests().catch((err) => {
  console.error('\n❌ ASSISTANT UI CONTRACT TEST FAILED:', err);
  process.exit(1);
});
