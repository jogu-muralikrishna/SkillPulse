import { TrainingRecord } from '../types';

/**
 * ============================================================================
 * SKILLPULSE VERIFIED TRAINING SUPPLY & CAPACITY DATA LAYER
 * ============================================================================
 * REAL-DATA-DRIVEN REQUIREMENT:
 * - Institutional Training Supply represents accredited institutional training
 *   capacity, candidate enrollments, certifications, and verified placements
 *   with valid official provenance (e.g. MSDE PMKVY official center disclosures).
 * - When empirical training microdata has not been filed for a geography or skill,
 *   we NEVER generate synthetic course names, fake centers, or placeholder seats.
 * - Missing data is represented as Unavailable, NOT zero.
 * ============================================================================
 */

export const TRAINING_RECORDS: TrainingRecord[] = [
  // Production dataset: Awaiting verified official MSDE / PMKVY accredited center disclosure ingestion.
  // Test/demo fixtures are maintained separately in demoFixtures.ts and excluded from production APIs.
];
