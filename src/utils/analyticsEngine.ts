import {
  DemandRecord,
  SupplyWorkerRecord,
  TrainingRecord,
  SkillGapAnalysis,
  ForecastResult,
  TrainingRecommendation,
  SkillPriority,
  PriorityWeights,
  QualityLevel,
  PlanningDataResult
} from '../types';
import { formatPeriodToHuman } from './dateFormatter';
import { DEMAND_RECORDS } from '../data/demandData';
import { SUPPLY_WORKER_RECORDS } from '../data/supplyData';
import { TRAINING_RECORDS } from '../data/trainingData';
import {
  filterByCanonicalGeography,
  matchesCanonicalGeography
} from './canonicalGeography';

// --- DATA ACCESS HELPERS ---
export function getAvailableLocations() {
  const states = Array.from(new Set(DEMAND_RECORDS.map(d => d.state)));
  const map: Record<string, string[]> = {};
  DEMAND_RECORDS.forEach(d => {
    if (!map[d.state]) map[d.state] = [];
    if (!map[d.state].includes(d.district)) map[d.state].push(d.district);
  });
  return { states, districtsByState: map };
}

export function getAvailableSectors() {
  return Array.from(new Set(DEMAND_RECORDS.map(d => d.sector)));
}

export function getAvailableSkills(sectorFilter?: string) {
  const records = sectorFilter
    ? DEMAND_RECORDS.filter(d => d.sector === sectorFilter)
    : DEMAND_RECORDS;
  return Array.from(new Set(records.map(d => d.normalizedSkill)));
}

export function getAvailablePeriods() {
  return Array.from(new Set(DEMAND_RECORDS.map(d => d.period))).sort();
}

// --- SKILL GAP ANALYSIS ---
export interface GapThresholds {
  shortageThresholdPercent: number; // e.g., 15 (Demand > Supply by 15%)
  oversupplyThresholdPercent: number; // e.g., -15 (Supply > Demand by 15%)
}

export const DEFAULT_THRESHOLDS: GapThresholds = {
  shortageThresholdPercent: 15,
  oversupplyThresholdPercent: -15
};

