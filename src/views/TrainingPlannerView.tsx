import React, { useEffect, useState, useMemo } from 'react';
import { MasterGeographySelect } from '../components/MasterGeographySelect';
import { DataCoverageCard } from '../components/DataCoverageCard';
import { checkDataCoverage } from '../utils/dataAvailability';
import { getPlanningData } from '../utils/analyticsEngine';
import { filterByCanonicalGeography } from '../utils/canonicalGeography';
import { DEMAND_RECORDS } from '../data/demandData';
import { SUPPLY_WORKER_RECORDS } from '../data/supplyData';
import { TRAINING_RECORDS } from '../data/trainingData';
import {
  GraduationCap,
  Building2,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sliders,
  ShieldCheck,
  Info,
  Minus,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { PlanningDataResult } from '../types';

interface TrainingPlannerViewProps {
  onNavigateToSimulator?: (skill: string, state: string, district: string) => void;
  onNavigateToAssistant?: () => void;
}

export const TrainingPlannerView: React.FC<TrainingPlannerViewProps> = ({
  onNavigateToSimulator,
  onNavigateToAssistant,
}) => {
  const [selectedState, setSelectedState] = useState('Telangana');
  const [selectedDistrict, setSelectedDistrict] = useState('Hyderabad');
  const [selectedSkill, setSelectedSkill] = useState('');

  const [planningData, setPlanningData] = useState<PlanningDataResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamically extract verified skills for the selected state and district from real records
  const availableSkills = useMemo(() => {
    if (!selectedState) return [];

    const skillSet = new Set<string>();

    filterByCanonicalGeography(DEMAND_RECORDS, { state: selectedState, district: selectedDistrict })
      .forEach((d) => skillSet.add(d.normalizedSkill));

    filterByCanonicalGeography(SUPPLY_WORKER_RECORDS, { state: selectedState, district: selectedDistrict })
      .forEach((s) => skillSet.add(s.normalizedSkill));

    filterByCanonicalGeography(TRAINING_RECORDS, { state: selectedState, district: selectedDistrict })
      .forEach((t) => skillSet.add(t.normalizedSkill));

    return Array.from(skillSet).sort();
  }, [selectedState, selectedDistrict]);

  // Synchronize selected skill when location or available skills change
  useEffect(() => {
    if (availableSkills.length > 0) {
      if (!selectedSkill || !availableSkills.includes(selectedSkill)) {
        setSelectedSkill(availableSkills[0]);
      }
    } else {
      setSelectedSkill('');
    }
  }, [availableSkills]);

  // Coverage evaluation for district
  const coverage = useMemo(() => {
    if (selectedState || selectedDistrict) {
      return checkDataCoverage(selectedState, selectedDistrict, undefined, selectedSkill || undefined);
    }
    return null;
  }, [selectedState, selectedDistrict, selectedSkill]);

  // Load planning data dynamically from shared service / API
  useEffect(() => {
    async function loadPlanning() {
      if (!selectedState || !selectedDistrict || !selectedSkill) {
        if (selectedState && selectedDistrict) {
          // District has no skill filings
          const blankData = getPlanningData(selectedState, selectedDistrict, '');
          setPlanningData(blankData);
        } else {
          setPlanningData(null);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams({
          skill: selectedSkill,
          state: selectedState,
          district: selectedDistrict,
        });

        const res = await fetch(`/api/planning-data?${params.toString()}`);
        if (res.ok) {
          const json: PlanningDataResult = await res.json();
          setPlanningData(json);
        } else {
          // Fallback to client service if offline / API error
          const fallback = getPlanningData(selectedState, selectedDistrict, selectedSkill);
          setPlanningData(fallback);
        }
      } catch (err) {
        console.error('Failed to load planning data:', err);
        const fallback = getPlanningData(selectedState, selectedDistrict, selectedSkill);
        setPlanningData(fallback);
      } finally {
        setLoading(false);
      }
    }

    loadPlanning();
  }, [selectedSkill, selectedState, selectedDistrict]);

  const isDistrictUnavailable = Boolean(
    selectedDistrict && coverage && coverage.demandStatus === 'UNAVAILABLE' && coverage.workerSupplyStatus === 'UNAVAILABLE' && coverage.trainingStatus === 'UNAVAILABLE'
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Training Planner
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Based on verified labour-market evidence, where and for which skills might additional training capacity be useful?
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Decision-Support Planning Tool</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Evidence-Based Decision Support
            </p>
            <p className="leading-relaxed">
              This planner synthesizes verified job vacancies from the National Career Service, active seeker registrations from e-Shram, and accredited institutional capacity from MSDE. When comparable empirical data is unavailable, advisories are withheld. Missing data is never zero-filled.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Official Geography & Dynamic Skill Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Select Official Geography & Verified Skill</span>
          </label>
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
            disabled={availableSkills.length === 0}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100"
          >
            {availableSkills.length === 0 ? (
              <option value="">Skill data unavailable for this selection</option>
            ) : (
              availableSkills.map((sk) => (
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
            {availableSkills.length > 0 ? (
              <span className="text-emerald-700 font-medium">
                {availableSkills.length} verified skill {availableSkills.length === 1 ? 'record' : 'records'} available
              </span>
            ) : (
              <span className="text-slate-400">
                Official LGD record verified; no filings present in current datasets
              </span>
            )}
          </span>
        </div>
      </div>

      {/* District Coverage Info */}
      {selectedDistrict && coverage && (
        <DataCoverageCard coverage={coverage} />
      )}

      {/* Main Workspace Area */}
      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3"></div>
          <div className="h-24 bg-slate-100 rounded"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      ) : isDistrictUnavailable ? (
        /* Missing Data Handling (Section 4 & 5) */
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Labour-market data unavailable for this selection
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            Location <strong className="text-slate-800">{selectedDistrict}, {selectedState}</strong> is verified in India's official Local Government Directory (LGD). Training planning requires matching empirical records from employment portals (NCS) and accredited training centers (MSDE).
          </p>
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 text-amber-900 rounded-lg text-xs max-w-md mx-auto">
            Missing data is not zero. We never generate arbitrary seat quotas without verified filings.
          </div>
        </div>
      ) : !planningData ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Please select an official State, District, and Skill to view the training planning analysis.
          </p>
        </div>
      ) : (
        /* Simple User Interface (Section 14) */
        <div className="space-y-6">
          {/* Data Availability Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Data Availability Breakdown</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target: {planningData.skill || 'Unfiled Skill'} • {planningData.district}, {planningData.state}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Latest Available Data
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {planningData.latestAvailableDate}
                </span>
              </div>
            </div>

            {/* 4 Core Dimensions: Job Demand, Workforce Supply, Potential Skill Gap, Training Capacity */}
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Job Demand */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Job Demand
                </span>
                {planningData.demandStatus === 'AVAILABLE' && planningData.demandCount !== undefined ? (
                  <>
                    <span className="text-xl font-bold font-mono text-slate-900 tabular-nums block">
                      {planningData.demandCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Vacancies observed in {planningData.demandDate} (NCS)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-semibold text-slate-400 block">
                      Unavailable
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      No verified vacancy filings
                    </span>
                  </>
                )}
              </div>

              {/* 2. Workforce Supply */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Workforce Supply
                </span>
                {planningData.workerSupplyStatus === 'AVAILABLE' && planningData.workerSupplyCount !== undefined ? (
                  <>
                    <span className="text-xl font-bold font-mono text-slate-900 tabular-nums block">
                      {planningData.workerSupplyCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Active jobseekers in {planningData.workerSupplyDate} (e-Shram/NCS)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-semibold text-slate-400 block">
                      Unavailable
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      No matching worker registrations
                    </span>
                  </>
                )}
              </div>

              {/* 3. Potential Skill Gap */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Potential Skill Gap
                </span>
                {planningData.isComparable && planningData.potentialGap !== undefined ? (
                  <>
                    <span className={`text-xl font-bold font-mono tabular-nums block ${
                      planningData.potentialGap > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {planningData.potentialGap > 0
                        ? `+${planningData.potentialGap.toLocaleString()}`
                        : 'Balanced'}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      {planningData.potentialGap > 0 ? 'Observed hiring deficit' : 'Supply meets observed demand'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-semibold text-amber-700 block">
                      Cannot calculate
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Datasets are not comparable
                    </span>
                  </>
                )}
              </div>

              {/* 4. Training Capacity */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  Training Capacity
                </span>
                {planningData.trainingStatus === 'AVAILABLE' && planningData.trainingCapacity !== undefined ? (
                  <>
                    <span className="text-xl font-bold font-mono text-slate-900 tabular-nums block">
                      {planningData.trainingCapacity.toLocaleString()} seats
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Across {planningData.activeCenters || 0} center(s) in {planningData.trainingDate} (MSDE)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-semibold text-slate-400 block">
                      Unavailable
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Institutional capacity unfiled
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Incomplete / Non-Comparable Notice if applicable */}
            {planningData.trainingNotice && (
              <div className="px-5 pb-4 text-xs text-amber-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{planningData.trainingNotice}</span>
              </div>
            )}
          </div>

          {/* Planning Insight Card (Section 14) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Planning Insight
              </h3>
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {planningData.planningAdvisory}
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
              Notice: Additional training capacity recommendations are analytical indicators based on observed vacancy filings and registered trainees; they support, rather than mandate, administrative planning decisions.
            </div>

            {/* Actions footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              {onNavigateToAssistant ? (
                <button
                  type="button"
                  onClick={onNavigateToAssistant}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Ask SkillPulse Assistant about this calculation</span>
                </button>
              ) : (
                <div></div>
              )}

              {planningData.isComparable && (planningData.potentialGap || 0) > 0 && onNavigateToSimulator && (
                <button
                  type="button"
                  onClick={() => onNavigateToSimulator(planningData.skill, planningData.state, planningData.district)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span>Simulate in What-If Tool</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
