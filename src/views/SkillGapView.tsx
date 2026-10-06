import React, { useEffect, useState, useMemo } from 'react';
import { EmptyState } from '../components/EmptyState';
import { DataQualityIndicator } from '../components/DataQualityIndicator';
import { MasterGeographySelect } from '../components/MasterGeographySelect';
import { MasterSectorSelect } from '../components/MasterSectorSelect';
import { DataCoverageCard } from '../components/DataCoverageCard';
import { checkDataCoverage } from '../utils/dataAvailability';
import { Scale, Filter, ShieldAlert, MapPin, Info } from 'lucide-react';
import { TelanganaCoverageWarning } from '../components/TelanganaCoverageWarning';
import { SkillGapAnalysis, GapClassification } from '../types';

export const SkillGapView: React.FC = () => {
  const [gaps, setGaps] = useState<SkillGapAnalysis[]>([]);
  const [comparableCount, setComparableCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');

  // Coverage evaluation
  const coverage = useMemo(() => {
    if (selectedState || selectedDistrict) {
      return checkDataCoverage(selectedState, selectedDistrict, selectedSector);
    }
    return null;
  }, [selectedState, selectedDistrict, selectedSector]);

  useEffect(() => {
    async function loadGaps() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedState) params.append('state', selectedState);
        if (selectedDistrict) params.append('district', selectedDistrict);
        if (selectedSector) params.append('sector', selectedSector);

        const res = await fetch(`/api/gaps?${params.toString()}`);
        const json = await res.json();
        setGaps(json.gaps || []);
        setComparableCount(json.comparableCount || 0);
      } catch (err) {
        console.error('Failed to load gaps:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGaps();
  }, [selectedState, selectedDistrict, selectedSector]);

  // Comparable records vs non-comparable records
  const comparableGaps = useMemo(() => gaps.filter(g => g.isComparable), [gaps]);
  const nonComparableGaps = useMemo(() => gaps.filter(g => !g.isComparable), [gaps]);

  const displayedGaps = useMemo(() => {
    if (selectedClassification === 'ALL') {
      // By default, if comparable records exist, show them; otherwise return empty so honest empty state renders
      return comparableGaps;
    }
    if (selectedClassification === 'NON_COMPARABLE') {
      return nonComparableGaps;
    }
    return comparableGaps.filter(g => g.classification === selectedClassification);
  }, [selectedClassification, comparableGaps, nonComparableGaps]);

  const resetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedClassification('ALL');
  };

  const getClassificationBadge = (cls: GapClassification) => {
    switch (cls) {
      case 'SHORTAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Shortage
          </span>
        );
      case 'BALANCED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Balanced
          </span>
        );
      case 'OVERSUPPLY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Oversupply
          </span>
        );
      case 'NON_COMPARABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            Non-Comparable
          </span>
        );
    }
  };

  const isDistrictUnavailable = Boolean(
    selectedDistrict && coverage && coverage.gapStatus === 'UNAVAILABLE'
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Skill Gaps
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              Comparative Analysis
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Compare employer job demand with available workforce for comparable skills and locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataQualityIndicator
            level={comparableCount > 0 ? "High" : "Unavailable"}
            reason={
              comparableCount > 0
                ? "Calculated strictly on identical spatial and temporal boundaries."
                : "Data quality assessment unavailable: No comparable demand-workforce pairs exist in production dataset."
            }
            compact={true}
          />
        </div>
      </div>

      {/* Filter Bar with Master Geography & Normalized Sectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Search & Geography Filters</span>
          </div>

          {(selectedState || selectedDistrict || selectedSector || selectedClassification !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Master Geography Selector */}
        <MasterGeographySelect
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onStateChange={setSelectedState}
          onDistrictChange={setSelectedDistrict}
          showAllOption={true}
        />

        {/* Sector and Classification Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <MasterSectorSelect
            selectedSector={selectedSector}
            onSectorChange={setSelectedSector}
            showAllOption={true}
          />

          {/* Classification Filter Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Gap Classification
            </label>
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
              {[
                { id: 'ALL', label: 'All Comparable' },
                { id: 'SHORTAGE', label: 'Shortage' },
                { id: 'BALANCED', label: 'Balanced' },
                { id: 'OVERSUPPLY', label: 'Oversupply' },
                { id: 'NON_COMPARABLE', label: `Non-Comparable (${nonComparableGaps.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedClassification(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    selectedClassification === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Telangana Coverage Warning */}
      <TelanganaCoverageWarning
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
      />

      {/* Coverage Card */}
      {selectedDistrict && coverage && (
        <DataCoverageCard coverage={coverage} domain="gaps" />
      )}

      {/* Main Content */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
      ) : isDistrictUnavailable ? (
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
              Official Local Government Directory (LGD) record verified. Comparable demand and workforce records have not yet been ingested for this district.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg text-[11px] text-amber-900 font-medium">
              Missing data is not zero. We never display false zero values (Demand = 0, Supply = 0, Gap = 0).
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
      ) : displayedGaps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Scale className="w-7 h-7" />
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              No comparable skill-gap data is currently available.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Skill gaps are shown only when comparable demand and workforce records are available for the same skill, geography, and compatible time period. Missing data is never treated as zero.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Zero-Fake-Data Standard:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Employer demand records exist across industrial clusters, but matching official workforce registrations (e-Shram microdata) have not been ingested for direct comparison. SkillPulse never manufactures artificial gap scores.
              </p>
            </div>
          </div>
          {nonComparableGaps.length > 0 && selectedClassification !== 'NON_COMPARABLE' && (
            <div className="pt-2">
              <button
                onClick={() => setSelectedClassification('NON_COMPARABLE')}
                className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                View {nonComparableGaps.length} Unlinked Demand Records (Non-Comparable)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Skill & Sector</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Demand</th>
                  <th className="py-3 px-4 text-right">Available Workforce</th>
                  <th className="py-3 px-4 text-right">Potential Gap</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Data Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedGaps.map((item, idx) => (
                  <tr key={`${item.district}-${item.normalizedSkill}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block text-xs">{item.normalizedSkill}</span>
                      <span className="text-[11px] text-slate-500 block">{item.sector}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{item.district}</span>
                      <span className="text-slate-400 block text-[10px]">{item.state}</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.demand.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {item.isComparable && item.workerSupply !== null ? item.workerSupply.toLocaleString() : 'Data Unavailable'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {item.isComparable && item.gap !== null ? (
                        <span className={item.gap > 0 ? 'text-rose-600' : item.gap < 0 ? 'text-blue-600' : 'text-emerald-600'}>
                          {item.gap > 0 ? `+${item.gap.toLocaleString()}` : item.gap.toLocaleString()}
                          <span className="text-[10px] block font-normal text-slate-400">
                            ({item.gapPercentage !== null && item.gapPercentage > 0 ? `+${item.gapPercentage}%` : `${item.gapPercentage}%`})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic text-[11px]">
                          Cannot calculate
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getClassificationBadge(item.classification)}
                    </td>
                    <td className="py-3 px-4">
                      <DataQualityIndicator level={item.dataQuality.level} reason={item.dataQuality.reason} compact={true} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
