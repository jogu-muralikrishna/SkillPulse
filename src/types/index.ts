export type SourceType = 'government' | 'public' | 'third_party';

export interface StateMaster {
  state_id: string; // e.g. "IN-TG"
  state_name: string; // e.g. "Telangana"
  lgd_state_code: number; // official LGD state code e.g. 36
  state_type: 'State' | 'Union Territory';
}

export interface DistrictMaster {
  district_id: string; // e.g. "IN-TG-04"
  district_name: string; // official LGD name e.g. "Hyderabad"
  lgd_district_code: number; // official LGD district code
  state_id: string; // e.g. "IN-TG"
  state_name: string; // e.g. "Telangana"
  status: 'ACTIVE' | 'ARCHIVED';
  lat?: number;
  lng?: number;
}

export interface SectorMaster {
  sector_id: string;
  sector_name: string;
  sector_source: string;
  source_sector_name: string;
  description: string;
  category?: string;
}

export interface SkillMaster {
  skill_id: string;
  skill_name: string;
  normalized_skill_name: string;
  sector_id: string;
  sector_name: string;
  source: string;
}

export interface DataCoverageStatus {
  locationExists: boolean;
  districtName: string;
  stateName: string;
  lgdDistrictCode?: number;
  demandStatus: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  demandRecordsCount: number;
  demandVerificationStatus?: 'VERIFIED_INGESTED' | 'REQUIRES_VERIFICATION' | 'UNVERIFIED';
  workerSupplyStatus: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  workerSupplyRecordsCount: number;
  trainingStatus: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  trainingRecordsCount: number;
  gapStatus: 'AVAILABLE' | 'NON_COMPARABLE' | 'UNAVAILABLE';
  forecastStatus: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
  sourcesChecked: string[];
  message: string;
  suggestedAction?: string;
  latestDate?: string;
  demandDate?: string;
  supplyDate?: string;
  workerSupplyDate?: string;
  trainingDate?: string;
}

export interface PlanningDataResult {
  state: string;
  district: string;
  skill: string;
  demandStatus: 'AVAILABLE' | 'UNAVAILABLE';
  demandCount?: number;
  demandPeriod?: string;
  demandDate?: string;
  workerSupplyStatus: 'AVAILABLE' | 'UNAVAILABLE';
  workerSupplyCount?: number;
  workerSupplyPeriod?: string;
  workerSupplyDate?: string;
  trainingStatus: 'AVAILABLE' | 'UNAVAILABLE';
  trainingCapacity?: number;
  activeCenters?: number;
  placedCount?: number;
  trainingPeriod?: string;
  trainingDate?: string;
  isComparable: boolean;
  incomparabilityReason?: string;
  potentialGap?: number;
  effectiveSupply?: number;
  planningSignal: 'POTENTIAL_SHORTAGE' | 'BALANCED' | 'INSUFFICIENT_DATA';
  planningAdvisory: string;
  latestAvailableDate: string;
  trainingNotice?: string;
  dataQualityLevel: QualityLevel;
  geography_level?: GeographyLevel;
}

export type GeographyLevel = 'STATE' | 'DISTRICT';

export type WorkerPopulationScope =
  | 'UNORGANISED_WORKFORCE'
  | 'FORMAL_JOBSEEKERS'
  | 'ACCREDITED_TRAINEES'
  | 'TOTAL_EMPLOYED'
  | 'DEVELOPMENT_SAMPLE';

export type DatasetVerificationStatus =
  | 'VERIFIED_INGESTED'
  | 'VERIFIED_SOURCE_PENDING_INGESTION'
  | 'PARTIALLY_VERIFIED'
  | 'REQUIRES_VERIFICATION'
  | 'UNAVAILABLE';

export interface RecordProvenance {
  source_name: string;
  dataset_name: string;
  resource_name?: string;
  source_period: string;
  geography_level: GeographyLevel;
  source_identifier?: string;
  verification_status: 'VERIFIED_INGESTED' | 'REQUIRES_VERIFICATION' | 'UNVERIFIED';
  ingestion_date: string;
  is_forecast: boolean;
  notes?: string;
}

export interface DataSource {
  id: string;
  name: string;
  organization: string;
  url: string;
  downloadUrl?: string;
  accessDate: string;
  columnsUsed: string[];
  type: SourceType;
  systemRole: string;
  license: string;
  description: string;
  coverage: string;
  status: DatasetVerificationStatus;
  recordCount: number;
  lastAudited?: string;
}

