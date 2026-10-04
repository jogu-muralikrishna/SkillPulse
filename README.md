# SkillPulse — Labour-Market Intelligence Platform

> **Purpose:** SkillPulse helps understand which skills are in demand, where skill shortages exist, how demand may change in the future, and what training capacity may be required.

SkillPulse is a data-driven labour-market intelligence and skill planning platform built to synthesize verified job demand signals, workforce registries, and accredited training capacity across India's key industrial clusters.

---

## 1. Project Overview

Modern workforce planning requires reconciling dynamic industrial labor demand with institutional training output. SkillPulse bridges this gap by establishing:
- **Verified Demand Tracking:** Empirical vacancy counts from the National Career Service (NCS) and documented public job market listings.
- **Supply Separation:** Explicit distinction between active registered workers (e-Shram / NCS jobseekers) and accredited training capacity (PMKVY / MSDE).
- **Transparent Skill Normalization:** An auditable mapping layer linking varied raw portal tags to standard occupational competencies.
- **Rigorous Skill Gap Analysis:** Spatial and temporal comparability validation prior to calculating shortages or surpluses.
- **Statistical Demand Forecasting:** Econometric Ordinary Least Squares (OLS) time-series forecasting with MAE, RMSE, and R² evaluation metrics.
- **Decision-Support Planning Advisor:** Phrased to recommend where additional training capacity *may be considered*, without rigid or fabricated mandates.
- **Interactive What-If Simulation:** Dynamic modeling of training intake adjustments and their projected impact on future supply deficits.
- **Grounded Assistant:** An integrated intelligence assistant powered by server-side Gemini 3.8 Flash, strictly bounded by the empirical database state.

---

## 2. Core Features

1. **Executive Dashboard:** Macro overview of national demand trends, sector distribution, top potential shortages, and data quality indicators.
2. **Demand Analysis:** Multi-dimensional filters (State, District, Sector, Skill, Quarter) with top job roles and compensation ranges.
3. **Supply Analysis:** Clear dual-track view separating active worker supply from accredited training center capacity and placement rates.
4. **Skill Gap Matrix:** Calculates `Net Gap = Demand - Effective Supply` with configurable shortage/oversupply thresholds and comparability validation.
5. **Statistical Forecasting:** Chronological regression modeling generating 2–6 quarter projections with 95% confidence intervals and residual metrics.
6. **Training Planner:** Actionable guidance for skill councils and training providers, projecting required capacity expansions.
7. **What-If Simulator:** Real-time capacity adjustment slider recalculating residual deficits and gap closure percentages.
8. **Skill Priority Index:** Transparent ranking based on user-weighted factors (Demand Growth, Projected Gap, Deficit Urgency, Training Capacity Constraints).
9. **Geographic Map:** Interactive Leaflet + OpenStreetMap visualization of district-level demand, supply, and shortages (no third-party API key required).
10. **Skill Normalization Layer:** Transparent dictionary mapping raw posting keywords to canonical competencies.
11. **Data Sources Catalog:** Full provenance documentation with official URLs, access dates, column schemas, and license terms.
12. **Methodology & Limitations:** Comprehensive step-by-step pipeline documentation with an honest evaluation of platform boundaries.

---

## 3. Technology Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Leaflet.
- **Backend:** Node.js, Express, TSX.
- **Analytical & ML Engine:** Statistical Ordinary Least Squares (OLS) Regression, Residual Variance Computation, Empirical Gap Evaluation.
- **AI Intelligence Layer:** `@google/genai` TypeScript SDK (Server-Side with model `gemini-3.8-flash`).
- **Data Architecture:** Relational in-memory and file-backed structured records indexed by geographic location, sector, and quarterly period.

---

## 4. Dataset Sources & Provenance

SkillPulse operates under a zero-fake-data policy. All statistics are verified against publicly published figures:

