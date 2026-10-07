import React, { useEffect, useState, useMemo } from 'react';
import { MetricCard } from '../components/MetricCard';
import { MasterGeographySelect } from '../components/MasterGeographySelect';
import { MasterSectorSelect } from '../components/MasterSectorSelect';
import { formatPeriodToHuman } from '../utils/dateFormatter';
import { formatNumber, safeTickFormatter } from '../utils/numberFormatter';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Building2,
  Briefcase,
  ArrowRight,
  ChevronRight,
  Bot,
  Filter,
  RotateCcw,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Info
} from 'lucide-react';
import { TelanganaCoverageWarning } from '../components/TelanganaCoverageWarning';
import { AnomalyDetectionResponse } from '../utils/anomalyDetection';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: string, filter?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [demandData, setDemandData] = useState<any>(null);
  const [gapData, setGapData] = useState<any>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyDetectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Geography and Sector Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedState) params.append('state', selectedState);
        if (selectedDistrict) params.append('district', selectedDistrict);
        if (selectedSector) params.append('sector', selectedSector);

        const qs = params.toString() ? `?${params.toString()}` : '';

        const [overviewRes, demandRes, gapRes, anomalyRes] = await Promise.all([
          fetch(`/api/overview${qs}`),
          fetch(`/api/demand${qs}`),
          fetch(`/api/gaps${qs}`),
          fetch(`/api/anomalies${qs}`)
        ]);

        const [overviewJson, demandJson, gapJson, anomalyJson] = await Promise.all([
          overviewRes.json(),
          demandRes.json(),
          gapRes.json(),
          anomalyRes.json()
        ]);

        setData(overviewJson);
        setDemandData(demandJson);
        setGapData(gapJson);
        setAnomalyData(anomalyJson);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [selectedState, selectedDistrict, selectedSector]);

  const handleResetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSector('');
  };

  const formattedTrendData = useMemo(() => {
    const rawTrends = demandData?.trendData || [];
    return rawTrends.map((item: any) => ({
      ...item,
      displayPeriod: formatPeriodToHuman(item.period, false),
    }));
  }, [demandData?.trendData]);

  const shortages = useMemo(() => {
    return (
      gapData?.gaps?.filter(
        (g: any) => g.isComparable && g.classification === 'SHORTAGE'
      ) || []
    );
  }, [gapData?.gaps]);

  const balanced = useMemo(() => {
    return (
      gapData?.gaps?.filter(
        (g: any) => g.isComparable && g.classification === 'BALANCED'
      ) || []
    );
  }, [gapData?.gaps]);

  const hasActiveFilters = Boolean(selectedState || selectedDistrict || selectedSector);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Context Header with clear visual separation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-tight text-slate-500 uppercase">
              SkillPulse
            </span>
            <span className="text-slate-300 font-bold">·</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              Labour-Market Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            What is happening in the labour market: Compare hiring demand with available workforce to identify potential skill gaps and guide training capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('assistant')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/80 transition-colors cursor-pointer shadow-2xs"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Ask Assistant</span>
          </button>
        </div>
      </div>

      {/* Nationwide Master Geography & Sector Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dashboard Scope & Location Filters
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <MasterGeographySelect
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              onStateChange={(st) => setSelectedState(st)}
              onDistrictChange={(dist) => setSelectedDistrict(dist)}
              showAllOption={true}
            />
          </div>
          <div>
            <MasterSectorSelect
              selectedSector={selectedSector}
              onSectorChange={(sec) => setSelectedSector(sec)}
              showAllOption={true}
            />
          </div>
        </div>
      </div>

      {/* Telangana Coverage Notice */}
      <TelanganaCoverageWarning
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
      />

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-72 bg-slate-200 rounded-xl"></div>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Job Demand"
              value={data?.totalAggregatedDemand !== null && data?.totalAggregatedDemand !== undefined ? data.totalAggregatedDemand : 'Unavailable'}
              subtext={
                data?.totalAggregatedDemand !== null && data?.totalAggregatedDemand !== undefined
                  ? (selectedDistrict
                      ? `In ${selectedDistrict}, ${selectedState}`
                      : selectedState
                        ? `Across ${data?.locationsCovered || 0} districts in ${selectedState}`
                        : `Across ${data?.locationsCovered || 0} industrial districts`)
                  : "No verified demand records available"
              }
              icon={Briefcase}
            />
            <MetricCard
              label="Available Workforce"
              value={data?.totalRegisteredWorkers !== null && data?.totalRegisteredWorkers !== undefined ? data.totalRegisteredWorkers : 'Unavailable'}
              subtext={data?.totalRegisteredWorkers !== null && data?.totalRegisteredWorkers !== undefined ? "Registered jobseekers and skilled workers" : "Workforce data is not available for this selection."}
              icon={Users}
            />
            <MetricCard
              label="Potential Skill Gaps"
              value={data?.comparableCount > 0 ? shortages.length : 'Unavailable'}
              subtext={data?.comparableCount > 0 ? "Skills where demand exceeds workforce by >15%" : "Comparable demand and workforce data are not available for this selection."}
              icon={AlertTriangle}
              badge={
                data?.comparableCount > 0 && shortages.length > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Needs Planning
                  </span>
                ) : undefined
              }
            />
            <MetricCard
              label="Annual Training Output"
              value={data?.totalCertifiedWorkers !== null && data?.totalCertifiedWorkers !== undefined ? data.totalCertifiedWorkers : 'Unavailable'}
              subtext={data?.totalCertifiedWorkers !== null && data?.totalCertifiedWorkers !== undefined ? "Certified trainees and graduates" : "Verified training-output data is not available for this selection."}
              icon={Building2}
            />
          </div>

          {/* Demand Trend and Sector Share Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Demand Trend Over Time with Human Readable Dates */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Demand Trend</h2>
                  <p className="text-xs text-slate-500">Employer job openings over time</p>
                </div>
                <button
                  onClick={() => onNavigate('demand', { state: selectedState, district: selectedDistrict, sector: selectedSector })}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  Detailed Demand <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {formattedTrendData.length > 0 ? (
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="displayPeriod" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={safeTickFormatter} />
                      <Tooltip
                        formatter={(value: any) => [formatNumber(value), 'Job Demand']}
                        labelFormatter={(lbl) => `Time: ${lbl}`}
                        contentStyle={{ backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#4F46E5"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#4F46E5', strokeWidth: 1, stroke: '#FFFFFF' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <TrendingUp className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Demand Trend</p>
                  <p className="text-xs text-slate-500 mt-0.5">Not enough verified historical demand data available.</p>
                </div>
              )}
            </div>

            {/* Sector Demand Share */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">Demand by Sector</h2>
                <p className="text-xs text-slate-500">Top 5 sectors by recorded demand</p>
              </div>

              {demandData?.sectorShare && demandData.sectorShare.length > 0 ? (
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {demandData.sectorShare.slice(0, 5).map((sec: any) => {
                    const total = demandData?.records?.reduce((s: number, r: any) => s + r.demandCount, 0) || 1;
                    const pct = Math.round(((sec.count || 0) / total) * 100);
                    return (
                      <div key={sec.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700 truncate max-w-[180px]" title={sec.name}>
                            {sec.name}
                          </span>
                          <span className="text-slate-500 tabular-nums">
                            {formatNumber(sec.count)} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  Sector-level demand data is unavailable.
                </div>
              )}

              <button
                onClick={() => onNavigate('demand', { state: selectedState, district: selectedDistrict, sector: selectedSector })}
                className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Explore all sectors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Shortages vs Balanced Dual Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Potential Skill Gaps */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Potential Skill Gaps
                    </h2>
                    <p className="text-xs text-slate-500">Skills where comparable demand and workforce data indicate a potential gap</p>
                  </div>
                  <button
                    onClick={() => (gapData?.comparableCount > 0 ? onNavigate('gaps', { state: selectedState, district: selectedDistrict, sector: selectedSector }) : undefined)}
                    disabled={!gapData || gapData.comparableCount === 0}
                    className={`text-xs font-semibold inline-flex items-center gap-1 ${
                      gapData?.comparableCount > 0
                        ? 'text-indigo-600 hover:text-indigo-800 cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    All Skill Gaps <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {shortages.length > 0 ? (
                    shortages.slice(0, 4).map((item: any) => (
                      <div key={`${item.district}-${item.normalizedSkill}`} className="py-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-semibold text-slate-900">{item.normalizedSkill}</h3>
                          <p className="text-[11px] text-slate-500">{item.district}, {item.state} • {item.sector}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-rose-50 text-rose-700 tabular-nums">
                            +{item.gapPercentage ?? 0}% Deficit
                          </span>
                          <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            Potential Gap: ~{formatNumber(item.gap)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : !gapData || gapData?.comparableCount === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 leading-relaxed px-4">
                      No comparable demand-and-workforce records are currently available to identify potential skill gaps.
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No potential skill shortages identified in the comparable datasets.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
                <span>Explore training planning advisory signals</span>
                <button
                  onClick={() => onNavigate('planner')}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Training Planner →
                </button>
              </div>
            </div>

            {/* Balanced Skills */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Balanced Skills
                    </h2>
                    <p className="text-xs text-slate-500">Skills where observed workforce availability aligns with employer demand</p>
                  </div>
                  <button
                    onClick={() => (gapData?.comparableCount > 0 ? onNavigate('gaps', { state: selectedState, district: selectedDistrict, sector: selectedSector }) : undefined)}
                    disabled={!gapData || gapData.comparableCount === 0}
                    className={`text-xs font-semibold inline-flex items-center gap-1 ${
                      gapData?.comparableCount > 0
                        ? 'text-indigo-600 hover:text-indigo-800 cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    View Matrix <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {balanced.length > 0 ? (
                    balanced.slice(0, 4).map((item: any) => (
                      <div key={`${item.district}-${item.normalizedSkill}`} className="py-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-semibold text-slate-900">{item.normalizedSkill}</h3>
                          <p className="text-[11px] text-slate-500">{item.district}, {item.state} • {item.sector}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 tabular-nums">
                            Balanced (±15%)
                          </span>
                          <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            Available Workforce: {formatNumber(item.effectiveSupply)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : !gapData || gapData?.comparableCount === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 leading-relaxed px-4">
                      Comparable demand and workforce data are currently unavailable, so balanced skills cannot be identified.
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No balanced skill records identified in the comparable datasets.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
                <span>Explore expected demand over future months</span>
                <button
                  onClick={() => onNavigate('forecast')}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Check Demand Forecast →
                </button>
              </div>
            </div>
          </div>

          {/* Data Quality & Statistical Anomaly Monitoring Section */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Data Quality & QoQ Anomaly Monitoring</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      3-Sigma Rule
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quarter-on-Quarter (QoQ) demand variance monitoring across verified time-series filings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-slate-500">Total Anomalies:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  (anomalyData?.totalAnomalies || 0) > 0
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {anomalyData?.totalAnomalies || 0}
                </span>
              </div>
            </div>

            {anomalyData && anomalyData.anomalies && anomalyData.anomalies.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {anomalyData.anomalies.map((a, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border space-y-2.5 ${
                        a.direction === 'spike'
                          ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                          : 'bg-rose-50/60 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          a.direction === 'spike'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {a.direction === 'spike' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {a.direction.toUpperCase()} ({a.severity})
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          z = {a.zScore > 0 ? `+${a.zScore}` : a.zScore}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{a.skill}</h4>
                        <p className="text-[11px] text-slate-600">{a.district}, {a.state} • {a.period}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 text-[11px] grid grid-cols-2 gap-1 font-mono text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">QoQ Change:</span>
                          <span className="font-bold">{a.qoqChange > 0 ? `+${a.qoqChange}` : a.qoqChange}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Baseline Mean:</span>
                          <span>{a.meanQoqChange > 0 ? `+${a.meanQoqChange}` : a.meanQoqChange} (±{a.stdQoqChange})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Clear Empty State */
              <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      No statistically significant QoQ anomalies detected in the available historical data.
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      All evaluated quarterly delta series ({anomalyData?.seriesAnalyzed || 0} series) lie within ±3 standard deviations of their empirical historical mean.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
                  Method: |Δt - μ| &le; 3σ (QoQ)
                </div>
              </div>
            )}

            {/* Completeness / Scope Disclaimer */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Statistical Scope & Provenance:</strong> Anomaly detection is performed strictly on comparable historical series within the available SkillPulse dataset (minimum {anomalyData?.provenance?.minimumQoqObservations || 4} QoQ observations). This serves as an analytical data-quality indicator and does not represent a claim of exhaustive national statistical completeness.
              </span>
            </div>
          </div>

          {/* Helpful SkillPulse Assistant Callout */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Have questions about calculations or data?</h4>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                  The SkillPulse Assistant can explain where data came from, why workforce records are currently unfiled, how skill gaps are formulated, and the exact methodology used.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              Ask the Assistant
            </button>
          </div>
        </>
      )}
    </div>
  );
};
