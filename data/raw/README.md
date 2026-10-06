# SkillPulse Raw Source Data Manifest

This document records the authoritative source links, public data access points, and the actual existence status of raw source artifacts for the SkillPulse platform.

## Policy & Ground Truth

SkillPulse maintains strict separation between **verified administrative masters**, **empirical government disclosures**, and **development/testing fixtures**.

- **No fabricated raw files:** SkillPulse does NOT invent or simulate downloaded CSVs, Excel files, or raw database dumps.
- **Explicit artifact availability:** Where primary source data exists only as structured in-repo fixtures or official publications rather than raw batch downloads, this status is explicitly stated below.

---

## 1. Local Government Directory (LGD) — Administrative Geography

- **Publishing Authority:** Ministry of Panchayati Raj (MoPR), Government of India
- **Official Portal:** [https://lgdirectory.gov.in/](https://lgdirectory.gov.in/)
- **data.gov.in Catalog:** [https://www.data.gov.in/catalog/local-government-directory-lgd](https://www.data.gov.in/catalog/local-government-directory-lgd)
- **Reference Publication:** Official Gazette & LGD Master Database (28 States, 8 UTs, 786 Districts)
- **Access Date:** 2026-10-04
- **Raw Artifact in Repo:** `src/data/masterGeography.ts` (786 official districts mapped with canonical IDs and LGD codes), `src/data/india_states_boundaries.json`, and `src/data/india_districts_clean.json`.
- **Status:** **VERIFIED & INGESTED** (Administrative geography master).

---

## 2. National Career Service (NCS) — Labour Vacancies & Employer Demand

- **Publishing Authority:** Ministry of Labour & Employment (MoLE), Government of India
- **Official Portal:** [https://www.ncs.gov.in/](https://www.ncs.gov.in/)
- **data.gov.in Catalog:** [https://www.data.gov.in/](https://www.data.gov.in/) (Search: "National Career Service monthly vacancies")
- **Reference Publication:** NCS Monthly Vacancies Bulletins & Public Job Market Research
- **Access Date:** 2026-10-04
- **Raw Artifact in Repo:** **UNAVAILABLE** (No raw CSV, JSON, or SQL export exists in the repository).
- **Current Data Representation:** `src/data/demandData.ts` contains 101 development and testing fixtures covering 8 urban clusters (with Telangana demand covering Hyderabad only). Quarters $\ge 2025$ are forward statistical projections tagged with `is_forecast: true`.
- **Status:** **DEVELOPMENT / TESTING FIXTURE (Awaiting primary source raw file ingestion)**.

---

## 3. e-Shram National Worker Database — Unorganised Workforce Registrations

- **Publishing Authority:** Ministry of Labour & Employment (MoLE), Government of India
- **Official Portal:** [https://eshram.gov.in/](https://eshram.gov.in/)
- **Public Dashboard:** [https://eshram.gov.in/dashboard](https://eshram.gov.in/dashboard)
- **Reference Publication:** Parliamentary Unstarred Questions (Rajya Sabha Written Reply July 24, 2025; Lok Sabha July 14, 2026) & PIB National Releases
- **Access Date:** 2026-10-04
- **Raw Artifact in Repo:** **UNAVAILABLE** (No raw e-Shram portal export dump is present in the repository).
- **Current Data Representation:** `src/data/supplyData.ts` contains 15 district-level records representing unorganised registrations (e.g. Visakhapatnam total unorganised count: 600,785, plus occupational approximations under NCO codes for auto-electricians, solar technicians, pathology assistants). Telangana coverage spans 3 districts (Hyderabad, Rangareddy, Medchal-Malkajgiri).
- **Population Scope:** Unorganised workforce only. Corporate IT/software developers are **not** tracked by e-Shram.
- **Status:** **VERIFIED SOURCE / MICRODATA APPROXIMATIONS (Awaiting full raw microdata dump)**.

---

## 4. Pradhan Mantri Kaushal Vikas Yojana (PMKVY) — Training & Capacity Disclosures

- **Publishing Authority:** Ministry of Skill Development & Entrepreneurship (MSDE), Government of India / NSDC
- **Official Portal:** [https://www.msde.gov.in/](https://www.msde.gov.in/)
- **Digital Hub:** [https://www.skillindiadigital.gov.in/](https://www.skillindiadigital.gov.in/)
- **Reference Publication:** Lok Sabha Unstarred Question No. 3504 (10.08.2026) & MSDE PMKK Center Disclosures
- **Access Date:** 2026-10-04
- **Raw Artifact in Repo:** **UNAVAILABLE** (No raw MSDE spreadsheet or database dump is present in the repository).
- **Current Data Representation:** `src/data/trainingData.ts` contains 14 district-level training records. Under PMKVY 4.0, placement tracking was delinked; thus `placedCount` and `certifiedCount` remain undefined where unrecorded by the source. Active PMKK center numbers reflect operational disclosures (e.g. 2 PMKKs in Hyderabad).
- **Status:** **VERIFIED SOURCE / SELECT CLUSTER INGESTION (Awaiting automated portal sync)**.

---

## Summary Matrix

| Dataset | Raw Source File in Repo | Source Status | Population Scope | Geographic Coverage in Repo |
| :--- | :--- | :--- | :--- | :--- |
| **LGD Geography Master** | **Present** (Boundaries & Directory) | Verified & Ingested | Administrative territory | 100% (36 States/UTs, 786 Districts) |
| **NCS Demand** | **Unavailable** | Development/Testing Fixture | Formal job vacancies | 8 urban industrial hubs (Hyderabad in Telangana) |
| **e-Shram Supply** | **Unavailable** | Verified Source / Fixtures | Unorganised workers | 7 districts (3 in Telangana) |
| **PMKVY Training** | **Unavailable** | Verified Source / Fixtures | Accredited trainees | 4 industrial districts |
