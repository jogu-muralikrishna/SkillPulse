import {
  MASTER_STATES,
  MASTER_DISTRICTS,
  StateMaster,
  DistrictMaster
} from '../data/masterGeography';
import { DemandRecord, SupplyWorkerRecord, TrainingRecord, DataCoverageStatus } from '../types';
import { formatPeriodToHuman } from './dateFormatter';

// --- Fast Index Lookups ---
const STATE_BY_ID = new Map<string, StateMaster>();
const STATE_BY_NAME = new Map<string, StateMaster>();
const STATE_ALIASES = new Map<string, string>();

const DISTRICT_BY_ID = new Map<string, DistrictMaster>();
const DISTRICTS_BY_STATE_ID = new Map<string, DistrictMaster[]>();
const DISTRICT_BY_STATE_AND_NAME = new Map<string, DistrictMaster>();
const DISTRICT_ALIASES = new Map<string, string>();

// Initialize State lookups
MASTER_STATES.forEach(state => {
  STATE_BY_ID.set(state.state_id.toUpperCase(), state);
  STATE_BY_NAME.set(state.state_name.toLowerCase(), state);
});

// Common State aliases and variations
const RAW_STATE_ALIASES: Record<string, string> = {
  'delhi ncr': 'IN-DL',
  'nct of delhi': 'IN-DL',
  'national capital territory of delhi': 'IN-DL',
  'delhi': 'IN-DL',
  'orissa': 'IN-OR',
  'uttaranchal': 'IN-UT',
  'pondicherry': 'IN-PY',
  'andaman & nicobar islands': 'IN-AN',
  'andaman & nicobar': 'IN-AN',
  'andaman and nicobar': 'IN-AN',
  'dadra & nagar haveli': 'IN-DH',
  'daman & diu': 'IN-DH',
  'dadra and nagar haveli and daman and diu': 'IN-DH',
  'jammu & kashmir': 'IN-JK',
  'tg': 'IN-TG',
  'ts': 'IN-TG',
  'ap': 'IN-AP',
  'ka': 'IN-KA',
  'mh': 'IN-MH',
  'tn': 'IN-TN',
  'up': 'IN-UP',
  'gj': 'IN-GJ',
  'dl': 'IN-DL',
  'wb': 'IN-WB',
  'rj': 'IN-RJ',
  'pb': 'IN-PB',
  'kl': 'IN-KL',
  'mp': 'IN-MP',
  'br': 'IN-BR',
  'ar': 'IN-AR',
  'as': 'IN-AS',
};

Object.entries(RAW_STATE_ALIASES).forEach(([alias, stateId]) => {
  STATE_ALIASES.set(alias.toLowerCase(), stateId.toUpperCase());
});

// Initialize District lookups
MASTER_DISTRICTS.forEach(dist => {
  DISTRICT_BY_ID.set(dist.district_id.toUpperCase(), dist);

  const stateDistList = DISTRICTS_BY_STATE_ID.get(dist.state_id.toUpperCase()) || [];
  stateDistList.push(dist);
  DISTRICTS_BY_STATE_ID.set(dist.state_id.toUpperCase(), stateDistList);

  const compositeKey = `${dist.state_id.toUpperCase()}|${dist.district_name.toLowerCase().trim()}`;
  DISTRICT_BY_STATE_AND_NAME.set(compositeKey, dist);
});

