/**
 * ============================================================================
 * SKILLPULSE PHASE 5B — QoQ ANOMALY DETECTION ACCEPTANCE TEST SUITE
 * ============================================================================
 * Tests:
 * A. Known synthetic spike >3 SD is detected (direction: 'spike', zScore > 3)
 * B. Normal change is not detected (|z| <= 3 yields 0 anomalies)
 * C. Known large drop >3 SD is detected (direction: 'drop', zScore < -3)
 * D. Insufficient history returns no false anomaly (< 4 QoQ transitions)
 * E. Zero variance returns no false anomaly (std == 0, safe status)
 * F. Missing quarter is not treated as zero
 * G. State/district filtering works
 * H. Multiple skill/geography series are isolated correctly
 * I. Result contains source/provenance metadata
 * J. No fabricated values
 * ============================================================================
 */

import { detectQoqAnomalies } from '../src/utils/anomalyDetection';
import { DemandRecord } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Helper to create synthetic series records
function makeSyntheticSeries(
  state: string,
  district: string,
  skill: string,
  startQuarterIndex: number,
  values: number[]
): DemandRecord[] {
  const records: DemandRecord[] = [];
  for (let i = 0; i < values.length; i++) {
    const qIndex = startQuarterIndex + i;
    const year = 2023 + Math.floor(qIndex / 4);
    const qNum = (qIndex % 4) + 1;
    const quarter = `Q${qNum}`;
    const period = `${year}-${quarter}`;

    records.push({
      id: `syn-${state}-${district}-${skill}-${period}`,
      period,
      year,
      quarter,
      state,
      district,
      normalizedSkill: skill,
      jobRole: `${skill} Professional`,
      sector: 'Technology & Engineering',
      demandCount: values[i],
      source: 'Synthetic Test Registry',
      geography_level: 'DISTRICT',
      provenance: {
        source_name: 'Synthetic Test',
        source_url: 'https://test.skillpulse.org',
        access_date: '2026-10-07',
        dataset_name: 'Test Demand Series',
        source_period: period,
        geography_level: 'DISTRICT',
        verification_status: 'VERIFIED_INGESTED',
        is_development_fixture: true,
        ingestion_date: '2026-10-07',
        is_forecast: false
      }
    });
  }
  return records;
}

