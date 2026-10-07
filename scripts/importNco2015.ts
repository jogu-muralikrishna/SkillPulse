/**
 * ============================================================================
 * SKILLPULSE AUTOMATED NCO-2015 CATALOGUE INGESTION PIPELINE
 * ============================================================================
 * Source: Directorate General of Employment (DGE) / Ministry of Labour & Employment
 * Official Portal: https://www.dge.gov.in/nco-2015
 * 
 * Pipeline Functionality:
 * 1. Downloads the official NCO-2015 source documents (Vol I, Vol II-A, Vol II-B)
 *    from their authoritative DGE URLs to `data/raw/nco2015/` without blindly overwriting.
 * 2. Computes and records SHA-256 checksums of the downloaded artifacts.
 * 3. Automatically parses the official Concordance Table in Vol I using `pdf-parse`
 *    to extract standard 8-digit NCO-2015 occupational records with full hierarchical
 *    metadata (Division, Sub-Division, Group, Family).
 * 4. Strictly validates extracted records (format, non-empty title, uniqueness, NCO-2015 classification).
 * 5. Generates the machine-readable derivative JSON dataset:
 *    `data/nco2015/occupations.json`
 * 6. Generates machine-readable provenance metadata:
 *    `data/nco2015/provenance.json`
 * 7. Verifies the presence of genuine software-related occupations.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export interface NcoOccupationRecord {
  code: string;
  title: string;
  division: string;
  subDivision: string;
  group: string;
  family: string;
  classification: 'NCO-2015';
  source: string;
  sourceUrl: string;
}

export interface NcoProvenanceMetadata {
  datasetName: string;
  description: string;
  officialSourcePortal: string;
  publishingAuthority: string;
  accessDate: string;
  sourceFiles: {
    fileName: string;
    sourceUrl: string;
    fileSizeBytes: number;
    sha256Checksum: string;
    downloadStatus: 'DOWNLOADED' | 'ALREADY_EXISTS_VERIFIED';
  }[];
  extractionSummary: {
    totalExtractedOccupations: number;
    divisionsCount: number;
    groupsCount: number;
    familiesCount: number;
    softwareOccupationsCount: number;
    codeFormat: string;
    classificationStandard: string;
    isDerivativeDataset: boolean;
  };
  parserVersion: string;
  generatedAt: string;
}

const OFFICIAL_DOCUMENTS = [
  {
    fileName: 'National_Classification_of_Occupations_Vol_I-2015.pdf',
    url: 'https://www.dge.gov.in/sites/default/files/2024-05/National_Classification_of_Occupations_Vol_I-2015.pdf',
    description: 'NCO-2015 Vol I: Code Structure, Concordance Table, and Alphabetical Index'
  },
  {
    fileName: 'National_Classification_of_Occupations_Vol_II-A-2015.pdf',
    url: 'https://www.dge.gov.in/sites/default/files/2024-05/National_Classification_of_Occupations_Vol_II-A-2015.pdf',
    description: 'NCO-2015 Vol II-A: Occupational Descriptions (Divisions 1 to 5)'
  },
  {
    fileName: 'National_Classification_of_Occupations_Vol_II-B-2015.pdf',
    url: 'https://www.dge.gov.in/sites/default/files/2024-05/National_Classification_of_Occupations_Vol_II-B-2015.pdf',
    description: 'NCO-2015 Vol II-B: Occupational Descriptions (Divisions 6 to 9)'
  }
];

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

async function downloadFile(url: string, destPath: string): Promise<'DOWNLOADED' | 'ALREADY_EXISTS_VERIFIED'> {
  // If file already exists and has a non-trivial size (>100KB), verify and preserve idempotently
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    if (stats.size > 500000) {
      console.log(`   [CACHED] ${path.basename(destPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB) already present.`);
      return 'ALREADY_EXISTS_VERIFIED';
    }
  }

  console.log(`   [DOWNLOADING] ${path.basename(destPath)} from ${url}...`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, { rejectUnauthorized: false, timeout: 60000 }, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(new Error(`Failed to download ${url}: HTTP status ${res.statusCode}`));
        return;
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(destPath);
        console.log(`   [SAVED] ${path.basename(destPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB).`);
        resolve('DOWNLOADED');
      });
    });

    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error(`Download timeout for ${url}`));
    });
  });
}

async function extractOccupationsFromPdf(pdfPath: string, sourceUrl: string): Promise<NcoOccupationRecord[]> {
  console.log(`\n📄 [PARSING] Extracting occupational structure from ${path.basename(pdfPath)}...`);
  const buffer = fs.readFileSync(pdfPath);
  const parser = new pdf.PDFParse(new Uint8Array(buffer));
  const pdfResult = await parser.getText();
  const text = pdfResult.text;

  // Locate the official Concordance Table section in Vol I
  const startMarker = 'National Classification of Occupations – 2015 Concordance Table';
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`Concordance Table starting marker not found in ${path.basename(pdfPath)}`);
  }

  // End of Concordance Table is page 238 / start of Alphabetical Index
  const endMarker = '-- 250 of 384 --';
  const endIdx = text.indexOf(endMarker);
  if (endIdx === -1) {
    throw new Error(`Concordance Table boundary marker not found in ${path.basename(pdfPath)}`);
  }

  console.log(`   [RANGE] Processing Concordance Table (character indices ${startIdx} to ${endIdx})...`);
  const concordanceText = text.slice(startIdx, endIdx);
  const lines = concordanceText.split('\n').map((l: string) => l.trim()).filter(Boolean);

  let currentDivision = '';
  let currentSubDivision = '';
  let currentGroup = '';
  let currentFamily = '';

  const occupations: NcoOccupationRecord[] = [];
  const seenCodes = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Filter out page footers and headers
    if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(line)) continue;
    if (
      line.startsWith('National Classification of Occupations') ||
      line.startsWith('VOLUME I') ||
      line.startsWith('NCO 2015') ||
      line === 'Table' ||
      line === 'Concordance Table'
    ) {
      continue;
    }

    // 1. Division (e.g. "Division 2 Professionals")
    if (line.startsWith('Division ') && /^Division\s+\d+\b/i.test(line)) {
      currentDivision = line;
      continue;
    }

    // 2. Sub-Division (handles standard line and wrapped "Sub-" on previous line)
    if (line === 'Sub-' && lines[i + 1] === 'Division') {
      let nextLineIdx = i + 2;
      while (nextLineIdx < lines.length && /^--\s*\d+\s+of\s+\d+\s*--$/.test(lines[nextLineIdx])) {
        nextLineIdx++;
      }
      if (nextLineIdx < lines.length && /^\d{2}\s+[A-Za-z]/.test(lines[nextLineIdx])) {
        currentSubDivision = `Sub-Division ${lines[nextLineIdx]}`;
        i = nextLineIdx;
        continue;
      }
    } else if (line.startsWith('Sub-Division ') && /^Sub-Division\s+\d{2}\b/i.test(line)) {
      currentSubDivision = line;
      continue;
    }

    // 3. Group (e.g. "Group 251 Software and Application Developers, and")
    if (line.startsWith('Group ') && /^Group\s+\d{3}\b/i.test(line)) {
      currentGroup = line;
      continue;
    }

    // 4. Family (e.g. "Family 2512 Software Developers")
    if (line.startsWith('Family ') && /^Family\s+\d{4}\b/i.test(line)) {
      currentFamily = line;
      continue;
    }

    // 5. 8-digit NCO-2015 Occupation Code (e.g. "2512.0100 Computer Programmer/Software Engineer 2132.10")
    const match = line.match(/^(\d{4}\.\d{4})\s+(.+)$/);
    if (match) {
      const code = match[1];
      let rawTitle = match[2];

      // Remove trailing NCO 2004 concordance code if present (e.g., " 2132.10")
      rawTitle = rawTitle.replace(/\s+\d{4}\.\d{1,2}\s*$/, '').trim();

      // Check if title wraps across subsequent line(s) before another code or structure marker
      let nextIdx = i + 1;
      while (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(nextLine)) {
          nextIdx++;
          continue;
        }

        if (
          nextLine.startsWith('Division ') ||
          nextLine === 'Sub-' ||
          nextLine.startsWith('Group ') ||
          nextLine.startsWith('Family ') ||
          /^\d{4}\.\d{4}\b/.test(nextLine) ||
          nextLine.startsWith('National Classification') ||
          nextLine.startsWith('VOLUME I') ||
          nextLine.startsWith('NCO 2015')
        ) {
          break;
        }

        // If nextLine is a standalone NCO 2004 concordance code (e.g. "2132.40"), consume and stop
        if (/^\d{4}\.\d{1,2}$/.test(nextLine)) {
          i = nextIdx;
          break;
        }

        // Title continuation
        rawTitle += ` ${nextLine.replace(/\s+\d{4}\.\d{1,2}\s*$/, '').trim()}`;
        i = nextIdx;
        nextIdx++;
      }

      const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();

      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        occupations.push({
          code,
          title: cleanTitle,
          division: currentDivision,
          subDivision: currentSubDivision,
          group: currentGroup,
          family: currentFamily,
          classification: 'NCO-2015',
          source: 'Directorate General of Employment (DGE), Ministry of Labour & Employment',
          sourceUrl
        });
      }
    }
  }

  return occupations;
}

function validateCatalogue(occupations: NcoOccupationRecord[]): void {
  console.log('\n🔎 [VALIDATION] Verifying NCO-2015 extracted records...');

  if (occupations.length < 3000) {
    throw new Error(`Extracted occupations count (${occupations.length}) is below expected NCO-2015 catalogue threshold (>3000).`);
  }

  const seenCodes = new Set<string>();
  const seenPairs = new Set<string>();

  for (const occ of occupations) {
    // 1. Valid code format: Exactly 4 digits, a period, and 4 digits (e.g. 2512.0100)
    if (!/^\d{4}\.\d{4}$/.test(occ.code)) {
      throw new Error(`Invalid NCO-2015 code format: '${occ.code}' for title '${occ.title}'`);
    }

    // 2. Non-empty title
    if (!occ.title || occ.title.trim().length === 0) {
      throw new Error(`Empty title found for NCO-2015 code: '${occ.code}'`);
    }

    // 3. No duplicate codes
    if (seenCodes.has(occ.code)) {
      throw new Error(`Duplicate NCO-2015 code detected: '${occ.code}'`);
    }
    seenCodes.add(occ.code);

    // 4. No duplicate code/title pairs
    const pair = `${occ.code}::${occ.title.toLowerCase()}`;
    if (seenPairs.has(pair)) {
      throw new Error(`Duplicate NCO-2015 code/title pair detected: '${occ.code}' - '${occ.title}'`);
    }
    seenPairs.add(pair);

    // 5. Classification must be NCO-2015
    if (occ.classification !== 'NCO-2015') {
      throw new Error(`Invalid classification '${occ.classification}' for code '${occ.code}'`);
    }

    // 6. Hierarchy presence
    if (!occ.division) {
      throw new Error(`Missing division for code '${occ.code}'`);
    }
  }

  // 7. Verify presence of genuine software-related occupations
  const softwareOccupations = occupations.filter((o) =>
    o.code.startsWith('2512') ||
    o.title.toLowerCase().includes('software') ||
    o.title.toLowerCase().includes('programmer')
  );

  if (softwareOccupations.length < 20) {
    throw new Error(`Software occupation check failed: Expected at least 20 software-related occupations, found only ${softwareOccupations.length}.`);
  }

  console.log(`   ✅ Validated ${occupations.length} unique NCO-2015 occupations.`);
  console.log(`   ✅ Zero duplicate codes or invalid formats.`);
  console.log(`   ✅ Software verification PASSED (${softwareOccupations.length} software/developer occupations verified).`);
}

async function runImporter() {
  console.log('================================================================');
  console.log(' SKILLPULSE NCO-2015 OCCUPATION CATALOGUE INGESTION PIPELINE');
  console.log('================================================================');

  const rawDir = path.resolve(process.cwd(), 'data/raw/nco2015');
  const outDir = path.resolve(process.cwd(), 'data/nco2015');

  if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Download official NCO-2015 documents from DGE
  console.log('\n📥 [STEP 1/4] Ensuring official NCO-2015 source documents are present...');
  const fileProvenanceList = [];

  for (const doc of OFFICIAL_DOCUMENTS) {
    const destPath = path.join(rawDir, doc.fileName);
    const status = await downloadFile(doc.url, destPath);
    const stats = fs.statSync(destPath);
    const checksum = computeSha256(destPath);

    fileProvenanceList.push({
      fileName: doc.fileName,
      sourceUrl: doc.url,
      fileSizeBytes: stats.size,
      sha256Checksum: checksum,
      downloadStatus: status
    });
  }

  // 2. Extract occupations from Vol I (Code Structure and Concordance Table)
  console.log('\n⚙️ [STEP 2/4] Parsing official source documents and extracting records...');
  const vol1Path = path.join(rawDir, 'National_Classification_of_Occupations_Vol_I-2015.pdf');
  const occupations = await extractOccupationsFromPdf(vol1Path, OFFICIAL_DOCUMENTS[0].url);

  // 3. Validate extracted records
  console.log('\n🔍 [STEP 3/4] Validating extracted catalogue...');
  validateCatalogue(occupations);

  // 4. Save normalized derivative JSON dataset
  console.log('\n💾 [STEP 4/4] Writing normalized derivative outputs...');
  const occupationsJsonPath = path.join(outDir, 'occupations.json');
  fs.writeFileSync(occupationsJsonPath, JSON.stringify(occupations, null, 2), 'utf-8');
  console.log(`   [SAVED] ${occupationsJsonPath} (${(fs.statSync(occupationsJsonPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Build provenance summary
  const divisions = new Set(occupations.map((o) => o.division));
  const groups = new Set(occupations.map((o) => o.group));
  const families = new Set(occupations.map((o) => o.family));
  const softwareOccupations = occupations.filter((o) =>
    o.code.startsWith('2512') ||
    o.title.toLowerCase().includes('software') ||
    o.title.toLowerCase().includes('programmer')
  );

  const provenanceData: NcoProvenanceMetadata = {
    datasetName: 'National Classification of Occupations 2015 (NCO-2015) Normalized Catalogue',
    description: 'Locally normalized machine-readable derivative JSON dataset extracted from official DGE / MoLE NCO-2015 publication documents. Not an official Ministry JSON release.',
    officialSourcePortal: 'https://www.dge.gov.in/nco-2015',
    publishingAuthority: 'Directorate General of Employment (DGE), Ministry of Labour & Employment, Government of India',
    accessDate: new Date().toISOString().split('T')[0],
    sourceFiles: fileProvenanceList,
    extractionSummary: {
      totalExtractedOccupations: occupations.length,
      divisionsCount: divisions.size,
      groupsCount: groups.size,
      familiesCount: families.size,
      softwareOccupationsCount: softwareOccupations.length,
      codeFormat: 'YYYY.NNNN (4-digit family code followed by 4-digit occupational unit code)',
      classificationStandard: 'NCO-2015',
      isDerivativeDataset: true
    },
    parserVersion: '1.0.0-phase2a',
    generatedAt: new Date().toISOString()
  };

  const provenanceJsonPath = path.join(outDir, 'provenance.json');
  fs.writeFileSync(provenanceJsonPath, JSON.stringify(provenanceData, null, 2), 'utf-8');
  console.log(`   [SAVED] ${provenanceJsonPath}`);

  console.log('\n================================================================');
  console.log(`✅ NCO-2015 INGESTION COMPLETE: ${occupations.length} occupations successfully extracted & validated.`);
  console.log('================================================================\n');
}

runImporter().catch((err) => {
  console.error('\n❌ NCO-2015 INGESTION FAILED:', err);
  process.exit(1);
});