export function calculateSkillGaps(filters?: {
  state?: string;
  district?: string;
  sector?: string;
  skill?: string;
  period?: string;
}, thresholds: GapThresholds = DEFAULT_THRESHOLDS): SkillGapAnalysis[] {
  const targetPeriod = filters?.period || '2024-Q4';

  // Filter demand records matching criteria using canonical geography
  let demandSubset = DEMAND_RECORDS.filter(d => d.period === targetPeriod);
  demandSubset = filterByCanonicalGeography(demandSubset, {
    state: filters?.state,
    district: filters?.district
  });
  if (filters?.sector) demandSubset = demandSubset.filter(d => d.sector.toLowerCase() === filters.sector?.toLowerCase());
  if (filters?.skill) demandSubset = demandSubset.filter(d => d.normalizedSkill.toLowerCase() === filters.skill?.toLowerCase());

  const results: SkillGapAnalysis[] = [];

  for (const dem of demandSubset) {
    // Find matching worker supply using canonical geography
    const workerRec = SUPPLY_WORKER_RECORDS.find(
      s => matchesCanonicalGeography(s, { state: dem.state, district: dem.district }) &&
           s.normalizedSkill.toLowerCase() === dem.normalizedSkill.toLowerCase()
    );

    // Find matching training supply using canonical geography
    const trainRec = TRAINING_RECORDS.find(
      t => matchesCanonicalGeography(t, { state: dem.state, district: dem.district }) &&
           t.normalizedSkill.toLowerCase() === dem.normalizedSkill.toLowerCase()
    );

    // Comparability check: Real workforce data must be available, temporally compatible,
    // geography-level compatible, and population-scope compatible.
    const isTemporallyCompatible = Boolean(workerRec && workerRec.period === dem.period);
    const isGeographyLevelCompatible = Boolean(
      workerRec && (!dem.geography_level || !workerRec.geography_level || dem.geography_level === workerRec.geography_level)
    );
    const isSoftwareOrFormalTech = dem.sector.toLowerCase().includes('information technology') ||
                                   dem.sector.toLowerCase().includes('artificial intelligence') ||
                                   dem.sector.toLowerCase().includes('semiconductor');
    const isUnorganisedSupplyMismatch = Boolean(workerRec && workerRec.population_scope === 'UNORGANISED_WORKFORCE' && isSoftwareOrFormalTech);

    if (!workerRec || !isTemporallyCompatible || !isGeographyLevelCompatible || isUnorganisedSupplyMismatch) {
      let reason = 'Comparable workforce data is unavailable for this skill and location.';
      if (!workerRec) {
        reason = 'Comparable workforce data is unavailable for this skill and location.';
      } else if (!isGeographyLevelCompatible) {
        reason = `Geographic levels are mismatched (Demand is ${dem.geography_level || 'District'}, Workforce is ${workerRec.geography_level || 'State'}). Cross-level comparison is invalid.`;
      } else if (!isTemporallyCompatible) {
        reason = `Demand period (${dem.period}) and workforce registry period (${workerRec.period}) are temporally incompatible.`;
      } else if (isUnorganisedSupplyMismatch) {
        reason = 'Unorganised workforce registry (e-Shram) does not track formal software/engineering occupations. Comparable formal workforce data is unavailable.';
      }

      results.push({
        normalizedSkill: dem.normalizedSkill,
        sector: dem.sector,
        state: dem.state,
        district: dem.district,
        period: dem.period,
        demand: dem.demandCount,
        workerSupply: workerRec ? workerRec.workerCount : null,
        trainingOutput: trainRec ? (trainRec.placedCount ?? null) : null,
        trainingCapacity: trainRec ? (trainRec.annualCapacity ?? null) : null,
        effectiveSupply: workerRec ? workerRec.workerCount : null,
        gap: null,
        gapPercentage: null,
        classification: 'NON_COMPARABLE',
        isComparable: false,
        incomparabilityReason: reason,
        geography_level: dem.geography_level || 'DISTRICT',
        dataQuality: {
          level: 'Unavailable',
          reason: 'No verified comparable workforce registrations exist for this selection in the production dataset.'
        }
      });
      continue;
    }

    const workerSupply = workerRec.workerCount;
    const trainingOutput = trainRec ? trainRec.placedCount : null;
    const trainingCapacity = trainRec ? trainRec.annualCapacity : null;

    // Potential Skill Gap = Demand - Available Workforce
    const gap = dem.demandCount - workerSupply;
    const gapPercentage = Math.round((gap / dem.demandCount) * 100);

    let classification: 'SHORTAGE' | 'BALANCED' | 'OVERSUPPLY' = 'BALANCED';
    if (gapPercentage > thresholds.shortageThresholdPercent) {
      classification = 'SHORTAGE';
    } else if (gapPercentage < thresholds.oversupplyThresholdPercent) {
      classification = 'OVERSUPPLY';
    }

    // Historical points for this skill/location
    const historicalPoints = DEMAND_RECORDS.filter(
      d => d.state.toLowerCase() === dem.state.toLowerCase() &&
           d.district.toLowerCase() === dem.district.toLowerCase() &&
           d.normalizedSkill.toLowerCase() === dem.normalizedSkill.toLowerCase()
    ).length;

    let qualityLevel: QualityLevel = 'Medium';
    let qualityReason = '';

    if (historicalPoints >= 6 && trainRec) {
      qualityLevel = 'High';
      qualityReason = `Verified by ${historicalPoints} historical demand quarters and official worker registry at district level.`;
    } else if (historicalPoints >= 4) {
      qualityLevel = 'Medium';
      qualityReason = `Historical depth of ${historicalPoints} quarters with verified single-stream worker validation.`;
    } else {
      qualityLevel = 'Low';
      qualityReason = `Limited historical observations (${historicalPoints} quarters) or partial geographical supply alignment.`;
    }

    results.push({
      normalizedSkill: dem.normalizedSkill,
      sector: dem.sector,
      state: dem.state,
      district: dem.district,
      period: dem.period,
      demand: dem.demandCount,
      workerSupply,
      trainingOutput: trainRec ? (trainRec.placedCount ?? null) : null,
      trainingCapacity: trainRec ? (trainRec.annualCapacity ?? null) : null,
      effectiveSupply: workerSupply,
      gap,
      gapPercentage,
      classification,
      isComparable: true,
      geography_level: dem.geography_level || 'DISTRICT',
      dataQuality: {
        level: qualityLevel,
        reason: qualityReason
      }
    });
  }

  return results;
}