async function runTests() {
  console.log('================================================================');
  console.log(' SKILLPULSE PHASE 5B — QoQ ANOMALY DETECTION TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Scenario A: Known synthetic spike > 3 SD
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario A] Testing detection of synthetic spike > 3 SD...');
  // 13 values: 11 steps of +10, followed by 1 step of +300
  const spikeValues = [100];
  for (let i = 0; i < 11; i++) spikeValues.push(spikeValues[spikeValues.length - 1] + 10);
  spikeValues.push(spikeValues[spikeValues.length - 1] + 300); // Massive sudden jump

  const spikeRecords = makeSyntheticSeries('Telangana', 'Hyderabad', 'Cloud Computing', 0, spikeValues);
  const spikeRes = detectQoqAnomalies({}, spikeRecords);

  assert(spikeRes.totalAnomalies === 1, `Expected 1 anomaly, found ${spikeRes.totalAnomalies}`);
  const spikeAnomaly = spikeRes.anomalies[0];
  assert(spikeAnomaly.direction === 'spike', 'Direction must be "spike"');
  assert(spikeAnomaly.zScore > 3.0, `zScore must be > 3.0, got ${spikeAnomaly.zScore}`);
  assert(spikeAnomaly.qoqChange === 300, `qoqChange must be 300, got ${spikeAnomaly.qoqChange}`);
  assert(spikeAnomaly.severity === 'high' || spikeAnomaly.severity === 'critical', 'Severity must be high/critical');
  console.log(`   ✅ Spike detected: period ${spikeAnomaly.period}, delta = +${spikeAnomaly.qoqChange}, z = +${spikeAnomaly.zScore} (${spikeAnomaly.direction})\n`);

  // --------------------------------------------------------------------------
  // Scenario B: Normal change is not detected
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario B] Testing normal changes (no false positives)...');
  // Regular steady growth series (+10, +12, +9, +11, +10, +13, +10, +11, +12, +10)
  const normalDeltas = [10, 12, 9, 11, 10, 13, 10, 11, 12, 10, 11, 10];
  const normalValues = [100];
  normalDeltas.forEach(d => normalValues.push(normalValues[normalValues.length - 1] + d));

  const normalRecords = makeSyntheticSeries('Maharashtra', 'Pune', 'Mechanical Design', 0, normalValues);
  const normalRes = detectQoqAnomalies({}, normalRecords);

  assert(normalRes.totalAnomalies === 0, `Normal series must produce 0 anomalies, got ${normalRes.totalAnomalies}`);
  assert(normalRes.message.includes('No statistically significant QoQ anomalies detected'), 'Must return standard empty state message');
  console.log(`   ✅ Normal series verified: 0 anomalies flagged across ${normalRes.seriesAnalyzed} series.\n`);

  // --------------------------------------------------------------------------
  // Scenario C: Known large drop > 3 SD
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario C] Testing detection of synthetic drop > 3 SD...');
  // 13 values: 11 steps of +10, followed by 1 step of -300
  const dropValues = [500];
  for (let i = 0; i < 11; i++) dropValues.push(dropValues[dropValues.length - 1] + 10);
  dropValues.push(dropValues[dropValues.length - 1] - 300); // Sudden crash

  const dropRecords = makeSyntheticSeries('Karnataka', 'Bengaluru Urban', 'Hardware Assembly', 0, dropValues);
  const dropRes = detectQoqAnomalies({}, dropRecords);

  assert(dropRes.totalAnomalies === 1, `Expected 1 anomaly, found ${dropRes.totalAnomalies}`);
  const dropAnomaly = dropRes.anomalies[0];
  assert(dropAnomaly.direction === 'drop', 'Direction must be "drop"');
  assert(dropAnomaly.zScore < -3.0, `zScore must be < -3.0, got ${dropAnomaly.zScore}`);
  assert(dropAnomaly.qoqChange === -300, `qoqChange must be -300, got ${dropAnomaly.qoqChange}`);
  console.log(`   ✅ Drop detected: period ${dropAnomaly.period}, delta = ${dropAnomaly.qoqChange}, z = ${dropAnomaly.zScore} (${dropAnomaly.direction})\n`);

  // --------------------------------------------------------------------------
  // Scenario D: Insufficient history returns no false anomaly
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario D] Testing small-data safety (< 4 QoQ transitions)...');
  // Only 3 observations (2 QoQ changes), even with extreme jump
  const smallValues = [100, 110, 9999];
  const smallRecords = makeSyntheticSeries('Gujarat', 'Ahmedabad', 'Renewable Tech', 0, smallValues);
  const smallRes = detectQoqAnomalies({}, smallRecords);

  assert(smallRes.totalAnomalies === 0, 'Must produce 0 anomalies when history is insufficient');
  assert(smallRes.seriesAnalyzed === 0, 'Series with < 4 transitions must not be eligible for 3-sigma evaluation');
  assert(smallRes.diagnostics?.[0].status === 'insufficient_history', 'Diagnostic status must be insufficient_history');
  console.log(`   ✅ Small-data safety verified: diagnostic status = "${smallRes.diagnostics?.[0].status}".\n`);

  // --------------------------------------------------------------------------
  // Scenario E: Zero variance returns no false anomaly
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario E] Testing zero-variance safety (constant delta)...');
  // 8 observations: exactly +10 every quarter (variance = 0)
  const zeroVarValues = [100, 110, 120, 130, 140, 150, 160, 170];
  const zeroVarRecords = makeSyntheticSeries('Delhi', 'Central Delhi', 'Cyber Defense', 0, zeroVarValues);
  const zeroVarRes = detectQoqAnomalies({}, zeroVarRecords);

  assert(zeroVarRes.totalAnomalies === 0, 'Zero-variance series must not produce false anomalies');
  assert(zeroVarRes.diagnostics?.[0].status === 'zero_variance', 'Diagnostic status must be zero_variance');
  console.log(`   ✅ Zero-variance safety verified: status = "${zeroVarRes.diagnostics?.[0].status}".\n`);

  // --------------------------------------------------------------------------
  // Scenario F: Missing quarter is not treated as zero
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario F] Testing missing quarter handling (no 0-padding)...');
  // Construct records skipping 2024-Q2
  const skippedRecords: DemandRecord[] = [
    ...makeSyntheticSeries('Tamil Nadu', 'Chennai', 'Bioinformatics', 0, [100, 110]), // 2023-Q1, 2023-Q2
    ...makeSyntheticSeries('Tamil Nadu', 'Chennai', 'Bioinformatics', 3, [120, 130, 140, 150]) // skips 2023-Q3
  ];
  const skipRes = detectQoqAnomalies({}, skippedRecords);
  // Ensure that no delta of -110 or +120 was generated from a fabricated zero
  const nonExistentZeroDelta = skipRes.anomalies.some(a => a.currentValue === 0 || a.previousValue === 0);
  assert(!nonExistentZeroDelta, 'Missing quarter must never inject a zero value');
  console.log('   ✅ Missing quarter preserved without zero-padding.\n');

  // --------------------------------------------------------------------------
  // Scenario G: State/District filtering
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario G] Testing state and district filtering...');
  const mixedRecords = [
    ...spikeRecords, // Telangana / Hyderabad
    ...dropRecords   // Karnataka / Bengaluru Urban
  ];

  const filteredTg = detectQoqAnomalies({ state: 'Telangana', district: 'Hyderabad' }, mixedRecords);
  assert(filteredTg.totalAnomalies === 1, 'Filtered query must return only Telangana anomaly');
  assert(filteredTg.anomalies[0].state === 'Telangana', 'State must match Telangana filter');

  const filteredKa = detectQoqAnomalies({ state: 'Karnataka' }, mixedRecords);
  assert(filteredKa.totalAnomalies === 1, 'Filtered query must return only Karnataka anomaly');
  assert(filteredKa.anomalies[0].state === 'Karnataka', 'State must match Karnataka filter');
  console.log('   ✅ Geography filtering verified.\n');

  // --------------------------------------------------------------------------
  // Scenario H: Multiple series isolated correctly
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario H] Testing multi-series isolation...');
  const combinedRes = detectQoqAnomalies({}, mixedRecords);
  assert(combinedRes.totalAnomalies === 2, 'Unfiltered multi-series must detect both anomalies');
  assert(combinedRes.seriesAnalyzed === 2, 'Must analyze both series independently');
  console.log('   ✅ Independent series statistics confirmed.\n');

  // --------------------------------------------------------------------------
  // Scenario I: Provenance and Response Metadata
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario I] Testing provenance & contract schema...');
  assert(combinedRes.source === 'SkillPulse Data Quality Engine', 'Source must match');
  assert(combinedRes.endpoint === '/api/anomalies', 'Endpoint must match');
  assert(combinedRes.provenance.thresholdMultiplier === 3, 'Multiplier must be 3');
  assert(combinedRes.provenance.minimumQoqObservations === 4, 'Minimum QoQ count must be 4');
  console.log(`   ✅ Contract metadata verified: ${combinedRes.source} (${combinedRes.endpoint})\n`);

  // --------------------------------------------------------------------------
  // Scenario J: Zero Fabricated Numbers
  // --------------------------------------------------------------------------
  console.log('📡 [Scenario J] Testing zero fabrication in output metrics...');
  for (const a of combinedRes.anomalies) {
    assert(a.qoqChange === a.currentValue - a.previousValue, 'qoqChange must equal currentValue - previousValue');
    assert(typeof a.meanQoqChange === 'number', 'meanQoqChange must be numeric');
    assert(typeof a.stdQoqChange === 'number' && a.stdQoqChange > 0, 'stdQoqChange must be positive number');
    const expectedZ = Math.round(((a.qoqChange - a.meanQoqChange) / a.stdQoqChange) * 100) / 100;
    assert(Math.abs(a.zScore - expectedZ) <= 0.05, `zScore must match expected formula (got ${a.zScore}, expected ~${expectedZ})`);
  }
  console.log('   ✅ Exact mathematical derivation verified.\n');

  // --------------------------------------------------------------------------
  // Production Baseline Verification (Real Dataset)
  // --------------------------------------------------------------------------
  console.log('📡 [Production Baseline] Checking real production DEMAND_RECORDS...');
  const prodRes = detectQoqAnomalies();
  assert(Array.isArray(prodRes.anomalies), 'anomalies must be an array');
  console.log(`   ✅ Real dataset evaluated: ${prodRes.seriesAnalyzed} series analyzed, ${prodRes.totalAnomalies} anomalies found.`);
  console.log(`   ✅ Production message: "${prodRes.message}"\n`);

  console.log('================================================================');
  console.log('✅ ALL PHASE 5B QoQ ANOMALY DETECTION ACCEPTANCE TESTS PASSED');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ ANOMALY DETECTION TEST FAILED:', err);
  process.exit(1);
});