export interface SkillMapping {
  id: string;
  rawSkill: string;
  normalizedSkill: string;
  sector: string;
  source: string;
  confidence: number; // 0 to 1
  isVerified: boolean;
}

export interface DemandRecord {
  id: string;
  period: string; // e.g. "2024-Q3"
  year: number;
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  state: string;
  district: string;
  state_id?: string;
  district_id?: string;
  lgd_district_code?: number;
  geography_level?: GeographyLevel;
  sector: string;
  jobRole: string;
  normalizedSkill: string;
  demandCount: number;
  averageSalaryMin?: number;
  averageSalaryMax?: number;
  source: string;
  is_forecast?: boolean;
  provenance?: RecordProvenance;
}

export interface SupplyWorkerRecord {
  id: string;
  period: string;
  state: string;
  district: string;
  state_id?: string;
  district_id?: string;
  lgd_state_code?: number;
  lgd_district_code?: number;
  geography_level?: GeographyLevel;
  population_scope?: WorkerPopulationScope;
  sector: string;
  normalizedSkill: string;
  workerCount: number;
  source: string;
  provenance?: RecordProvenance;
}

export interface TrainingRecord {
  id: string;
  period: string;
  state: string;
  district: string;
  state_id?: string;
  district_id?: string;
  lgd_state_code?: number;
  lgd_district_code?: number;
  geography_level?: GeographyLevel;
  sector: string;
  courseName: string;
  normalizedSkill: string;
  enrolledCount?: number | null;
  trainedCount?: number | null;
  certifiedCount?: number | null;
  placedCount?: number | null;
  annualCapacity?: number | null;
  activeCenters?: number | null;
  scheme: string;
  source: string;
  provenance?: RecordProvenance;
}

export interface LocationGeo {
  state: string;
  district: string;
  lat: number;
  lng: number;
  industrialZone: string;
  hasDemandData: boolean;
  hasSupplyData: boolean;
  hasTrainingData: boolean;
}

export type GapClassification = 'SHORTAGE' | 'BALANCED' | 'OVERSUPPLY' | 'NON_COMPARABLE';
export type QualityLevel = 'High' | 'Medium' | 'Low' | 'Unavailable';

export interface SkillGapAnalysis {
  normalizedSkill: string;
  sector: string;
  state: string;
  district: string;
  period: string;
  demand: number;
  workerSupply: number | null;
  trainingOutput: number | null;
  trainingCapacity: number | null;
  effectiveSupply: number | null;
  gap: number | null;
  gapPercentage: number | null;
  classification: GapClassification;
  isComparable: boolean;
  incomparabilityReason?: string;
  geography_level?: GeographyLevel;
  dataQuality: {
    level: QualityLevel;
    reason: string;
  };
}

export interface ForecastPoint {
  period: string;
  demand?: number;
  predictedDemand?: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface ForecastResult {
  normalizedSkill: string;
  state: string;
  district: string;
  historicalData: { period: string; demand: number }[];
  forecastData: { period: string; predictedDemand: number; lowerBound: number; upperBound: number }[];
  modelUsed: string;
  horizon: string;
  trainingPeriod: string;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
  };
  explanation: string;
  technicalDetails: {
    slope: number;
    intercept: number;
    sampleSize: number;
    confidenceInterval: number;
  };
  isAvailable: boolean;
  reason?: string;
  dataQuality: {
    level: QualityLevel;
    reason: string;
  };
}

export interface TrainingRecommendation {
  normalizedSkill: string;
  sector: string;
  state: string;
  district: string;
  projectedDemand: number;
  estimatedAvailableSupply: number;
  potentialGap: number;
  currentTrainingCapacity: number;
  activeCenters: number;
  suggestedAdditionalCapacityRange: [number, number];
  confidence: QualityLevel;
  recommendationText: string;
  justification: string[];
}

export interface PriorityWeights {
  demandGrowth: number;
  projectedGap: number;
  currentShortage: number;
  trainingAvailability: number;
}

export interface SkillPriority {
  normalizedSkill: string;
  sector: string;
  state: string;
  district: string;
  demandScore: number;
  demandGrowthScore: number;
  gapScore: number;
  trainingConstraintScore: number;
  compositeScore: number;
  rank: number;
  classification: GapClassification;
  demandCount?: number;
  demandPeriod?: string;
  demandTrend?: string;
  workerSupply?: number | null;
  trainingCapacity?: number | null;
  activeCenters?: number;
  potentialGap?: number | null;
  demandBadge?: string;
  workforceBadge?: string;
  trainingBadge?: string;
  priorityReason?: string;
}