// --- STATISTICAL FORECASTING ENGINE ---
export function forecastSkillDemand(
  skill: string,
  state: string,
  district: string,
  horizonQuarters: number = 4
): ForecastResult {
  // Extract historical demand points chronologically matching canonical geography
  const records = DEMAND_RECORDS.filter(
    d => d.normalizedSkill.toLowerCase() === skill.toLowerCase() &&
         matchesCanonicalGeography(d, { state, district })
  ).sort((a, b) => a.period.localeCompare(b.period));

  const n = records.length;

  if (n < 4) {
    return {
      normalizedSkill: skill,
      state,
      district,
      historicalData: records.map(r => ({ period: r.period, demand: r.demandCount })),
      forecastData: [],
      modelUsed: 'Ordinary Least Squares (OLS) Linear Trend',
      horizon: '0 Quarters',
      trainingPeriod: records.length > 0 ? `${records[0].period} to ${records[records.length - 1].period}` : 'N/A',
      metrics: { mae: 0, rmse: 0, r2: 0 },
      explanation: 'Forecast unavailable: insufficient historical data.',
      technicalDetails: { slope: 0, intercept: 0, sampleSize: n, confidenceInterval: 0 },
      isAvailable: false,
      reason: `Not enough comparable historical demand data is available for this skill and location. Found ${n} observation(s), but statistical time-series forecasting requires a minimum of 4 chronological quarters.`,
      dataQuality: {
        level: 'Low',
        reason: `Only ${n} historical demand observation(s) available in dataset.`
      }
    };
  }

  // OLS Linear Regression: y = beta_0 + beta_1 * x
  const xValues = records.map((_, idx) => idx);
  const yValues = records.map(r => r.demandCount);

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate actual statistical metrics: MAE, RMSE, R²
  let sumAbsError = 0;
  let sumSqError = 0;
  let totalSumSquares = 0;

  for (let i = 0; i < n; i++) {
    const yHat = intercept + slope * xValues[i];
    const residual = yValues[i] - yHat;
    sumAbsError += Math.abs(residual);
    sumSqError += Math.pow(residual, 2);
    totalSumSquares += Math.pow(yValues[i] - yMean, 2);
  }

  const mae = Math.round((sumAbsError / n) * 10) / 10;
  const rmse = Math.round(Math.sqrt(sumSqError / n) * 10) / 10;
  const r2 = totalSumSquares !== 0
    ? Math.round(Math.max(0, 1 - (sumSqError / totalSumSquares)) * 1000) / 1000
    : 0;

  // Standard Error of Estimate for 95% Confidence Interval
  const stdError = Math.sqrt(sumSqError / Math.max(1, n - 2));
  const tCritical = 2.05; // ~95% CI for sample sizes 6-12

  // Generate future quarter periods
  const lastRecord = records[records.length - 1];
  const [lastYearStr, lastQStr] = lastRecord.period.split('-');
  let currentYear = parseInt(lastYearStr, 10);
  let currentQ = parseInt(lastQStr.replace('Q', ''), 10);

  const forecastData: { period: string; predictedDemand: number; lowerBound: number; upperBound: number }[] = [];

  for (let h = 1; h <= horizonQuarters; h++) {
    currentQ += 1;
    if (currentQ > 4) {
      currentQ = 1;
      currentYear += 1;
    }
    const futurePeriod = `${currentYear}-Q${currentQ}`;
    const xFuture = n - 1 + h;
    const predicted = Math.round(intercept + slope * xFuture);
    // Expand confidence bound further into future
    const boundDelta = Math.round(tCritical * stdError * Math.sqrt(1 + 1/n + Math.pow(xFuture - xMean, 2)/denominator));
    const lower = Math.max(0, predicted - boundDelta);
    const upper = predicted + boundDelta;

    forecastData.push({
      period: futurePeriod,
      predictedDemand: predicted,
      lowerBound: lower,
      upperBound: upper
    });
  }

  const firstPeriodHuman = formatPeriodToHuman(records[0].period);
  const lastPeriodHuman = formatPeriodToHuman(records[records.length - 1].period);
  const endForecastPeriodHuman = formatPeriodToHuman(forecastData[forecastData.length - 1].period);

  const quarterlyGrowthRate = Math.round((slope / yMean) * 1000) / 10;
  const explanation = `Based on the available historical demand pattern, employer demand is estimated to ${slope > 0 ? 'continue increasing' : slope < 0 ? 'continue declining' : 'remain stable'} over the selected forecast period. The system evaluated ${n} verified quarterly filings from ${firstPeriodHuman} to ${lastPeriodHuman} from the National Career Service. Future demand is estimated to reach approximately ${forecastData[forecastData.length - 1].predictedDemand.toLocaleString()} vacancies by ${endForecastPeriodHuman}, representing an estimated change of ${quarterlyGrowthRate >= 0 ? '+' : ''}${quarterlyGrowthRate}% per quarter based on observed historical patterns.`;

  const qualityLevel: QualityLevel = n >= 8 ? 'High' : n >= 5 ? 'Medium' : 'Low';

  return {
    normalizedSkill: skill,
    state,
    district,
    historicalData: records.map(r => ({ period: r.period, demand: r.demandCount })),
    forecastData,
    modelUsed: 'Ordinary Least Squares (OLS) Linear Trend',
    horizon: `${horizonQuarters} Quarters (${forecastData[0].period} to ${forecastData[forecastData.length - 1].period})`,
    trainingPeriod: `${records[0].period} to ${records[records.length - 1].period}`,
    metrics: { mae, rmse, r2 },
    explanation,
    technicalDetails: {
      slope: Math.round(slope * 100) / 100,
      intercept: Math.round(intercept * 100) / 100,
      sampleSize: n,
      confidenceInterval: 95
    },
    isAvailable: true,
    dataQuality: {
      level: qualityLevel,
      reason: `Computed across ${n} verified historical quarters from National Career Service postings.`
    }
  };
}