// Common District aliases and variations across sources
const RAW_DISTRICT_ALIASES: Record<string, string> = {
  // Karnataka
  'bengaluru': 'IN-KA-03',
  'bengaluru urban': 'IN-KA-03',
  'bangalore': 'IN-KA-03',
  'bangalore urban': 'IN-KA-03',
  'bengaluru rural': 'IN-KA-02',
  'bangalore rural': 'IN-KA-02',
  'mysore': 'IN-KA-21',
  'mysuru': 'IN-KA-21',
  
  // Uttar Pradesh / Delhi NCR
  'noida': 'IN-UP-27',
  'gautam buddha nagar': 'IN-UP-27',
  'gautam budh nagar': 'IN-UP-27',
  'gautambuddha nagar': 'IN-UP-27',
  'greater noida': 'IN-UP-27',

  // Haryana / Delhi NCR
  'gurgaon': 'IN-HR-07',
  'gurugram': 'IN-HR-07',

  // Andhra Pradesh
  'vizag': 'IN-AP-23',
  'visakhapatnam': 'IN-AP-23',
  'visakhapatnam district': 'IN-AP-23',
  'ysr': 'IN-AP-26',
  'y.s.r.': 'IN-AP-26',
  'y s r': 'IN-AP-26',
  'kadapa': 'IN-AP-26',
  'ysr kadapa': 'IN-AP-26',
  'east godavari district': 'IN-AP-08',
  'west godavari district': 'IN-AP-25',

  // Telangana
  'hyderabad': 'IN-TG-15',
  'hyderabad district': 'IN-TG-15',
  'ranga reddy': 'IN-TG-26',
  'rangareddy': 'IN-TG-26',
  'rangareddy district': 'IN-TG-26',
  'medchal malkajgiri': 'IN-TG-21',
  'medchal-malkajgiri': 'IN-TG-21',
  'medchal': 'IN-TG-21',

  // Arunachal Pradesh
  'papum pare': 'IN-AR-18',
  'papum-pare': 'IN-AR-18',
  'papumpare': 'IN-AR-18',
  'itanagar': 'IN-AR-06',
  'itanagar capital complex': 'IN-AR-06',

  // Maharashtra
  'pune': 'IN-MH-26',
  'pune district': 'IN-MH-26',
  'mumbai': 'IN-MH-21',
  'mumbai city': 'IN-MH-21',
  'mumbai suburban': 'IN-MH-22',

  // Tamil Nadu
  'chennai': 'IN-TN-04',
  'chennai district': 'IN-TN-04',
};

Object.entries(RAW_DISTRICT_ALIASES).forEach(([alias, districtId]) => {
  DISTRICT_ALIASES.set(alias.toLowerCase(), districtId.toUpperCase());
});

/**
 * Checks if a district filter string represents the "All Districts" state scope.
 */
export function isAllDistrictsScope(districtInput?: string | null): boolean {
  if (!districtInput) return true;
  const cleaned = districtInput.trim().toLowerCase();
  return (
    cleaned === '' ||
    cleaned === 'all' ||
    cleaned === 'all districts' ||
    cleaned.startsWith('all districts in')
  );
}

/**
 * Resolves any State representation (name, state_id, alias) to canonical StateMaster.
 */
export function resolveCanonicalState(input?: string | null): StateMaster | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === 'all' || trimmed.toLowerCase().includes('all states')) {
    return null;
  }

  // 1. Exact State ID match (e.g. "IN-TG")
  const idMatch = STATE_BY_ID.get(trimmed.toUpperCase());
  if (idMatch) return idMatch;

  // 2. Exact Name match (e.g. "Telangana")
  const nameMatch = STATE_BY_NAME.get(trimmed.toLowerCase());
  if (nameMatch) return nameMatch;

  // 3. Known Alias (e.g. "Delhi NCR" -> "IN-DL", "TG" -> "IN-TG")
  const aliasId = STATE_ALIASES.get(trimmed.toLowerCase());
  if (aliasId) {
    const aliasMatch = STATE_BY_ID.get(aliasId);
    if (aliasMatch) return aliasMatch;
  }

  // 4. Fuzzy / partial match
  const lower = trimmed.toLowerCase();
  for (const [name, state] of STATE_BY_NAME.entries()) {
    if (lower.includes(name) || name.includes(lower)) {
      return state;
    }
  }

  return null;
}

/**
 * Resolves any District representation (name, district_id, alias) to canonical DistrictMaster.
 */
