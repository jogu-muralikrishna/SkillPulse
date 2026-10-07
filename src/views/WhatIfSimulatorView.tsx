import React, { useEffect, useState, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  Info,
  CheckCircle2,
  MapPin,
  Building2,
  GraduationCap
} from 'lucide-react';
import { SimulationResult } from '../utils/analyticsEngine';
import { MASTER_STATES, getDistrictsForState } from '../data/masterGeography';
import { filterByCanonicalGeography } from '../utils/canonicalGeography';
import { DEMAND_RECORDS } from '../data/demandData';
import { SUPPLY_WORKER_RECORDS } from '../data/supplyData';
import { TRAINING_RECORDS } from '../data/trainingData';

interface WhatIfSimulatorViewProps {
  initialSkill?: string;
  initialState?: string;
  initialDistrict?: string;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({
  initialSkill,
  initialState = 'Telangana',
  initialDistrict = 'Hyderabad',
}) => {
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkill || '');
  const [additionalCapacity, setAdditionalCapacity] = useState<number>(300);

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Available districts for selected state
  const availableDistricts = useMemo(() => {
    return selectedState ? getDistrictsForState(selectedState) : [];
  }, [selectedState]);

  // Dynamically extract verified skills for the selected state and district from real data
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

  // Synchronize selected district when state changes
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const districts = getDistrictsForState(newState);
    const defaultDist = districts.length > 0 ? districts[0].district_name : '';
    setSelectedDistrict(defaultDist);
  };

  // Synchronize selected skill when location changes
  useEffect(() => {
    if (availableSkills.length > 0) {
      if (!selectedSkill || !availableSkills.includes(selectedSkill)) {
        // If initialSkill was passed and is available, use it; otherwise pick first
        if (initialSkill && availableSkills.includes(initialSkill)) {
          setSelectedSkill(initialSkill);
        } else {
          setSelectedSkill(availableSkills[0]);
        }
      }
    } else {
      setSelectedSkill('');
    }
  }, [availableSkills, initialSkill]);

  // Run simulation against backend API
  const runSimulation = async (
    cap: number,
    sk = selectedSkill,
    st = selectedState,
    dt = selectedDistrict
  ) => {
    if (!sk || !st || !dt) {
      setSimulation({
        skill: sk || '',
        state: st || '',
        district: dt || '',
        projectedDemand: 0,
        currentSupply: 0,
        currentTrainingCapacity: 0,
        currentGap: 0,
        additionalCapacity: 0,
        effectivePlacementRate: 0,
        newTrainingCapacity: 0,
        newEstimatedOutput: 0,
        newEstimatedSupply: 0,
        newEstimatedGap: 0,
        gapReductionPercent: 0,
        isAvailable: false,
        reason: 'Comparable demand and workforce data are not available for this selection.',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: sk,
          state: st,
          district: dt,
          additionalCapacity: cap,
        }),
      });
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSkill && selectedState && selectedDistrict) {
      runSimulation(additionalCapacity, selectedSkill, selectedState, selectedDistrict);
    } else {
      setSimulation({
        skill: selectedSkill || '',
        state: selectedState || '',
        district: selectedDistrict || '',
        projectedDemand: 0,
        currentSupply: 0,
        currentTrainingCapacity: 0,
        currentGap: 0,
        additionalCapacity: 0,
        effectivePlacementRate: 0,
        newTrainingCapacity: 0,
        newEstimatedOutput: 0,
        newEstimatedSupply: 0,
        newEstimatedGap: 0,
        gapReductionPercent: 0,
        isAvailable: false,
        reason: 'Comparable demand and workforce data are not available for this selection.',
      });
    }
  }, [selectedSkill, selectedState, selectedDistrict]);

  const handleSliderChange = (val: number) => {
    setAdditionalCapacity(val);
    if (selectedSkill && selectedState && selectedDistrict) {
      runSimulation(val, selectedSkill, selectedState, selectedDistrict);
    }
  };

  const handlePresetCapacity = (val: number) => {
    setAdditionalCapacity(val);
    if (selectedSkill && selectedState && selectedDistrict) {
      runSimulation(val, selectedSkill, selectedState, selectedDistrict);
    }
  };

  const currentGap = simulation?.currentGap || 0;
  const projectedGap = simulation
    ? (simulation.unmetShortage !== undefined ? simulation.unmetShortage : Math.max(0, simulation.newEstimatedGap))
    : 0;
  const gapReduction = Math.max(0, currentGap - projectedGap);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              What-If Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Project the potential impact of adding accredited training capacity on labour-market skill gaps
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Empirical Evidence Baseline</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Decision-Support Impact Projection
            </p>
            <p className="leading-relaxed">
              This simulator answers: <span className="font-medium text-slate-900">“What could happen to the potential skill gap if additional training capacity is added?”</span> All calculations rely on actual verified vacancy filings and accredited training outcomes. When comparable data is unavailable, synthetic figures are never generated.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Hierarchy Selection: State -> District -> Skill */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>Select Official Geography & Verified Skill</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Select State */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Select State / UT:
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              {MASTER_STATES.map((s) => (
                <option key={s.state_id} value={s.state_name}>
                  {s.state_name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select District */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Select District:
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={availableDistricts.length === 0}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium disabled:opacity-50"
            >
              {availableDistricts.map((d) => (
                <option key={d.district_id} value={d.district_name}>
                  {d.district_name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Select Skill */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Select Skill:
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              disabled={availableSkills.length === 0}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium disabled:opacity-50"
            >
              {availableSkills.length === 0 ? (
                <option value="">No verified skills filed for this district</option>
              ) : (
                availableSkills.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selection summary pill */}
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
                {availableSkills.length} skill {availableSkills.length === 1 ? 'filing' : 'filings'} available in verified records
              </span>
            ) : (
              <span className="text-slate-400">
                Official LGD district verified; no filings present in current datasets
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Simulation Workspace or Unavailable Notice */}
      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
          <div className="h-32 bg-slate-100 rounded"></div>
        </div>
      ) : !simulation?.isAvailable ? (
        /* Missing Data Handling (Section 6 & Section 10) */
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-amber-200/90 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Simulation unavailable
              </h3>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                {simulation?.reason ||
                  'Comparable demand and workforce data are not available for this selection.'}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                To estimate training impact, the system requires comparable demand records, worker registrations, and institutional training disclosures for the exact same skill and district. SkillPulse does not fabricate scores or gaps when real data is unavailable.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Valid Data Workspace (Section 7, 8, 9, 13) */
        <div className="space-y-6">
          {/* Capacity Input Card */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Proposed Additional Training Capacity</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate new intake capacity for {simulation.skill} in {simulation.district}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Additional Training Capacity
                </span>
                <span className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
                  +{additionalCapacity.toLocaleString()} seats
                </span>
              </div>
            </div>

            {/* Slider & Presets */}
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={additionalCapacity}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 (Status Quo)</span>
                <span>250</span>
                <span>500</span>
                <span>750</span>
                <span>+1,000 seats</span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                {[0, 100, 250, 300, 500, 750, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetCapacity(preset)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors border ${
                      additionalCapacity === preset
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset === 0 ? '0' : `+${preset}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Display (Section 9 & 13) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>What-If Result</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated from available empirical demand and institutional placement baselines
                </p>
              </div>
              {simulation.mode === 'CAPACITY_SCENARIO' ? (
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200 self-start sm:self-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Capacity Scenario</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Observed Placement Outcome</span>
                </span>
              )}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="p-5 sm:p-6 space-y-6">
              {simulation.mode === 'CAPACITY_SCENARIO' && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px]">
                        Capacity Scenario Mode
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 font-medium">
                        PMKVY 4.0 Delinked Placement Data
                      </span>
                    </div>
                    <p className="leading-relaxed text-amber-900/90">
                      Under PMKVY 4.0 guidelines, placement tracking was delinked to prioritize short-term orientation. This projection evaluates a <strong>mathematical capacity scenario</strong>: adding proposed intake (+{additionalCapacity.toLocaleString()} seats) to current effective supply ({simulation.currentSupply.toLocaleString()}) to project potential supply ceiling ({simulation.newEstimatedSupply.toLocaleString()}). This is a capacity benchmark, not an assertion that 100% of seats will result in immediate commercial hiring.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Current Potential Gap */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    Current Potential Gap
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums block">
                    {currentGap > 0 ? `${currentGap.toLocaleString()}` : 'Balanced'}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    Demand {simulation.projectedDemand.toLocaleString()} − Supply {simulation.currentSupply.toLocaleString()}
                  </span>
                </div>

                {/* 2. Additional Training Capacity */}
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-xs text-indigo-900 font-medium block">
                    Additional Training Capacity
                  </span>
                  <span className="text-xl font-bold font-mono text-indigo-700 tabular-nums block">
                    +{additionalCapacity.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-indigo-600/80 block leading-tight">
                    Proposed accredited center seats
                  </span>
                </div>

                {/* 3. Projected Potential Gap / Scenario Unmet Shortage */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {simulation.mode === 'CAPACITY_SCENARIO' ? 'Scenario Unmet Shortage' : 'Projected Potential Gap'}
                  </span>
                  <span className={`text-xl font-bold font-mono tabular-nums block ${
                    projectedGap > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {projectedGap > 0 ? `${projectedGap.toLocaleString()}` : '0 (Stabilized)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    {simulation.rawPostInterventionGap !== undefined && simulation.rawPostInterventionGap < 0
                      ? `Raw balance: ${simulation.rawPostInterventionGap.toLocaleString()} (Capped at 0)`
                      : 'Estimated residual deficit'}
                  </span>
                </div>

                {/* 4. Change in Potential Gap */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-xs text-emerald-900 font-medium block">
                    Change in Potential Gap
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums block flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>{gapReduction.toLocaleString()}</span>
                  </span>
                  <span className="text-[10px] text-emerald-800/80 block leading-tight font-medium">
                    {gapReduction.toLocaleString()} fewer openings ({simulation.gapReductionPercent}% closed)
                  </span>
                </div>
              </div>

              {/* Transparent Mathematical Scenario Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-mono text-slate-700 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans pb-1 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1">
                  <span>Mathematical Scenario Step-by-Step Breakdown:</span>
                  <span className="text-[10px] text-slate-500 font-mono">Unmet Shortage = max(0, Demand − Scenario Supply)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">1. Current Demand:</span>
                    <span className="font-bold text-slate-900">{simulation.projectedDemand.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">2. Scenario Supply:</span>
                    <span className="font-bold text-slate-900">
                      {simulation.newEstimatedSupply.toLocaleString()}
                      <span className="text-[10px] text-slate-500 font-sans ml-1">({simulation.currentSupply.toLocaleString()} + {simulation.additionalCapacity.toLocaleString()})</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">3. Raw Post-Intervention Gap:</span>
                    <span className="font-bold text-slate-900">
                      {simulation.rawPostInterventionGap !== undefined
                        ? (simulation.rawPostInterventionGap > 0 ? `+${simulation.rawPostInterventionGap.toLocaleString()}` : simulation.rawPostInterventionGap.toLocaleString())
                        : (simulation.projectedDemand - simulation.newEstimatedSupply).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans text-[10px]">4. Displayed Unmet Shortage:</span>
                    <span className={`font-bold ${projectedGap === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {projectedGap.toLocaleString()} {projectedGap === 0 ? '(0 — Deficit Closed)' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action & Explanation Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 flex items-start gap-2 max-w-xl">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-slate-700">
                      {simulation.mode === 'CAPACITY_SCENARIO' ? 'Capacity Scenario Notice:' : 'Projected Estimate:'}
                    </strong>{' '}
                    {simulation.mode === 'CAPACITY_SCENARIO'
                      ? 'Direct mathematical scenario based on actual demand (1,090) and effective supply (780). Training placement counts are delinked under PMKVY 4.0; figures illustrate potential capacity impact rather than guaranteed commercial absorption.'
                      : 'This system estimate recalculates available certified workforce supply using accredited program placement baselines. It provides a planning benchmark for skill authorities, not a guaranteed commercial hiring outcome.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => runSimulation(additionalCapacity)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Run Simulation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
