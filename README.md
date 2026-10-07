# SkillPulse — Labour-Market Intelligence Platform

> **Purpose:** SkillPulse helps understand which skills are in demand, where skill shortages exist, how demand may change in the future, and what training capacity may be required.

SkillPulse is a data-driven labour-market intelligence and skill planning platform built to synthesize public job demand signals, workforce registries, and accredited training capacity across India's key industrial clusters.

---

## 1. Project Overview & Architecture

Modern workforce planning requires reconciling dynamic industrial labor demand with institutional training output. SkillPulse bridges this gap by establishing:

- **Canonical Administrative Geography:** Decoupled master hierarchy based on the Local Government Directory (LGD), covering all 36 States/UTs and 786 Districts.
- **Demand Tracking (Development Fixtures):** Sample vacancy counts based on National Career Service (NCS) categories and documented tech hiring listings across 8 urban industrial clusters.
- **Dual-Track Supply:** Explicit distinction between unorganised registered workers (e-Shram) and accredited institutional training capacity (PMKVY / MSDE).
- **Spatial & Population Comparability:** Validation rules ensuring unorganised registries and corporate white-collar vacancies are never erroneously subtracted.
- **Statistical Demand Forecasting:** Econometric Ordinary Least Squares (OLS) time-series forecasting with MAE, RMSE, and $R^2$ evaluation metrics (requires $\ge 4$ historical periods).
- **Decision-Support Planning Advisory:** Decision support phrasing ("additional capacity *may be considered*") to assist human administrators.
- **Data Integrity & Provenance CLI:** Automated audit script verifying dataset schema, non-negativity, geography consistency, and source metadata.

---

## 2. Core Features

1. **Executive Dashboard:** Macro overview of demand trends, sector distribution, potential shortages, and data quality indicators.
2. **Demand Analysis:** Multi-dimensional filters (State, District, Sector, Skill, Quarter) with top job roles and compensation boundaries.
3. **Supply Analysis:** Clear separation between active worker supply and accredited training center capacity.
4. **Skill Gap Matrix:** Calculates `Net Gap = Demand - Effective Supply` with configurable thresholds ($\pm 15\%$) and strict comparability validation.
5. **Statistical Forecasting:** Chronological OLS regression generating forward projections with 95% confidence intervals and residual metrics.
6. **Training Planner:** Guidance for skill councils and training providers, projecting potential capacity expansions.
7. **What-If Simulator:** Interactive capacity adjustment recalculating projected gap reduction percentages.
8. **Skill Priority Index:** Transparent ranking based on user-weighted factors (Growth, Gap, Shortage, Capacity Constraints).
9. **Geographic Map:** Interactive Leaflet map visualizing district-level demand, supply, and shortages (vector boundaries, no external map API key needed).
10. **Data Sources Catalog:** Full provenance documentation with official URLs, access dates, column schemas, and license terms.
11. **Methodology & Limitations:** Step-by-step documentation detailing analytical formulas, pipeline status, and scope limitations.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Leaflet.
- **Backend:** Node.js, Express, TSX.
- **Analytical Engine:** Statistical Ordinary Least Squares (OLS) Regression, Residual Variance Computation, Empirical Gap Evaluation.
- **AI Intelligence Layer:** `@google/genai` TypeScript SDK (Server-side Gemini 3.8 Flash with local fallback).
- **Data Layer:** Relational in-memory structured records indexed by canonical LGD geography, sector, and quarterly period.

---

## 4. Data Provenance Policy & Dataset Status

SkillPulse enforces strict data provenance standards:

