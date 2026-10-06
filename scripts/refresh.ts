/**
 * ============================================================================
 * SKILLPULSE DATA INTEGRITY & PROVENANCE VALIDATION CLI
 * ============================================================================
 * Purpose: Validates dataset schema, provenance metadata completeness,
 * canonical geography consistency, period formatting, non-negativity, and
 * duplicate detection across production and development records.
 * 
 * Safety: Does NOT download fabricated data or alter existing fixtures.
 * Fails safely with an explicit exit code if any required provenance is missing.
 * ============================================================================
 */

import { DEMAND_RECORDS } from '../src/data/demandData';
import { SUPPLY_WORKER_RECORDS } from '../src/data/supplyData';
import { TRAINING_RECORDS } from '../src/data/trainingData';
import { DATA_PROVENANCE_CATALOG } from '../src/data/dataProvenance';
import { MASTER_STATES, MASTER_DISTRICTS } from '../src/data/masterGeography';

interface ValidationError {
  dataset: string;
  recordId?: string;
  field: string;
  issue: string;
  severity: 'ERROR' | 'WARNING';
}

function runDataAudit(): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const validStateNames = new Set(MASTER_STATES.map(s => s.state_name.toLowerCase()));
  const validDistrictsByState = new Map<string, Set<string>>();

  for (const s of MASTER_STATES) {
    validDistrictsByState.set(s.state_name.toLowerCase(), new Set());
  }
  for (const d of MASTER_DISTRICTS) {
    const sName = d.state_name.toLowerCase();
    if (!validDistrictsByState.has(sName)) {
      validDistrictsByState.set(sName, new Set());
    }
    validDistrictsByState.get(sName)!.add(d.district_name.toLowerCase());
  }

  // 1. Audit DATA_PROVENANCE_CATALOG
  console.log('🔍 [1/5] Auditing Dataset Provenance Catalog...');
  const catalogKeys = Object.keys(DATA_PROVENANCE_CATALOG);
  if (catalogKeys.length === 0) {
    errors.push({
      dataset: 'DATA_PROVENANCE_CATALOG',
      field: 'catalog',
      issue: 'Provenance catalog is empty.',
      severity: 'ERROR'
    });
  }

  for (const [key, entry] of Object.entries(DATA_PROVENANCE_CATALOG)) {
    if (!entry.sourceOrganization || !entry.officialPortalUrl) {
      errors.push({
        dataset: `DATA_PROVENANCE_CATALOG:${key}`,
        field: 'sourceOrganization/officialPortalUrl',
        issue: 'Missing authoritative organization or portal URL.',
        severity: 'ERROR'
      });
    }
    if (!entry.accessDate || !/^\d{4}-\d{2}-\d{2}$/.test(entry.accessDate)) {
      errors.push({
        dataset: `DATA_PROVENANCE_CATALOG:${key}`,
        field: 'accessDate',
        issue: `Invalid or missing accessDate: ${entry.accessDate}. Must be YYYY-MM-DD.`,
        severity: 'ERROR'
      });
    }
    if (!entry.dataLimitations || entry.dataLimitations.length === 0) {
      warnings.push({
        dataset: `DATA_PROVENANCE_CATALOG:${key}`,
        field: 'dataLimitations',
        issue: 'No limitations recorded for dataset.',
        severity: 'WARNING'
      });
    }
  }

  // Helper: Validate Period Format (YYYY-Q# or YYYY-YY or FY YYYY-YY)
  const isValidPeriod = (p: string) => /^\d{4}-Q[1-4]$/.test(p) || /^\d{4}-\d{2}$/.test(p) || /^FY\s*\d{4}-\d{2}$/.test(p);

  // 2. Audit Demand Records
  console.log(`🔍 [2/5] Auditing Demand Records (${DEMAND_RECORDS.length} fixtures)...`);
  const demandIds = new Set<string>();

  for (const dem of DEMAND_RECORDS) {
    // Duplicate check
    if (demandIds.has(dem.id)) {
      errors.push({
        dataset: 'DEMAND_RECORDS',
        recordId: dem.id,
        field: 'id',
        issue: `Duplicate demand record id: ${dem.id}`,
        severity: 'ERROR'
      });
    }
    demandIds.add(dem.id);

    // Negative counts
    if (dem.demandCount < 0) {
      errors.push({
        dataset: 'DEMAND_RECORDS',
        recordId: dem.id,
        field: 'demandCount',
        issue: `Negative demand count: ${dem.demandCount}`,
        severity: 'ERROR'
      });
    }

    // Period validation
    if (!isValidPeriod(dem.period)) {
      errors.push({
        dataset: 'DEMAND_RECORDS',
        recordId: dem.id,
        field: 'period',
        issue: `Invalid period format: ${dem.period}`,
        severity: 'ERROR'
      });
    }

    // Geography validation
    const stLower = dem.state.toLowerCase();
    if (!validStateNames.has(stLower)) {
      errors.push({
        dataset: 'DEMAND_RECORDS',
        recordId: dem.id,
        field: 'state',
        issue: `State '${dem.state}' not in official LGD master list.`,
        severity: 'ERROR'
      });
    } else {
      const allowedDistricts = validDistrictsByState.get(stLower);
      if (allowedDistricts && !allowedDistricts.has(dem.district.toLowerCase())) {
        errors.push({
          dataset: 'DEMAND_RECORDS',
          recordId: dem.id,
          field: 'district',
          issue: `District '${dem.district}' does not belong to state '${dem.state}' in LGD master directory.`,
          severity: 'ERROR'
        });
      }
    }

    // Provenance metadata presence
    if (!dem.provenance) {
      errors.push({
        dataset: 'DEMAND_RECORDS',
        recordId: dem.id,
        field: 'provenance',
        issue: 'Record is missing provenance metadata.',
        severity: 'ERROR'
      });
    } else {
      if (!dem.provenance.source_name || !dem.provenance.source_url) {
        errors.push({
          dataset: 'DEMAND_RECORDS',
          recordId: dem.id,
          field: 'provenance.source_name/url',
          issue: 'Missing source_name or source_url in provenance metadata.',
          severity: 'ERROR'
        });
      }
      if (!dem.provenance.verification_status) {
        errors.push({
          dataset: 'DEMAND_RECORDS',
          recordId: dem.id,
          field: 'provenance.verification_status',
          issue: 'Missing verification_status in provenance.',
          severity: 'ERROR'
        });
      }
      if (dem.provenance.is_development_fixture !== true) {
        warnings.push({
          dataset: 'DEMAND_RECORDS',
          recordId: dem.id,
          field: 'provenance.is_development_fixture',
          issue: 'Demand record should be explicitly flagged as is_development_fixture: true.',
          severity: 'WARNING'
        });
      }
    }
  }

  // 3. Audit Supply Worker Records
  console.log(`🔍 [3/5] Auditing Supply Worker Records (${SUPPLY_WORKER_RECORDS.length} records)...`);
  const supplyIds = new Set<string>();

  for (const sup of SUPPLY_WORKER_RECORDS) {
    if (supplyIds.has(sup.id)) {
      errors.push({
        dataset: 'SUPPLY_WORKER_RECORDS',
        recordId: sup.id,
        field: 'id',
        issue: `Duplicate supply record id: ${sup.id}`,
        severity: 'ERROR'
      });
    }
    supplyIds.add(sup.id);

    if (sup.workerCount < 0) {
      errors.push({
        dataset: 'SUPPLY_WORKER_RECORDS',
        recordId: sup.id,
        field: 'workerCount',
        issue: `Negative worker count: ${sup.workerCount}`,
        severity: 'ERROR'
      });
    }

    if (!isValidPeriod(sup.period)) {
      errors.push({
        dataset: 'SUPPLY_WORKER_RECORDS',
        recordId: sup.id,
        field: 'period',
        issue: `Invalid period format: ${sup.period}`,
        severity: 'ERROR'
      });
    }

    const stLower = sup.state.toLowerCase();
    if (!validStateNames.has(stLower)) {
      errors.push({
        dataset: 'SUPPLY_WORKER_RECORDS',
        recordId: sup.id,
        field: 'state',
        issue: `State '${sup.state}' not in official LGD master list.`,
        severity: 'ERROR'
      });
    } else {
      const allowedDistricts = validDistrictsByState.get(stLower);
      if (allowedDistricts && !allowedDistricts.has(sup.district.toLowerCase())) {
        errors.push({
          dataset: 'SUPPLY_WORKER_RECORDS',
          recordId: sup.id,
          field: 'district',
          issue: `District '${sup.district}' does not belong to state '${sup.state}' in LGD master directory.`,
          severity: 'ERROR'
        });
      }
    }

    if (!sup.provenance) {
      errors.push({
        dataset: 'SUPPLY_WORKER_RECORDS',
        recordId: sup.id,
        field: 'provenance',
        issue: 'Record is missing provenance metadata.',
        severity: 'ERROR'
      });
    } else {
      if (!sup.provenance.source_name || !sup.provenance.source_url) {
        errors.push({
          dataset: 'SUPPLY_WORKER_RECORDS',
          recordId: sup.id,
          field: 'provenance.source_name/url',
          issue: 'Missing source_name or source_url.',
          severity: 'ERROR'
        });
      }
      if (!sup.provenance.labour_definition) {
        warnings.push({
          dataset: 'SUPPLY_WORKER_RECORDS',
          recordId: sup.id,
          field: 'provenance.labour_definition',
          issue: 'Record lacks explicit labour_definition scope.',
          severity: 'WARNING'
        });
      }
    }
  }

  // 4. Audit Training Records
  console.log(`🔍 [4/5] Auditing Training Records (${TRAINING_RECORDS.length} records)...`);
  const trainingIds = new Set<string>();

  for (const tr of TRAINING_RECORDS) {
    if (trainingIds.has(tr.id)) {
      errors.push({
        dataset: 'TRAINING_RECORDS',
        recordId: tr.id,
        field: 'id',
        issue: `Duplicate training record id: ${tr.id}`,
        severity: 'ERROR'
      });
    }
    trainingIds.add(tr.id);

    if ((tr.trainedCount ?? 0) < 0 || (tr.placedCount ?? 0) < 0 || (tr.annualCapacity ?? 0) < 0) {
      errors.push({
        dataset: 'TRAINING_RECORDS',
        recordId: tr.id,
        field: 'counts',
        issue: 'Negative count in training metrics.',
        severity: 'ERROR'
      });
    }

    if (!isValidPeriod(tr.period)) {
      errors.push({
        dataset: 'TRAINING_RECORDS',
        recordId: tr.id,
        field: 'period',
        issue: `Invalid period format: ${tr.period}`,
        severity: 'ERROR'
      });
    }

    const stLower = tr.state.toLowerCase();
    if (!validStateNames.has(stLower)) {
      errors.push({
        dataset: 'TRAINING_RECORDS',
        recordId: tr.id,
        field: 'state',
        issue: `State '${tr.state}' not in official LGD master list.`,
        severity: 'ERROR'
      });
    }

    if (!tr.provenance || !tr.provenance.source_name || !tr.provenance.source_url) {
      errors.push({
        dataset: 'TRAINING_RECORDS',
        recordId: tr.id,
        field: 'provenance',
        issue: 'Missing provenance or source url.',
        severity: 'ERROR'
      });
    }
  }

  // 5. Audit Regional Scope (Telangana Specific Checks)
  console.log('🔍 [5/5] Auditing Regional Scope (Telangana Coverage Checks)...');
  const tgDemand = DEMAND_RECORDS.filter(d => d.state === 'Telangana');
  const tgSupply = SUPPLY_WORKER_RECORDS.filter(s => s.state === 'Telangana');
  const tgDemandDistricts = new Set(tgDemand.map(d => d.district));
  const tgSupplyDistricts = new Set(tgSupply.map(s => s.district));

  if (tgDemandDistricts.size === 1 && !tgDemandDistricts.has('Hyderabad')) {
    warnings.push({
      dataset: 'DEMAND_RECORDS',
      field: 'coverage',
      issue: 'Telangana demand does not match expected Hyderabad baseline.',
      severity: 'WARNING'
    });
  }

  return { errors, warnings };
}

