import { SkillMapping } from '../types';

export interface SectorDefinition {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export const SECTORS: SectorDefinition[] = [
  { id: 'it-ites', name: 'IT-ITeS & Software', description: 'Software engineering, cloud infrastructure, cybersecurity, and data analytics.', iconName: 'Terminal' },
  { id: 'automotive-ev', name: 'Automotive & EV Technology', description: 'Electric mobility, battery diagnostics, ADAS calibration, and automotive electronics.', iconName: 'Car' },
  { id: 'electronics-semi', name: 'Electronics & Semiconductors', description: 'VLSI design, PCB assembly, embedded hardware, and microelectronics fabrication.', iconName: 'Cpu' },
  { id: 'healthcare', name: 'Healthcare & Allied Medical', description: 'Clinical laboratory technology, radiology, patient care, and biomedical equipment maintenance.', iconName: 'HeartPulse' },
  { id: 'green-energy', name: 'Renewable Energy & Green Jobs', description: 'Solar photovoltaic installation, wind turbine maintenance, and green hydrogen systems.', iconName: 'Zap' },
  { id: 'logistics', name: 'Logistics & Supply Chain', description: 'Automated warehouse management, freight forwarding, and cold-chain inventory control.', iconName: 'Truck' },
  { id: 'manufacturing', name: 'Manufacturing & Capital Goods', description: 'CNC precision machining, robotics welding, additive manufacturing, and industrial automation.', iconName: 'Cog' },
  { id: 'construction', name: 'Construction & Infrastructure', description: 'Building Information Modeling (BIM), structural inspection, and precast concrete engineering.', iconName: 'Building' },
];

export const INITIAL_SKILL_MAPPINGS: SkillMapping[] = [
  // IT-ITeS
  { id: 'm1', rawSkill: 'Python Programming', normalizedSkill: 'Python Development', sector: 'IT-ITeS & Software', source: 'open-job-postings', confidence: 0.98, isVerified: true },
  { id: 'm2', rawSkill: 'Python Developer', normalizedSkill: 'Python Development', sector: 'IT-ITeS & Software', source: 'ncs-portal', confidence: 0.96, isVerified: true },
  { id: 'm3', rawSkill: 'Python Scripting', normalizedSkill: 'Python Development', sector: 'IT-ITeS & Software', source: 'open-job-postings', confidence: 0.94, isVerified: true },
  { id: 'm4', rawSkill: 'React.js Developer', normalizedSkill: 'React & Frontend Engineering', sector: 'IT-ITeS & Software', source: 'open-job-postings', confidence: 0.97, isVerified: true },
  { id: 'm5', rawSkill: 'Frontend Web Developer', normalizedSkill: 'React & Frontend Engineering', sector: 'IT-ITeS & Software', source: 'ncs-portal', confidence: 0.91, isVerified: true },
  { id: 'm6', rawSkill: 'Data Analyst (SQL/Python)', normalizedSkill: 'Data Analytics & Business Intelligence', sector: 'IT-ITeS & Software', source: 'open-job-postings', confidence: 0.95, isVerified: true },
  { id: 'm7', rawSkill: 'Business Intelligence Executive', normalizedSkill: 'Data Analytics & Business Intelligence', sector: 'IT-ITeS & Software', source: 'ncs-portal', confidence: 0.89, isVerified: true },
  { id: 'm8', rawSkill: 'Cybersecurity Analyst', normalizedSkill: 'Cybersecurity & Threat Detection', sector: 'IT-ITeS & Software', source: 'open-job-postings', confidence: 0.96, isVerified: true },
  { id: 'm9', rawSkill: 'Information Security Executive', normalizedSkill: 'Cybersecurity & Threat Detection', sector: 'IT-ITeS & Software', source: 'ncs-portal', confidence: 0.92, isVerified: true },

  // Automotive & EV
  { id: 'm10', rawSkill: 'EV Battery Technician', normalizedSkill: 'EV Powertrain & Battery Diagnostics', sector: 'Automotive & EV Technology', source: 'pmkvy-msde', confidence: 0.98, isVerified: true },
  { id: 'm11', rawSkill: 'Electric Vehicle Service Engineer', normalizedSkill: 'EV Powertrain & Battery Diagnostics', sector: 'Automotive & EV Technology', source: 'ncs-portal', confidence: 0.95, isVerified: true },
  { id: 'm12', rawSkill: 'Auto Electrician (EV)', normalizedSkill: 'EV Powertrain & Battery Diagnostics', sector: 'Automotive & EV Technology', source: 'eshram-registry', confidence: 0.88, isVerified: true },
  { id: 'm13', rawSkill: 'ADAS Calibration Specialist', normalizedSkill: 'Automotive Sensor & ADAS Systems', sector: 'Automotive & EV Technology', source: 'open-job-postings', confidence: 0.94, isVerified: true },

  // Electronics & Semiconductors
  { id: 'm14', rawSkill: 'VLSI Physical Design Engineer', normalizedSkill: 'VLSI & Semiconductor Physical Design', sector: 'Electronics & Semiconductors', source: 'open-job-postings', confidence: 0.99, isVerified: true },
  { id: 'm15', rawSkill: 'Semiconductor Layout Technician', normalizedSkill: 'VLSI & Semiconductor Physical Design', sector: 'Electronics & Semiconductors', source: 'ncs-portal', confidence: 0.93, isVerified: true },
  { id: 'm16', rawSkill: 'Surface Mount Technology (SMT) Operator', normalizedSkill: 'SMT Electronic Assembly & Inspection', sector: 'Electronics & Semiconductors', source: 'pmkvy-msde', confidence: 0.97, isVerified: true },
  { id: 'm17', rawSkill: 'PCB Assembly Technician', normalizedSkill: 'SMT Electronic Assembly & Inspection', sector: 'Electronics & Semiconductors', source: 'eshram-registry', confidence: 0.90, isVerified: true },

  // Healthcare
  { id: 'm18', rawSkill: 'Medical Laboratory Technician', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', sector: 'Healthcare & Allied Medical', source: 'pmkvy-msde', confidence: 0.97, isVerified: true },
  { id: 'm19', rawSkill: 'Clinical Pathology Assistant', normalizedSkill: 'Clinical Laboratory Diagnostic Technology', sector: 'Healthcare & Allied Medical', source: 'ncs-portal', confidence: 0.93, isVerified: true },
  { id: 'm20', rawSkill: 'Dialysis Technician', normalizedSkill: 'Renal Dialysis Technology', sector: 'Healthcare & Allied Medical', source: 'pmkvy-msde', confidence: 0.98, isVerified: true },

  // Renewable Energy
  { id: 'm21', rawSkill: 'Solar PV Installer (Suryamitra)', normalizedSkill: 'Solar PV Installation & Grid Integration', sector: 'Renewable Energy & Green Jobs', source: 'pmkvy-msde', confidence: 0.99, isVerified: true },
  { id: 'm22', rawSkill: 'Rooftop Solar Technician', normalizedSkill: 'Solar PV Installation & Grid Integration', sector: 'Renewable Energy & Green Jobs', source: 'ncs-portal', confidence: 0.94, isVerified: true },
  { id: 'm23', rawSkill: 'Wind Turbine Maintenance Mechanic', normalizedSkill: 'Wind Energy Electromechanical Servicing', sector: 'Renewable Energy & Green Jobs', source: 'pmkvy-msde', confidence: 0.95, isVerified: true },

  // Manufacturing
  { id: 'm24', rawSkill: 'CNC Milling & Turning Operator', normalizedSkill: 'CNC Precision Machining', sector: 'Manufacturing & Capital Goods', source: 'pmkvy-msde', confidence: 0.98, isVerified: true },
  { id: 'm25', rawSkill: 'CNC Machine Programmer', normalizedSkill: 'CNC Precision Machining', sector: 'Manufacturing & Capital Goods', source: 'ncs-portal', confidence: 0.96, isVerified: true },
  { id: 'm26', rawSkill: 'Industrial Automation PLC Programmer', normalizedSkill: 'PLC & SCADA Industrial Automation', sector: 'Manufacturing & Capital Goods', source: 'open-job-postings', confidence: 0.97, isVerified: true },

  // Logistics
  { id: 'm27', rawSkill: 'Warehouse Supervisor / Executive', normalizedSkill: 'Automated Warehouse & Inventory Management', sector: 'Logistics & Supply Chain', source: 'ncs-portal', confidence: 0.95, isVerified: true },
  { id: 'm28', rawSkill: 'Cold Chain Logistics Coordinator', normalizedSkill: 'Cold Chain & Temperature Logistics', sector: 'Logistics & Supply Chain', source: 'pmkvy-msde', confidence: 0.96, isVerified: true },

  // Construction
  { id: 'm29', rawSkill: 'BIM Modeler (Revit)', normalizedSkill: 'Building Information Modeling (BIM)', sector: 'Construction & Infrastructure', source: 'open-job-postings', confidence: 0.97, isVerified: true },
  { id: 'm30', rawSkill: 'Precast Concrete Quality Inspector', normalizedSkill: 'Precast Concrete Engineering & Quality', sector: 'Construction & Infrastructure', source: 'pmkvy-msde', confidence: 0.94, isVerified: true }
];