export function resolveCanonicalDistrict(
  districtInput?: string | null,
  stateInput?: string | null
): DistrictMaster | null {
  if (!districtInput || typeof districtInput !== 'string') return null;
  if (isAllDistrictsScope(districtInput)) return null;

  const trimmed = districtInput.trim();
  const stateContext = resolveCanonicalState(stateInput);

  // 1. Exact District ID match (e.g. "IN-TG-15")
  const idMatch = DISTRICT_BY_ID.get(trimmed.toUpperCase());
  if (idMatch) return idMatch;

  // 2. Direct State + District composite match
  if (stateContext) {
    const compositeKey = `${stateContext.state_id.toUpperCase()}|${trimmed.toLowerCase()}`;
    const compositeMatch = DISTRICT_BY_STATE_AND_NAME.get(compositeKey);
    if (compositeMatch) return compositeMatch;
  }

  // 3. Known District Alias (e.g. "Bengaluru" -> "IN-KA-03", "Noida" -> "IN-UP-27")
  const aliasDistrictId = DISTRICT_ALIASES.get(trimmed.toLowerCase());
  if (aliasDistrictId) {
    const aliasMatch = DISTRICT_BY_ID.get(aliasDistrictId);
    if (aliasMatch) return aliasMatch;
  }

  // 4. Match within state if stateContext provided
  if (stateContext) {
    const stateDistricts = DISTRICTS_BY_STATE_ID.get(stateContext.state_id.toUpperCase()) || [];
    const lower = trimmed.toLowerCase();

    // Clean punctuation (e.g. "Papum-Pare" vs "Papum Pare")
    const cleanLower = lower.replace(/[-_.,]/g, ' ').replace(/\s+/g, ' ').trim();

    for (const d of stateDistricts) {
      const dClean = d.district_name.toLowerCase().replace(/[-_.,]/g, ' ').replace(/\s+/g, ' ').trim();
      if (dClean === cleanLower) return d;
    }
    for (const d of stateDistricts) {
      const dClean = d.district_name.toLowerCase().replace(/[-_.,]/g, ' ').replace(/\s+/g, ' ').trim();
      if (dClean.includes(cleanLower) || cleanLower.includes(dClean)) return d;
    }
  }

  // 5. Global match across all districts
  const cleanLower = trimmed.toLowerCase().replace(/[-_.,]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const d of MASTER_DISTRICTS) {
    const dClean = d.district_name.toLowerCase().replace(/[-_.,]/g, ' ').replace(/\s+/g, ' ').trim();
    if (dClean === cleanLower) return d;
  }

  return null;
}

/**
 * Enriches any record with canonical state_id, district_id, lgd_district_code.
 */
export function enrichWithCanonicalGeography<
  T extends { state: string; district: string; state_id?: string; district_id?: string; lgd_district_code?: number }
>(record: T): T {
  const canonicalState = resolveCanonicalState(record.state_id || record.state);
  const canonicalDistrict = resolveCanonicalDistrict(
    record.district_id || record.district,
    canonicalState?.state_name || record.state
  );

  return {
    ...record,
    state: canonicalState ? canonicalState.state_name : record.state,
    state_id: canonicalState ? canonicalState.state_id : record.state_id,
    district: canonicalDistrict ? canonicalDistrict.district_name : record.district,
    district_id: canonicalDistrict ? canonicalDistrict.district_id : record.district_id,
    lgd_district_code: canonicalDistrict?.lgd_district_code || record.lgd_district_code
  };
}

/**
 * Robust Canonical Matching:
 * Evaluates whether a labour-market record matches given geography filter query.
 */
