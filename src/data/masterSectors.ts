import { SectorMaster, SkillMaster } from '../types';

export const MASTER_SECTORS: SectorMaster[] = [
  {
    sector_id: 'sec-it',
    sector_name: 'Information Technology & Software (IT-ITeS)',
    sector_source: 'National Career Service / NASSCOM SSC',
    source_sector_name: 'IT & ITeS',
    description: 'Software development, cloud infrastructure, AI/ML engineering, and data analytics.',
    category: 'Technology & Services'
  },
  {
    sector_id: 'sec-ai-cloud',
    sector_name: 'Artificial Intelligence, Data & Cloud Computing',
    sector_source: 'National Career Service / NASSCOM FutureSkills',
    source_sector_name: 'AI, Data & Emerging Technologies',
    description: 'Generative AI engineering, large language model deployment, MLOps, cloud infrastructure, and big data architecture.',
    category: 'Technology & Services'
  },
  {
    sector_id: 'sec-cyber',
    sector_name: 'Cybersecurity & Information Assurance',
    sector_source: 'National Career Service / DSCI',
    source_sector_name: 'Cybersecurity & Security Services',
    description: 'Threat hunting, SOC operations, zero-trust network architecture, and cloud security compliance.',
    category: 'Technology & Services'
  },
  {
    sector_id: 'sec-health',
    sector_name: 'Healthcare & Allied Medical Sciences',
    sector_source: 'National Career Service / Healthcare Sector Skill Council (HSSC)',
    source_sector_name: 'Healthcare and Pharmaceuticals',
    description: 'Clinical laboratory technology, radiological diagnostics, emergency medical care, and hospital operations.',
    category: 'Healthcare & Life Sciences'
  },
  {
    sector_id: 'sec-pharma',
    sector_name: 'Pharmaceuticals & Biotechnology',
    sector_source: 'Life Sciences Sector Skill Development Council (LSSSDC)',
    source_sector_name: 'Chemicals and Pharmaceuticals',
    description: 'Bio-process operations, formulation chemistry, quality assurance, and clinical trials compliance.',
    category: 'Healthcare & Life Sciences'
  },
  {
    sector_id: 'sec-mfg',
    sector_name: 'Manufacturing & Capital Goods',
    sector_source: 'Capital Goods Skill Council (CGSC)',
    source_sector_name: 'Capital Goods & Precision Machining',
    description: 'CNC precision machining, industrial robotics programming, additive manufacturing, and automated assembly.',
    category: 'Manufacturing & Engineering'
  },
  {
    sector_id: 'sec-auto',
    sector_name: 'Automotive & EV Technology',
    sector_source: 'National Career Service / Automotive Skills Development Council (ASDC)',
    source_sector_name: 'Automotive & Electric Mobility',
    description: 'Electric vehicle powertrain assembly, lithium-ion battery diagnostics, BMS calibration, and charging infrastructure.',
    category: 'Manufacturing & Engineering'
  },
  {
    sector_id: 'sec-elec',
    sector_name: 'Electronics & Semiconductor Manufacturing',
    sector_source: 'National Career Service / Electronic Sector Skills Council (ESSCI)',
    source_sector_name: 'Electronics & Hardware',
    description: 'VLSI physical design, semiconductor packaging, SMT automated board assembly, and embedded IoT firmware.',
    category: 'Manufacturing & Engineering'
  },
  {
    sector_id: 'sec-green',
    sector_name: 'Renewable Energy & Green Jobs',
    sector_source: 'Skill Council for Green Jobs (SCGJ)',
    source_sector_name: 'Green Jobs & Renewable Energy',
    description: 'Utility-scale solar PV installation, wind turbine operation, green hydrogen production, and energy storage systems.',
    category: 'Energy & Environment'
  },
  {
    sector_id: 'sec-const',
    sector_name: 'Construction & Infrastructure Engineering',
    sector_source: 'Construction Skill Development Council of India (CSDCI)',
    source_sector_name: 'Construction & Civil Infrastructure',
    description: 'Precast engineering, Building Information Modeling (BIM), heavy machinery operation, and smart highway construction.',
    category: 'Infrastructure & Construction'
  },
  {
    sector_id: 'sec-logistics',
    sector_name: 'Logistics & Supply Chain Management',
    sector_source: 'Logistics Sector Skill Council (LSC)',
    source_sector_name: 'Logistics & Warehousing',
    description: 'Automated warehouse distribution, cold-chain monitoring, predictive fleet logistics, and multimodal freight forwarding.',
    category: 'Transportation & Logistics'
  },
  {
    sector_id: 'sec-bfsi',
    sector_name: 'Banking, Financial Services & Insurance (BFSI)',
    sector_source: 'BFSI Sector Skill Council of India',
    source_sector_name: 'Banking and Financial Services',
    description: 'Fintech compliance, algorithmic credit risk analysis, digital banking operations, and actuarial underwriting.',
    category: 'Financial Services'
  },
  {
    sector_id: 'sec-edu',
    sector_name: 'Education & Vocational Training',
    sector_source: 'Ministry of Skill Development and Entrepreneurship (MSDE)',
    source_sector_name: 'Education & Training',
    description: 'Vocational pedagogical instruction, technical lab training, digital curriculum authoring, and assessment proctoring.',
    category: 'Services & Education'
  },
  {
    sector_id: 'sec-retail',
    sector_name: 'Retail & E-Commerce Operations',
    sector_source: 'Retailers Association\'s Skill Council of India (RASCI)',
    source_sector_name: 'Retail and Consumer Commerce',
    description: 'Omnichannel inventory management, e-commerce fulfillment operations, visual merchandising, and CRM analytics.',
    category: 'Services & Trade'
  },
  {
    sector_id: 'sec-telecom',
    sector_name: 'Telecommunications & 5G Infrastructure',
    sector_source: 'Telecom Sector Skill Council (TSSC)',
    source_sector_name: 'Telecommunications',
    description: '5G small-cell deployment, optical fiber splicing, network virtualization, and RF optimization.',
    category: 'Technology & Services'
  },
  {
    sector_id: 'sec-agri',
    sector_name: 'Agriculture & Food Processing Technology',
    sector_source: 'Agriculture Skill Council of India (ASCI) / FICSI',
    source_sector_name: 'Agriculture and Allied Industries',
    description: 'Precision agriculture, drone crop surveillance, automated post-harvest processing, and food quality cold storage.',
    category: 'Agriculture & Primary'
  },
  {
    sector_id: 'sec-textiles',
    sector_name: 'Textiles & Apparel Manufacturing',
    sector_source: 'Apparel Made-Ups & Home Furnishing Sector Skill Council (AMHSSC)',
    source_sector_name: 'Textiles and Apparel',
    description: 'Technical textiles production, automated CNC cutting, CAD pattern grading, and sustainable dye house engineering.',
    category: 'Manufacturing & Engineering'
  },
  {
    sector_id: 'sec-tourism',
    sector_name: 'Tourism & Hospitality Operations',
    sector_source: 'Tourism and Hospitality Skill Council (THSC)',
    source_sector_name: 'Tourism and Hospitality',
    description: 'Eco-tourism management, heritage hospitality, culinary arts, and revenue optimization systems.',
    category: 'Services & Trade'
  }
];

