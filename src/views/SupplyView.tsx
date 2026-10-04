import React, { useEffect, useState, useMemo } from 'react';
import { EmptyState } from '../components/EmptyState';
import { DataQualityIndicator } from '../components/DataQualityIndicator';
import { MasterGeographySelect } from '../components/MasterGeographySelect';
import { MasterSectorSelect } from '../components/MasterSectorSelect';
import { DataCoverageCard } from '../components/DataCoverageCard';
import { checkDataCoverage } from '../utils/dataAvailability';
import { Users, GraduationCap, Building2, CheckCircle2, Filter, Award, MapPin, Info } from 'lucide-react';

export const SupplyView: React.FC = () => {
  const [supplyData, setSupplyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [activeTab, setActiveTab] = useState<'both' | 'workers' | 'training'>('both');

  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  // Coverage evaluation
  const coverage = useMemo(() => {
    if (selectedState || selectedDistrict) {
      return checkDataCoverage(selectedState, selectedDistrict, selectedSector, selectedSkill);
    }
    return null;
  }, [selectedState, selectedDistrict, selectedSector, selectedSkill]);

  useEffect(() => {
    async function loadSupply() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedState) params.append('state', selectedState);
        if (selectedDistrict) params.append('district', selectedDistrict);
        if (selectedSector) params.append('sector', selectedSector);
        if (selectedSkill) params.append('skill', selectedSkill);

        const res = await fetch(`/api/supply?${params.toString()}`);
        const json = await res.json();
        setSupplyData(json);

        if (json.isAvailable) {
          const wList = json.workerSupply?.records || [];
          const tList = json.trainingSupply?.records || [];
          const allRecs = [...wList, ...tList];
          setAvailableSkills(Array.from(new Set(allRecs.map((r: any) => r.normalizedSkill))));
        } else {
          setAvailableSkills([]);
        }
      } catch (err) {
        console.error('Failed to load supply:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSupply();
  }, [selectedState, selectedDistrict, selectedSector, selectedSkill]);

  const resetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedSkill('');
  };

  const workerRecords = supplyData?.workerSupply?.records || [];
  const trainingRecords = supplyData?.trainingSupply?.records || [];
  const hasRecords = workerRecords.length > 0 || trainingRecords.length > 0;

  const isDistrictUnavailable = Boolean(
    selectedDistrict && coverage && coverage.workerSupplyStatus === 'UNAVAILABLE' && coverage.trainingStatus === 'UNAVAILABLE'
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Supply Analysis
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
              {hasRecords ? 'Verified Ingested' : 'Awaiting Source Ingestion'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View available workforce and verified training capacity from the latest available records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataQualityIndicator
            level={hasRecords ? "High" : "Unavailable"}
            reason={
              hasRecords
                ? "Verified worker registrations and accredited training records with valid official provenance."
                : "Workforce and training data unavailable: Verified workforce and training records have not yet been ingested for this selection."
            }
            compact={true}
          />
        </div>
      </div>

      {/* Filter Controls Bar with Master Geography */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Search & Geography Filters</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented View Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Supply
              </button>
              <button
                onClick={() => setActiveTab('workers')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'workers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Worker Supply
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'training' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Training Centers
              </button>
            </div>

            {(selectedState || selectedDistrict || selectedSector || selectedSkill) && (
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Master Geography Selector */}
        <MasterGeographySelect
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onStateChange={setSelectedState}
          onDistrictChange={setSelectedDistrict}
          showAllOption={true}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Normalized Sector Select */}
          <MasterSectorSelect
            selectedSector={selectedSector}
            onSectorChange={setSelectedSector}
            showAllOption={true}
          />

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Skill Track
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">
                {availableSkills.length > 0 ? 'All Skills' : 'Skill data unavailable'}
              </option>
              {availableSkills.map((sk) => (
                <option key={sk} value={sk}>{sk}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Coverage Card */}
      {selectedDistrict && coverage && (
        <DataCoverageCard coverage={coverage} domain="supply" />
      )}

      {loading ? (
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
      ) : isDistrictUnavailable ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Supply data unavailable for this district
            </h3>
            <p className="text-xs font-semibold text-slate-700">
              District: {selectedDistrict}, {selectedState}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official Local Government Directory (LGD) record verified. Verified workforce and training records have not yet been ingested for this district.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg text-[11px] text-amber-900 font-medium">
              Missing data is not zero. We never display false zero values.
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
      ) : (
        <>
          {/* Workforce Summary Cards - Always Dynamic or Honest Unavailable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold mb-1">
                <span>Active Registered Workers</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {supplyData?.workerSupply?.totalCount !== null && supplyData?.workerSupply?.totalCount !== undefined
                  ? supplyData.workerSupply.totalCount.toLocaleString()
                  : 'Unavailable'}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {supplyData?.workerSupply?.totalCount !== null && supplyData?.workerSupply?.totalCount !== undefined
                  ? 'Active Registered Seekers'
                  : 'Verified registry data not filed'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-sky-700 text-xs font-semibold mb-1">
                <span>Annual Training Capacity</span>
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {supplyData?.trainingSupply?.totalAnnualCapacity !== null && supplyData?.trainingSupply?.totalAnnualCapacity !== undefined
                  ? supplyData.trainingSupply.totalAnnualCapacity.toLocaleString()
                  : 'Unavailable'}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {supplyData?.trainingSupply?.totalAnnualCapacity !== null && supplyData?.trainingSupply?.totalAnnualCapacity !== undefined
                  ? 'Accredited Center Seats'
                  : 'Accredited capacity not filed'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
                <span>Certified Candidates</span>
                <Award className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {supplyData?.trainingSupply?.totalCertified !== null && supplyData?.trainingSupply?.totalCertified !== undefined
                  ? supplyData.trainingSupply.totalCertified.toLocaleString()
                  : 'Unavailable'}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {supplyData?.trainingSupply?.totalCertified !== null && supplyData?.trainingSupply?.totalCertified !== undefined
                  ? 'Assessment Passed'
                  : 'Assessment records not filed'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-1">
                <span>Verified Placement Rate</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {supplyData?.trainingSupply?.averagePlacementRate !== null && supplyData?.trainingSupply?.averagePlacementRate !== undefined
                  ? `${supplyData.trainingSupply.averagePlacementRate}%`
                  : 'Unavailable'}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {supplyData?.trainingSupply?.averagePlacementRate !== null && supplyData?.trainingSupply?.averagePlacementRate !== undefined
                  ? 'Placed / Certified'
                  : 'Outcome records not filed'}
              </span>
            </div>
          </div>

          {!hasRecords ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Verified supply data unavailable.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  No verified workforce supply or training-capacity records are currently available for this selection. Supply analysis requires verified worker registrations (e-Shram) and accredited institutional training center records (MSDE PMKVY) with valid official provenance.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span>Real Data Standard:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    SkillPulse strictly adheres to the principle that missing data is never converted to false zero values or populated with synthetic demonstration placeholders.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Section: Worker Supply */}
              {(activeTab === 'both' || activeTab === 'workers') && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Worker Supply (Available Workforce)</span>
                      </h3>
                      <p className="text-xs text-slate-500">Available registered workforce records from verified datasets</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {workerRecords.length} {workerRecords.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Period</th>
                          <th className="py-2.5 px-4">Location</th>
                          <th className="py-2.5 px-4">Sector</th>
                          <th className="py-2.5 px-4">Skill</th>
                          <th className="py-2.5 px-4 text-right">Available Workforce</th>
                          <th className="py-2.5 px-4">Workforce Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {workerRecords.map((w: any) => (
                          <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-900">{w.period}</td>
                            <td className="py-2.5 px-4">
                              <span className="font-medium text-slate-900">{w.district}</span>
                              <span className="text-slate-400 block text-[10px]">{w.state}</span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">{w.sector}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{w.normalizedSkill}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-600 tabular-nums">
                              {w.workerCount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-[11px] text-slate-500">
                              {w.population_scope === 'UNORGANISED_WORKFORCE'
                                ? 'Unorganised Workforce'
                                : w.population_scope === 'FORMAL_JOBSEEKERS'
                                ? 'Registered Jobseekers'
                                : (w.population_scope ? w.population_scope.replace(/_/g, ' ') : 'Registered Jobseekers')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section: Training Supply */}
              {(activeTab === 'both' || activeTab === 'training') && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-sky-600" />
                        <span>Institutional Training Supply (Accredited Centers)</span>
                      </h3>
                      <p className="text-xs text-slate-500">Government certified courses, seat capacity, and outcome tracking</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded">
                      {trainingRecords.length} {trainingRecords.length === 1 ? 'course' : 'courses'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Location</th>
                          <th className="py-2.5 px-4">Course & Scheme</th>
                          <th className="py-2.5 px-4">Target Skill</th>
                          <th className="py-2.5 px-4 text-right">Annual Capacity</th>
                          <th className="py-2.5 px-4 text-right">Enrolled</th>
                          <th className="py-2.5 px-4 text-right">Certified</th>
                          <th className="py-2.5 px-4 text-right">Placed</th>
                          <th className="py-2.5 px-4 text-right">Placement %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trainingRecords.map((t: any) => {
                          const hasCertified = t.certifiedCount !== null && t.certifiedCount !== undefined && t.certifiedCount > 0;
                          const hasPlaced = t.placedCount !== null && t.placedCount !== undefined;
                          const placementRate = (hasCertified && hasPlaced) ? Math.round((t.placedCount / t.certifiedCount) * 100) : null;
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-4">
                                <span className="font-medium text-slate-900">{t.district}</span>
                                <span className="text-slate-400 block text-[10px]">{t.state}</span>
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="font-semibold text-slate-900">{t.courseName}</span>
                                <span className="text-[10px] text-slate-500 block">{t.scheme}</span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-700">{t.normalizedSkill}</td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                                {t.annualCapacity !== null && t.annualCapacity !== undefined ? t.annualCapacity.toLocaleString() : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                                {t.enrolledCount !== null && t.enrolledCount !== undefined ? t.enrolledCount.toLocaleString() : (t.trainedCount !== null && t.trainedCount !== undefined ? `${t.trainedCount.toLocaleString()} (Trained)` : '—')}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                                {t.certifiedCount !== null && t.certifiedCount !== undefined ? t.certifiedCount.toLocaleString() : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 tabular-nums">
                                {t.placedCount !== null && t.placedCount !== undefined ? t.placedCount.toLocaleString() : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {placementRate !== null ? (
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    placementRate >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {placementRate}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
