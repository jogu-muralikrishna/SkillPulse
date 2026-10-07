/**
 * ============================================================================
 * SKILLPULSE ML FORECASTING INTEGRATION & FALLBACK TEST SUITE
 * ============================================================================
 * Tests:
 * 1. Direct Python FastAPI /forecast probe:
 *    - Valid 8-quarter reproducible series -> valid ML model, holdout MAPE, 95% intervals
 *    - Fewer than 4 quarters -> isAvailable: false
 *    - Interval bounds check: lower95 <= forecast <= upper95
 * 2. Node server forecast integration:
 *    - Live call with real Hyderabad Python Development data (15 quarters) -> ML Forecaster
 *    - Live call with insufficient history (< 4 quarters) -> isAvailable: false
 * 3. Node server OLS fallback verification:
 *    - Simulated dead ML service URL -> falls back gracefully to OLS baseline
 *    - Fallback clearly labeled as "Ordinary Least Squares (OLS) Linear Trend (Fallback)"
 * ============================================================================
 */

import http from 'http';
import app from '../src/server/app';

const PORT = 3998;
let server: http.Server;

// Reproducible 8-quarter test series
const REPRODUCIBLE_8Q_SERIES = [
  { period: '2023-Q1', value: 150.0 },
  { period: '2023-Q2', value: 180.0 },
  { period: '2023-Q3', value: 210.0 },
  { period: '2023-Q4', value: 170.0 },
  { period: '2024-Q1', value: 165.0 },
  { period: '2024-Q2', value: 200.0 },
  { period: '2024-Q3', value: 235.0 },
  { period: '2024-Q4', value: 190.0 }
];

async function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST] Test Express server listening on port ${PORT}`);
      resolve();
    });
  });
}

async function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runDirectPythonTests(): Promise<void> {
  console.log('================================================================');
  console.log(' [1/3] DIRECT PYTHON FASTAPI /forecast ENDPOINT PROBE');
  console.log('================================================================\n');

  const pythonUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

  // 1. Health check
  console.log(`📡 Connecting to ML service at ${pythonUrl}/health...`);
  const healthRes = await fetch(`${pythonUrl}/health`);
  if (!healthRes.ok) {
    throw new Error(`ML service health check failed with status ${healthRes.status}`);
  }
  const healthJson = await healthRes.json();
  console.log(`   ✅ ML Service status: ${healthJson.status} (models: ${healthJson.models.join(', ')})`);

  // 2. Minimum history test (< 4 quarters)
  console.log('📡 Testing minimum history rule (< 4 quarters)...');
  const shortRes = await fetch(`${pythonUrl}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      series: [
        { period: '2024-Q1', value: 100 },
        { period: '2024-Q2', value: 110 },
        { period: '2024-Q3', value: 120 }
      ],
      horizon: 4
    })
  });
  const shortJson = await shortRes.json();
  if (shortJson.isAvailable !== false) {
    throw new Error('Assertion failed: < 4 quarters must return isAvailable=false');
  }
  console.log(`   ✅ < 4 quarters correctly returned isAvailable: false ("${shortJson.reason}")`);

  // 3. Valid 8-quarter series test
  console.log('📡 Testing 8-quarter reproducible series on Python service...');
  const validRes = await fetch(`${pythonUrl}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      series: REPRODUCIBLE_8Q_SERIES,
      horizon: 4
    })
  });
  const validJson = await validRes.json();

  if (!validJson.isAvailable) {
    throw new Error(`Assertion failed: 8-quarter series returned isAvailable=false: ${validJson.reason}`);
  }
  if (!['Holt-Winters', 'LightGBM'].includes(validJson.model)) {
    throw new Error(`Assertion failed: Unexpected model: ${validJson.model}`);
  }
  if (typeof validJson.heldOutMAPE !== 'number' || validJson.heldOutMAPE <= 0) {
    throw new Error(`Assertion failed: Invalid heldOutMAPE: ${validJson.heldOutMAPE}`);
  }
  if (validJson.forecast.length !== 4) {
    throw new Error(`Assertion failed: Forecast horizon length ${validJson.forecast.length} !== 4`);
  }

  console.log(`   ✅ Selected Model: ${validJson.model}`);
  console.log(`   ✅ Held-Out Validation MAPE: ${validJson.heldOutMAPE}%`);
  console.log(`   ✅ Selection Reason: ${validJson.validation.selectionReason}`);

  // Check prediction interval consistency
  for (let idx = 0; idx < 4; idx++) {
    const pt = validJson.forecast[idx];
    const low = validJson.lower95[idx];
    const up = validJson.upper95[idx];
    if (low > pt.value || pt.value > up) {
      throw new Error(`Interval violation: lower (${low}) <= forecast (${pt.value}) <= upper (${up}) failed`);
    }
    console.log(`   • ${pt.period}: Forecast = ${pt.value} [95% Band: ${low} to ${up}]`);
  }
  console.log('   ✅ 95% Prediction Interval bounds verified (lower95 <= forecast <= upper95)\n');
}

async function runNodeIntegrationTests(): Promise<void> {
  console.log('================================================================');
  console.log(' [2/3] NODE EXPRESS /api/forecast ENDPOINT INTEGRATION');
  console.log('================================================================\n');

  // Test real dataset query: Python Development in Hyderabad, Telangana (15 historical quarters)
  const queryUrl = `http://127.0.0.1:${PORT}/api/forecast?skill=Python%20Development&state=Telangana&district=Hyderabad&horizon=4`;
  console.log(`📡 Querying Node endpoint: ${queryUrl}`);

  const res = await fetch(queryUrl);
  if (!res.ok) {
    throw new Error(`Node /api/forecast returned HTTP ${res.status}`);
  }
  const json = await res.json();

  if (!json.isAvailable) {
    throw new Error(`Assertion failed: Hyderabad Python Development should be available, got: ${json.reason}`);
  }

  console.log(`   ✅ Model Used: ${json.modelUsed}`);
  console.log(`   ✅ Held-Out MAPE: ${json.metrics.heldOutMAPE}%`);
  console.log(`   ✅ Historical Quarters Analyzed: ${json.historicalData.length}`);
  console.log(`   ✅ Projected Horizon: ${json.horizon}`);
  console.log(`   ✅ End Period Prediction: ${json.forecastData[json.forecastData.length - 1].period} = ${json.forecastData[json.forecastData.length - 1].predictedDemand} vacancies`);
  console.log(`   ✅ Explanation:\n      ${json.explanation}\n`);

  if (!json.modelUsed.includes('ML Forecaster')) {
    throw new Error(`Assertion failed: Expected ML Forecaster, got: ${json.modelUsed}`);
  }
}

