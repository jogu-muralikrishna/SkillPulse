# National Classification of Occupations 2015 (NCO-2015) — Raw Source Documentation

## 1. Authoritative Source Overview
The National Classification of Occupations 2015 (NCO-2015) is the official occupational classification standard released by the **Directorate General of Employment (DGE)**, **Ministry of Labour & Employment (MoLE)**, Government of India. It aligns national occupational codes with the International Standard Classification of Occupations 2008 (ISCO-08).

- **Official Source Portal:** [https://www.dge.gov.in/nco-2015](https://www.dge.gov.in/nco-2015)
- **Publishing Authority:** Directorate General of Employment (DGE), Ministry of Labour & Employment, Government of India
- **Access / Download Date:** 2026-10-07

---

## 2. Source Documents & Download URLs
The authoritative publication comprises three primary PDF volumes:

| Document Filename | Official DGE Source URL | Description |
| :--- | :--- | :--- |
| `National_Classification_of_Occupations_Vol_I-2015.pdf` | `https://www.dge.gov.in/sites/default/files/2024-05/National_Classification_of_Occupations_Vol_I-2015.pdf` | Volume I: Structure, Concordance Table, and Alphabetical Index |
| `National_Classification_of_Occupations_Vol_II-A-2015.pdf` | `https://www.dge.gov.in/sites/default/files/2024-05/National_Classification_of_Occupations_Vol_II-A-2015.pdf` | Volume II-A: Occupational Descriptions (Divisions 1 to 5) |
| `National_Classification_of_Occupations_Vol_II-B-2015.pdf` | `https://www.dge.gov.in/sites/default/files/2024-05/National_Classification_of_Occupations_Vol_II-B-2015.pdf` | Volume II-B: Occupational Descriptions (Divisions 6 to 9) |

---

## 3. Automated Extraction Process
The ingestion pipeline is implemented in [`scripts/importNco2015.ts`](../../scripts/importNco2015.ts) and executed via:

```bash
npm run nco:import
```

### Pipeline Workflow:
1. **Idempotent Acquisition:** Checks if source volumes already exist in `data/raw/nco2015/`. If absent or corrupted, downloads them directly from authoritative DGE servers over HTTPS (bypassing intermediate/third-party mirrors).
2. **Checksum Verification:** Computes SHA-256 cryptographic hashes for all downloaded PDF artifacts.
3. **Structured PDF Parsing:** Ingests `National_Classification_of_Occupations_Vol_I-2015.pdf` via `pdf-parse`:
   - Specifically bounds extraction to the **Concordance Table** (Pages 33 through 238, character range strictly terminating prior to page 239 where the Alphabetical Index starts, avoiding duplication).
   - Tracks 1-digit Divisions, 2-digit Sub-Divisions, 3-digit Groups, and 4-digit Families sequentially.
   - Extracts 8-digit occupation codes matching the regex `^(\d{4}\.\d{4})\s+(.+)$`.
   - Strips trailing 4-digit NCO-2004 concordance references (e.g., `2132.10`).
   - Accurately joins multi-line wrapped titles across soft linebreaks.
4. **Catalogue Validation:**
   - Validates that every code adheres to the 8-digit `YYYY.NNNN` structure.
   - Asserts non-empty titles.
   - Enforces 100% uniqueness of codes and code-title pairs.
   - Verifies NCO-2015 standard compliance.
   - Validates the presence of key occupation families, including genuine software and developer occupations (`2512.*`).
5. **Derivative Output Generation:**
   - Writes `data/nco2015/occupations.json`
   - Writes `data/nco2015/provenance.json`

---

## 4. Derivative Dataset Notice
> [!IMPORTANT]
> The generated file `data/nco2015/occupations.json` is a **locally normalized derivative dataset** extracted programmatically from the official DGE publication PDFs. It is **NOT** an official Ministry of Labour & Employment JSON distribution file (as the Ministry publishes only PDF documents).

---

## 5. Output Files

- **`data/nco2015/occupations.json`**: Normalized array of occupation records containing:
  - `code`: 8-digit NCO-2015 identifier (e.g. `2512.0100`)
  - `title`: Standard occupational title (e.g. `Computer Programmer/Software Engineer`)
  - `division`: Hierarchy Division string (e.g. `Division 2 Professionals`)
  - `subDivision`: Hierarchy Sub-Division string
  - `group`: Hierarchy Group string
  - `family`: Hierarchy Family string
  - `classification`: `"NCO-2015"`
  - `source`: `"Directorate General of Employment (DGE), Ministry of Labour & Employment"`
  - `sourceUrl`: Direct DGE publication link
- **`data/nco2015/provenance.json`**: Machine-readable metadata audit including download timestamps, file sizes, SHA-256 checksums, and extraction stats.

---

## 6. Known Limitations
1. **Source Document Format:** Official NCO-2015 tables are published only as scanned/typeset PDF files by DGE rather than machine-readable CSV/JSON/API endpoints.
2. **Volumes II-A and II-B:** Occupational descriptive task narratives, educational levels, and skill definitions reside in Volumes II-A and II-B. The current Phase 2A catalogue extracts the core hierarchical structure and occupation codes from Volume I. Detailed descriptive text may be extracted in subsequent iterations if required.
3. **Typesetting Kerning & Wrapping:** OCR/PDF text extraction relies on layout heuristics in the Concordance Table. Any non-standard formatting in rare edge cases has been normalized to single whitespace.