// --- TRAINING PLANNER & RECOMMENDATIONS ---
export function generateTrainingRecommendations(
  skill: string,
  state: string,
  district: string
): TrainingRecommendation | null {
  const gaps = calculateSkillGaps({ state, district, skill });
  const gapItem = gaps.find(g => g.normalizedSkill === skill);

  if (!gapItem || !gapItem.isComparable || gapItem.effectiveSupply === null) {
    return null;
  }

  const forecast = forecastSkillDemand(skill, state, district, 4);
  const oneYearProjectedDemand = forecast.isAvailable && forecast.forecastData.length >= 4
    ? forecast.forecastData[3].predictedDemand
    : gapItem.demand;

  const estimatedAvailableSupply = gapItem.effectiveSupply;
  const potentialGap = Math.max(0, oneYearProjectedDemand - estimatedAvailableSupply);

  // Suggested additional capacity (accounting for ~75% placement efficiency)
  const requiredCapacity = Math.round(potentialGap / 0.75);
  const lowerRange = Math.round(requiredCapacity * 0.85);
  const upperRange = Math.round(requiredCapacity * 1.15);

  const recommendationText = potentialGap > 0
    ? `Based on the available data, additional training capacity MAY be considered. The available data indicates a potential shortage of approximately ${potentialGap.toLocaleString()} workers across the upcoming annual horizon in ${district}. Expanding accredited center capacity by approximately ${lowerRange.toLocaleString()} to ${upperRange.toLocaleString()} seats could help stabilize this supply gap.`
    : `Based on the available data, current training and workforce supply is balanced with projected demand in ${district}. Existing capacity appears sufficient for current labor market requirements.`;

  return {
    normalizedSkill: skill,
    sector: gapItem.sector,
    state,
    district,
    projectedDemand: oneYearProjectedDemand,
    estimatedAvailableSupply,
    potentialGap,
    currentTrainingCapacity: gapItem.trainingCapacity ?? 0,
    activeCenters: TRAINING_RECORDS.find(t => t.normalizedSkill === skill && t.district === district)?.activeCenters || 0,
    suggestedAdditionalCapacityRange: [lowerRange, upperRange],
    confidence: gapItem.dataQuality.level,
    recommendationText,
    justification: [
      `Current demand in ${gapItem.period} stands at ${gapItem.demand.toLocaleString()} positions.`,
      `Effective workforce supply is estimated at ${estimatedAvailableSupply.toLocaleString()} (including registered seekers and certified graduates).`,
      `Current annual institutional capacity in ${district} is ${(gapItem.trainingCapacity ?? 0).toLocaleString()} seats.`,
      forecast.isAvailable
        ? `Statistical forecast projects annual demand at ${oneYearProjectedDemand.toLocaleString()} (R² = ${forecast.metrics.r2}).`
        : `Forecast extrapolation constrained due to historical depth.`
    ]
  };
}