| Dataset | Organization | Official Portal URL | Access Date | Verification Status | Scope & Repository Representation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local Government Directory (LGD)** | Ministry of Panchayati Raj | [https://lgdirectory.gov.in/](https://lgdirectory.gov.in/) | 2026-10-04 | **VERIFIED & INGESTED** | 100% of Indian administrative territory: 36 States/UTs, 786 Districts. |
| **National Career Service (NCS)** | Ministry of Labour & Employment | [https://www.ncs.gov.in/](https://www.ncs.gov.in/) | 2026-10-04 | **DEVELOPMENT FIXTURE** | 101 development/testing demand fixtures covering 8 urban hubs. Quarters $\ge 2025$ are statistical projections. |
| **e-Shram National Database** | Ministry of Labour & Employment | [https://eshram.gov.in/](https://eshram.gov.in/) | 2026-10-04 | **CURATED DISCLOSURES** | 15 district-level records representing unorganised workforce counts (e-Shram). Corporate IT developers are excluded. |
| **PMKVY / MSDE Repository** | Ministry of Skill Development & Entrepreneurship | [https://www.msde.gov.in/](https://www.msde.gov.in/) | 2026-10-04 | **CURATED DISCLOSURES** | 14 district-level training records. Under PMKVY 4.0, placement tracking was delinked; unmeasured counts remain undefined. |

For detailed information on raw source artifacts, see [`data/raw/README.md`](file:///c:/Users/pavan/Desktop/skillpulse/data/raw/README.md).

---

## 5. Telangana Coverage & Regional Limitations

When evaluating figures for the state of Telangana:
1. **Demand Representation:** Current demand fixtures represent **Hyderabad district only** (1 of 33 districts in Telangana).
2. **Workforce Supply Representation:** Registered workforce supply in the repo represents **3 districts** (Hyderabad, Rangareddy, and Medchal-Malkajgiri).
3. **Population Scope Difference:** High-tech software engineering vacancies (Python, GenAI, VLSI) represent formal corporate job postings, whereas e-Shram worker registrations track unorganised technical workers (auto-electricians, solar installers, pathology lab assistants).
4. **Interpretation Notice:** These figures must **not** be interpreted as a complete statewide Telangana workforce balance. Where populations are incompatible, the engine explicitly reports `NON_COMPARABLE`.

---

## 6. Analytical Methodology

### Effective Supply Calibration
$$\text{Effective Supply} = \text{Worker Supply}_{\text{registered}} + (\text{Placed Trainees} \times 0.70)$$

### Net Skill Gap
$$\text{Net Gap} = \text{Demand} - \text{Effective Supply}$$

### Comparability Rule
Before any gap is calculated, the system verifies:
- Identical state and district
- Temporal alignment (matching quarterly bounds)
- Population scope compatibility (formal vacancy demand is not subtracted by unorganised registries)

If supply records are unavailable or incompatible, the skill is classified as **Non-Comparable** (`NON_COMPARABLE`). Missing data is never treated as zero.

### Future Demand-Index Pipeline
The direct calculation formula is active in production. An automated composite demand-index pipeline—combining multi-portal job vacancy feeds, deduplicating repeat postings, and mapping keywords to NCO-2015 competency vectors—is currently in architectural specification and is not yet operating in production.

---

## 7. Data Refresh & Integrity Validation

To run the automated data integrity and provenance validation script:

```bash
npm run refresh
```

This command executes `scripts/refresh.ts` to:
- Validate provenance metadata completeness across all datasets.
- Ensure all states and districts strictly match official LGD master directories.
- Check period formatting (`YYYY-Q#` or `YYYY-YY`).
- Verify non-negativity of demand, worker, and training counts.
- Detect duplicate record identifiers.
- Validate regional coverage constraints.

---

## 8. Installation & Local Execution

### Prerequisites
- Node.js (version 20+ recommended)
- npm

### Step-by-Step Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Data Integrity Check:**
   ```bash
   npm run refresh
   ```

3. **Run Development Server (Full-Stack):**
   ```bash
   npm run dev
   ```
   Launches the server on `http://localhost:3000`.

4. **Build for Production:**
   ```bash
   npm run build
   ```

5. **Start Production Server:**
   ```bash
   npm run start
   ```

---

## 9. Known Scope Boundaries

1. **Development Fixtures:** Demand records are testing fixtures pending primary raw source ingestion.
2. **Informal Labor Representation:** Public vacancies reflect formal and tech-enabled hiring; unorganized day-labor exchanges are captured primarily through e-Shram counts.
3. **Historical Observations:** Forecasting requires at least 4 consecutive historical quarters; where observations are $< 4$, forecasts are withheld.
4. **Planning Support:** SkillPulse is designed as an analytical decision-support tool to inform human planners, not replace administrative deliberation.

---

## 10. API Reference

SkillPulse exposes RESTful JSON endpoints designed for evidence-based workforce planning, econometric forecasting, semantic normalization, and conversational intelligence.

### Core Labour-Market Analytics Endpoints

#### 1. `GET /api/overview`
- **Purpose:** Retrieves macro executive dashboard aggregates including total vacancies, registered workforce, count of severe skill shortages, certified training capacity, sector distributions, and quarterly hiring trends.
- **Query Parameters:**
  - `state` *(optional)*: State name (e.g., `Telangana`).
  - `district` *(optional)*: District name (e.g., `Hyderabad`).
  - `sector` *(optional)*: Sector filter (e.g., `IT-ITeS & Software`).
  - `skill` *(optional)*: Normalized skill title.

#### 2. `GET /api/demand`
- **Purpose:** Fetches granular, filtered job vacancy records derived from National Career Service (NCS) filings with salary ranges, reporting quarters, and job roles.
- **Query Parameters:**
  - `state`, `district`, `sector`, `skill`, `period` *(optional)*: Filter attributes.

#### 3. `GET /api/supply`
- **Purpose:** Returns dual-track workforce supply data, clearly distinguishing unorganised registered workers (e-Shram) from institutional accredited training completions (PMKVY / MSDE).
- **Query Parameters:**
  - `state`, `district`, `sector`, `skill` *(optional)*: Location and competency filters.

#### 4. `GET /api/gaps`
- **Purpose:** Computes the canonical Net Skill Gap (`Demand - Effective Supply`) across all comparable skills, applying spatial/temporal comparability validation and assigning classification badges (`SHORTAGE`, `BALANCED`, `OVERSUPPLY`, `NON_COMPARABLE`).
- **Query Parameters:**
  - `state`, `district`, `sector`, `skill`, `period` *(optional)*.
  - `shortageThreshold` *(optional, default: 15)*: Percentage deficit threshold.
  - `oversupplyThreshold` *(optional, default: -15)*: Percentage surplus threshold.

#### 5. `GET /api/forecast`
- **Purpose:** Produces quarterly econometric time-series demand projections. Evaluates candidate models via out-of-sample holdout validation (Holt-Winters vs LightGBM on the FastAPI ML service, with OLS fallback) and computes 95% RMSE prediction intervals.
- **Query Parameters:**
  - `skill` *(required)*: Normalized skill name (e.g., `Python Development`).
  - `state` *(required)*: State name (e.g., `Telangana`).
  - `district` *(required)*: District name (e.g., `Hyderabad`).
  - `horizon` *(optional, default: 4)*: Forecast horizon in quarters.

#### 6. `GET /api/recommendations`
- **Purpose:** Delivers institutional training advisories and recommended seat expansion ranges for accredited providers based on projected shortages and baseline placement rates.
- **Query Parameters:**
  - `skill` *(required)*, `state` *(required)*, `district` *(required)*.

#### 7. `POST /api/simulate`
- **Purpose:** Powers the interactive What-If Simulator. Models post-intervention supply, remaining unmet shortage, and gap reduction percentage when additional training seats are introduced. Supports both observed placement outcomes and mathematical capacity scenario modes.
- **Request Body (JSON):**
  - `skill` *(string, required)*: Target skill name.
  - `state` *(string, required)*: Administrative state.
  - `district` *(string, required)*: Administrative district.
  - `additionalCapacity` *(number, required)*: Simulated trainee seats to add (e.g., `1000`).

#### 8. `POST /api/priority` & `GET /api/priority`
- **Purpose:** Evaluates and ranks local skills by labor market intervention urgency using a multi-criteria index (Demand Growth, Projected Gap, Current Shortage, Training Availability).
- **Parameters / Body (JSON):**
  - `state`, `district` *(required)*: Geographic area.
  - `period` *(optional)*: Target quarter.
  - `weights` *(optional)*: User-configurable weighting object `{ demandGrowth, projectedGap, currentShortage, trainingAvailability }`.

#### 9. `GET /api/locations`
- **Purpose:** Returns geospatial cluster metadata, district coordinates, total vacancies, active workforce counts, and prominent shortages for interactive vector map rendering.
- **Query Parameters:**
  - `state`, `district` *(optional)*.

### Skill Normalization, Reskilling & Data Quality Endpoints

#### 10. `GET /api/skills/mappings`
- **Purpose:** Retrieves the active taxonomy mapping dictionary connecting industry job titles and raw keyword tags to canonical NCO-2015 occupational standards.

#### 11. `POST /api/skills/match`
- **Purpose:** Semantic skill-to-NCO normalization engine. Generates 768-dimensional Gemini embeddings for arbitrary raw skill terms, computes cosine similarities against 3,445 cached NCO-2015 occupations, executes domain-aware hierarchy reranking, and applies the strict acceptance threshold ($\ge 0.75 \to \text{accepted}$, $< 0.75 \to \text{needs\_review}$).
- **Request Body (JSON):**
  - `rawSkill` *(string, required)*: Raw input text (e.g., `"Python Scripting"`).

#### 12. `GET /api/reskill`
- **Purpose:** Embedding-based reskilling recommendation engine. For verified surplus skills (`OVERSUPPLY`), calculates semantic proximity using Gemini embeddings to identify the top 3 adjacent target skills facing active shortages within the exact same district.
- **Query Parameters:**
  - `state` *(required)*: State name (e.g., `Maharashtra`).
  - `district` *(required)*: District name (e.g., `Pune`).
  - `skill` *(required)*: Surplus skill (e.g., `CNC Precision Machining & Programming`).

#### 13. `GET /api/anomalies`
- **Purpose:** Statistical Quarter-on-Quarter (QoQ) anomaly detector. Analyzes historical delta shifts ($\Delta_t = \text{value}_t - \text{value}_{t-1}$) and flags observations deviating $> 3\sigma$ from normal historical variation with small-data ($\ge 4$ transitions) safety.
- **Query Parameters:**
  - `state`, `district`, `skill` *(optional)*.

#### 14. `POST /api/assistant/chat`
- **Purpose:** Autonomous labour-market conversational assistant powered by `gemini-3.8-flash` with native function-calling tools (`getGaps`, `getForecast`, `simulate`, `getPriority`, `getDemand`), server-side grounding, and source citation chips.
- **Request Body (JSON):**
  - `message` *(string, required)*: User question (e.g., `"What are the skill gaps in Hyderabad?"`).
  - `history` *(array, optional)*: Prior conversational turn history `[{ role: "user" | "model", text: string }]`.
