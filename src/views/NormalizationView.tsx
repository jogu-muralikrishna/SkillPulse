import React, { useEffect, useState } from 'react';
import {
  GitFork,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw
} from 'lucide-react';
import { SkillMapping, MATCH_ACCEPTANCE_THRESHOLD, classifyMatchStatus } from '../types';

export const NormalizationView: React.FC = () => {
  const [mappings, setMappings] = useState<SkillMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'accepted' | 'needs_review'>('all');

  // Interactive Live Skill Match Tester
  const [testSkillInput, setTestSkillInput] = useState('Python Scripting');
  const [testSectorInput, setTestSectorInput] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Add form drawer state
  const [showAddForm, setShowAddForm] = useState(false);
  const [rawSkill, setRawSkill] = useState('');
  const [normalizedSkill, setNormalizedSkill] = useState('');
  const [sector, setSector] = useState('IT-ITeS & Software');
  const [source, setSource] = useState('User Configured Mapping');
  const [submitting, setSubmitting] = useState(false);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/skills/mappings');
      const json = await res.json();
      setMappings(json.mappings || []);
    } catch (err) {
      console.error('Error fetching mappings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleTestMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSkillInput.trim()) return;

    try {
      setTesting(true);
      setTestError(null);
      const res = await fetch('/api/skills/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: testSkillInput.trim(),
          sector: testSectorInput || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to match skill');
      }
      setTestResult(data);
    } catch (err: any) {
      setTestError(err.message || 'Failed to execute semantic match');
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  };

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawSkill.trim() || !normalizedSkill.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/skills/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawSkill, normalizedSkill, sector, source })
      });
      if (res.ok) {
        setRawSkill('');
        setNormalizedSkill('');
        setShowAddForm(false);
        fetchMappings();
      }
    } catch (err) {
      console.error('Failed to add mapping:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Status computation and tab counts
  const totalCount = mappings.length;
  const acceptedCount = mappings.filter(
    (m) => (m.matchStatus === 'accepted' || (m.confidence !== undefined && m.confidence >= MATCH_ACCEPTANCE_THRESHOLD))
  ).length;
  const needsReviewCount = mappings.filter(
    (m) => (m.matchStatus === 'needs_review' || (m.confidence !== undefined && m.confidence < MATCH_ACCEPTANCE_THRESHOLD))
  ).length;

  // Filter by tab and search
  const filteredMappings = mappings.filter((m) => {
    const isAccepted = m.matchStatus === 'accepted' || (m.confidence !== undefined && m.confidence >= MATCH_ACCEPTANCE_THRESHOLD);

    if (activeTab === 'accepted' && !isAccepted) return false;
    if (activeTab === 'needs_review' && isAccepted) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.rawSkill.toLowerCase().includes(q) ||
      (m.ncoCode && m.ncoCode.toLowerCase().includes(q)) ||
      (m.ncoTitle && m.ncoTitle.toLowerCase().includes(q)) ||
      m.normalizedSkill.toLowerCase().includes(q) ||
      m.sector.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GitFork className="w-6 h-6 text-indigo-600" />
            <span>Skill Normalization & NCO-2015 Semantic Mapping</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Matches raw job posting skills against the 3,445 official National Classification of Occupations 2015 (NCO-2015) catalogue using Gemini embeddings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMappings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Refresh Mappings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Editor' : 'Add Custom Mapping'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Mappings
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-500 font-medium">skills evaluated</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Aligned with NCO-2015 8-digit unit codes
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Accepted Matches (≥ 75%)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{acceptedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">
              ({totalCount > 0 ? ((acceptedCount / totalCount) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> High semantic alignment
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/30">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Needs Review (&lt; 75%)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{needsReviewCount}</span>
            <span className="text-xs text-amber-600 font-medium">
              ({totalCount > 0 ? ((needsReviewCount / totalCount) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {needsReviewCount} {needsReviewCount === 1 ? 'skill needs' : 'skills need'} review
          </span>
        </div>
      </div>

      {/* Review Rule Alert Banner */}
      {needsReviewCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Active Review Requirement:</strong> {needsReviewCount} skills have semantic cosine similarity below the 0.75 threshold and are classified as <strong>Needs Review</strong>. Low-confidence matches are transparently flagged to prevent flawed policy classifications.
          </div>
        </div>
      )}

      {/* Live Interactive Skill Matcher Probe */}
      <div className="p-5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-3 bg-gradient-to-br from-indigo-50/30 via-white to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
              Live NCO-2015 Semantic Matcher Probe
            </h2>
          </div>
          <span className="text-[11px] text-indigo-600 font-mono">gemini-embedding-2 (768 dims)</span>
        </div>
        <p className="text-xs text-slate-600">
          Test any raw skill or job posting phrase to calculate real cosine similarity against the 3,445 NCO-2015 occupations.
        </p>
        <form onSubmit={handleTestMatch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="e.g. Python Scripting, Solar Panel Installer, Dialysis Nurse..."
              value={testSkillInput}
              onChange={(e) => setTestSkillInput(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-900"
            />
          </div>
          <div className="w-full sm:w-56">
            <select
              value={testSectorInput}
              onChange={(e) => setTestSectorInput(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="">Auto-Detect Sector</option>
              <option value="IT-ITeS & Software">IT-ITeS & Software</option>
              <option value="Automotive & EV Technology">Automotive & EV Technology</option>
              <option value="Electronics & Semiconductors">Electronics & Semiconductors</option>
              <option value="Healthcare & Allied Medical">Healthcare & Allied Medical</option>
              <option value="Renewable Energy & Green Jobs">Renewable Energy & Green Jobs</option>
              <option value="Manufacturing & Capital Goods">Manufacturing & Capital Goods</option>
              <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
              <option value="Construction & Infrastructure">Construction & Infrastructure</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={testing}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {testing ? 'Matching...' : 'Run Match Probe'}
          </button>
        </form>

        {testError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
            {testError}
          </div>
        )}

        {testResult && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900 font-mono">
                &ldquo;{testResult.rawSkill}&rdquo;
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                    testResult.matchStatus === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {testResult.matchStatus === 'accepted' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {testResult.matchStatus === 'accepted' ? 'ACCEPTED' : 'NEEDS REVIEW'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800">
                  Confidence: {(testResult.confidence * 100).toFixed(2)}% ({testResult.confidence.toFixed(4)})
                </span>
                {testResult.semanticConfidence !== undefined && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-600 bg-slate-200/70 border border-slate-300">
                    Raw Cosine: {(testResult.semanticConfidence * 100).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-700 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Matched NCO Code</span>
                <span className="font-mono font-bold text-indigo-700">{testResult.ncoCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Official Occupation Title</span>
                <span className="font-semibold text-slate-900">{testResult.ncoTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Occupational Family</span>
                <span className="text-slate-600">{testResult.ncoFamily}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Target Sector</span>
                <span className="text-slate-600 font-medium">{testResult.sector || 'Neutral / Inferred'}</span>
              </div>
            </div>

            {testResult.explanation && (
              <div className="mt-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">
                  <strong>Disambiguation Rationale:</strong> {testResult.explanation}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Mapping Drawer (Optional Manual Add) */}
      {showAddForm && (
        <form onSubmit={handleAddMapping} className="p-5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
            Add New Transparent Mapping Entry
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Raw Skill Tag</label>
              <input
                type="text"
                required
                placeholder="e.g. EV Battery Servicing"
                value={rawSkill}
                onChange={(e) => setRawSkill(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Normalized Skill</label>
              <input
                type="text"
                required
                placeholder="e.g. EV Powertrain Diagnostics"
                value={normalizedSkill}
                onChange={(e) => setNormalizedSkill(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="IT-ITeS & Software">IT-ITeS & Software</option>
                <option value="Automotive & EV Technology">Automotive & EV Technology</option>
                <option value="Electronics & Semiconductors">Electronics & Semiconductors</option>
                <option value="Healthcare & Allied Medical">Healthcare & Allied Medical</option>
                <option value="Renewable Energy & Green Jobs">Renewable Energy & Green Jobs</option>
                <option value="Manufacturing & Capital Goods">Manufacturing & Capital Goods</option>
                <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                <option value="Construction & Infrastructure">Construction & Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Source Tag</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Mapping'}
            </button>
          </div>
        </form>
      )}

      {/* Main Table Card with Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          {/* Tabs: All / Accepted / Needs Review */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'accepted'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Accepted ({acceptedCount})
            </button>
            <button
              onClick={() => setActiveTab('needs_review')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'needs_review'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Needs Review ({needsReviewCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search skill, code, or occupation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Raw Skill / Tag</th>
                <th className="py-3 px-4">NCO Code</th>
                <th className="py-3 px-4">NCO Occupation</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Sector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {loading ? 'Loading mappings...' : 'No skill mappings found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m) => {
                  const isAccepted =
                    m.matchStatus === 'accepted' || (m.confidence !== undefined && m.confidence >= MATCH_ACCEPTANCE_THRESHOLD);
                  const confidenceDisplay =
                    m.confidence !== undefined ? (m.confidence * 100).toFixed(1) + '%' : '—';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        m.rawSkill === 'Python Scripting' ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Raw Skill */}
                      <td className="py-3 px-4 font-mono text-slate-900 font-medium whitespace-nowrap">
                        &ldquo;{m.rawSkill}&rdquo;
                      </td>

                      {/* NCO Code */}
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {m.ncoCode || '—'}
                      </td>

                      {/* NCO Occupation & Family */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.ncoTitle || m.normalizedSkill}</div>
                        {m.ncoFamily && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{m.ncoFamily}</div>
                        )}
                        {m.explanation && (
                          <div className="text-[10px] text-indigo-600/80 truncate max-w-xs mt-0.5" title={m.explanation}>
                            {m.explanation}
                          </div>
                        )}
                      </td>

                      {/* Confidence Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold rounded border ${
                              isAccepted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                            title={m.explanation || `Combined confidence: ${m.confidence !== undefined ? m.confidence.toFixed(4) : 'N/A'}`}
                          >
                            {confidenceDisplay}
                          </span>
                          {m.semanticConfidence !== undefined && (
                            <span
                              className="text-[9px] font-mono text-slate-400"
                              title={`Raw cosine similarity: ${m.semanticConfidence.toFixed(4)}`}
                            >
                              raw: {(m.semanticConfidence * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded ${
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isAccepted ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          )}
                          {isAccepted ? 'Accepted' : 'Needs Review'}
                        </span>
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{m.sector}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