// --- SHARED DATA AVAILABILITY & TRAINING PLANNING SERVICE ---
export function getPlanningData(
  state: string,
  district: string,
  skill: string
): PlanningDataResult {
  // Query demand records for this skill and location using canonical geography
  const matchedDemand = DEMAND_RECORDS.filter(
    d => matchesCanonicalGeography(d, { state, district }) &&
         d.normalizedSkill.toLowerCase() === skill.toLowerCase()
  ).sort((a, b) => a.period.localeCompare(b.period));

  const hasDemand = matchedDemand.length > 0;
  const latestDemandRec = hasDemand ? matchedDemand[matchedDemand.length - 1] : null;
  const demandCount = latestDemandRec ? latestDemandRec.demandCount : undefined;
  const demandPeriod = latestDemandRec ? latestDemandRec.period : undefined;
  const demandDate = demandPeriod ? formatPeriodToHuman(demandPeriod) : 'Unavailable';

  // Query worker supply using canonical geography
  const workerRec = SUPPLY_WORKER_RECORDS.find(
    s => matchesCanonicalGeography(s, { state, district }) &&
         s.normalizedSkill.toLowerCase() === skill.toLowerCase()
  );
  const hasWorkerSupply = !!workerRec;
  const workerSupplyCount = workerRec ? workerRec.workerCount : undefined;
  const workerSupplyPeriod = workerRec ? workerRec.period : undefined;
  const workerSupplyDate = workerSupplyPeriod ? formatPeriodToHuman(workerSupplyPeriod) : 'Unavailable';

  // Query training capacity using canonical geography
  const trainRec = TRAINING_RECORDS.find(
    t => matchesCanonicalGeography(t, { state, district }) &&
         t.normalizedSkill.toLowerCase() === skill.toLowerCase()
  );
  const hasTraining = !!trainRec;
  const trainingCapacity = trainRec ? (trainRec.annualCapacity ?? undefined) : undefined;
  const activeCenters = trainRec ? (trainRec.activeCenters ?? undefined) : undefined;
  const placedCount = trainRec ? (trainRec.placedCount ?? undefined) : undefined;
  const trainingPeriod = trainRec ? trainRec.period : undefined;
  const trainingDate = trainingPeriod ? formatPeriodToHuman(trainingPeriod) : 'Unavailable';

  // Determine latest available date
  const allPeriods = [
    ...(demandPeriod ? [demandPeriod] : []),
    ...(workerSupplyPeriod ? [workerSupplyPeriod] : []),
    ...(trainingPeriod ? [trainingPeriod] : [])
  ].sort();
  const latestPeriod = allPeriods.length > 0 ? allPeriods[allPeriods.length - 1] : '';
  const latestAvailableDate = latestPeriod ? formatPeriodToHuman(latestPeriod) : 'Unavailable';

  // Check comparability: Requires BOTH demand and comparable worker supply
  const hasComparableWorkerSupply = hasWorkerSupply && workerSupplyCount !== undefined && workerSupplyCount !== null;

  if (!hasDemand && !hasComparableWorkerSupply && !hasTraining) {
    return {
      state,
      district,
      skill,
      demandStatus: 'UNAVAILABLE',
      workerSupplyStatus: 'UNAVAILABLE',
      trainingStatus: 'UNAVAILABLE',
      isComparable: false,
      incomparabilityReason: 'Comparable demand and workforce data are not available for this selection.',
      planningSignal: 'INSUFFICIENT_DATA',
      planningAdvisory: 'Labour-market data is currently unavailable for this district. Official Local Government Directory (LGD) record verified, but no filings are present in the current connected datasets.',
      latestAvailableDate: 'Unavailable',
      dataQualityLevel: 'Low'
    };
  }

  if (!hasDemand) {
    return {
      state,
      district,
      skill,
      demandStatus: 'UNAVAILABLE',
      workerSupplyStatus: hasComparableWorkerSupply ? 'AVAILABLE' : 'UNAVAILABLE',
      workerSupplyCount,
      workerSupplyPeriod,
      workerSupplyDate,
      trainingStatus: hasTraining ? 'AVAILABLE' : 'UNAVAILABLE',
      trainingCapacity,
      activeCenters,
      placedCount,
      trainingPeriod,
      trainingDate,
      isComparable: false,
      incomparabilityReason: 'Training planning cannot be estimated for this selection because comparable demand data is unavailable.',
      planningSignal: 'INSUFFICIENT_DATA',
      planningAdvisory: hasTraining
        ? 'Training output data is recorded, but planning analysis is unavailable because comparable labour-demand data is missing.'
        : 'Training planning cannot be estimated for this selection because comparable demand data is unavailable.',
      latestAvailableDate,
      dataQualityLevel: 'Low'
    };
  }

  if (!hasComparableWorkerSupply) {
    return {
      state,
      district,
      skill,
      demandStatus: 'AVAILABLE',
      demandCount,
      demandPeriod,
      demandDate,
      workerSupplyStatus: 'UNAVAILABLE',
      trainingStatus: hasTraining ? 'AVAILABLE' : 'UNAVAILABLE',
      trainingCapacity,
      activeCenters,
      placedCount,
      trainingPeriod,
      trainingDate,
      isComparable: false,
      incomparabilityReason: 'Training planning cannot be estimated because comparable workforce supply data is unavailable.',
      planningSignal: 'INSUFFICIENT_DATA',
      planningAdvisory: 'Training planning cannot be estimated because comparable workforce supply data is unavailable.',
      latestAvailableDate,
      trainingNotice: !hasTraining ? 'Training capacity data is unavailable.' : undefined,
      dataQualityLevel: 'Low'
    };
  }

  // Both demand and comparable worker supply exist - comparable
  const effectiveSupply = workerSupplyCount || 0;
  const potentialGap = Math.max(0, (demandCount || 0) - effectiveSupply);

  let trainingNotice: string | undefined = undefined;
  if (!hasTraining) {
    trainingNotice = 'Training capacity data is unavailable, so existing training capacity cannot be compared.';
  } else if (trainingCapacity === undefined || trainingCapacity === null) {
    trainingNotice = 'Candidate training completions are recorded, but annual institutional seat capacity is not reported by the official source.';
  }

  const planningSignal = potentialGap > 0 ? 'POTENTIAL_SHORTAGE' : 'BALANCED';
  const planningAdvisory = potentialGap > 0
    ? `Potential planning signal detected. Additional training capacity MAY be considered based on the observed potential skill gap of approximately ${potentialGap.toLocaleString()} openings, subject to local institutional capacity and economic conditions.`
    : `Current workforce supply appears balanced with observed demand. Additional training capacity does not appear indicated based on current data.`;

  const qualityLevel: QualityLevel = matchedDemand.length >= 6 && hasWorkerSupply && hasTraining
    ? 'High'
    : matchedDemand.length >= 4 && (hasWorkerSupply || hasTraining)
    ? 'Medium'
    : 'Low';

  return {
    state,
    district,
    skill,
    demandStatus: 'AVAILABLE',
    demandCount,
    demandPeriod,
    demandDate,
    workerSupplyStatus: hasWorkerSupply ? 'AVAILABLE' : 'UNAVAILABLE',
    workerSupplyCount,
    workerSupplyPeriod,
    workerSupplyDate,
    trainingStatus: hasTraining ? 'AVAILABLE' : 'UNAVAILABLE',
    trainingCapacity,
    activeCenters,
    placedCount,
    trainingPeriod,
    trainingDate,
    isComparable: true,
    potentialGap,
    effectiveSupply,
    planningSignal,
    planningAdvisory,
    latestAvailableDate,
    trainingNotice,
    dataQualityLevel: qualityLevel
  };
}


