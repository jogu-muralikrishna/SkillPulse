import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Briefcase,
  Users,
  Building2,
  AlertTriangle,
  Layers,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Filter,
  RotateCcw,
  Compass,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Search,
  Check
} from 'lucide-react';
import { MASTER_STATES, getDistrictsForState } from '../data/masterGeography';
import { SECTORS, INITIAL_SKILL_MAPPINGS } from '../data/skillsTaxonomy';
import { formatNumber } from '../utils/numberFormatter';
import {
  getStateLabourMetrics,
  getDistrictLabourMetrics,
  getNationalLabourMetrics,
  normalizeStateName,
  LocationLabourMetrics
} from '../utils/indiaMapMetrics';
import indiaStatesGeoJson from '../data/india_states_boundaries.json';
import indiaDistrictsGeoJson from '../data/india_districts_clean.json';

export const LocationView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const statesLayerRef = useRef<L.GeoJSON | null>(null);
  const districtsLayerRef = useRef<L.GeoJSON | null>(null);

  // Filter states
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');

  // Dropdown search states
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);

  // Available districts for the selected state from official LGD master
  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  // Filtered lists for searchable dropdowns
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return MASTER_STATES;
    const q = stateSearch.toLowerCase();
    return MASTER_STATES.filter(s => s.state_name.toLowerCase().includes(q));
  }, [stateSearch]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return availableDistricts;
    const q = districtSearch.toLowerCase();
    return availableDistricts.filter(d => d.district_name.toLowerCase().includes(q));
  }, [availableDistricts, districtSearch]);

  // Available skills filtered by sector
  const availableSkills = useMemo(() => {
    if (!selectedSector) {
      return Array.from(new Set(INITIAL_SKILL_MAPPINGS.map(m => m.normalizedSkill))).sort();
    }
    return Array.from(
      new Set(
        INITIAL_SKILL_MAPPINGS.filter(m =>
          m.sector.toLowerCase().includes(selectedSector.toLowerCase()) ||
          selectedSector.toLowerCase().includes(m.sector.toLowerCase())
        ).map(m => m.normalizedSkill)
      )
    ).sort();
  }, [selectedSector]);

  // Compute labour-market metrics for current selection
  const currentMetrics: LocationLabourMetrics = useMemo(() => {
    if (selectedDistrict) {
      return getDistrictLabourMetrics(selectedDistrict, selectedState, selectedSkill, selectedSector);
    }
    if (selectedState) {
      return getStateLabourMetrics(selectedState, selectedSkill, selectedSector);
    }
    return getNationalLabourMetrics(selectedSkill, selectedSector);
  }, [selectedState, selectedDistrict, selectedSkill, selectedSector]);

  // Color generator based on application's existing calculation rules
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'HIGH_SHORTAGE':
        return '#EF4444'; // 🔴 Higher gap
      case 'MODERATE_SHORTAGE':
        return '#F59E0B'; // 🟡 Moderate gap
      case 'LOWER_GAP':
        return '#10B981'; // 🟢 Lower gap
      case 'UNAVAILABLE':
      default:
        return '#E2E8F0'; // ⚪ Data unavailable
    }
  };

  // Initialize Leaflet map with India vector boundaries (NO WORLD MAP)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // India geographic bounds
    const indiaSouthWest = L.latLng(7.0, 68.0);
    const indiaNorthEast = L.latLng(37.5, 97.5);
    const indiaBounds = L.latLngBounds(indiaSouthWest, indiaNorthEast);

    const map = L.map(mapContainerRef.current, {
      center: [22.8, 80.0],
      zoom: 4.8,
      minZoom: 4,
      maxZoom: 10,
      maxBounds: L.latLngBounds(L.latLng(5.0, 65.0), L.latLng(38.5, 100.0)),
      maxBoundsViscosity: 1.0,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    map.fitBounds(indiaBounds, { padding: [10, 10] });
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render India States & Districts GeoJSON layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean previous layers
    if (statesLayerRef.current) {
      map.removeLayer(statesLayerRef.current);
      statesLayerRef.current = null;
    }
    if (districtsLayerRef.current) {
      map.removeLayer(districtsLayerRef.current);
      districtsLayerRef.current = null;
    }

    // When NO state is selected (All-India view):
    // Render all 36 States & Union Territories with clear administrative boundaries
    if (!selectedState) {
      const statesLayer = L.geoJSON(indiaStatesGeoJson as any, {
        style: (feature: any) => {
          const stateName = feature.properties.state_name;
          const metrics = getStateLabourMetrics(stateName, selectedSkill, selectedSector);
          const color = getCategoryColor(metrics.gapCategory);

          return {
            fillColor: color,
            fillOpacity: metrics.hasData ? 0.85 : 0.65,
            color: '#475569', // Clear separation between neighbouring states
            weight: 1.2,
            opacity: 1,
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const stateName = feature.properties.state_name;
          const metrics = getStateLabourMetrics(stateName, selectedSkill, selectedSector);

          // Rich hover tooltip with state name and live labour metrics
          layer.bindTooltip(`
            <div style="font-family: sans-serif; font-size: 11px; padding: 4px; line-height: 1.4;">
              <div style="font-weight: 700; color: #0F172A; font-size: 12px; margin-bottom: 2px;">
                ${stateName}
              </div>
              ${
                metrics.hasData
                  ? `
                <div style="display: flex; gap: 8px; border-top: 1px solid #CBD5E1; padding-top: 3px; font-size: 10px;">
                  <span>Demand: <strong>${formatNumber(metrics.totalDemand)}</strong></span>
                  <span>Workforce: <strong>${formatNumber(metrics.totalWorkers)}</strong></span>
                </div>
                <div style="margin-top: 3px;">
                  <span style="font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 4px; background: ${
                    metrics.gapCategory === 'HIGH_SHORTAGE'
                      ? '#FFE4E6'
                      : metrics.gapCategory === 'MODERATE_SHORTAGE'
                      ? '#FEF3C7'
                      : '#ECFDF5'
                  }; color: ${
                    metrics.gapCategory === 'HIGH_SHORTAGE'
                      ? '#BE123C'
                      : metrics.gapCategory === 'MODERATE_SHORTAGE'
                      ? '#B45309'
                      : '#047857'
                  };">
                    ${metrics.gapLabel}
                  </span>
                </div>
              `
                  : `
                <div style="color: #64748B; font-size: 10px; border-top: 1px solid #E2E8F0; padding-top: 2px;">
                  ⚪ Labour-market data unavailable
                </div>
              `
              }
            </div>
          `, { sticky: true });

          // Hover highlights
          layer.on({
            mouseover: (e) => {
              const target = e.target;
              target.setStyle({
                weight: 2.5,
                color: '#1E293B',
                fillOpacity: 0.95,
              });
              target.bringToFront();
            },
            mouseout: (e) => {
              statesLayer.resetStyle(e.target);
            },
            click: () => {
              setSelectedState(stateName);
              setSelectedDistrict('');
            },
          });
        },
      }).addTo(map);

      statesLayerRef.current = statesLayer;

      // Fit map to India
      const indiaBounds = L.latLngBounds(L.latLng(7.5, 68.0), L.latLng(37.5, 97.5));
      map.fitBounds(indiaBounds, { padding: [10, 10] });
    } else {
      // A STATE IS SELECTED:
      // 1. Render all states dimmed in background
      const statesBgLayer = L.geoJSON(indiaStatesGeoJson as any, {
        style: (feature: any) => {
          const isCurrentState =
            normalizeStateName(feature.properties.state_name) === normalizeStateName(selectedState);
          return {
            fillColor: isCurrentState ? '#EEF2FF' : '#F8FAFC',
            fillOpacity: isCurrentState ? 0.3 : 0.8,
            color: isCurrentState ? '#4338CA' : '#CBD5E1',
            weight: isCurrentState ? 2.5 : 0.8,
            dashArray: isCurrentState ? '' : '2',
          };
        },
      }).addTo(map);
      statesLayerRef.current = statesBgLayer;

      // 2. Render official district boundaries for the selected state
      const stateDistricts = (indiaDistrictsGeoJson as any).features.filter(
        (f: any) => normalizeStateName(f.properties.st_nm) === normalizeStateName(selectedState)
      );

      if (stateDistricts.length > 0) {
        const districtsLayer = L.geoJSON({ type: 'FeatureCollection', features: stateDistricts } as any, {
          style: (feature: any) => {
            const districtName = feature?.properties?.district || feature?.properties?.district_name || 'District';
            const isSelected = selectedDistrict && selectedDistrict.toLowerCase() === districtName.toLowerCase();
            const metrics = getDistrictLabourMetrics(districtName, selectedState, selectedSkill, selectedSector);
            const color = getCategoryColor(metrics.gapCategory);

            return {
              fillColor: isSelected ? '#F59E0B' : color,
              fillOpacity: isSelected ? 0.95 : metrics.hasData ? 0.85 : 0.55,
              color: isSelected ? '#78350F' : '#64748B',
              weight: isSelected ? 2.5 : 1,
              opacity: 1,
            };
          },
          onEachFeature: (feature: any, layer: L.Layer) => {
            const districtName = feature?.properties?.district || feature?.properties?.district_name || 'District';
            const metrics = getDistrictLabourMetrics(districtName, selectedState, selectedSkill, selectedSector);

            layer.bindTooltip(`
              <div style="font-family: sans-serif; font-size: 11px; padding: 4px; line-height: 1.4;">
                <div style="font-weight: 700; color: #0F172A; font-size: 12px; margin-bottom: 2px;">
                  ${districtName}, ${selectedState}
                </div>
                ${
                  metrics.hasData
                    ? `
                  <div style="display: flex; gap: 8px; border-top: 1px solid #CBD5E1; padding-top: 3px; font-size: 10px;">
                    <span>Demand: <strong>${formatNumber(metrics.totalDemand)}</strong></span>
                    <span>Workforce: <strong>${formatNumber(metrics.totalWorkers)}</strong></span>
                  </div>
                  <div style="margin-top: 3px;">
                    <span style="font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 4px; background: ${
                      metrics.gapCategory === 'HIGH_SHORTAGE'
                        ? '#FFE4E6'
                        : metrics.gapCategory === 'MODERATE_SHORTAGE'
                        ? '#FEF3C7'
                        : '#ECFDF5'
                    }; color: ${
                      metrics.gapCategory === 'HIGH_SHORTAGE'
                        ? '#BE123C'
                        : metrics.gapCategory === 'MODERATE_SHORTAGE'
                        ? '#B45309'
                        : '#047857'
                    };">
                      ${metrics.gapLabel}
                    </span>
                  </div>
                `
                    : `
                  <div style="color: #64748B; font-size: 10px; border-top: 1px solid #E2E8F0; padding-top: 2px;">
                    ⚪ Labour-market data unavailable
                  </div>
                `
                }
              </div>
            `, { sticky: true });

            layer.on({
              mouseover: (e) => {
                const target = e.target;
                target.setStyle({ weight: 2.5, color: '#0F172A', fillOpacity: 0.95 });
                target.bringToFront();
              },
              mouseout: (e) => {
                districtsLayer.resetStyle(e.target);
              },
              click: () => {
                setSelectedDistrict(districtName);
              },
            });
          },
        }).addTo(map);

        districtsLayerRef.current = districtsLayer;

        // Auto-zoom to the selected state's boundary
        map.fitBounds(districtsLayer.getBounds(), { padding: [20, 20] });
      }
    }
  }, [selectedState, selectedDistrict, selectedSkill, selectedSector]);

  // Reset to All-India View
  const handleResetToIndia = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSkill('');
    setSelectedSector('');
    if (mapInstanceRef.current) {
      const indiaBounds = L.latLngBounds(L.latLng(7.5, 68.0), L.latLng(37.5, 97.5));
      mapInstanceRef.current.fitBounds(indiaBounds, { padding: [10, 10] });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Geographic Labour Market
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              India Administrative Map
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Explore verified job demand, available workforce, and potential skill gaps across all 36 States & Union Territories of India.
          </p>
        </div>

        {(selectedState || selectedDistrict || selectedSkill || selectedSector) && (
          <button
            onClick={handleResetToIndia}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors self-start md:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to India
          </button>
        )}
      </div>

      {/* Filter Bar: State, District, Skill, Sector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. State Selector */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-indigo-600" />
                Select State
              </span>
              <span className="text-[10px] text-slate-400 font-normal">{MASTER_STATES.length} States & UTs</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStateMenuOpen(!stateMenuOpen);
                  setDistrictMenuOpen(false);
                }}
                className="w-full text-left bg-white border border-slate-300 hover:border-indigo-400 rounded-lg px-3 py-2 text-xs flex items-center justify-between shadow-2xs transition-colors"
              >
                <span className="truncate font-medium text-slate-900">
                  {selectedState || 'All India'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
              </button>

              {stateMenuOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Search state..."
                      value={stateSearch}
                      onChange={e => setStateSearch(e.target.value)}
                      className="w-full text-xs pl-7 pr-2 py-1 border border-slate-200 rounded bg-slate-50"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedState('');
                      setSelectedDistrict('');
                      setStateMenuOpen(false);
                      setStateSearch('');
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-indigo-50 hover:text-indigo-700 ${
                      !selectedState ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    All India
                  </button>
                  {filteredStates.map(s => (
                    <button
                      key={s.state_id}
                      onClick={() => {
                        setSelectedState(s.state_name);
                        setSelectedDistrict('');
                        setStateMenuOpen(false);
                        setStateSearch('');
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between ${
                        selectedState === s.state_name ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <span>{s.state_name}</span>
                      <span className="text-[10px] text-slate-400">{s.state_type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. District Selector */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" />
                Select District
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {selectedState ? `${availableDistricts.length} Districts` : 'Select State first'}
              </span>
            </label>
            <div className="relative">
              <button
                type="button"
                disabled={!selectedState}
                onClick={() => {
                  setDistrictMenuOpen(!districtMenuOpen);
                  setStateMenuOpen(false);
                }}
                className={`w-full text-left border rounded-lg px-3 py-2 text-xs flex items-center justify-between shadow-2xs transition-colors ${
                  !selectedState
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-900'
                }`}
              >
                <span className="truncate font-medium">
                  {selectedDistrict || (selectedState ? 'All Districts in State' : 'Select a State')}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
              </button>

              {districtMenuOpen && selectedState && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Search district..."
                      value={districtSearch}
                      onChange={e => setDistrictSearch(e.target.value)}
                      className="w-full text-xs pl-7 pr-2 py-1 border border-slate-200 rounded bg-slate-50"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDistrict('');
                      setDistrictMenuOpen(false);
                      setDistrictSearch('');
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-indigo-50 hover:text-indigo-700 ${
                      !selectedDistrict ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    All Districts in {selectedState}
                  </button>
                  {filteredDistricts.map(d => (
                    <button
                      key={d.district_id}
                      onClick={() => {
                        setSelectedDistrict(d.district_name);
                        setDistrictMenuOpen(false);
                        setDistrictSearch('');
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-indigo-50 hover:text-indigo-700 ${
                        selectedDistrict === d.district_name ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      {d.district_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Skill Selector */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-indigo-600" />
                Select Skill
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {availableSkills.length} Skills
              </span>
            </label>
            <select
              value={selectedSkill}
              onChange={e => setSelectedSkill(e.target.value)}
              className="w-full bg-white border border-slate-300 hover:border-indigo-400 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Technical Skills</option>
              {availableSkills.map(skill => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Sector Selector */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                Industry Sector
              </span>
              <span className="text-[10px] text-slate-400 font-normal">All Sectors</span>
            </label>
            <select
              value={selectedSector}
              onChange={e => {
                setSelectedSector(e.target.value);
                setSelectedSkill('');
              }}
              className="w-full bg-white border border-slate-300 hover:border-indigo-400 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Industry Sectors</option>
              {SECTORS.map(sec => (
                <option key={sec.id} value={sec.name}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: India Administrative Map on Left, Selected Location on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Box (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>India Administrative Map</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {selectedState ? `Drilldown: ${selectedState}` : `${MASTER_STATES.length} States & UTs`}
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="relative bg-slate-50/50">
            <div
              ref={mapContainerRef}
              className="w-full h-[420px] sm:h-[500px] z-10"
              style={{ minHeight: '420px' }}
            />

            {/* In-Map Control */}
            {selectedState && (
              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={handleResetToIndia}
                  className="bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-sm px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  ← Back to India
                </button>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="p-3.5 border-t border-slate-100 bg-white">
            <span className="text-[11px] font-bold text-slate-700 block mb-2">Legend:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                <span>🟢 Lower gap</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                <span>🟡 Moderate gap</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                <span>🔴 Higher gap</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400 shrink-0"></span>
                <span>⚪ Data unavailable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Location Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
            {/* Header */}
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selected Location
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedDistrict ? `${selectedDistrict}, ${selectedState}` : selectedState || '🇮🇳 India (National Overview)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDistrict ? 'District-level administrative intelligence' : selectedState ? 'State-level aggregated labour intelligence' : 'National consolidated labour-market overview'}
              </p>
            </div>

            {/* If empirical data is available */}
            {currentMetrics.hasData ? (
              <div className="space-y-4">
                {/* 4 Primary KPI Metrics */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Job Demand</span>
                    <span className="font-mono font-bold text-indigo-600 text-base tabular-nums">
                      {formatNumber(currentMetrics.totalDemand)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">vacancies</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Available Workforce</span>
                    <span className="font-mono font-bold text-slate-900 text-base tabular-nums">
                      {formatNumber(currentMetrics.totalWorkers)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">registered seekers</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Potential Skill Gap</span>
                    <span
                      className={`font-mono font-bold text-base tabular-nums block ${
                        currentMetrics.gapCategory === 'HIGH_SHORTAGE'
                          ? 'text-rose-600'
                          : currentMetrics.gapCategory === 'MODERATE_SHORTAGE'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {currentMetrics.gap > 0 ? `-${formatNumber(currentMetrics.gap)}` : `+${formatNumber(Math.abs(currentMetrics.gap))}`}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {currentMetrics.gapPercentage}% {currentMetrics.gap > 0 ? 'deficit' : 'surplus'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Expected Demand</span>
                    <span className="font-mono font-bold text-slate-900 text-base tabular-nums">
                      {currentMetrics.expectedDemand ? formatNumber(currentMetrics.expectedDemand) : 'Unavailable'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">12-mo projected</span>
                  </div>
                </div>

                {/* Training Information */}
                <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">Institutional Training Capacity</span>
                    <span className="text-[10px] text-slate-500">Accredited center capacity in this location</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {formatNumber(currentMetrics.totalTrainingCapacity)} seats
                  </span>
                </div>

                {/* Top In-Demand Skills in this Selection */}
                {currentMetrics.topSkills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 mb-2">Tracked Technical Roles</h3>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {currentMetrics.topSkills.map(s => (
                        <div
                          key={s.skill}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-800">{s.skill}</span>
                          <span className="font-mono font-bold text-indigo-600">{formatNumber(s.demand)} vacancies</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* When data is unavailable for this selection */
              <div className="p-6 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Labour-market data unavailable
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Official administrative boundary verified. Current labour-market postings and worker registry disclosures have not been filed for this selection in the connected official open datasets.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600">
                  🛡️ <strong>Zero Fake Data Standard:</strong> Missing data is not zero. We never display false numbers when official filings are absent.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
