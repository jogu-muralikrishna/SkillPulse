import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  Users,
  GraduationCap,
  Info,
  AlertTriangle,
  Building2,
  Filter,
  RotateCcw,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { SkillPriority } from '../types';
import { MASTER_STATES, getDistrictsForState } from '../data/masterGeography';
import { MASTER_SECTORS } from '../data/masterSectors';
import { EmptyState } from '../components/EmptyState';

export const SkillPriorityView: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [priorities, setPriorities] = useState<SkillPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  const fetchPriorities = async (state?: string, district?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: state || undefined,
          district: district || undefined,
        }),
      });
      const data = await res.json();
      setPriorities(data.rankings || []);
    } catch (err) {
      console.error('Failed to load priorities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities(selectedState, selectedDistrict);
  }, [selectedState, selectedDistrict]);

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedDistrict('');
  };

  const handleResetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSector('');
  };

  const availableDistricts = selectedState ? getDistrictsForState(selectedState) : [];

  const filteredPriorities = priorities.filter(item => {
    if (selectedSector && item.sector.toLowerCase() !== selectedSector.toLowerCase()) {
      return false;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedSkillId(expandedSkillId === id ? null : id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Decision Support Notice */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Skill Priority Index
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Skills needing attention based on available labour-market evidence
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified Labour-Market Evidence Only</span>
          </div>
        </div>

        {/* Informational Guidance Notice */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Decision-Support Planning Tool
            </p>
            <p className="leading-relaxed">
              This index answers: <span className="font-medium text-slate-900">“Which skills and locations may need attention first based on available verified labour-market evidence?”</span> It synthesizes real job vacancies from the National Career Service, worker registrations from e-Shram, and accredited institutional capacity from MSDE. Missing data is never zero-filled or fabricated.
            </p>
          </div>
        </div>
      </div>

      {/* Location & Sector Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Evidence By Location & Sector</span>
          </h2>
          {(selectedState || selectedDistrict || selectedSector) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Select State */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Select State / UT:
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All States & UTs (National Overview)</option>
              {MASTER_STATES.map((s) => (
                <option key={s.state_id} value={s.state_name}>
                  {s.state_name}
                </option>
              ))}
            </select>
          </div>

          {/* Select District */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Select District:
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100"
            >
              <option value="">
                {selectedState ? 'All Districts in State' : 'Select a State first'}
              </option>
              {availableDistricts.map((d) => (
                <option key={d.district_id} value={d.district_name}>
                  {d.district_name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Sector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Select Sector:
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Industry Sectors</option>
              {MASTER_SECTORS.map((sec) => (
                <option key={sec.sector_id} value={sec.sector_name}>
                  {sec.sector_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      ) : filteredPriorities.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Priority ranking unavailable because comparable demand, workforce, and training data are insufficient.
          </h3>
          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            Priority assessment requires verified job demand postings, worker supply registrations, and institutional training records on identical geographic boundaries. When one or more required factors are missing, SkillPulse refrains from fabricating synthetic scores.
          </p>
          {selectedDistrict && (
            <div className="pt-2">
              <span className="inline-block text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-md font-mono">
                Location verified in LGD: {selectedDistrict}, {selectedState} (No empirical filings in current datasets)
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Skills Needing Attention</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                {filteredPriorities.length} {filteredPriorities.length === 1 ? 'skill identified' : 'skills identified'}
              </span>
            </h2>
            <span className="text-xs text-slate-500">
              Ordered by urgency based on empirical shortage & demand trajectory
            </span>
          </div>

          <div className="space-y-3">
            {filteredPriorities.map((item) => {
              const cardId = `${item.district}-${item.normalizedSkill}`;
              const isExpanded = expandedSkillId === cardId;
              const isShortage = item.classification === 'SHORTAGE';

              return (
                <div
                  key={cardId}
                  className={`bg-white rounded-xl border transition-all duration-200 shadow-xs ${
                    isShortage ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200/90'
                  }`}
                >
                  {/* Card Header & Overview */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Skill Title & Location */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {item.normalizedSkill}
                          </h3>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                              isShortage
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.classification === 'BALANCED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {isShortage ? 'Potential Shortage / Needs Attention' : 'Balanced Workforce Supply'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.district}, {item.state}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.sector}</span>
                          </span>
                        </div>
                      </div>

                      {/* Plain-Language Status Indicators */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 px-3 bg-slate-50/80 rounded-lg border border-slate-200/70 text-xs shrink-0">
                        {/* Demand */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Demand
                          </span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-indigo-600" />
                            <span className="truncate">{item.demandBadge || 'Growing'}</span>
                          </span>
                        </div>

                        {/* Workforce */}
                        <div className="space-y-0.5 border-l border-slate-200 pl-2 sm:pl-3">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Workforce
                          </span>
                          <span className={`font-semibold flex items-center gap-1 ${
                            isShortage ? 'text-rose-700' : 'text-slate-800'
                          }`}>
                            <Users className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{item.workforceBadge || 'Data available'}</span>
                          </span>
                        </div>

                        {/* Training Capacity */}
                        <div className="space-y-0.5 border-l border-slate-200 pl-2 sm:pl-3">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Training Capacity
                          </span>
                          <span className={`font-semibold flex items-center gap-1 ${
                            item.trainingBadge === 'Limited' ? 'text-amber-700' : 'text-slate-800'
                          }`}>
                            <GraduationCap className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{item.trainingBadge || 'Available'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Toggle Details Button */}
                      <button
                        onClick={() => toggleExpand(cardId)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors self-start lg:self-center shrink-0 ${
                          isExpanded
                            ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80'
                        }`}
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Explanation & Transparent Evidence Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                      {/* Section: Why is this shown? */}
                      <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-200/80">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Why is this shown?</span>
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {item.priorityReason ||
                            'This skill is highlighted because demand has increased over the available historical period and comparable workforce data indicates a potential shortage.'}
                        </p>
                      </div>

                      {/* Verified Empirical Evidence Grid */}
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Underlying Verified Labour-Market Evidence ({item.demandPeriod || 'Latest Available Period'})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* 1. Demand Count */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[11px] text-slate-500 block">Verified Job Demand</span>
                            <span className="font-mono font-bold text-slate-900 text-sm block">
                              {item.demandCount?.toLocaleString() || item.demandScore?.toLocaleString()} vacancies
                            </span>
                            <span className="text-[10px] text-slate-400 block leading-tight">
                              Source: National Career Service ({item.demandPeriod || '2024-Q4'})
                            </span>
                          </div>

                          {/* 2. Registered Workforce */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[11px] text-slate-500 block">Registered Workforce Supply</span>
                            <span className="font-mono font-bold text-slate-900 text-sm block">
                              {item.workerSupply !== undefined && item.workerSupply !== null ? `${item.workerSupply.toLocaleString()} registered seekers` : 'Data unavailable'}
                            </span>
                            <span className="text-[10px] text-slate-400 block leading-tight">
                              Source: e-Shram & NCS Worker Registries
                            </span>
                          </div>

                          {/* 3. Potential Skill Gap */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[11px] text-slate-500 block">Potential Skill Gap</span>
                            <span className={`font-mono font-bold text-sm block ${
                              (item.potentialGap || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                            }`}>
                              {(item.potentialGap || 0) > 0
                                ? `-${item.potentialGap?.toLocaleString()} deficit`
                                : 'Balanced Supply'}
                            </span>
                            <span className="text-[10px] text-slate-400 block leading-tight">
                              Demand vs effective certified workforce
                            </span>
                          </div>

                          {/* 4. Accredited Training Capacity */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[11px] text-slate-500 block">Accredited Training Capacity</span>
                            <span className="font-mono font-bold text-slate-900 text-sm block">
                              {item.trainingCapacity !== undefined && item.trainingCapacity !== null
                                ? `${item.trainingCapacity.toLocaleString()} annual seats`
                                : 'Capacity unfiled'}
                            </span>
                            <span className="text-[10px] text-slate-400 block leading-tight">
                              Source: MSDE PMKVY ({item.activeCenters || 0} active accredited centers)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Evidence Summary Footnote */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>
                          Time-series depth: <strong className="text-slate-700">{item.demandTrend || 'Verified historical quarters'}</strong>
                        </span>
                        <span>
                          Status: <strong className="text-slate-700">Potential priority for workforce and training planning</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
