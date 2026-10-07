/**
 * ============================================================================
 * SKILLPULSE QUARTER-ON-QUARTER (QoQ) ANOMALY DETECTION ENGINE
 * ============================================================================
 * Methodology:
 * 1. Partitions demand records into discrete time-series by:
 *    [state, district, normalizedSkill, geography_level]
 * 2. Sorts each series strictly chronologically by quarter period (YYYY-QX).
 * 3. Calculates quarter-on-quarter changes:
 *    delta_t = value_t - value_(t-1)
 * 4. Small-Data Safety:
 *    Requires at least MIN_QOQ_OBSERVATIONS = 4 QoQ transitions (>= 5 quarters)
 *    to reliably characterize normal variance.
 * 5. Zero-Variance Safety:
 *    If std_delta is 0 or undefined, returns "zero_variance" and produces no false anomalies.
 * 6. 3-Standard-Deviation Anomaly Detection:
 *    Flags an observation as anomalous when:
 *    |delta_t - mean_delta| > 3 * std_delta
 * 7. Classifies direction based on delta deviation:
 *    delta_t - mean_delta > 0 => 'spike'
 *    delta_t - mean_delta < 0 => 'drop'
 * ============================================================================
 */

import { DemandRecord } from '../types';
import { DEMAND_RECORDS } from '../data/demandData';
import { matchesCanonicalGeography } from './canonicalGeography';

export const MIN_QOQ_OBSERVATIONS = 4; // Requires minimum 4 QoQ transitions (5 quarters)
export const ANOMALY_STD_MULTIPLIER = 3.0; // 3 standard deviations threshold

export interface AnomalyRecord {
  skill: string;
  state: string;
  district: string;
  period: string;
  previousPeriod: string;
  previousValue: number;
  currentValue: number;
  qoqChange: number;
  meanQoqChange: number;
  stdQoqChange: number;
  zScore: number;
  direction: 'spike' | 'drop';
  severity: 'high' | 'critical';
}

export interface SeriesAnomalyDiagnostic {
  skill: string;
  state: string;
  district: string;
  totalObservations: number;
  qoqChangesCount: number;
  meanQoqChange?: number;
  stdQoqChange?: number;
  isAnalyzed: boolean;
  status: 'valid' | 'insufficient_history' | 'zero_variance';
  reason?: string;
}

export interface AnomalyDetectionFilters {
  state?: string;
  district?: string;
  skill?: string;
}

export interface AnomalyDetectionResponse {
  source: string;
  endpoint: string;
  filters: AnomalyDetectionFilters;
  totalAnomalies: number;
  seriesAnalyzed: number;
  anomalies: AnomalyRecord[];
  diagnostics?: SeriesAnomalyDiagnostic[];
  message: string;
  provenance: {
    methodology: string;
    thresholdRule: string;
    thresholdMultiplier: number;
    minimumQoqObservations: number;
  };
}

/**
 * Detects Quarter-on-Quarter anomalies across demand time-series.
 */
