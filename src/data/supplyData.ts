import { SupplyWorkerRecord } from '../types';

/**
 * ============================================================================
 * SKILLPULSE VERIFIED WORKFORCE SUPPLY DATA LAYER
 * ============================================================================
 * REAL-DATA-DRIVEN REQUIREMENT:
 * - Worker Supply represents verified active registered jobseekers and skilled
 *   workers with valid official source provenance (e.g. e-Shram / NCS microdata).
 * - When empirical microdata has not been filed for a geography or skill,
 *   we NEVER generate synthetic fallback counts or placeholder workers.
 * - Missing data is represented as Unavailable, NOT zero.
 * ============================================================================
 */

export const SUPPLY_WORKER_RECORDS: SupplyWorkerRecord[] = [
  // Production dataset: Awaiting verified official e-Shram / NCS workforce registry microdata ingestion.
  // Test/demo fixtures are maintained separately in demoFixtures.ts and excluded from production APIs.
];