export function matchesCanonicalGeography(
  record: { state: string; district: string; state_id?: string; district_id?: string },
  query: { state?: string | null; district?: string | null; state_id?: string | null; district_id?: string | null }
): boolean {
  const queryStateInput = query.state_id || query.state;
  const queryDistrictInput = query.district_id || query.district;

  // 1. State Filter Check
  if (queryStateInput && !queryStateInput.toLowerCase().includes('all')) {
    const queryState = resolveCanonicalState(queryStateInput);
    const recordState = resolveCanonicalState(record.state_id || record.state);

    if (queryState && recordState) {
      if (queryState.state_id !== recordState.state_id) return false;
    } else {
      // Fallback string matching if unmapped
      const qLower = queryStateInput.trim().toLowerCase();
      const rLower = (record.state || '').trim().toLowerCase();
      if (qLower !== rLower && !rLower.includes(qLower)) return false;
    }
  }

  // 2. District Filter Check
  if (queryDistrictInput && !isAllDistrictsScope(queryDistrictInput)) {
    const queryDistrict = resolveCanonicalDistrict(queryDistrictInput, queryStateInput);
    const recordDistrict = resolveCanonicalDistrict(record.district_id || record.district, record.state);

    if (queryDistrict && recordDistrict) {
      if (queryDistrict.district_id !== recordDistrict.district_id) return false;
    } else {
      // Fallback clean string matching
      const qClean = queryDistrictInput.toLowerCase().replace(/[-_.,]/g, ' ').replace(/\s+/g, ' ').trim();
      const rClean = (record.district || '').toLowerCase().replace(/[-_.,]/g, ' ').replace(/\s+/g, ' ').trim();
      if (qClean !== rClean) return false;
    }
  }

  return true;
}

/**
 * Filter an array of labour records by canonical geography.
 */
export function filterByCanonicalGeography<
  T extends { state: string; district: string; state_id?: string; district_id?: string }
>(
  records: T[],
  query: { state?: string | null; district?: string | null; state_id?: string | null; district_id?: string | null }
): T[] {
  return records.filter(record => matchesCanonicalGeography(record, query));
}

/**
 * Evaluates official data coverage using canonical geography identifiers.
 * Solves:
 * - "All Districts" (State-level view)
 * - Specific District view (District-level view)
 * - National view (All India)
 * Never converts missing data to 0.
 */
