import React, { useEffect, useState, useMemo } from 'react';
import { MasterGeographySelect } from '../components/MasterGeographySelect';
import { DataCoverageCard } from '../components/DataCoverageCard';
import { checkDataCoverage } from '../utils/dataAvailability';
import { formatPeriodToHuman } from '../utils/dateFormatter';
import { filterByCanonicalGeography } from '../utils/canonicalGeography';
import { DEMAND_RECORDS } from '../data/demandData';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles,
  Calendar,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building2,
  ShieldCheck,
  Info,
  Clock
} from 'lucide-react';
import { ForecastResult } from '../types';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart
} from 'recharts';

interface ForecastViewProps {
  onNavigateToAssistant?: () => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ onNavigateToAssistant }) => {
  const [selectedState, setSelectedState] = useState('Telangana');
  const [selectedDistrict, setSelectedDistrict] = useState('Hyderabad');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedHorizon, setSelectedHorizon] = useState('4');

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhyResult, setShowWhyResult] = useState(false);

  // Dynamically load skills that actually have historical demand records for the selected location
  const availableDemandSkills = useMemo(() => {
    if (!selectedState) return [];

    const skills = Array.from(
      new Set(
        filterByCanonicalGeography(DEMAND_RECORDS, { state: selectedState, district: selectedDistrict })
          .map((d) => d.normalizedSkill)
      )
    ).sort();

    return skills;
  }, [selectedState, selectedDistrict]);

  // Synchronize selected skill when location or available skills change
  useEffect(() => {
    if (availableDemandSkills.length > 0) {
      if (!selectedSkill || !availableDemandSkills.includes(selectedSkill)) {
        setSelectedSkill(availableDemandSkills[0]);
      }
    } else {
      setSelectedSkill('');
    }
  }, [availableDemandSkills]);

  // Coverage evaluation for district
  const coverage = useMemo(() => {
    if (selectedState || selectedDistrict) {
      return checkDataCoverage(selectedState, selectedDistrict, undefined, selectedSkill || undefined);
    }
    return null;
  }, [selectedState, selectedDistrict, selectedSkill]);

  // Load forecast from API
  useEffect(() => {
    async function loadForecast() {
      if (!selectedState || !selectedDistrict || !selectedSkill) {
        setForecast(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams({
          skill: selectedSkill,
          state: selectedState,
          district: selectedDistrict,
          horizon: selectedHorizon,
        });

        const res = await fetch(`/api/forecast?${params.toString()}`);
        const json = await res.json();
        setForecast(json);
      } catch (err) {
        console.error('Failed to load forecast:', err);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, [selectedSkill, selectedState, selectedDistrict, selectedHorizon]);

  // Transform historical and forecast points for the chart with human-readable date labels
  const chartData = useMemo(() => {
    if (!forecast || !forecast.isAvailable) return [];

    const points: any[] = [];

    // Observed Historical Points
    forecast.historicalData.forEach((h) => {
      points.push({
        rawPeriod: h.period,
        displayPeriod: formatPeriodToHuman(h.period, false),
        historicalDemand: h.demand,
        predictedDemand: null,
        lowerBound: null,
        upperBound: null,
      });
    });

    // Bridge point: Connects last historical point to projected line seamlessly
    if (forecast.historicalData.length > 0 && forecast.forecastData.length > 0) {
      const lastHist = forecast.historicalData[forecast.historicalData.length - 1];
      points[points.length - 1].predictedDemand = lastHist.demand;
      points[points.length - 1].lowerBound = lastHist.demand;
      points[points.length - 1].upperBound = lastHist.demand;
    }

    // Projected Future Points
    forecast.forecastData.forEach((f) => {
      points.push({
        rawPeriod: f.period,
        displayPeriod: formatPeriodToHuman(f.period, false),
        historicalDemand: null,
        predictedDemand: f.predictedDemand,
        lowerBound: f.lowerBound,
        upperBound: f.upperBound,
      });
    });

    return points;
  }, [forecast]);

  // Forecast Reliability: Calculated strictly from historical model fit metrics
  const forecastReliability = useMemo(() => {
    if (!forecast || !forecast.isAvailable) return 'Unavailable';
    const r2 = forecast.metrics?.r2 ?? 0;
    const sampleSize = forecast.technicalDetails?.sampleSize ?? 0;
    if (sampleSize < 4) return 'Unavailable';
    if (r2 >= 0.8 && sampleSize >= 6) return 'Good (Historical fit)';
    if (r2 >= 0.5) return 'Moderate (Historical fit)';
    return 'Limited (Historical fit)';
  }, [forecast]);

  // Derived metrics for summary cards
  const summaryMetrics = useMemo(() => {
    if (!forecast || !forecast.isAvailable || forecast.forecastData.length === 0 || forecast.historicalData.length === 0) {
      return null;
    }

    const firstHist = forecast.historicalData[0];
    const lastHist = forecast.historicalData[forecast.historicalData.length - 1];
    const latestProjected = forecast.forecastData[forecast.forecastData.length - 1].predictedDemand;

    const growthPercent = Math.round(((latestProjected - lastHist.demand) / Math.max(1, lastHist.demand)) * 100);
    const growthTrend = growthPercent > 5 ? 'Rising' : growthPercent < -5 ? 'Declining' : 'Stable';

    const firstDateHuman = formatPeriodToHuman(firstHist.period, false);
    const lastDateHuman = formatPeriodToHuman(lastHist.period, false);
    const endForecastDateHuman = formatPeriodToHuman(forecast.forecastData[forecast.forecastData.length - 1].period, false);
    const horizonMonths = Number(selectedHorizon) * 3;

    return {
      recentDemand: lastHist.demand,
      recentPeriod: lastDateHuman,
      expectedDemand: latestProjected,
      expectedPeriod: endForecastDateHuman,
      growthPercent,
      growthTrend,
      historicalRange: `${firstDateHuman} – ${lastDateHuman}`,
      observationsCount: forecast.historicalData.length,
      horizonMonths,
      horizonLabel: selectedHorizon === '2' ? 'Next 6 Months' : selectedHorizon === '4' ? 'Next 1 Year' : 'Next 1.5 Years'
    };
  }, [forecast, selectedHorizon]);

  const isDistrictUnavailable = Boolean(
    selectedDistrict && coverage && coverage.demandStatus === 'UNAVAILABLE'
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Demand Forecast
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-50 text-sky-800 border border-sky-200">
                Demand Projection
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Based on available historical demand data, the system estimates how demand may change over the selected forecast period.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Empirical Time-Series Analysis</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Planning Projection Notice
            </p>
            <p className="leading-relaxed">
              Expected Demand is a system estimate based on verified quarterly vacancy filings from the National Career Service (NCS). This estimate reflects historical patterns and should be interpreted as planning information, not a guaranteed future outcome.
            </p>
          </div>
        </div>
      </div>

      {/* Select Location & Skill (Section 27) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Select Location & Skill</span>
          </label>

          {/* Forecast Period Horizon Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="text-[11px] font-medium text-slate-500">Forecast Period:</span>
            <select
              value={selectedHorizon}
              onChange={(e) => setSelectedHorizon(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 font-semibold"
            >
              <option value="2">Next 6 Months</option>
              <option value="4">Next 1 Year</option>
              <option value="6">Next 1.5 Years</option>
            </select>
          </div>
        </div>

        {/* Master Geography Select */}
        <MasterGeographySelect
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onStateChange={setSelectedState}
          onDistrictChange={setSelectedDistrict}
          showAllOption={false}
        />

        {/* Dynamic Skill Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Skill / Occupation:
          </label>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            disabled={availableDemandSkills.length === 0}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100"
          >
            {availableDemandSkills.length === 0 ? (
              <option value="">No historical demand data available for this selection</option>
            ) : (
              availableDemandSkills.map((sk) => (
                <option key={sk} value={sk}>
                  {sk}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Dynamic Selection Summary */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Selected Location: <strong className="text-slate-800">{selectedDistrict}, {selectedState}</strong>
            </span>
          </span>
          <span>
            {availableDemandSkills.length > 0 ? (
              <span className="text-emerald-700 font-medium">
                {availableDemandSkills.length} skill {availableDemandSkills.length === 1 ? 'series' : 'series'} available with verified demand history
              </span>
            ) : (
              <span className="text-slate-400">
                Official LGD record verified; no historical vacancy filings present
              </span>
            )}
          </span>
        </div>
      </div>

      {/* District Coverage Info */}
      {selectedDistrict && coverage && <DataCoverageCard coverage={coverage} />}

      {/* Main Forecast Workspace Area */}
      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3"></div>
          <div className="h-28 bg-slate-100 rounded"></div>
          <div className="h-64 bg-slate-100 rounded"></div>
        </div>
      ) : isDistrictUnavailable ? (
        /* District Missing Data Handling (Section 3 & 6) */
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Forecast unavailable
          </h3>
          <p className="text-xs font-semibold text-slate-700">
            Demand data unavailable for this district.
          </p>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            Location <strong className="text-slate-800">{selectedDistrict}, {selectedState}</strong> is verified in India's official Local Government Directory (LGD). Statistical time-series forecasting requires a minimum of 4 chronological quarters of verified job postings from official sources.
          </p>
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 text-amber-900 rounded-lg text-xs max-w-md mx-auto">
            Missing data is not zero. We never fabricate synthetic projections when historical data is absent.
          </div>
        </div>
      ) : !forecast?.isAvailable ? (
        /* Insufficient Data State (Section 5 & 19) */
        <div className="bg-white p-8 rounded-xl border border-amber-200/90 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Forecast unavailable
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            {forecast?.reason || 'Not enough comparable historical demand data is available to produce a forecast for this selection.'}
          </p>
          <div className="pt-2 text-xs text-slate-600 font-medium space-y-1">
            <p>
              Historical records available: <strong className="text-slate-900">{forecast?.historicalData.length || 0}</strong>
            </p>
            <p className="text-slate-500">
              Minimum required for statistical trend estimation: <strong className="text-slate-700">4 quarters</strong>
            </p>
          </div>
        </div>
      ) : (
        /* Active Real Data Forecast Workspace (Section 13, 14, 15, 17, 18, 27) */
        <div className="space-y-6">
          {/* Demand Summary Cards (Section 13 & 27) */}
          {summaryMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Recent Demand */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Recent Demand
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums block">
                  {summaryMetrics.recentDemand.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Observed vacancies in {summaryMetrics.recentPeriod} (NCS)
                </span>
              </div>

              {/* 2. Expected Demand */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200/80 shadow-xs space-y-1">
                <span className="text-xs text-indigo-900 font-medium block">
                  Expected Demand
                </span>
                <span className="text-2xl font-bold font-mono text-indigo-700 tabular-nums block">
                  {summaryMetrics.expectedDemand.toLocaleString()}
                </span>
                <span className="text-[10px] text-indigo-600/80 block leading-tight font-medium">
                  Projected estimate through {summaryMetrics.expectedPeriod}
                </span>
              </div>

              {/* 3. Demand Trend */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Demand Trend
                </span>
                <span className={`text-2xl font-bold font-mono tabular-nums block flex items-center gap-1 ${
                  summaryMetrics.growthPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {summaryMetrics.growthPercent >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                  )}
                  <span>
                    {summaryMetrics.growthPercent >= 0 ? `+${summaryMetrics.growthPercent}%` : `${summaryMetrics.growthPercent}%`}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Trend direction: <strong className="text-slate-700">{summaryMetrics.growthTrend}</strong>
                </span>
              </div>

              {/* 4. Forecast Reliability */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Forecast Reliability
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      forecastReliability.includes('Good')
                        ? 'text-emerald-600'
                        : forecastReliability.includes('Moderate')
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="text-base font-bold text-slate-900">{forecastReliability}</span>
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Evaluated across {summaryMetrics.observationsCount} verified historical quarters
                </span>
              </div>

              {/* 5. Historical Period */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Historical Period
                </span>
                <span className="text-base font-bold font-mono text-slate-800 block mt-1">
                  {summaryMetrics.historicalRange}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {summaryMetrics.observationsCount} chronological quarters recorded
                </span>
              </div>

              {/* 6. Forecast Period */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Forecast Period
                </span>
                <span className="text-base font-bold font-mono text-slate-800 block mt-1">
                  {summaryMetrics.horizonLabel}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Next {summaryMetrics.horizonMonths} months (Through {summaryMetrics.expectedPeriod})
                </span>
              </div>
            </div>
          )}

          {/* Dynamic "Why am I seeing this result?" (Section 18 & 27) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWhyResult(!showWhyResult)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Why am I seeing this result?
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                <span>{showWhyResult ? 'Hide explanation' : 'Read explanation'}</span>
                {showWhyResult ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showWhyResult && summaryMetrics && (
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-700 space-y-2.5 animate-in fade-in">
                <p className="leading-relaxed">
                  You selected <strong>{forecast.normalizedSkill}</strong> in <strong>{forecast.district}, {forecast.state}</strong>. The system found <strong>{summaryMetrics.observationsCount}</strong> valid historical demand observations from <strong>{summaryMetrics.historicalRange}</strong>. Because sufficient comparable historical records were available (minimum 4 required), a forward estimate was calculated for the selected forecast period (<strong>{summaryMetrics.horizonLabel}</strong>).
                </p>
                <p className="leading-relaxed">
                  • <strong>Recent observed demand:</strong> Stands at <strong>{summaryMetrics.recentDemand.toLocaleString()} vacancies</strong> in {summaryMetrics.recentPeriod}.
                </p>
                <p className="leading-relaxed">
                  • <strong>Historical trend direction:</strong> The observed data demonstrates a <strong>{summaryMetrics.growthTrend.toLowerCase()}</strong> quarterly trajectory.
                </p>
                <p className="leading-relaxed">
                  • <strong>Projected benchmark:</strong> Under current hiring momentum, employer demand is estimated to reach approximately <strong>{summaryMetrics.expectedDemand.toLocaleString()} vacancies</strong> by {summaryMetrics.expectedPeriod}, representing an estimated change of <strong>{summaryMetrics.growthPercent >= 0 ? `+${summaryMetrics.growthPercent}%` : `${summaryMetrics.growthPercent}%`}</strong> over the forecast horizon.
                </p>
              </div>
            )}
          </div>

          {/* Dynamic Demand Trend & Future Projection Chart (Section 15, 16, 27) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {forecast.normalizedSkill} — Demand Trend & Future Projection
                </h3>
                <p className="text-xs text-slate-500">
                  {forecast.district}, {forecast.state} • Historical observations with forward estimate
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-1 bg-indigo-600 rounded-full inline-block"></span> Observed Demand
                </span>
                <span className="flex items-center gap-1.5 font-medium text-sky-700">
                  <span className="w-3 h-1 bg-sky-500 border-t border-dashed border-sky-500 inline-block"></span> Estimated Demand
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-0.5 bg-slate-300 inline-block"></span> Expected Range
                </span>
              </div>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="displayPeriod" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (value === null) return ['N/A', name || ''];
                      const labels: Record<string, string> = {
                        historicalDemand: 'Observed Demand',
                        predictedDemand: 'Estimated Demand',
                        lowerBound: 'Expected Lower Range',
                        upperBound: 'Expected Upper Range',
                      };
                      return [Number(value).toLocaleString(), labels[String(name)] || String(name)];
                    }}
                    labelFormatter={(label) => `Period: ${label}`}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                  />
                  {/* Historical Solid Line (Observed Demand) */}
                  <Line
                    type="monotone"
                    dataKey="historicalDemand"
                    name="historicalDemand"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#4F46E5' }}
                    connectNulls={false}
                  />
                  {/* Projected Dashed Line (Estimated Future Demand) */}
                  <Line
                    type="monotone"
                    dataKey="predictedDemand"
                    name="predictedDemand"
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#0284C7' }}
                  />
                  {/* Confidence Interval Bands */}
                  <Line
                    type="monotone"
                    dataKey="upperBound"
                    name="upperBound"
                    stroke="#CBD5E1"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lowerBound"
                    name="lowerBound"
                    stroke="#CBD5E1"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Notice:</strong> Expected Demand is a system estimate based on historical demand data. This estimate reflects historical patterns and should be interpreted as planning information, not a guaranteed future outcome.
            </div>
          </div>

          {/* Ask Assistant Integration Footer (Section 25 & 27) */}
          <div className="p-4 sm:p-5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700">
            <div>
              <span className="font-bold text-slate-900 block text-xs">How was this forecast calculated?</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                The SkillPulse Assistant can explain the mathematical trend estimation, historical data requirements, and forecast reliability.
              </p>
            </div>
            {onNavigateToAssistant && (
              <button
                type="button"
                onClick={onNavigateToAssistant}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask SkillPulse Assistant</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