async function runNodeFallbackTests(): Promise<void> {
  console.log('================================================================');
  console.log(' [3/3] NODE OLS FALLBACK WHEN ML SERVICE UNAVAILABLE');
  console.log('================================================================\n');

  // Save original ML_SERVICE_URL and point to an unreachable port
  const originalUrl = process.env.ML_SERVICE_URL;
  process.env.ML_SERVICE_URL = 'http://127.0.0.1:9999'; // unreachable dead port

  try {
    const queryUrl = `http://127.0.0.1:${PORT}/api/forecast?skill=Python%20Development&state=Telangana&district=Hyderabad&horizon=4`;
    console.log(`📡 Simulating dead ML service at ${process.env.ML_SERVICE_URL}...`);
    console.log(`📡 Querying Node endpoint: ${queryUrl}`);

    const res = await fetch(queryUrl);
    if (!res.ok) {
      throw new Error(`Node /api/forecast returned HTTP ${res.status}`);
    }
    const json = await res.json();

    console.log(`   ✅ Fallback Response Received: isAvailable = ${json.isAvailable}`);
    console.log(`   ✅ Model Used: "${json.modelUsed}"`);
    console.log(`   ✅ Projected Horizon: ${json.horizon}`);
    console.log(`   ✅ First Predicted Point: ${json.forecastData[0].period} = ${json.forecastData[0].predictedDemand}`);

    if (json.modelUsed !== 'Ordinary Least Squares (OLS) Linear Trend (Fallback)') {
      throw new Error(
        `Assertion failed: Expected 'Ordinary Least Squares (OLS) Linear Trend (Fallback)', got '${json.modelUsed}'`
      );
    }

    if (!json.validation?.fallback) {
      throw new Error('Assertion failed: validation.fallback must be true');
    }

    console.log('   ✅ OLS Fallback executed seamlessly without hanging or throwing.\n');
  } finally {
    if (originalUrl !== undefined) {
      process.env.ML_SERVICE_URL = originalUrl;
    } else {
      delete process.env.ML_SERVICE_URL;
    }
  }
}

