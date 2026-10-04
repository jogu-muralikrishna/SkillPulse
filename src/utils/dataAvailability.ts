import { DEMAND_RECORDS } from '../data/demandData';
import { SUPPLY_WORKER_RECORDS } from '../data/supplyData';
import { TRAINING_RECORDS } from '../data/trainingData';
import { DataCoverageStatus } from '../types';
import { evaluateCanonicalCoverage } from './canonicalGeography';

export const CONNECTED_SOURCES = [
  'Government Open Data Platform (data.gov.in)',
  'National Career Service (NCS) Vacancy Portal',
  'Pradhan Mantri Kaushal Vikas Yojana (PMKVY) / MSDE',
  'e-Shram National Worker Database'
];

/**
 * Evaluates empirical data availability for any state and district.
 * Implements the core principles:
 * - LOCATION EXISTS != DATA EXISTS.
 * - Missing data is NEVER converted to zero.
 * - Accurately supports both State-Level ("All Districts in...") and District-Level queries.
 */
export function checkDataCoverage(
  stateName?: string | null,
  districtName?: string | null,
  sectorName?: string | null,
  skillName?: string | null
): DataCoverageStatus {
  return evaluateCanonicalCoverage(
    stateName,
    districtName,
    sectorName,
    skillName,
    DEMAND_RECORDS,
    SUPPLY_WORKER_RECORDS,
    TRAINING_RECORDS
  );
}
