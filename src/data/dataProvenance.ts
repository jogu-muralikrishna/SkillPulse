/**
 * ============================================================================
 * SKILLPULSE OFFICIAL DATA PROVENANCE & AUDIT REPOSITORY
 * ============================================================================
 * Standard: Government Open Data & Parliamentary Record Transparency
 * Integrity Principle: DATA INTEGRITY > VISUAL COMPLETENESS
 * 
 * This file records complete provenance metadata for all verified government
 * datasets integrated into the SkillPulse / LifeSaver analytics engine.
 * ============================================================================
 */

export interface ProvenanceDatasetEntry {
  id: string;
  sourceOrganization: string;
  officialPortalUrl: string;
  dataGovCatalogUrl?: string;
  referencePublication: string;
  referenceDate: string;
  accessDate: string;
  populationScope: 'UNORGANISED_WORKFORCE' | 'FORMAL_JOBSEEKERS' | 'ACCREDITED_TRAINEES' | 'CANONICAL_GEOGRAPHY' | 'FORMAL_LABOUR_DEMAND';
  geographyLevel: 'STATE' | 'DISTRICT' | 'NATIONAL';
  verifiedDistrictsCovered: string[];
  recordsCount: number;
  isDevelopmentFixture: boolean;
  verificationStatus: 'VERIFIED_INGESTED' | 'REQUIRES_VERIFICATION' | 'UNVERIFIED';
  dataLimitations: string[];
  comparabilityGuidance: string;
}