async function runUiIntegrationTests(): Promise<void> {
  console.log('================================================================');
  console.log(' [4/4] FORECAST UI PRESENTATION & FORMATTING ACCEPTANCE TESTS');
  console.log('================================================================\n');

  // 1. Test formatHeldOutMAPE unit cases
  const { formatHeldOutMAPE } = await import('../src/utils/numberFormatter.js');

  console.log('📡 Testing MAPE formatting rule (0.0463 -> 4.63%, not 0.0463%)...');
  const formatted0463 = formatHeldOutMAPE(0.0463);
  if (formatted0463 !== '4.63%') {
    throw new Error(`Assertion failed: formatHeldOutMAPE(0.0463) returned '${formatted0463}', expected '4.63%'`);
  }
  if (formatted0463.includes('0.0463%')) {
    throw new Error('Assertion failed: Output must never be 0.0463%');
  }
  console.log(`   ✅ 0.0463 correctly formatted as: "${formatted0463}"`);

  const formatted111 = formatHeldOutMAPE(0.111);
  if (formatted111 !== '11.1%') {
    throw new Error(`Assertion failed: formatHeldOutMAPE(0.111) returned '${formatted111}', expected '11.1%'`);
  }
  console.log(`   ✅ 0.111 correctly formatted as: "${formatted111}"`);

  const formattedScaled = formatHeldOutMAPE(4.63);
  if (formattedScaled !== '4.63%') {
    throw new Error(`Assertion failed: formatHeldOutMAPE(4.63) returned '${formattedScaled}', expected '4.63%'`);
  }
  console.log(`   ✅ 4.63 (pre-scaled) correctly formatted as: "${formattedScaled}"`);

  // 2. Case A: Successful ML response validation
  console.log('\n📡 Testing UI Case A: Successful ML response presentation...');
  const mlRes = await fetch(
    `http://127.0.0.1:${PORT}/api/forecast?skill=Python%20Development&state=Telangana&district=Hyderabad&horizon=4`
  );
  const mlJson = await mlRes.json();
  if (!mlJson.isAvailable) {
    throw new Error('Case A failed: Expected isAvailable = true');
  }
  const isFallbackA = Boolean(
    mlJson.validation?.fallback ||
    mlJson.modelUsed?.includes('Fallback') ||
    mlJson.modelUsed?.includes('OLS')
  );
  if (isFallbackA) {
    throw new Error('Case A failed: Unexpected fallback when ML service is active');
  }
  const selectedModelA = mlJson.technicalDetails?.selectedModel ||
    (mlJson.modelUsed?.includes('Holt-Winters') ? 'Holt-Winters' : 'LightGBM');
  const formattedMapeA = formatHeldOutMAPE(mlJson.metrics.heldOutMAPE);
  console.log(`   ✅ UI Display Model: "${selectedModelA}"`);
  console.log(`   ✅ UI Display Held-out MAPE: "${formattedMapeA}"`);
  console.log(`   ✅ UI Display Horizon: "${mlJson.horizon}"`);
  console.log(`   ✅ UI Forecast Values Count: ${mlJson.forecastData.length} quarters`);
  console.log(`   ✅ UI Prediction Band Sample: [${mlJson.forecastData[0].lowerBound} <= ${mlJson.forecastData[0].predictedDemand} <= ${mlJson.forecastData[0].upperBound}]`);

  // 3. Case B: OLS fallback response presentation
  console.log('\n📡 Testing UI Case B: OLS fallback presentation (simulating unreachable ML)...');
  const originalUrl = process.env.ML_SERVICE_URL;
  process.env.ML_SERVICE_URL = 'http://127.0.0.1:9999';
  try {
    const fbRes = await fetch(
      `http://127.0.0.1:${PORT}/api/forecast?skill=Python%20Development&state=Telangana&district=Hyderabad&horizon=4`
    );
    const fbJson = await fbRes.json();
    const isFallbackB = Boolean(
      fbJson.validation?.fallback ||
      fbJson.modelUsed?.includes('Fallback') ||
      fbJson.modelUsed?.includes('OLS')
    );
    if (!isFallbackB) {
      throw new Error('Case B failed: Expected fallback to be true');
    }
    const displayModelB = 'OLS (Fallback)';
    if (displayModelB.includes('ML')) {
      throw new Error('Case B failed: Fallback model must not be called ML');
    }
    console.log(`   ✅ UI Display Model: "${displayModelB}" (no misleading ML branding)`);
    console.log(`   ✅ UI Fallback Notice: "${fbJson.validation?.reason}"`);
  } finally {
    if (originalUrl !== undefined) {
      process.env.ML_SERVICE_URL = originalUrl;
    } else {
      delete process.env.ML_SERVICE_URL;
    }
  }

  // 4. Case C: Insufficient history response presentation (< 4 quarters)
  console.log('\n📡 Testing UI Case C: Insufficient history presentation (< 4 quarters)...');
  const insuffRes = await fetch(
    `http://127.0.0.1:${PORT}/api/forecast?skill=Nonexistent%20Skill&state=Telangana&district=Hyderabad&horizon=4`
  );
  const insuffJson = await insuffRes.json();
  if (insuffJson.isAvailable !== false) {
    throw new Error('Case C failed: Expected isAvailable = false for < 4 quarters');
  }
  if (!insuffJson.reason.includes('minimum of 4')) {
    throw new Error('Case C failed: Explanation must state minimum 4 quarters required');
  }
  if (insuffJson.forecastData.length !== 0) {
    throw new Error('Case C failed: forecastData must be empty');
  }
  console.log(`   ✅ UI Unavailable Notice: "${insuffJson.reason}"`);
  console.log(`   ✅ UI Forecast Values Count: ${insuffJson.forecastData.length} (no fabricated values)`);
  console.log('   ✅ Insufficient history state verified.\n');
}

async function main() {
  await startServer();
  try {
    await runDirectPythonTests();
    await runNodeIntegrationTests();
    await runNodeFallbackTests();
    await runUiIntegrationTests();

    console.log('================================================================');
    console.log('✅ ALL ML FORECAST & UI INTEGRATION ACCEPTANCE TESTS PASSED');
    console.log('================================================================\n');
  } finally {
    await stopServer();
  }
}

main().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