export function evaluateCanonicalCoverage(
  stateInput?: string | null,
  districtInput?: string | null,
  sectorInput?: string | null,
  skillInput?: string | null,
  demandDataset: DemandRecord[] = [],
  workerDataset: SupplyWorkerRecord[] = [],
  trainingDataset: TrainingRecord[] = []
): DataCoverageStatus {
  const isStateLevel = isAllDistrictsScope(districtInput);
  const canonicalState = resolveCanonicalState(stateInput);
  const canonicalDistrict = isStateLevel
    ? null
    : resolveCanonicalDistrict(districtInput, canonicalState?.state_name || stateInput);

  const stateName = canonicalState?.state_name || stateInput || 'All India';
  const districtName = isStateLevel
    ? (canonicalState ? `All Districts in ${canonicalState.state_name}` : 'All Districts')
    : (canonicalDistrict?.district_name || districtInput || '');

  // Verify existence in official LGD master
  const locationExists = isStateLevel
    ? (!stateInput || !!canonicalState)
    : !!canonicalDistrict;

  // Filter demand records canonically
  let matchedDemand = filterByCanonicalGeography(demandDataset, {
    state: canonicalState?.state_id || stateInput,
    district: canonicalDistrict?.district_id || (isStateLevel ? undefined : districtInput)
  });

  if (sectorInput) {
    const secLower = sectorInput.toLowerCase();
    matchedDemand = matchedDemand.filter(
      d => d.sector.toLowerCase().includes(secLower) || secLower.includes(d.sector.toLowerCase())
    );
  }
  if (skillInput) {
    const skLower = skillInput.toLowerCase();
    matchedDemand = matchedDemand.filter(d => d.normalizedSkill.toLowerCase() === skLower);
  }

  // Filter worker supply records canonically
  let matchedWorkers = filterByCanonicalGeography(workerDataset, {
    state: canonicalState?.state_id || stateInput,
    district: canonicalDistrict?.district_id || (isStateLevel ? undefined : districtInput)
  });

  if (sectorInput) {
    const secLower = sectorInput.toLowerCase();
    matchedWorkers = matchedWorkers.filter(
      s => s.sector.toLowerCase().includes(secLower) || secLower.includes(s.sector.toLowerCase())
    );
  }
  if (skillInput) {
    const skLower = skillInput.toLowerCase();
    matchedWorkers = matchedWorkers.filter(s => s.normalizedSkill.toLowerCase() === skLower);
  }

  // Filter training records canonically
  let matchedTraining = filterByCanonicalGeography(trainingDataset, {
    state: canonicalState?.state_id || stateInput,
    district: canonicalDistrict?.district_id || (isStateLevel ? undefined : districtInput)
  });

  if (sectorInput) {
    const secLower = sectorInput.toLowerCase();
    matchedTraining = matchedTraining.filter(
      t => t.sector.toLowerCase().includes(secLower) || secLower.includes(t.sector.toLowerCase())
    );
  }
  if (skillInput) {
    const skLower = skillInput.toLowerCase();
    matchedTraining = matchedTraining.filter(t => t.normalizedSkill.toLowerCase() === skLower);
  }

  // Status computation
  const demandStatus: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' =
    matchedDemand.length >= 4 ? 'AVAILABLE' : matchedDemand.length > 0 ? 'PARTIAL' : 'UNAVAILABLE';
  const workerSupplyStatus: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' =
    matchedWorkers.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
  const trainingStatus: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' =
    matchedTraining.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE';

  const gapStatus: 'AVAILABLE' | 'NON_COMPARABLE' | 'UNAVAILABLE' =
    (matchedDemand.length > 0 && (matchedWorkers.length > 0 || matchedTraining.length > 0))
      ? 'AVAILABLE'
      : matchedDemand.length > 0
      ? 'NON_COMPARABLE'
      : 'UNAVAILABLE';

  const forecastStatus: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE' =
    matchedDemand.length >= 4
      ? 'AVAILABLE'
      : matchedDemand.length > 0
      ? 'INSUFFICIENT_DATA'
      : 'UNAVAILABLE';

  // Separate observed demand from statistical forecast records
  const observedDemand = matchedDemand.filter(d => !d.is_forecast);
  const forecastDemand = matchedDemand.filter(d => d.is_forecast);

  const observedDemandPeriods = observedDemand.map(d => d.period).sort();
  const workerPeriods = matchedWorkers.map(s => s.period).sort();
  const trainingPeriods = matchedTraining.map(t => t.period).sort();

  // Supply periods (workers + training) strictly
  const supplyPeriods = [...workerPeriods, ...trainingPeriods].sort();
  const supplyDate = supplyPeriods.length > 0
    ? formatPeriodToHuman(supplyPeriods[supplyPeriods.length - 1])
    : 'Unavailable';
  const workerSupplyDate = workerPeriods.length > 0
    ? formatPeriodToHuman(workerPeriods[workerPeriods.length - 1])
    : 'Unavailable';
  const trainingDate = trainingPeriods.length > 0
    ? formatPeriodToHuman(trainingPeriods[trainingPeriods.length - 1])
    : 'Unavailable';

  // Demand observed vs forecast separation
  const demandObservedDate = observedDemandPeriods.length > 0
    ? formatPeriodToHuman(observedDemandPeriods[observedDemandPeriods.length - 1])
    : 'Unavailable';
  const demandForecastDate = forecastDemand.length > 0
    ? formatPeriodToHuman(forecastDemand[forecastDemand.length - 1].period)
    : undefined;

  const demandDate = demandObservedDate !== 'Unavailable'
    ? demandObservedDate
    : demandForecastDate
    ? `${demandForecastDate} (Statistical Forecast)`
    : 'Unavailable';

  // Overall latest OBSERVED period (never derived from forward projections)
  const allObservedPeriods = [...observedDemandPeriods, ...workerPeriods, ...trainingPeriods].sort();
  const latestPeriod = allObservedPeriods.length > 0 ? allObservedPeriods[allObservedPeriods.length - 1] : '';
  const latestDate = latestPeriod ? formatPeriodToHuman(latestPeriod) : 'Unavailable';

  // Determine verification status of demand records
  const hasVerifiedDemand = matchedDemand.length > 0 && matchedDemand.every(d => d.provenance?.verification_status === 'VERIFIED_INGESTED');
  const demandVerificationStatus: 'VERIFIED_INGESTED' | 'REQUIRES_VERIFICATION' | 'UNVERIFIED' =
    hasVerifiedDemand
      ? 'VERIFIED_INGESTED'
      : matchedDemand.length > 0
      ? 'REQUIRES_VERIFICATION'
      : 'UNVERIFIED';

  let message = '';
  let suggestedAction = '';

  if (!locationExists) {
    message = `Location "${districtName || stateName}" is not recognized in India's official Local Government Directory (LGD).`;
    suggestedAction = 'Please verify the selection using the official directory dropdown.';
  } else if (demandStatus === 'UNAVAILABLE' && workerSupplyStatus === 'UNAVAILABLE' && trainingStatus === 'UNAVAILABLE') {
    message = isStateLevel
      ? `Labour-market filings are currently unavailable for ${stateName}.`
      : `Labour-market filings are currently unavailable for ${districtName}, ${stateName}.`;
    suggestedAction = 'Official Local Government Directory (LGD) record verified. Location exists, but verified records have not yet been ingested.';
  } else if (gapStatus === 'NON_COMPARABLE') {
    message = `Job demand records exist (${matchedDemand.length} observation(s)), but comparable worker supply data is unavailable for this selection. Potential skill gaps cannot be calculated.`;
    suggestedAction = 'Skill gaps require verified demand and workforce supply on identical geographic and temporal boundaries.';
  } else {
    message = `Records available: ${matchedDemand.length} demand observation(s), ${matchedWorkers.length} worker registry record(s), and ${matchedTraining.length} training center record(s).`;
  }

  return {
    locationExists,
    districtName,
    stateName,
    lgdDistrictCode: canonicalDistrict?.lgd_district_code,
    demandStatus,
    demandRecordsCount: matchedDemand.length,
    demandVerificationStatus,
    workerSupplyStatus,
    workerSupplyRecordsCount: matchedWorkers.length,
    trainingStatus,
    trainingRecordsCount: matchedTraining.length,
    gapStatus,
    forecastStatus,
    sourcesChecked: [
      'Government Open Data Platform (data.gov.in)',
      'National Career Service (NCS) Vacancy Portal',
      'Pradhan Mantri Kaushal Vikas Yojana (PMKVY) / MSDE',
      'e-Shram National Worker Database'
    ],
    message,
    suggestedAction,
    latestDate,
    demandDate,
    supplyDate,
    workerSupplyDate,
    trainingDate
  };
}