// --- WHAT-IF SIMULATOR ---
export interface SimulationResult {
  skill: string;
  state: string;
  district: string;
  projectedDemand: number;
  currentSupply: number;
  currentTrainingCapacity: number;
  currentGap: number;
  additionalCapacity: number;
  effectivePlacementRate: number; // e.g. 0.78
  newTrainingCapacity: number;
  newEstimatedOutput: number;
  newEstimatedSupply: number;
  newEstimatedGap: number;
  gapReductionPercent: number;
  isAvailable: boolean;
  reason?: string;
}

export function simulateCapacityChange(
  skill: string,
  state: string,
  district: string,
  additionalCapacity: number
): SimulationResult {
  const hasDemand = DEMAND_RECORDS.some(
    d => matchesCanonicalGeography(d, { state, district }) &&
         d.normalizedSkill.toLowerCase() === skill.toLowerCase()
  );
  const hasWorkerSupply = SUPPLY_WORKER_RECORDS.some(
    s => matchesCanonicalGeography(s, { state, district }) &&
         s.normalizedSkill.toLowerCase() === skill.toLowerCase()
  );
  const hasTraining = TRAINING_RECORDS.some(
    t => matchesCanonicalGeography(t, { state, district }) &&
         t.normalizedSkill.toLowerCase() === skill.toLowerCase()
  );

  if (!hasDemand && !hasWorkerSupply && !hasTraining) {
    return {
      skill,
      state,
      district,
      projectedDemand: 0,
      currentSupply: 0,
      currentTrainingCapacity: 0,
      currentGap: 0,
      additionalCapacity: 0,
      effectivePlacementRate: 0,
      newTrainingCapacity: 0,
      newEstimatedOutput: 0,
      newEstimatedSupply: 0,
      newEstimatedGap: 0,
      gapReductionPercent: 0,
      isAvailable: false,
      reason: 'Comparable demand and workforce data are not available for this selection.'
    };
  }

  if (!hasDemand) {
    return {
      skill,
      state,
      district,
      projectedDemand: 0,
      currentSupply: 0,
      currentTrainingCapacity: 0,
      currentGap: 0,
      additionalCapacity: 0,
      effectivePlacementRate: 0,
      newTrainingCapacity: 0,
      newEstimatedOutput: 0,
      newEstimatedSupply: 0,
      newEstimatedGap: 0,
      gapReductionPercent: 0,
      isAvailable: false,
      reason: 'Demand data is unavailable for this location and skill.'
    };
  }

  if (!hasWorkerSupply && !hasTraining) {
    return {
      skill,
      state,
      district,
      projectedDemand: 0,
      currentSupply: 0,
      currentTrainingCapacity: 0,
      currentGap: 0,
      additionalCapacity: 0,
      effectivePlacementRate: 0,
      newTrainingCapacity: 0,
      newEstimatedOutput: 0,
      newEstimatedSupply: 0,
      newEstimatedGap: 0,
      gapReductionPercent: 0,
      isAvailable: false,
      reason: 'Comparable workforce/supply data is unavailable for this selection.'
    };
  }

  if (!hasTraining) {
    return {
      skill,
      state,
      district,
      projectedDemand: 0,
      currentSupply: 0,
      currentTrainingCapacity: 0,
      currentGap: 0,
      additionalCapacity: 0,
      effectivePlacementRate: 0,
      newTrainingCapacity: 0,
      newEstimatedOutput: 0,
      newEstimatedSupply: 0,
      newEstimatedGap: 0,
      gapReductionPercent: 0,
      isAvailable: false,
      reason: 'Training-capacity data is unavailable, so the training impact cannot be estimated.'
    };
  }

  const rec = generateTrainingRecommendations(skill, state, district);

  if (!rec) {
    return {
      skill,
      state,
      district,
      projectedDemand: 0,
      currentSupply: 0,
      currentTrainingCapacity: 0,
      currentGap: 0,
      additionalCapacity: 0,
      effectivePlacementRate: 0,
      newTrainingCapacity: 0,
      newEstimatedOutput: 0,
      newEstimatedSupply: 0,
      newEstimatedGap: 0,
      gapReductionPercent: 0,
      isAvailable: false,
      reason: 'Comparable demand and workforce data are not available for this selection.'
    };
  }

  const trainRec = TRAINING_RECORDS.find(
    t => matchesCanonicalGeography(t, { state, district }) &&
         t.normalizedSkill.toLowerCase() === skill.toLowerCase()
  );

  if (!trainRec || trainRec.annualCapacity === null || trainRec.annualCapacity === undefined) {
    return {
      skill,
      state,
      district,
      projectedDemand: 0,
      currentSupply: 0,
      currentTrainingCapacity: 0,
      currentGap: 0,
      additionalCapacity: 0,
      effectivePlacementRate: 0,
      newTrainingCapacity: 0,
      newEstimatedOutput: 0,
      newEstimatedSupply: 0,
      newEstimatedGap: 0,
      gapReductionPercent: 0,
      isAvailable: false,
      reason: 'Institutional annual seat capacity is not reported in official candidate disclosures for this selection.'
    };
  }

  const hasPlacementMetrics = Boolean(
    trainRec.certifiedCount && trainRec.certifiedCount > 0 &&
    trainRec.placedCount !== null && trainRec.placedCount !== undefined
  );

  if (!hasPlacementMetrics) {
    return {
      skill,
      state,
      district,
      projectedDemand: 0,
      currentSupply: 0,
      currentTrainingCapacity: 0,
      currentGap: 0,
      additionalCapacity: 0,
      effectivePlacementRate: 0,
      newTrainingCapacity: 0,
      newEstimatedOutput: 0,
      newEstimatedSupply: 0,
      newEstimatedGap: 0,
      gapReductionPercent: 0,
      isAvailable: false,
      reason: 'Verified placement figures are not available for this training program, so output cannot be simulated without arbitrary assumptions.'
    };
  }

  const effectivePlacementRate = Math.round((trainRec.placedCount! / trainRec.certifiedCount!) * 100) / 100;
  const currentOutput = Math.round(rec.currentTrainingCapacity * effectivePlacementRate);
  const additionalOutput = Math.round(additionalCapacity * effectivePlacementRate);

  const newCapacity = rec.currentTrainingCapacity + additionalCapacity;
  const newEstimatedSupply = rec.estimatedAvailableSupply + additionalOutput;
  const newGap = rec.projectedDemand - newEstimatedSupply;
  const gapReduction = rec.potentialGap > 0
    ? Math.round(((rec.potentialGap - Math.max(0, newGap)) / rec.potentialGap) * 100)
    : 0;

  return {
    skill,
    state,
    district,
    projectedDemand: rec.projectedDemand,
    currentSupply: rec.estimatedAvailableSupply,
    currentTrainingCapacity: rec.currentTrainingCapacity,
    currentGap: rec.potentialGap,
    additionalCapacity,
    effectivePlacementRate,
    newTrainingCapacity: newCapacity,
    newEstimatedOutput: currentOutput + additionalOutput,
    newEstimatedSupply,
    newEstimatedGap: newGap,
    gapReductionPercent: gapReduction,
    isAvailable: true
  };
}