function main() {
  console.log('================================================================');
  console.log(' SKILLPULSE DATA INTEGRITY & PROVENANCE AUDIT PIPELINE');
  console.log('================================================================');

  const { errors, warnings } = runDataAudit();

  console.log('\n----------------------------------------------------------------');
  console.log(' AUDIT SUMMARY');
  console.log('----------------------------------------------------------------');
  console.log(`Total Errors   : ${errors.length}`);
  console.log(`Total Warnings : ${warnings.length}`);
  console.log(`Total Records  : ${DEMAND_RECORDS.length} Demand, ${SUPPLY_WORKER_RECORDS.length} Supply, ${TRAINING_RECORDS.length} Training`);
  console.log(`Catalog Entries: ${Object.keys(DATA_PROVENANCE_CATALOG).length} Registered Sources`);
  console.log('----------------------------------------------------------------\n');

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach((w, i) => {
      console.log(`   ${i + 1}. [${w.dataset}] ${w.field}: ${w.issue}`);
    });
    console.log('');
  }

  if (errors.length > 0) {
    console.error('❌  CRITICAL ERRORS FOUND:');
    errors.forEach((e, i) => {
      console.error(`   ${i + 1}. [${e.dataset}${e.recordId ? ` id=${e.recordId}` : ''}] ${e.field}: ${e.issue}`);
    });
    console.error('\nData integrity check FAILED. Exiting with code 1.');
    process.exit(1);
  }

  console.log('✅  All provenance, schema, non-negativity, and geography checks PASSED.');
  console.log('    Data provenance meets Phase 1 foundation criteria.\n');
  process.exit(0);
}

main();