/**
 * Diagnostic Report:
 * Inspects all official states & districts and reports empirical database coverage.
 * Internal diagnostic for development verification.
 */
export function getGeographyDataDiagnostics(
  demandDataset: DemandRecord[],
  workerDataset: SupplyWorkerRecord[],
  trainingDataset: TrainingRecord[]
) {
  const stateSummary = MASTER_STATES.map(state => {
    const stateDemand = filterByCanonicalGeography(demandDataset, { state_id: state.state_id });
    const stateWorkers = filterByCanonicalGeography(workerDataset, { state_id: state.state_id });
    const stateTraining = filterByCanonicalGeography(trainingDataset, { state_id: state.state_id });

    const totalDemandVolume = stateDemand.reduce((s, d) => s + d.demandCount, 0);
    const districtsWithData = new Set(stateDemand.map(d => d.district));

    return {
      state_id: state.state_id,
      state_name: state.state_name,
      state_type: state.state_type,
      demandRecordsCount: stateDemand.length,
      totalDemandVolume,
      workerRecordsCount: stateWorkers.length,
      trainingRecordsCount: stateTraining.length,
      districtsWithDemandCount: districtsWithData.size,
      districtsWithDemand: Array.from(districtsWithData),
      hasData: stateDemand.length > 0 || stateWorkers.length > 0 || stateTraining.length > 0
    };
  });

  const statesWithData = stateSummary.filter(s => s.hasData);
  const statesWithoutData = stateSummary.filter(s => !s.hasData);

  return {
    totalStatesInMaster: MASTER_STATES.length,
    totalDistrictsInMaster: MASTER_DISTRICTS.length,
    statesWithDataCount: statesWithData.length,
    statesWithoutDataCount: statesWithoutData.length,
    statesWithData,
    statesWithoutDataSummary: statesWithoutData.map(s => s.state_name)
  };
}