export const DATA_PROVENANCE_CATALOG: Record<string, ProvenanceDatasetEntry> = {
  ncs_demand: {
    id: 'ncs_demand',
    sourceOrganization: 'Ministry of Labour & Employment (MoLE), Government of India / National Career Service',
    officialPortalUrl: 'https://www.ncs.gov.in/',
    dataGovCatalogUrl: 'https://www.data.gov.in/',
    referencePublication: 'NCS Monthly Vacancies Bulletin & Public Job Market Research Listings',
    referenceDate: '2024-Q4',
    accessDate: '2026-10-04',
    populationScope: 'FORMAL_LABOUR_DEMAND',
    geographyLevel: 'DISTRICT',
    verifiedDistrictsCovered: [
      'Hyderabad (Telangana)',
      'Bengaluru Urban (Karnataka)',
      'Pune (Maharashtra)',
      'Chennai (Tamil Nadu)',
      'Ahmedabad (Gujarat)',
      'Central Delhi (Delhi)',
      'Visakhapatnam (Andhra Pradesh)',
      'Gautam Buddha Nagar (Uttar Pradesh)'
    ],
    recordsCount: 101,
    isDevelopmentFixture: true,
    verificationStatus: 'REQUIRES_VERIFICATION',
    dataLimitations: [
      'Current 101 demand records are development/testing fixtures and are NOT backed by raw source files in this repository.',
      'Periods from 2025 onwards (2025-Q1 through 2026-Q3) are forward projections tagged as forecasts, not observed government filings.',
      'Telangana demand currently represents Hyderabad district only (1 out of 33 districts in Telangana).',
      'Reflects formal corporate vacancies and technical postings; does not represent total unorganised labor demand.'
    ],
    comparabilityGuidance: 'Formal tech vacancies (e.g. Python, Generative AI) cannot be compared against unorganised worker registries (e-Shram). Cross-population comparisons must be flagged as NON_COMPARABLE.'
  },
  eshram_registry: {
    id: 'eshram_registry',
    sourceOrganization: 'Ministry of Labour & Employment (MoLE), Government of India',
    officialPortalUrl: 'https://eshram.gov.in/',
    dataGovCatalogUrl: 'https://www.data.gov.in/catalog/demographic-data-unorganised-workers-registered-eshram-portal',
    referencePublication: 'Parliamentary Unstarred Questions (Rajya Sabha July 24, 2025; Lok Sabha July 14, 2026) & PIB National Releases',
    referenceDate: '2026-07-14',
    accessDate: '2026-10-04',
    populationScope: 'UNORGANISED_WORKFORCE',
    geographyLevel: 'DISTRICT',
    verifiedDistrictsCovered: [
      'Visakhapatnam (Andhra Pradesh)',
      'Hyderabad (Telangana)',
      'Rangareddy (Telangana)',
      'Medchal-Malkajgiri (Telangana)',
      'Pune (Maharashtra)',
      'Chennai (Tamil Nadu)',
      'Ahmedabad (Gujarat)'
    ],
    recordsCount: 15,
    isDevelopmentFixture: false,
    verificationStatus: 'VERIFIED_INGESTED',
    dataLimitations: [
      'e-Shram registers unorganised workers (construction, agriculture, informal technical services, domestic, logistics).',
      'e-Shram does NOT track formal corporate IT/software engineering occupations (Python, Generative AI, VLSI Physical Design).',
      'Aggregate district totals must not be divided or estimated across unrelated skills using arbitrary percentage assumptions.',
      'Unfiled districts remain honestly marked as Unavailable in accordance with data integrity principles.'
    ],
    comparabilityGuidance: 'e-Shram records must only be compared against compatible informal/technical skill demand where occupational definitions correspond. Comparing e-Shram counts against corporate software engineering vacancies is flagged as NON_COMPARABLE by the analytics engine.'
  },

  pmkvy_training: {
    id: 'pmkvy_training',
    sourceOrganization: 'Ministry of Skill Development & Entrepreneurship (MSDE), Government of India / NSDC',
    officialPortalUrl: 'https://www.msde.gov.in/',
    dataGovCatalogUrl: 'https://www.skillindiadigital.gov.in/',
    referencePublication: 'Skill India Digital Hub (SIDH) / Lok Sabha Unstarred Question No. 3504 (10.08.2026) & MSDE Official Center Disclosures',
    referenceDate: '2026-08-10',
    accessDate: '2026-10-04',
    populationScope: 'ACCREDITED_TRAINEES',
    geographyLevel: 'DISTRICT',
    verifiedDistrictsCovered: [
      'Hyderabad (Telangana)',
      'Visakhapatnam (Andhra Pradesh)',
      'Bengaluru Urban (Karnataka)',
      'Pune (Maharashtra)'
    ],
    recordsCount: 14,
    isDevelopmentFixture: false,
    verificationStatus: 'VERIFIED_INGESTED',
    dataLimitations: [
      'Under PMKVY 4.0 (effective FY 2022-23 onwards), the mandatory placement tracking was delinked to emphasize short-term training and on-the-job orientation (OJT).',
      'Where official disclosures do not report certifiedCount or placedCount, fields remain strictly null/undefined.',
      'District training totals represent macro scheme orientation and must not be artificially portioned across individual skill tracks without accredited course disclosures.',
      'Active centers are verified against operational PMKK disclosures (e.g., 2 operational PMKKs in Hyderabad).'
    ],
    comparabilityGuidance: 'Training output reflects accredited candidate completions in Short-Term Training (STT) and Recognition of Prior Learning (RPL). Simulation of placement outcomes is disabled when certified/placed ratios are withheld in official reports.'
  },

  lgd_master_geography: {
    id: 'lgd_master_geography',
    sourceOrganization: 'Ministry of Panchayati Raj, Government of India',
    officialPortalUrl: 'https://lgdirectory.gov.in/',
    dataGovCatalogUrl: 'https://www.data.gov.in/catalog/local-government-directory-lgd',
    referencePublication: 'Local Government Directory (LGD) Master Repository (28 States, 8 UTs, 786 Districts)',
    referenceDate: '2026-10-04',
    accessDate: '2026-10-04',
    populationScope: 'CANONICAL_GEOGRAPHY',
    geographyLevel: 'DISTRICT',
    verifiedDistrictsCovered: ['All 786 official Districts across all 36 States and Union Territories'],
    recordsCount: 786,
    isDevelopmentFixture: false,
    verificationStatus: 'VERIFIED_INGESTED',
    dataLimitations: [
      'Establishes administrative baseline. Existence of an LGD district does NOT imply presence of labour filings.',
      'Missing labour records in an LGD district are strictly preserved as "Unavailable", never converted to false zero counts.'
    ],
    comparabilityGuidance: 'Canonical geography IDs (e.g., IN-TG-04 for Hyderabad, IN-AP-23 for Visakhapatnam) decouple location lookup from dataset filing status.'
  }
};
