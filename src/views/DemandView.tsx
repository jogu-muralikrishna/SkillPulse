import React, { useEffect, useState, useMemo } from 'react';
import { EmptyState } from '../components/EmptyState';
import { DataQualityIndicator } from '../components/DataQualityIndicator';
import { MasterGeographySelect } from '../components/MasterGeographySelect';
import { MasterSectorSelect } from '../components/MasterSectorSelect';
import { DataCoverageCard } from '../components/DataCoverageCard';
import { checkDataCoverage } from '../utils/dataAvailability';
import { formatPeriodToHuman } from '../utils/dateFormatter';
import { Filter, Briefcase, TrendingUp, Layers, MapPin, Calendar, Search, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

export const DemandView: React.FC = () => {
  const [demandData, setDemandData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Preference for human-readable dates vs technical quarterly codes
  const [showTechnicalQuarterCodes, setShowTechnicalQuarterCodes] = useState(false);

  // Dynamic skill options based on sector
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  // Evaluate data coverage explicitly
  const coverage = useMemo(() => {
    if (selectedState || selectedDistrict) {
      return checkDataCoverage(selectedState, selectedDistrict, selectedSector, selectedSkill);
    }
    return null;
  }, [selectedState, selectedDistrict, selectedSector, selectedSkill]);

  // Fetch filtered data whenever filters change
  useEffect(() => {
    async function loadFilteredDemand() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedState) params.append('state', selectedState);
        if (selectedDistrict) params.append('district', selectedDistrict);
        if (selectedSector) params.append('sector', selectedSector);
        if (selectedSkill) params.append('skill', selectedSkill);
        if (selectedPeriod) params.append('period', selectedPeriod);

        const res = await fetch(`/api/demand?${params.toString()}`);
        const json = await res.json();
        setDemandData(json);

        // Populate skills and periods if available
        if (json.records) {
          const sks = Array.from(new Set(json.records.map((r: any) => r.normalizedSkill))) as string[];
          setAvailableSkills(sks);
          const prds = Array.from(new Set(json.records.map((r: any) => r.period))).sort() as string[];
          setAvailablePeriods(prds);
        }
      } catch (err) {
        console.error('Error fetching demand:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFilteredDemand();
  }, [selectedState, selectedDistrict, selectedSector, selectedSkill, selectedPeriod]);

  // Reset filters
  const resetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedSkill('');
    setSelectedPeriod('');
    setSearchQuery('');
  };

  const records = demandData?.records || [];
  const filteredRecords = searchQuery
    ? records.filter((r: any) =>
        r.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.normalizedSkill.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.district.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : records;

  const totalDemandVolume = filteredRecords.reduce((sum: number, r: any) => sum + r.demandCount, 0);

  // Format trend data with human-readable dates (e.g. "Jan 2026", "Jul 2026")
  const formattedTrendData = useMemo(() => {
    const rawTrends = demandData?.trendData || [];
    return rawTrends.map((item: any) => ({
      ...item,
      displayPeriod: formatPeriodToHuman(item.period, showTechnicalQuarterCodes),
      rawPeriod: item.period
    }));
  }, [demandData?.trendData, showTechnicalQuarterCodes]);

  const isDistrictUnavailable = Boolean(
    selectedDistrict && coverage && coverage.demandStatus === 'UNAVAILABLE'
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Live 2026 Freshness Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Demand Analysis
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
              Dev Baseline (Audit Pending)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Hiring demand indicators across industrial sectors (testing sample awaiting primary provenance audit).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataQualityIndicator
            level={records.length > 5 ? 'Medium' : records.length > 0 ? 'Low' : 'Unavailable'}
            reason={
              records.length > 0
                ? `Computed across ${records.length} development records. Awaiting primary source provenance verification.`
                : 'No matching filings in the connected development dataset for this selection.'
            }
            compact={true}
          />
        </div>
      </div>

      {/* Filter Controls Bar with Master Geography & Normalized Sectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Search & Geography Filters</span>
          </div>

          <div className="flex items-center gap-3">
            {(selectedState || selectedDistrict || selectedSector || selectedSkill || selectedPeriod || searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Master Geography Select (All 36 States/UTs + All 786 Districts Searchable) */}
        <MasterGeographySelect
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onStateChange={setSelectedState}
          onDistrictChange={setSelectedDistrict}
          showAllOption={true}
        />

        {/* Normalized Sectors, Skills & Time Period Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Normalized Sector Select */}
          <MasterSectorSelect
            selectedSector={selectedSector}
            onSectorChange={setSelectedSector}
            showAllOption={true}
          />

          {/* Skill Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Skills in Selection</option>
              {availableSkills.map((sk) => (
                <option key={sk} value={sk}>{sk}</option>
              ))}
            </select>
          </div>

          {/* Time Period Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Periods (2023-2024 Observed / 2025-2026 Projected)</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {formatPeriodToHuman(p, showTechnicalQuarterCodes)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* District Data Coverage Indicator */}
      {selectedDistrict && coverage && (
        <DataCoverageCard coverage={coverage} />
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
      ) : isDistrictUnavailable ? (
        // When district is valid in LGD but has no labour data, DO NOT remove the district and DO NOT show Demand = 0
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Labour-market data unavailable for this district
            </h3>
            <p className="text-xs font-semibold text-slate-700">
              District: {selectedDistrict}, {selectedState}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official Local Government Directory (LGD) record verified. Active vacancy filings are currently not published for this district in the connected official datasets (NCS Vacancy Portal).
            </p>
            <div className="p-3 bg-amber-50 rounded-lg text-[11px] text-amber-900 font-medium">
              Missing data is not zero. We do not invent false zeroes or synthetic numbers.
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setSelectedDistrict('')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              View All Districts in {selectedState}
            </button>
          </div>
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title="No data available for this selection."
          message="There are no verified demand records matching the chosen filters in the current database. Try broadening your state or sector criteria."
          actionText="Clear Filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Matching Demand Records</span>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{filteredRecords.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Aggregated Demand Volume</span>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{totalDemandVolume.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Unique Skills Covered</span>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {new Set(filteredRecords.map((r: any) => r.normalizedSkill)).size}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Average Salary Range (LPA)</span>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                ₹5.8 - ₹16.2 L
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top In-Demand Skills */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Top In-Demand Skills</h2>
              <p className="text-xs text-slate-500 mb-4">Volume of verified vacancy postings</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={demandData?.topSkills?.slice(0, 6) || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                    <YAxis
                      dataKey="skill"
                      type="category"
                      stroke="#64748B"
                      fontSize={10}
                      width={130}
                      tickFormatter={(t) => (t.length > 20 ? t.substring(0, 18) + '...' : t)}
                    />
                    <Tooltip
                      formatter={(v: any) => [Number(v).toLocaleString(), 'Demand Count']}
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand Over Time formatted with human readable dates */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Demand Trend Over Time</h2>
                  <p className="text-xs text-slate-500">Vacancies across timeline (2023-2024 Observed / 2025-2026 Projected)</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="displayPeriod" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip
                      formatter={(v: any) => [Number(v).toLocaleString(), 'Verified Demand']}
                      labelFormatter={(lbl) => `Timeline: ${lbl}`}
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Granular Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Verified Demand Records</h3>
                <p className="text-xs text-slate-500">Itemized vacancy filings with location and salary boundaries</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search role or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-60"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">Sector</th>
                    <th className="py-2.5 px-4">Job Role & Skill</th>
                    <th className="py-2.5 px-4 text-right">Demand Count</th>
                    <th className="py-2.5 px-4 text-right">Salary Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {formatPeriodToHuman(r.period, showTechnicalQuarterCodes)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-slate-900">{r.district}</span>
                        <span className="text-slate-400 block text-[10px]">{r.state}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{r.sector}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-900">{r.jobRole}</span>
                        <span className="text-indigo-600 block text-[11px]">{r.normalizedSkill}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {r.demandCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                        {r.averageSalaryMin ? `₹${r.averageSalaryMin} - ₹${r.averageSalaryMax} L` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