| Source Name | Publishing Organization | Official Portal URL | Access Date | Supported System Role |
| :--- | :--- | :--- | :--- | :--- |
| **National Career Service (NCS)** | Ministry of Labour & Employment, Government of India | [https://www.ncs.gov.in/](https://www.ncs.gov.in/) | 2025-01-15 | Primary labor demand, job vacancies, registered jobseekers |
| **Pradhan Mantri Kaushal Vikas Yojana (PMKVY)** | Ministry of Skill Development & Entrepreneurship (MSDE) | [https://www.msde.gov.in/](https://www.msde.gov.in/) | 2025-02-10 | Accredited center capacity, enrolled, certified, and placed candidates |
| **e-Shram National Database** | Ministry of Labour & Employment, Government of India | [https://eshram.gov.in/](https://eshram.gov.in/) | 2025-01-28 | Baseline worker registrations categorized by primary occupation |
| **Public Tech & Industrial Job Market Postings** | Public Labour Market Research Initiative / data.gov.in | [https://data.gov.in/](https://data.gov.in/) | 2025-02-01 | Granular technical skill tags and wage boundaries |

---

## 5. How to Download Datasets

1. **National Career Service Vacancies:**
   - Visit [data.gov.in](https://www.data.gov.in/) and search for "National Career Service monthly vacancies and registrations".
   - Download the CSV/JSON release detailing vacancies classified under National Classification of Occupations (NCO-2015).
2. **PMKVY Training Outlines:**
   - Visit the MSDE portal or Lok Sabha question disclosures on training center performance.
   - Filter by Sector Skill Council (SSC), state, and district to retrieve candidate counts (Enrolled, Trained, Certified, Placed).
3. **e-Shram Occupational Distribution:**
   - Access the public dashboard at [eshram.gov.in/dashboard](https://eshram.gov.in/dashboard).
   - Export occupation-wise and state-wise unorganized and semi-skilled worker counts.

---

## 6. Dataset Preparation & Normalization Pipeline

The ingestion pipeline executes the following stages:
1. **Deduplication & Sanitization:** Removal of redundant or malformed vacancy records.
2. **Spatial Alignment:** Standardizing state and district names to official Census and administrative codes.
3. **Skill Standardization:** Mapping heterogeneous raw skill tags (e.g., "Python Developer", "Python Scripting") to normalized canonical nodes (e.g., "Python Development").
4. **Temporal Stamping:** Assigning chronological quarterly buckets (`YYYY-Q#`).

---

## 7. Database Schema

The internal data model is structured around relational entities:

- **`locations`**: `state`, `district`, `lat`, `lng`, `industrialZone`, coverage flags.
- **`skills` & `skill_mappings`**: `rawSkill`, `normalizedSkill`, `sector`, `source`, `confidence`.
- **`demand_records`**: `id`, `period`, `year`, `quarter`, `state`, `district`, `sector`, `jobRole`, `normalizedSkill`, `demandCount`, `averageSalaryMin`, `averageSalaryMax`, `source`.
- **`supply_worker_records`**: `id`, `period`, `state`, `district`, `sector`, `normalizedSkill`, `workerCount`, `source`.
- **`training_records`**: `id`, `period`, `state`, `district`, `sector`, `courseName`, `normalizedSkill`, `enrolledCount`, `trainedCount`, `certifiedCount`, `placedCount`, `annualCapacity`, `activeCenters`, `scheme`, `source`.

---

## 8. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
# GEMINI_API_KEY: Required for grounded AI Assistant interactions
GEMINI_API_KEY="your-gemini-api-key"

# Port on which the server listens (defaults to 3000)
PORT=3000
```

---

## 9. Installation & Local Execution

### Prerequisites
- Node.js (version 20+ recommended)
- npm

### Step-by-Step Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server (Full-Stack):**
   ```bash
   npm run dev
   ```
   This launches `server.ts` via `tsx` on `http://localhost:3000` with the Vite frontend middleware mounted.

3. **Build for Production:**
   ```bash
   npm run build
   ```

4. **Start Production Server:**
   ```bash
   npm run start
   ```

---

## 10. API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/overview` | `GET` | Aggregated system metrics, records count, and data quality overview. |
| `/api/demand` | `GET` | Filtered demand records by state, district, sector, skill, or period. |
| `/api/supply` | `GET` | Dual-track supply figures (Worker registry vs Institutional training). |
| `/api/gaps` | `GET` | Skill gap analysis with comparability validation and threshold classification. |
| `/api/forecast` | `GET` | Evaluated OLS time-series demand forecast with MAE, RMSE, and R² scores. |
| `/api/recommendations` | `GET` | Actionable training capacity planning guidance. |
| `/api/simulate` | `POST` | What-If simulation recalculating gap closure for additional capacity. |
| `/api/priority` | `POST` | Weighted multi-factor skill priority rankings with custom factor weights. |
| `/api/locations` | `GET` | District coordinates and local metrics for the Leaflet interactive map. |
| `/api/skills/mappings` | `GET` / `POST` | Read and dynamically configure transparent skill normalization rules. |
| `/api/assistant/chat` | `POST` | Grounded AI assistant querying current database metrics. |
| `/api/data-sources` | `GET` | Data sources catalog with verified URLs and licensing. |

---

## 11. Analytical Methodology

### Effective Supply Calibration
$$\text{Effective Supply} = \text{Worker Supply}_{\text{registered}} + (\text{Placed Trainees} \times 0.70)$$

### Net Skill Gap
$$\text{Net Gap} = \text{Demand} - \text{Effective Supply}$$

### Comparability Rule
Before any gap is calculated, the system verifies:
- Identical state and district
- Temporal alignment (matching quarterly bounds)
- Validated skill mapping

If supply records are unavailable, the skill is classified as **Non-Comparable** (`"Comparable supply data is unavailable for this skill/location"`). Fake numbers are never generated.

---

## 12. Known Limitations & Scope Boundaries

1. **Informal Labor Representation:** Public job postings and NCS filings reflect formal and tech-enabled hiring; unorganized day-labor exchanges are captured primarily through e-Shram counts.
2. **District Depth:** Certain districts have extensive 9-quarter time series (e.g. Hyderabad, Bengaluru, Pune, Chennai), while others have fewer observations. Where historical observations are $< 4$, forecasts are disabled with an explicit notice.
3. **Training Attrition:** Certified trainees do not enter local employment at 100% efficiency due to inter-state migration and higher education choices.
4. **Planning Support:** SkillPulse is designed as an analytical decision-support tool to inform human planners, not replace administrative deliberation.
