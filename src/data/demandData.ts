import { DemandRecord } from '../types';

/**
 * ============================================================================
 * SKILLPULSE LABOUR DEMAND DATA LAYER (DEVELOPMENT & TESTING)
 * ============================================================================
 * PROVENANCE & VALIDATION AUDIT NOTICE:
 * - These 101 demand records remain temporarily for development and testing
 *   purposes (to support the Telangana -> Hyderabad baseline and 7 urban hubs).
 * - They are NOT to be cited as "verified official filings" or "national coverage"
 *   until their line-by-line provenance is formally audited against primary
 *   official source documents.
 * - Periods from 2025 onwards are explicitly tagged with `is_forecast: true`.
 * ============================================================================
 */

const RAW_DEMAND_FIXTURES: Omit<DemandRecord, 'geography_level' | 'is_forecast' | 'provenance'>[] = [
  // =========================================================================
  // 1. TELANGANA / HYDERABAD
  // =========================================================================

  // Python Development (Time series 2023-Q1 through 2026-Q3)
  { id: 'd-hyd-py-23q1', period: '2023-Q1', year: 2023, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 1420, averageSalaryMin: 6.5, averageSalaryMax: 14.0, source: 'National Career Service' },
  { id: 'd-hyd-py-23q2', period: '2023-Q2', year: 2023, quarter: 'Q2', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 1530, averageSalaryMin: 6.8, averageSalaryMax: 14.5, source: 'National Career Service' },
  { id: 'd-hyd-py-23q3', period: '2023-Q3', year: 2023, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 1680, averageSalaryMin: 7.0, averageSalaryMax: 15.0, source: 'National Career Service' },
  { id: 'd-hyd-py-23q4', period: '2023-Q4', year: 2023, quarter: 'Q4', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 1790, averageSalaryMin: 7.2, averageSalaryMax: 15.2, source: 'National Career Service' },
  { id: 'd-hyd-py-24q1', period: '2024-Q1', year: 2024, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 1910, averageSalaryMin: 7.5, averageSalaryMax: 16.0, source: 'National Career Service' },
  { id: 'd-hyd-py-24q2', period: '2024-Q2', year: 2024, quarter: 'Q2', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 2080, averageSalaryMin: 7.8, averageSalaryMax: 16.5, source: 'National Career Service' },
  { id: 'd-hyd-py-24q3', period: '2024-Q3', year: 2024, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 2240, averageSalaryMin: 8.0, averageSalaryMax: 17.0, source: 'National Career Service' },
  { id: 'd-hyd-py-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 2390, averageSalaryMin: 8.2, averageSalaryMax: 17.5, source: 'National Career Service' },
  { id: 'd-hyd-py-25q1', period: '2025-Q1', year: 2025, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 2540, averageSalaryMin: 8.5, averageSalaryMax: 18.0, source: 'National Career Service' },
  { id: 'd-hyd-py-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 2680, averageSalaryMin: 8.8, averageSalaryMax: 18.5, source: 'National Career Service' },
  { id: 'd-hyd-py-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 2810, averageSalaryMin: 9.0, averageSalaryMax: 19.0, source: 'National Career Service' },
  { id: 'd-hyd-py-25q4', period: '2025-Q4', year: 2025, quarter: 'Q4', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 2950, averageSalaryMin: 9.2, averageSalaryMax: 19.5, source: 'National Career Service' },
  { id: 'd-hyd-py-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 3100, averageSalaryMin: 9.5, averageSalaryMax: 20.0, source: 'National Career Service' },
  { id: 'd-hyd-py-26q2', period: '2026-Q2', year: 2026, quarter: 'Q2', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 3240, averageSalaryMin: 9.8, averageSalaryMax: 20.5, source: 'National Career Service' },
  { id: 'd-hyd-py-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Engineer', normalizedSkill: 'Python Development', demandCount: 3380, averageSalaryMin: 10.0, averageSalaryMax: 21.0, source: 'National Career Service' },

  // Generative AI & LLM Systems (Hyderabad - Rapid 2025-2026 Rise)
  { id: 'd-hyd-genai-25q1', period: '2025-Q1', year: 2025, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'Generative AI Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 420, averageSalaryMin: 12.0, averageSalaryMax: 26.0, source: 'National Career Service' },
  { id: 'd-hyd-genai-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'Generative AI Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 650, averageSalaryMin: 13.0, averageSalaryMax: 28.0, source: 'National Career Service' },
  { id: 'd-hyd-genai-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'Generative AI Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 910, averageSalaryMin: 14.0, averageSalaryMax: 30.0, source: 'National Career Service' },
  { id: 'd-hyd-genai-25q4', period: '2025-Q4', year: 2025, quarter: 'Q4', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'Generative AI Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 1180, averageSalaryMin: 14.5, averageSalaryMax: 31.0, source: 'National Career Service' },
  { id: 'd-hyd-genai-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'Generative AI Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 1450, averageSalaryMin: 15.0, averageSalaryMax: 32.5, source: 'National Career Service' },
  { id: 'd-hyd-genai-26q2', period: '2026-Q2', year: 2026, quarter: 'Q2', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'Generative AI Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 1720, averageSalaryMin: 15.5, averageSalaryMax: 34.0, source: 'National Career Service' },
  { id: 'd-hyd-genai-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'Generative AI Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 1980, averageSalaryMin: 16.0, averageSalaryMax: 35.0, source: 'National Career Service' },

  // VLSI & Semiconductor Physical Design (Hyderabad)
  { id: 'd-hyd-vlsi-24q1', period: '2024-Q1', year: 2024, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 560, averageSalaryMin: 10.0, averageSalaryMax: 24.5, source: 'National Career Service' },
  { id: 'd-hyd-vlsi-24q3', period: '2024-Q3', year: 2024, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 710, averageSalaryMin: 11.0, averageSalaryMax: 26.0, source: 'National Career Service' },
  { id: 'd-hyd-vlsi-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 820, averageSalaryMin: 11.5, averageSalaryMax: 27.0, source: 'National Career Service' },
  { id: 'd-hyd-vlsi-25q1', period: '2025-Q1', year: 2025, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 940, averageSalaryMin: 12.0, averageSalaryMax: 28.0, source: 'National Career Service' },
  { id: 'd-hyd-vlsi-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 1120, averageSalaryMin: 12.5, averageSalaryMax: 29.5, source: 'National Career Service' },
  { id: 'd-hyd-vlsi-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 1310, averageSalaryMin: 13.0, averageSalaryMax: 31.0, source: 'National Career Service' },
  { id: 'd-hyd-vlsi-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 1480, averageSalaryMin: 13.5, averageSalaryMax: 32.5, source: 'National Career Service' },

  // Healthcare (Hyderabad - Genome Valley & Hospitals)
  { id: 'd-hyd-clin-25q1', period: '2025-Q1', year: 2025, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Diagnostic Medical Lab Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 620, averageSalaryMin: 3.5, averageSalaryMax: 6.8, source: 'National Career Service' },
  { id: 'd-hyd-clin-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Diagnostic Medical Lab Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 740, averageSalaryMin: 3.6, averageSalaryMax: 7.0, source: 'National Career Service' },
  { id: 'd-hyd-clin-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Diagnostic Medical Lab Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 890, averageSalaryMin: 3.8, averageSalaryMax: 7.4, source: 'National Career Service' },
  { id: 'd-hyd-clin-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Diagnostic Medical Lab Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 980, averageSalaryMin: 4.0, averageSalaryMax: 7.8, source: 'National Career Service' },

  // Renewable Energy (Hyderabad / Telangana)
  { id: 'd-hyd-solar-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Telangana', district: 'Hyderabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Installation Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 640, averageSalaryMin: 3.5, averageSalaryMax: 6.5, source: 'National Career Service' },
  { id: 'd-hyd-solar-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Telangana', district: 'Hyderabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Installation Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 780, averageSalaryMin: 3.8, averageSalaryMax: 7.0, source: 'National Career Service' },
  { id: 'd-hyd-solar-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Telangana', district: 'Hyderabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Installation Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 940, averageSalaryMin: 4.0, averageSalaryMax: 7.5, source: 'National Career Service' },
  { id: 'd-hyd-solar-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Telangana', district: 'Hyderabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Installation Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 1090, averageSalaryMin: 4.2, averageSalaryMax: 8.0, source: 'National Career Service' },

  // =========================================================================
  // 2. KARNATAKA / BENGALURU URBAN
  // =========================================================================

  // Python Development (Bengaluru Urban 2023 through 2026)
  { id: 'd-blr-py-23q1', period: '2023-Q1', year: 2023, quarter: 'Q1', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 2850, averageSalaryMin: 8.0, averageSalaryMax: 18.0, source: 'National Career Service' },
  { id: 'd-blr-py-23q3', period: '2023-Q3', year: 2023, quarter: 'Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 3240, averageSalaryMin: 8.5, averageSalaryMax: 19.0, source: 'National Career Service' },
  { id: 'd-blr-py-24q1', period: '2024-Q1', year: 2024, quarter: 'Q1', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 3650, averageSalaryMin: 9.0, averageSalaryMax: 20.0, source: 'National Career Service' },
  { id: 'd-blr-py-24q3', period: '2024-Q3', year: 2024, quarter: 'Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 4120, averageSalaryMin: 9.5, averageSalaryMax: 21.0, source: 'National Career Service' },
  { id: 'd-blr-py-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 4360, averageSalaryMin: 9.8, averageSalaryMax: 21.5, source: 'National Career Service' },
  { id: 'd-blr-py-25q1', period: '2025-Q1', year: 2025, quarter: 'Q1', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 4610, averageSalaryMin: 10.0, averageSalaryMax: 22.0, source: 'National Career Service' },
  { id: 'd-blr-py-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 4890, averageSalaryMin: 10.5, averageSalaryMax: 23.0, source: 'National Career Service' },
  { id: 'd-blr-py-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 5180, averageSalaryMin: 11.0, averageSalaryMax: 24.0, source: 'National Career Service' },
  { id: 'd-blr-py-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Backend Engineer', normalizedSkill: 'Python Development', demandCount: 5460, averageSalaryMin: 11.5, averageSalaryMax: 25.0, source: 'National Career Service' },

  // Generative AI & MLOps (Bengaluru Urban 2025-2026)
  { id: 'd-blr-genai-25q1', period: '2025-Q1', year: 2025, quarter: 'Q1', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'AI Model Architect', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 950, averageSalaryMin: 16.0, averageSalaryMax: 35.0, source: 'National Career Service' },
  { id: 'd-blr-genai-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'AI Model Architect', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 1680, averageSalaryMin: 18.0, averageSalaryMax: 38.0, source: 'National Career Service' },
  { id: 'd-blr-genai-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'AI Model Architect', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 2450, averageSalaryMin: 19.5, averageSalaryMax: 42.0, source: 'National Career Service' },
  { id: 'd-blr-genai-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'AI Model Architect', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 3120, averageSalaryMin: 20.0, averageSalaryMax: 45.0, source: 'National Career Service' },

  // VLSI Physical Design (Bengaluru Urban)
  { id: 'd-blr-vlsi-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'VLSI Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 1850, averageSalaryMin: 13.5, averageSalaryMax: 34.0, source: 'National Career Service' },
  { id: 'd-blr-vlsi-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'VLSI Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 2210, averageSalaryMin: 14.5, averageSalaryMax: 36.0, source: 'National Career Service' },
  { id: 'd-blr-vlsi-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'VLSI Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 2580, averageSalaryMin: 15.0, averageSalaryMax: 38.0, source: 'National Career Service' },
  { id: 'd-blr-vlsi-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Karnataka', district: 'Bengaluru Urban', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'VLSI Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', demandCount: 2890, averageSalaryMin: 16.0, averageSalaryMax: 40.0, source: 'National Career Service' },

  // =========================================================================
  // 3. MAHARASHTRA / PUNE
  // =========================================================================

  // EV Powertrain & Battery Diagnostics (Pune - Auto hub)
  { id: 'd-pun-ev-24q1', period: '2024-Q1', year: 2024, quarter: 'Q1', state: 'Maharashtra', district: 'Pune', sector: 'Automotive & EV Technology', jobRole: 'EV Systems Engineer', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 810, averageSalaryMin: 5.0, averageSalaryMax: 10.5, source: 'National Career Service' },
  { id: 'd-pun-ev-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Maharashtra', district: 'Pune', sector: 'Automotive & EV Technology', jobRole: 'EV Systems Engineer', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 1250, averageSalaryMin: 5.6, averageSalaryMax: 11.8, source: 'National Career Service' },
  { id: 'd-pun-ev-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Maharashtra', district: 'Pune', sector: 'Automotive & EV Technology', jobRole: 'EV Systems Engineer', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 1560, averageSalaryMin: 6.2, averageSalaryMax: 13.0, source: 'National Career Service' },
  { id: 'd-pun-ev-25q4', period: '2025-Q4', year: 2025, quarter: 'Q4', state: 'Maharashtra', district: 'Pune', sector: 'Automotive & EV Technology', jobRole: 'EV Systems Engineer', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 1820, averageSalaryMin: 6.8, averageSalaryMax: 14.0, source: 'National Career Service' },
  { id: 'd-pun-ev-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Maharashtra', district: 'Pune', sector: 'Automotive & EV Technology', jobRole: 'EV Systems Engineer', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 2040, averageSalaryMin: 7.2, averageSalaryMax: 14.8, source: 'National Career Service' },
  { id: 'd-pun-ev-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Maharashtra', district: 'Pune', sector: 'Automotive & EV Technology', jobRole: 'EV Systems Engineer', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 2280, averageSalaryMin: 7.5, averageSalaryMax: 15.5, source: 'National Career Service' },

  // Manufacturing & CNC Machining (Pune)
  { id: 'd-pun-cnc-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Maharashtra', district: 'Pune', sector: 'Manufacturing & Capital Goods', jobRole: 'CNC Machinist & Programmer', normalizedSkill: 'CNC Precision Machining & Programming', demandCount: 1040, averageSalaryMin: 3.2, averageSalaryMax: 6.2, source: 'National Career Service' },
  { id: 'd-pun-cnc-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Maharashtra', district: 'Pune', sector: 'Manufacturing & Capital Goods', jobRole: 'CNC Machinist & Programmer', normalizedSkill: 'CNC Precision Machining & Programming', demandCount: 1190, averageSalaryMin: 3.5, averageSalaryMax: 6.8, source: 'National Career Service' },
  { id: 'd-pun-cnc-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Maharashtra', district: 'Pune', sector: 'Manufacturing & Capital Goods', jobRole: 'CNC Machinist & Programmer', normalizedSkill: 'CNC Precision Machining & Programming', demandCount: 1350, averageSalaryMin: 3.8, averageSalaryMax: 7.2, source: 'National Career Service' },
  { id: 'd-pun-cnc-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Maharashtra', district: 'Pune', sector: 'Manufacturing & Capital Goods', jobRole: 'CNC Machinist & Programmer', normalizedSkill: 'CNC Precision Machining & Programming', demandCount: 1490, averageSalaryMin: 4.0, averageSalaryMax: 7.6, source: 'National Career Service' },

  // =========================================================================
  // 4. TAMIL NADU / CHENNAI
  // =========================================================================

  // EV Powertrain & Battery Diagnostics (Chennai)
  { id: 'd-chn-ev-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Tamil Nadu', district: 'Chennai', sector: 'Automotive & EV Technology', jobRole: 'EV Powertrain Specialist', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 1120, averageSalaryMin: 5.5, averageSalaryMax: 11.0, source: 'National Career Service' },
  { id: 'd-chn-ev-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Tamil Nadu', district: 'Chennai', sector: 'Automotive & EV Technology', jobRole: 'EV Powertrain Specialist', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 1440, averageSalaryMin: 6.0, averageSalaryMax: 12.2, source: 'National Career Service' },
  { id: 'd-chn-ev-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Tamil Nadu', district: 'Chennai', sector: 'Automotive & EV Technology', jobRole: 'EV Powertrain Specialist', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 1720, averageSalaryMin: 6.5, averageSalaryMax: 13.5, source: 'National Career Service' },
  { id: 'd-chn-ev-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Tamil Nadu', district: 'Chennai', sector: 'Automotive & EV Technology', jobRole: 'EV Powertrain Specialist', normalizedSkill: 'EV Powertrain & Battery Diagnostics', demandCount: 1960, averageSalaryMin: 7.0, averageSalaryMax: 14.5, source: 'National Career Service' },

  // SMT Electronic Assembly & Inspection (Chennai)
  { id: 'd-chn-smt-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Tamil Nadu', district: 'Chennai', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'SMT Line Specialist', normalizedSkill: 'SMT Electronic Assembly & Inspection', demandCount: 1180, averageSalaryMin: 3.2, averageSalaryMax: 5.8, source: 'National Career Service' },
  { id: 'd-chn-smt-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Tamil Nadu', district: 'Chennai', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'SMT Line Specialist', normalizedSkill: 'SMT Electronic Assembly & Inspection', demandCount: 1460, averageSalaryMin: 3.5, averageSalaryMax: 6.2, source: 'National Career Service' },
  { id: 'd-chn-smt-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Tamil Nadu', district: 'Chennai', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'SMT Line Specialist', normalizedSkill: 'SMT Electronic Assembly & Inspection', demandCount: 1780, averageSalaryMin: 3.8, averageSalaryMax: 6.8, source: 'National Career Service' },
  { id: 'd-chn-smt-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Tamil Nadu', district: 'Chennai', sector: 'Electronics & Semiconductor Manufacturing', jobRole: 'SMT Line Specialist', normalizedSkill: 'SMT Electronic Assembly & Inspection', demandCount: 2050, averageSalaryMin: 4.0, averageSalaryMax: 7.2, source: 'National Career Service' },

  // Healthcare (Chennai - Medical Tourism Hub)
  { id: 'd-chn-clin-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Tamil Nadu', district: 'Chennai', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Clinical Diagnostics Specialist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 790, averageSalaryMin: 3.8, averageSalaryMax: 7.2, source: 'National Career Service' },
  { id: 'd-chn-clin-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Tamil Nadu', district: 'Chennai', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Clinical Diagnostics Specialist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 960, averageSalaryMin: 4.2, averageSalaryMax: 7.8, source: 'National Career Service' },
  { id: 'd-chn-clin-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Tamil Nadu', district: 'Chennai', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Clinical Diagnostics Specialist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 1120, averageSalaryMin: 4.5, averageSalaryMax: 8.2, source: 'National Career Service' },

  // =========================================================================
  // 5. GUJARAT / AHMEDABAD
  // =========================================================================

  // Solar PV Installation & Grid Integration (Ahmedabad)
  { id: 'd-amd-solar-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Gujarat', district: 'Ahmedabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Plant Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 1040, averageSalaryMin: 4.0, averageSalaryMax: 7.8, source: 'National Career Service' },
  { id: 'd-amd-solar-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Gujarat', district: 'Ahmedabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Plant Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 1290, averageSalaryMin: 4.3, averageSalaryMax: 8.5, source: 'National Career Service' },
  { id: 'd-amd-solar-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Gujarat', district: 'Ahmedabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Plant Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 1560, averageSalaryMin: 4.6, averageSalaryMax: 9.0, source: 'National Career Service' },
  { id: 'd-amd-solar-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Gujarat', district: 'Ahmedabad', sector: 'Renewable Energy & Green Jobs', jobRole: 'Solar Plant Engineer', normalizedSkill: 'Solar PV Installation & Grid Integration', demandCount: 1810, averageSalaryMin: 4.8, averageSalaryMax: 9.5, source: 'National Career Service' },

  // =========================================================================
  // 6. DELHI NCR / CENTRAL DELHI & GURUGRAM
  // =========================================================================

  // Cybersecurity & Threat Detection (Delhi)
  { id: 'd-del-cyber-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', jobRole: 'Cyber Threat Analyst', normalizedSkill: 'Cybersecurity & Threat Detection', demandCount: 1080, averageSalaryMin: 10.8, averageSalaryMax: 23.5, source: 'National Career Service' },
  { id: 'd-del-cyber-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', jobRole: 'Cyber Threat Analyst', normalizedSkill: 'Cybersecurity & Threat Detection', demandCount: 1340, averageSalaryMin: 11.5, averageSalaryMax: 25.0, source: 'National Career Service' },
  { id: 'd-del-cyber-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', jobRole: 'Cyber Threat Analyst', normalizedSkill: 'Cybersecurity & Threat Detection', demandCount: 1610, averageSalaryMin: 12.2, averageSalaryMax: 26.5, source: 'National Career Service' },
  { id: 'd-del-cyber-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', jobRole: 'Cyber Threat Analyst', normalizedSkill: 'Cybersecurity & Threat Detection', demandCount: 1880, averageSalaryMin: 12.8, averageSalaryMax: 28.0, source: 'National Career Service' },

  // Cloud Security & DevSecOps (Delhi)
  { id: 'd-del-csec-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', jobRole: 'Cloud Security Architect', normalizedSkill: 'Cloud Security & DevSecOps', demandCount: 520, averageSalaryMin: 14.0, averageSalaryMax: 30.0, source: 'National Career Service' },
  { id: 'd-del-csec-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', jobRole: 'Cloud Security Architect', normalizedSkill: 'Cloud Security & DevSecOps', demandCount: 840, averageSalaryMin: 15.5, averageSalaryMax: 33.0, source: 'National Career Service' },
  { id: 'd-del-csec-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Delhi', district: 'Central Delhi', sector: 'Cybersecurity & Information Assurance', jobRole: 'Cloud Security Architect', normalizedSkill: 'Cloud Security & DevSecOps', demandCount: 1150, averageSalaryMin: 16.5, averageSalaryMax: 35.0, source: 'National Career Service' },

  // =========================================================================
  // 7. ANDHRA PRADESH / VISAKHAPATNAM
  // =========================================================================

  // Clinical Laboratory Diagnostic Technology (Visakhapatnam)
  { id: 'd-viz-clin-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Clinical Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 390, averageSalaryMin: 3.2, averageSalaryMax: 6.0, source: 'National Career Service' },
  { id: 'd-viz-clin-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Clinical Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 480, averageSalaryMin: 3.5, averageSalaryMax: 6.5, source: 'National Career Service' },
  { id: 'd-viz-clin-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Clinical Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 590, averageSalaryMin: 3.8, averageSalaryMax: 7.0, source: 'National Career Service' },
  { id: 'd-viz-clin-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Healthcare & Allied Medical Sciences', jobRole: 'Clinical Technologist', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', demandCount: 680, averageSalaryMin: 4.0, averageSalaryMax: 7.4, source: 'National Career Service' },

  // Construction & Infrastructure (Visakhapatnam)
  { id: 'd-viz-pre-24q4', period: '2024-Q4', year: 2024, quarter: 'Q4', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Construction & Infrastructure Engineering', jobRole: 'Precast Engineer', normalizedSkill: 'Precast Concrete Engineering & Quality', demandCount: 160, averageSalaryMin: 3.0, averageSalaryMax: 5.2, source: 'National Career Service' },
  { id: 'd-viz-pre-25q2', period: '2025-Q2', year: 2025, quarter: 'Q2', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Construction & Infrastructure Engineering', jobRole: 'Precast Engineer', normalizedSkill: 'Precast Concrete Engineering & Quality', demandCount: 220, averageSalaryMin: 3.4, averageSalaryMax: 5.8, source: 'National Career Service' },
  { id: 'd-viz-pre-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Construction & Infrastructure Engineering', jobRole: 'Precast Engineer', normalizedSkill: 'Precast Concrete Engineering & Quality', demandCount: 290, averageSalaryMin: 3.6, averageSalaryMax: 6.2, source: 'National Career Service' },
  { id: 'd-viz-pre-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Andhra Pradesh', district: 'Visakhapatnam', sector: 'Construction & Infrastructure Engineering', jobRole: 'Precast Engineer', normalizedSkill: 'Precast Concrete Engineering & Quality', demandCount: 350, averageSalaryMin: 3.8, averageSalaryMax: 6.5, source: 'National Career Service' },

  // =========================================================================
  // 8. UTTAR PRADESH / GAUTAM BUDDHA NAGAR (NOIDA)
  // =========================================================================

  // IT & AI (Noida - UP)
  { id: 'd-noida-py-25q1', period: '2025-Q1', year: 2025, quarter: 'Q1', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Developer', normalizedSkill: 'Python Development', demandCount: 1840, averageSalaryMin: 7.0, averageSalaryMax: 15.0, source: 'National Career Service' },
  { id: 'd-noida-py-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Developer', normalizedSkill: 'Python Development', demandCount: 2110, averageSalaryMin: 7.5, averageSalaryMax: 16.0, source: 'National Career Service' },
  { id: 'd-noida-py-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Developer', normalizedSkill: 'Python Development', demandCount: 2390, averageSalaryMin: 8.0, averageSalaryMax: 17.0, source: 'National Career Service' },
  { id: 'd-noida-py-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Information Technology & Software (IT-ITeS)', jobRole: 'Software Developer', normalizedSkill: 'Python Development', demandCount: 2650, averageSalaryMin: 8.5, averageSalaryMax: 18.0, source: 'National Career Service' },

  // Generative AI (Noida)
  { id: 'd-noida-genai-25q3', period: '2025-Q3', year: 2025, quarter: 'Q3', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'AI Application Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 680, averageSalaryMin: 13.0, averageSalaryMax: 28.0, source: 'National Career Service' },
  { id: 'd-noida-genai-26q1', period: '2026-Q1', year: 2026, quarter: 'Q1', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'AI Application Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 1120, averageSalaryMin: 14.5, averageSalaryMax: 31.0, source: 'National Career Service' },
  { id: 'd-noida-genai-26q3', period: '2026-Q3', year: 2026, quarter: 'Q3', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', sector: 'Artificial Intelligence, Data & Cloud Computing', jobRole: 'AI Application Engineer', normalizedSkill: 'Generative AI & LLM Systems Engineering', demandCount: 1540, averageSalaryMin: 15.0, averageSalaryMax: 33.0, source: 'National Career Service' }
];

export const DEMAND_RECORDS: DemandRecord[] = RAW_DEMAND_FIXTURES.map(rec => ({
  ...rec,
  geography_level: 'DISTRICT',
  is_forecast: rec.year >= 2025,
  provenance: {
    source_name: 'National Career Service (Reported/Pending Audit)',
    source_url: 'https://www.ncs.gov.in/',
    access_date: '2026-10-04',
    dataset_name: 'Industrial Demand Fixture (Development/Testing)',
    source_period: rec.period,
    geography_level: 'DISTRICT',
    verification_status: 'REQUIRES_VERIFICATION',
    labour_definition: 'Reported formal vacancies and active hiring indicators in corporate and tech sectors',
    is_development_fixture: true,
    limitations: [
      'Development & testing fixture; not supported by raw source files in repository',
      'Extrapolated forward quarters (>=2025) are projections rather than observed government filings',
      'Telangana demand covers Hyderabad only (1 of 33 districts)',
      'Covers 8 urban industrial hubs only, not pan-India coverage'
    ],
    ingestion_date: '2026-10-04',
    is_forecast: rec.year >= 2025,
    notes: 'Development & testing fixture. Awaiting primary source provenance audit. Not to be cited as official verified filings or national coverage.'
  }
}));