export function detectQoqAnomalies(
  filters?: AnomalyDetectionFilters,
  customRecords: DemandRecord[] = DEMAND_RECORDS
): AnomalyDetectionResponse {
  const reqState = filters?.state?.trim();
  const reqDistrict = filters?.district?.trim();
  const reqSkill = filters?.skill?.trim();

  // 1. Filter dataset according to canonical geography and skill filters
  let filteredRecords = customRecords;
  if (reqState || reqDistrict) {
    filteredRecords = filteredRecords.filter(r =>
      matchesCanonicalGeography(r, { state: reqState, district: reqDistrict })
    );
  }
  if (reqSkill) {
    filteredRecords = filteredRecords.filter(
      r => r.normalizedSkill.toLowerCase() === reqSkill.toLowerCase()
    );
  }

  // 2. Group into discrete time-series
  // Key: state | district | normalizedSkill | geography_level
  const seriesMap = new Map<string, DemandRecord[]>();

  for (const record of filteredRecords) {
    const geoLevel = record.geography_level || 'DISTRICT';
    const seriesKey = `${record.state.toLowerCase()}|${record.district.toLowerCase()}|${record.normalizedSkill.toLowerCase()}|${geoLevel}`;

    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, []);
    }
    seriesMap.get(seriesKey)!.push(record);
  }

  const detectedAnomalies: AnomalyRecord[] = [];
  const diagnostics: SeriesAnomalyDiagnostic[] = [];
  let eligibleSeriesCount = 0;

  // 3. Process each series independently
  for (const records of seriesMap.values()) {
    if (records.length === 0) continue;

    // Deduplicate / aggregate points per period
    const periodMap = new Map<string, number>();
    for (const r of records) {
      // Sum demand if duplicate filings exist in same period
      periodMap.set(r.period, (periodMap.get(r.period) || 0) + r.demandCount);
    }

    const sortedPeriods = Array.from(periodMap.keys()).sort((a, b) => a.localeCompare(b));
    const sampleRecord = records[0];

    const diag: SeriesAnomalyDiagnostic = {
      skill: sampleRecord.normalizedSkill,
      state: sampleRecord.state,
      district: sampleRecord.district,
      totalObservations: sortedPeriods.length,
      qoqChangesCount: Math.max(0, sortedPeriods.length - 1),
      isAnalyzed: false,
      status: 'insufficient_history'
    };

    // Small-Data Safety: require at least MIN_QOQ_OBSERVATIONS
    if (sortedPeriods.length < MIN_QOQ_OBSERVATIONS + 1) {
      diag.reason = `Insufficient history: found ${sortedPeriods.length - 1} QoQ change(s), minimum ${MIN_QOQ_OBSERVATIONS} required.`;
      diagnostics.push(diag);
      continue;
    }

    // Calculate QoQ deltas: delta_t = value_t - value_(t-1)
    const deltas: Array<{
      period: string;
      previousPeriod: string;
      currentValue: number;
      previousValue: number;
      delta: number;
    }> = [];

    for (let i = 1; i < sortedPeriods.length; i++) {
      const prevP = sortedPeriods[i - 1];
      const currP = sortedPeriods[i];
      const prevVal = periodMap.get(prevP)!;
      const currVal = periodMap.get(currP)!;
      const delta = currVal - prevVal;

      deltas.push({
        period: currP,
        previousPeriod: prevP,
        currentValue: currVal,
        previousValue: prevVal,
        delta
      });
    }

    // Compute mean of historical QoQ changes
    const sumDelta = deltas.reduce((acc, d) => acc + d.delta, 0);
    const meanDelta = sumDelta / deltas.length;

    // Compute population standard deviation of historical QoQ changes
    const sumSquaredDeviations = deltas.reduce(
      (acc, d) => acc + Math.pow(d.delta - meanDelta, 2),
      0
    );
    const varianceDelta = sumSquaredDeviations / deltas.length;
    const stdDelta = Math.sqrt(varianceDelta);

    diag.meanQoqChange = Math.round(meanDelta * 100) / 100;
    diag.stdQoqChange = Math.round(stdDelta * 100) / 100;

    // Zero-Variance Safety: prevent division by zero or degenerate flags
    if (stdDelta === 0 || isNaN(stdDelta)) {
      diag.status = 'zero_variance';
      diag.reason = 'Standard deviation of QoQ changes is zero (constant trend); no anomalies flagged.';
      diagnostics.push(diag);
      continue;
    }

    diag.isAnalyzed = true;
    diag.status = 'valid';
    diagnostics.push(diag);
    eligibleSeriesCount++;

    // Evaluate 3-Standard-Deviation Rule: |delta_t - mean_delta| > 3 * std_delta
    const thresholdDelta = ANOMALY_STD_MULTIPLIER * stdDelta;

    for (const d of deltas) {
      const deviation = d.delta - meanDelta;
      const absDeviation = Math.abs(deviation);

      if (absDeviation > thresholdDelta) {
        const z = deviation / stdDelta;
        const direction: 'spike' | 'drop' = deviation > 0 ? 'spike' : 'drop';
        const severity: 'high' | 'critical' = Math.abs(z) >= 4.0 ? 'critical' : 'high';

        detectedAnomalies.push({
          skill: sampleRecord.normalizedSkill,
          state: sampleRecord.state,
          district: sampleRecord.district,
          period: d.period,
          previousPeriod: d.previousPeriod,
          previousValue: d.previousValue,
          currentValue: d.currentValue,
          qoqChange: d.delta,
          meanQoqChange: Math.round(meanDelta * 100) / 100,
          stdQoqChange: Math.round(stdDelta * 100) / 100,
          zScore: Math.round(z * 100) / 100,
          direction,
          severity
        });
      }
    }
  }

  // Sort detected anomalies by descending absolute z-score
  detectedAnomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  const message = detectedAnomalies.length > 0
    ? `Detected ${detectedAnomalies.length} statistically significant QoQ demand anomaly/anomalies across ${eligibleSeriesCount} analyzed time-series.`
    : 'No statistically significant QoQ anomalies detected in the available historical data.';

  return {
    source: 'SkillPulse Data Quality Engine',
    endpoint: '/api/anomalies',
    filters: {
      state: reqState,
      district: reqDistrict,
      skill: reqSkill
    },
    totalAnomalies: detectedAnomalies.length,
    seriesAnalyzed: eligibleSeriesCount,
    anomalies: detectedAnomalies,
    diagnostics,
    message,
    provenance: {
      methodology: 'Quarter-on-Quarter (QoQ) Standard Deviation Threshold (|delta - mean| > 3*std)',
      thresholdRule: `|delta_t - mean_delta| > ${ANOMALY_STD_MULTIPLIER} * std_delta`,
      thresholdMultiplier: ANOMALY_STD_MULTIPLIER,
      minimumQoqObservations: MIN_QOQ_OBSERVATIONS
    }
  };
}