// In-memory updateable skill taxonomy for newly emerging roles (AI, Drone, EV, etc.)
export let MASTER_SKILLS: SkillMaster[] = [
  // IT & Software
  { skill_id: 'sk-py', skill_name: 'Python Development', normalized_skill_name: 'Python Development', sector_id: 'sec-it', sector_name: 'Information Technology & Software (IT-ITeS)', source: 'NCS & Tech Job Taxonomy' },
  { skill_id: 'sk-react', skill_name: 'React & Web Frontend Engineering', normalized_skill_name: 'React & Web Frontend Engineering', sector_id: 'sec-it', sector_name: 'Information Technology & Software (IT-ITeS)', source: 'NCS IT Occupations' },
  { skill_id: 'sk-data', skill_name: 'Data Engineering & Cloud Warehousing', normalized_skill_name: 'Data Engineering & Cloud Warehousing', sector_id: 'sec-it', sector_name: 'Information Technology & Software (IT-ITeS)', source: 'NASSCOM SSC' },

  // AI, Data & Cloud (Emerging 2026 roles)
  { skill_id: 'sk-genai', skill_name: 'Generative AI & LLM Systems Engineering', normalized_skill_name: 'Generative AI & LLM Systems Engineering', sector_id: 'sec-ai-cloud', sector_name: 'Artificial Intelligence, Data & Cloud Computing', source: 'NCS & AI Industry Filings (2026)' },
  { skill_id: 'sk-mlops', skill_name: 'MLOps & AI Model Deployment', normalized_skill_name: 'MLOps & AI Model Deployment', sector_id: 'sec-ai-cloud', sector_name: 'Artificial Intelligence, Data & Cloud Computing', source: 'NASSCOM FutureSkills (2026)' },
  { skill_id: 'sk-cloud-sec', skill_name: 'Cloud Security & DevSecOps', normalized_skill_name: 'Cloud Security & DevSecOps', sector_id: 'sec-cyber', sector_name: 'Cybersecurity & Information Assurance', source: 'DSCI & NCS (2026)' },
  { skill_id: 'sk-cyber', skill_name: 'Cybersecurity & Threat Detection', normalized_skill_name: 'Cybersecurity & Threat Detection', sector_id: 'sec-cyber', sector_name: 'Cybersecurity & Information Assurance', source: 'NCS / DSCI' },

  // Automotive & EV Technology
  { skill_id: 'sk-ev', skill_name: 'EV Powertrain & Battery Diagnostics', normalized_skill_name: 'EV Powertrain & Battery Diagnostics', sector_id: 'sec-auto', sector_name: 'Automotive & EV Technology', source: 'ASDC & NCS' },
  { skill_id: 'sk-bms', skill_name: 'Battery Management System (BMS) Calibration', normalized_skill_name: 'Battery Management System (BMS) Calibration', sector_id: 'sec-auto', sector_name: 'Automotive & EV Technology', source: 'ASDC National Standards' },

  // Electronics & Semiconductors
  { skill_id: 'sk-vlsi', skill_name: 'VLSI & Semiconductor Physical Design', normalized_skill_name: 'VLSI & Semiconductor Physical Design', sector_id: 'sec-elec', sector_name: 'Electronics & Semiconductor Manufacturing', source: 'ESSCI & NCS' },
  { skill_id: 'sk-smt', skill_name: 'SMT Electronic Assembly & Inspection', normalized_skill_name: 'SMT Electronic Assembly & Inspection', sector_id: 'sec-elec', sector_name: 'Electronics & Semiconductor Manufacturing', source: 'ESSCI & PMKVY' },

  // Renewable Energy & Green Jobs
  { skill_id: 'sk-solar', skill_name: 'Solar PV Installation & Grid Integration', normalized_skill_name: 'Solar PV Installation & Grid Integration', sector_id: 'sec-green', sector_name: 'Renewable Energy & Green Jobs', source: 'SCGJ & PMKVY' },
  { skill_id: 'sk-green-h2', skill_name: 'Green Hydrogen & Electrolyzer Operations', normalized_skill_name: 'Green Hydrogen & Electrolyzer Operations', sector_id: 'sec-green', sector_name: 'Renewable Energy & Green Jobs', source: 'SCGJ Energy Transition Framework' },

  // Manufacturing & Capital Goods
  { skill_id: 'sk-cnc', skill_name: 'CNC Precision Machining & Programming', normalized_skill_name: 'CNC Precision Machining & Programming', sector_id: 'sec-mfg', sector_name: 'Manufacturing & Capital Goods', source: 'Capital Goods SSC' },
  { skill_id: 'sk-robotics', skill_name: 'Industrial Robotics & Automation Maintenance', normalized_skill_name: 'Industrial Robotics & Automation Maintenance', sector_id: 'sec-mfg', sector_name: 'Manufacturing & Capital Goods', source: 'CGSC & NCS' },

  // Healthcare & Allied Medical Sciences
  { skill_id: 'sk-clinic', skill_name: 'Clinical Laboratory Diagnostic Technology', normalized_skill_name: 'Clinical Laboratory Diagnostic Technology', sector_id: 'sec-health', sector_name: 'Healthcare & Allied Medical Sciences', source: 'HSSC & PMKVY' },
  { skill_id: 'sk-pharma-qc', skill_name: 'Pharmaceutical Quality Control & HPLC Analysis', normalized_skill_name: 'Pharmaceutical Quality Control & HPLC Analysis', sector_id: 'sec-pharma', sector_name: 'Pharmaceuticals & Biotechnology', source: 'LSSSDC' },

  // Construction & Civil Infrastructure
  { skill_id: 'sk-const', skill_name: 'Precast Concrete Engineering & Quality', normalized_skill_name: 'Precast Concrete Engineering & Quality', sector_id: 'sec-const', sector_name: 'Construction & Infrastructure Engineering', source: 'CSDCI' },
  { skill_id: 'sk-bim', skill_name: 'BIM Civil Modeling & Structural Drafting', normalized_skill_name: 'BIM Civil Modeling & Structural Drafting', sector_id: 'sec-const', sector_name: 'Construction & Infrastructure Engineering', source: 'CSDCI' },

  // Logistics & Supply Chain
  { skill_id: 'sk-log', skill_name: 'Supply Chain Operations & Inventory Analytics', normalized_skill_name: 'Supply Chain Operations & Inventory Analytics', sector_id: 'sec-logistics', sector_name: 'Logistics & Supply Chain Management', source: 'LSC & PMKVY' },

  // Education & Vocational Training
  { skill_id: 'sk-edu-trainer', skill_name: 'Vocational Technical Training Instruction', normalized_skill_name: 'Vocational Technical Training Instruction', sector_id: 'sec-edu', sector_name: 'Education & Vocational Training', source: 'MSDE DGT' },

  // Banking & Financial Services
  { skill_id: 'sk-fintech', skill_name: 'Fintech Compliance & Digital Underwriting', normalized_skill_name: 'Fintech Compliance & Digital Underwriting', sector_id: 'sec-bfsi', sector_name: 'Banking, Financial Services & Insurance (BFSI)', source: 'BFSI SSC' },

  // Agriculture & Food Processing
  { skill_id: 'sk-drone-agri', skill_name: 'Agricultural Drone Operations & Crop Sensing', normalized_skill_name: 'Agricultural Drone Operations & Crop Sensing', sector_id: 'sec-agri', sector_name: 'Agriculture & Food Processing Technology', source: 'ASCI & DGCA Drone Rules' }
];

export function registerNewSkill(skill: SkillMaster): void {
  const existing = MASTER_SKILLS.find(
    s => s.skill_id === skill.skill_id || s.normalized_skill_name.toLowerCase() === skill.normalized_skill_name.toLowerCase()
  );
  if (!existing) {
    MASTER_SKILLS.push(skill);
  }
}

export function resolveSectorName(inputSector: string): string {
  if (!inputSector) return '';
  const match = MASTER_SECTORS.find(
    s => s.sector_name.toLowerCase().includes(inputSector.toLowerCase()) ||
         inputSector.toLowerCase().includes(s.source_sector_name.toLowerCase()) ||
         inputSector.toLowerCase().includes(s.sector_id.toLowerCase())
  );
  return match ? match.sector_name : inputSector;
}