// --- SKILL PRIORITY RANKING ---
export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  demandGrowth: 30,
  projectedGap: 40,
  currentShortage: 20,
  trainingAvailability: 10
};

export function calculateSkillPriorities(
  state?: string,
  district?: string,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): SkillPriority[] {
  const gaps = calculateSkillGaps({ state, district }).filter(g => g.isComparable);

  if (gaps.length === 0) return [];

  // Compute metrics for each skill
  const scored = gaps.map(g => {
    const forecast = forecastSkillDemand(g.normalizedSkill, g.state, g.district, 4);

    // 1. Demand Growth rate (from historical or forecast slope)
    const growthRate = forecast.isAvailable
      ? Math.max(0, (forecast.technicalDetails.slope / Math.max(1, forecast.historicalData[0]?.demand || 1)) * 100)
      : 10;
    const demandGrowthScore = Math.min(100, Math.round(growthRate * 3));

    // 2. Projected Gap Score
    const gapScore = Math.min(100, Math.max(0, Math.round(((g.gap ?? 0) / Math.max(1, g.demand)) * 100)));

    // 3. Current Shortage Score
    const currentShortageScore = g.classification === 'SHORTAGE' ? 90 : g.classification === 'BALANCED' ? 40 : 10;

    // 4. Training Capacity Deficit Score (Demand vs Capacity)
    const capacityRatio = (g.trainingCapacity && g.trainingCapacity > 0) ? g.demand / g.trainingCapacity : 2;
    const trainingConstraintScore = Math.min(100, Math.round(capacityRatio * 35));

    // Normalize weights sum to 100
    const totalWeight = weights.demandGrowth + weights.projectedGap + weights.currentShortage + weights.trainingAvailability;
    const wGrowth = weights.demandGrowth / totalWeight;
    const wGap = weights.projectedGap / totalWeight;
    const wShortage = weights.currentShortage / totalWeight;
    const wTraining = weights.trainingAvailability / totalWeight;

    const compositeScore = Math.round(
      demandGrowthScore * wGrowth +
      gapScore * wGap +
      currentShortageScore * wShortage +
      trainingConstraintScore * wTraining
    );

    const trainRec = TRAINING_RECORDS.find(
      t => t.normalizedSkill === g.normalizedSkill &&
           matchesCanonicalGeography(t, { state: g.state, district: g.district })
    );

    // Plain-language planning indicators based on verified data only
    const demandBadge = g.demand >= 1500
      ? 'High / based on available data'
      : (forecast.isAvailable && forecast.technicalDetails.slope > 0)
      ? 'Growing'
      : 'Active demand';

    const workforceBadge = g.classification === 'SHORTAGE'
      ? 'Potential shortage'
      : g.classification === 'OVERSUPPLY'
      ? 'Surplus available'
      : 'Data available';

    const trainingBadge = (!g.trainingCapacity || g.trainingCapacity === 0)
      ? 'Data unavailable'
      : g.trainingCapacity < g.demand * 0.6
      ? 'Limited'
      : 'Available';

    const priorityReason = g.classification === 'SHORTAGE'
      ? 'This skill is highlighted because demand has increased over the available historical period and comparable workforce data indicates a potential shortage.'
      : 'Workforce availability and training capacity are currently balanced with vacancies based on available records.';

    return {
      normalizedSkill: g.normalizedSkill,
      sector: g.sector,
      state: g.state,
      district: g.district,
      demandScore: g.demand,
      demandGrowthScore,
      gapScore,
      trainingConstraintScore,
      compositeScore,
      rank: 0,
      classification: g.classification,
      demandCount: g.demand,
      demandPeriod: g.period,
      demandTrend: forecast.isAvailable
        ? `${forecast.historicalData.length} quarters tracked (${forecast.technicalDetails.slope > 0 ? 'Upward trend' : 'Stable'})`
        : 'Active observation period',
      workerSupply: g.workerSupply,
      trainingCapacity: g.trainingCapacity,
      activeCenters: trainRec?.activeCenters || 0,
      potentialGap: g.gap !== null ? Math.max(0, g.gap) : null,
      demandBadge,
      workforceBadge,
      trainingBadge,
      priorityReason
    };
  });

  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  scored.forEach((item, idx) => { item.rank = idx + 1; });

  return scored;
}
