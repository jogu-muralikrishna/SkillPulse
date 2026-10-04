import React, { useEffect, useState } from 'react';
import { GitFork, Plus, CheckCircle, Search, Shield, Info } from 'lucide-react';
import { SkillMapping } from '../types';

export const NormalizationView: React.FC = () => {
  const [mappings, setMappings] = useState<SkillMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states to add new mapping
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

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawSkill.trim() || !normalizedSkill.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/skills/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawSkill, normalizedSkill, sector, source }),
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

  const filteredMappings = mappings.filter(
    (m) =>
      m.rawSkill.toLowerCase().includes(search.toLowerCase()) ||
      m.normalizedSkill.toLowerCase().includes(search.toLowerCase()) ||
      m.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GitFork className="w-6 h-6 text-indigo-600" />
            <span>Skill Standardization & Normalization Layer</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Reconciles disparate job titles, portal tags, and qualification packs into standard occupational competencies.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Close Editor' : 'Add New Mapping'}</span>
        </button>
      </div>

      {/* Explanatory Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Why Normalization Matters:</strong> Job postings use varying nomenclature (e.g. &ldquo;Python Developer&rdquo;, &ldquo;Python Scripting&rdquo;, &ldquo;Python Programming&rdquo;). This transparent mapping dictionary harmonizes them into single standard nodes (e.g. &ldquo;Python Development&rdquo;) without arbitrarily grouping unrelated domains.
        </div>
      </div>

      {/* Add New Mapping Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddMapping} className="p-5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
            Create Transparent Skill Mapping Entry
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Raw Skill / Job Title Tag</label>
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
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Target Normalized Skill</label>
              <input
                type="text"
                required
                placeholder="e.g. EV Powertrain & Battery Diagnostics"
                value={normalizedSkill}
                onChange={(e) => setNormalizedSkill(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Sector Skill Council</label>
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
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {submitting ? 'Saving...' : 'Save Mapping'}
            </button>
          </div>
        </form>
      )}

      {/* Search and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Standardized Mapping Dictionary</span>
            <span className="text-xs text-slate-500">({mappings.length} verified mappings)</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search raw or normalized skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Raw Tag / Posting Variant</th>
                <th className="py-2.5 px-4">Standardized Normalized Skill</th>
                <th className="py-2.5 px-4">Sector</th>
                <th className="py-2.5 px-4 text-center">Confidence</th>
                <th className="py-2.5 px-4">Origin Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-900 font-medium">
                    &ldquo;{m.rawSkill}&rdquo;
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-indigo-700">
                    {m.normalizedSkill}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">{m.sector}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {(m.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-slate-500">{m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
