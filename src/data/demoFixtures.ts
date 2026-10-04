import { SupplyWorkerRecord, TrainingRecord } from '../types';

/**
 * ============================================================================
 * UNVERIFIED DEMONSTRATION / TEST FIXTURES
 * ============================================================================
 * WARNING: These records are historical test fixtures created for UI prototyping.
 * They are NOT verified official government data and must NOT be returned in
 * production user-facing labour-market flows without empirical source verification.
 * ============================================================================
 */

export const DEMO_SUPPLY_WORKER_RECORDS: SupplyWorkerRecord[] = [
  { id: 'sw-hyd-py', period: '2026-Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', normalizedSkill: 'Python Development', workerCount: 2450, source: 'Demo Fixture' },
  { id: 'sw-hyd-genai', period: '2026-Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', normalizedSkill: 'Generative AI & LLM Systems Engineering', workerCount: 680, source: 'Demo Fixture' },
  { id: 'sw-hyd-react', period: '2026-Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', normalizedSkill: 'React & Frontend Engineering', workerCount: 2150, source: 'Demo Fixture' },
  { id: 'sw-hyd-vlsi', period: '2026-Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', normalizedSkill: 'VLSI & Semiconductor Physical Design', workerCount: 420, source: 'Demo Fixture' },
  { id: 'sw-hyd-ev', period: '2026-Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Automotive & EV Technology', normalizedSkill: 'EV Powertrain & Battery Diagnostics', workerCount: 390, source: 'Demo Fixture' },
  { id: 'sw-hyd-solar', period: '2026-Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Renewable Energy & Green Jobs', normalizedSkill: 'Solar PV Installation & Grid Integration', workerCount: 780, source: 'Demo Fixture' },
  { id: 'sw-hyd-clin', period: '2026-Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Healthcare & Allied Medical Sciences', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', workerCount: 620, source: 'Demo Fixture' },
  { id: 'sw-blr-py', period: '2026-Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', normalizedSkill: 'Python Development', workerCount: 4850, source: 'Demo Fixture' },
  { id: 'sw-blr-genai', period: '2026-Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Artificial Intelligence, Data & Cloud Computing', normalizedSkill: 'Generative AI & LLM Systems Engineering', workerCount: 1420, source: 'Demo Fixture' },
  { id: 'sw-blr-vlsi', period: '2026-Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Electronics & Semiconductor Manufacturing', normalizedSkill: 'VLSI & Semiconductor Physical Design', workerCount: 1150, source: 'Demo Fixture' },
  { id: 'sw-pun-ev', period: '2026-Q3', state: 'Maharashtra', district: 'Pune', sector: 'Automotive & EV Technology', normalizedSkill: 'EV Powertrain & Battery Diagnostics', workerCount: 780, source: 'Demo Fixture' },
  { id: 'sw-pun-cnc', period: '2026-Q3', state: 'Maharashtra', district: 'Pune', sector: 'Manufacturing & Capital Goods', normalizedSkill: 'CNC Precision Machining & Programming', workerCount: 1720, source: 'Demo Fixture' },
  { id: 'sw-chn-ev', period: '2026-Q3', state: 'Tamil Nadu', district: 'Chennai', sector: 'Automotive & EV Technology', normalizedSkill: 'EV Powertrain & Battery Diagnostics', workerCount: 710, source: 'Demo Fixture' },
  { id: 'sw-chn-smt', period: '2026-Q3', state: 'Tamil Nadu', district: 'Chennai', sector: 'Electronics & Semiconductor Manufacturing', normalizedSkill: 'SMT Electronic Assembly & Inspection', workerCount: 1240, source: 'Demo Fixture' },
  { id: 'sw-chn-clin', period: '2026-Q3', state: 'Tamil Nadu', district: 'Chennai', sector: 'Healthcare & Allied Medical Sciences', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', workerCount: 740, source: 'Demo Fixture' },
  { id: 'sw-amd-solar', period: '2026-Q3', state: 'Gujarat', district: 'Ahmedabad', sector: 'Renewable Energy & Green Jobs', normalizedSkill: 'Solar PV Installation & Grid Integration', workerCount: 1280, source: 'Demo Fixture' },
  { id: 'sw-del-cyber', period: '2026-Q3', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', normalizedSkill: 'Cybersecurity & Threat Detection', workerCount: 890, source: 'Demo Fixture' },
  { id: 'sw-del-csec', period: '2026-Q3', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', normalizedSkill: 'Cloud Security & DevSecOps', workerCount: 460, source: 'Demo Fixture' },
  { id: 'sw-viz-clin', period: '2026-Q3', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Healthcare & Allied Medical Sciences', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', workerCount: 480, source: 'Demo Fixture' },
  { id: 'sw-noida-py', period: '2026-Q3', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Information Technology & Software (IT-ITeS)', normalizedSkill: 'Python Development', workerCount: 2100, source: 'Demo Fixture' },
  { id: 'sw-noida-genai', period: '2026-Q3', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Artificial Intelligence, Data & Cloud Computing', normalizedSkill: 'Generative AI & LLM Systems Engineering', workerCount: 520, source: 'Demo Fixture' }
];

export const DEMO_TRAINING_RECORDS: TrainingRecord[] = [
  {
    id: 'tr-hyd-py',
    period: '2026-Q3',
    state: 'Telangana',
    district: 'Hyderabad',
    sector: 'Information Technology & Software (IT-ITeS)',
    courseName: 'Certificate Program in Advanced Python & Cloud Development',
    normalizedSkill: 'Python Development',
    enrolledCount: 1150,
    trainedCount: 1040,
    certifiedCount: 960,
    placedCount: 780,
    annualCapacity: 1600,
    activeCenters: 7,
    scheme: 'Demo Course',
    source: 'Demo Fixture'
  },
  {
    id: 'tr-hyd-genai',
    period: '2026-Q3',
    state: 'Telangana',
    district: 'Hyderabad',
    sector: 'Artificial Intelligence, Data & Cloud Computing',
    courseName: 'Generative AI & LLM Systems Specialization',
    normalizedSkill: 'Generative AI & LLM Systems Engineering',
    enrolledCount: 480,
    trainedCount: 420,
    certifiedCount: 380,
    placedCount: 340,
    annualCapacity: 600,
    activeCenters: 3,
    scheme: 'Demo Course',
    source: 'Demo Fixture'
  }
];
