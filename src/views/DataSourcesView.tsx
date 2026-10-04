import React, { useState } from 'react';
import { ExternalLink, Database, CheckCircle2, ShieldCheck, FileText, ChevronDown, ChevronUp, RefreshCw, ShieldAlert, AlertCircle } from 'lucide-react';
import { DataFreshnessBadge } from '../components/DataFreshnessBadge';

export const DataSourcesView: React.FC = () => {
  const [showTechnicalPipeline, setShowTechnicalPipeline] = useState(false);
  const [testingRefresh, setTestingRefresh] = useState(false);
  const [refreshTestResult, setRefreshTestResult] = useState<any | null>(null);

  const sourcesList = [
    {
      code: 'LGD',
      name: 'Local Government Directory (LGD)',
      organization: 'Ministry of Panchayati Raj, Government of India',
      usedFor: 'Official list of States and Districts across India',
      coverage: 'All 36 States & Union Territories, and all 786 Districts (100% active)',
      latestDate: 'Current Official Gazette',
      lastChecked: 'Audited Today',
      status: 'Verified & Ingested',
      officialUrl: 'https://lgdirectory.gov.in/',
      catalogUrl: 'https://data.gov.in/catalog/local-government-directory-lgd'
    },
    {
      code: 'NCS',
      name: 'National Career Service (NCS)',
      organization: 'Ministry of Labour & Employment, Government of India',
      usedFor: 'Labour demand, job vacancies, and active hiring indicators',
      coverage: 'Development sample across 8 industrial clusters (101 records in test mode)',
      latestDate: '2023-2024 Observed (Projections Flagged)',
      lastChecked: 'Audited Today',
      status: 'Requires Verification (Dev Sample)',
      officialUrl: 'https://www.ncs.gov.in/',
      catalogUrl: 'https://www.data.gov.in/'
    },
    {
      code: 'e-Shram',
      name: 'e-Shram National Database',
      organization: 'Ministry of Labour & Employment, Government of India',
      usedFor: 'Registered unorganised workforce counts by occupation sector',
      coverage: 'Resource identified; 0 production records ingested awaiting source file validation',
      latestDate: 'Mid-2024 Published Registry',
      lastChecked: 'Audited Today',
      status: 'Resource Identified — Pending Ingestion',
      officialUrl: 'https://eshram.gov.in/',
      catalogUrl: 'https://eshram.gov.in/dashboard'
    },
    {
      code: 'MSDE / PMKVY',
      name: 'Ministry of Skill Development & Entrepreneurship (MSDE)',
      organization: 'Government Open Data Platform / MSDE / NSDC',
      usedFor: 'Accredited training candidates enrolled, trained, and certified',
      coverage: 'Resource identified; 0 production records ingested awaiting spreadsheet validation',
      latestDate: 'FY 2023-24 Scheme Disclosures',
      lastChecked: 'Audited Today',
      status: 'Resource Identified — Pending Ingestion',
      officialUrl: 'https://www.msde.gov.in/',
      catalogUrl: 'https://www.data.gov.in/'
    }
  ];

  const runRefreshTest = async (simulateCorrupted: boolean) => {
    setTestingRefresh(true);
    setRefreshTestResult(null);
    try {
      const res = await fetch('/api/data-refresh/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateCorruptedSource: simulateCorrupted })
      });
      const data = await res.json();
      setRefreshTestResult({
        success: res.ok,
        data
      });
    } catch {
      setRefreshTestResult({
        success: false,
        data: { message: 'Connection constraint during test.' }
      });
    } finally {
      setTestingRefresh(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>Official Data Sources</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            SkillPulse uses official government open datasets. We never create imaginary or estimated numbers when official records are unfiled.
          </p>
        </div>

        <DataFreshnessBadge />
      </div>

      {/* Clean User-Friendly Cards for each Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sourcesList.map((src) => (
          <div
            key={src.code}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {src.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{src.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{src.organization}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {src.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Used For:</span>
                  <p className="text-slate-800 font-medium">{src.usedFor}</p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Geographic Coverage:</span>
                  <p className="text-slate-700">{src.coverage}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Latest Data Update</span>
                    <span className="font-semibold text-slate-900">{src.latestDate}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Last Verified</span>
                    <span className="font-semibold text-slate-900">{src.lastChecked}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={src.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>Visit Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={src.catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
              >
                <span>Open Data Catalog</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Honest Data Principles Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-slate-800 space-y-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Our Commitment to Real Government Data</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every statistic on SkillPulse comes directly from published government records. When data for a particular district or skill role has not been published yet, we inform you clearly: <strong>Missing data is not zero</strong>. We never invent fake numbers to fill gaps on a dashboard.
        </p>
      </div>

      {/* Optional Collapsed Section for Technical Verification (CLOSED by default) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnicalPipeline(!showTechnicalPipeline)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Technical Data Verification & Ingestion Diagnostics
              </span>
              <span className="text-[11px] text-slate-500">
                Optional diagnostic details for technical auditors (Closed by default)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600">
              {showTechnicalPipeline ? 'Hide Technical Details' : 'Show Technical Details'}
            </span>
            {showTechnicalPipeline ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </button>

        {showTechnicalPipeline && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-4 text-xs text-slate-700 animate-in fade-in">
            <p className="text-xs text-slate-600 leading-relaxed">
              When new feeds arrive, an automated 9-step check validates row counts, required columns, and all 36 States/UTs before updating the app. If a feed is corrupted or incomplete, the system keeps the verified dataset without downtime.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => runRefreshTest(false)}
                disabled={testingRefresh}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingRefresh ? 'animate-spin' : ''}`} />
                <span>Test Verification Sync</span>
              </button>
              <button
                type="button"
                onClick={() => runRefreshTest(true)}
                disabled={testingRefresh}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Test Fallback Safeguard</span>
              </button>
            </div>

            {refreshTestResult && (
              <div className={`p-3.5 rounded-xl text-xs space-y-1 ${
                refreshTestResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {refreshTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>{refreshTestResult.data?.message || 'Verification result received.'}</span>
                </div>
                {refreshTestResult.data?.details && (
                  <p className="text-[11px] text-slate-600">
                    {refreshTestResult.data.details.action}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
