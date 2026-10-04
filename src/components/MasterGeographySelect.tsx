import React, { useState, useMemo } from 'react';
import { MASTER_STATES, getDistrictsForState } from '../data/masterGeography';
import { DistrictMaster, StateMaster } from '../types';
import { MapPin, Search, X, Check, Compass } from 'lucide-react';

interface MasterGeographySelectProps {
  selectedState: string;
  selectedDistrict: string;
  onStateChange: (stateName: string) => void;
  onDistrictChange: (districtName: string) => void;
  showAllOption?: boolean;
  className?: string;
  labelPosition?: 'top' | 'inline';
}

export const MasterGeographySelect: React.FC<MasterGeographySelectProps> = ({
  selectedState,
  selectedDistrict,
  onStateChange,
  onDistrictChange,
  showAllOption = true,
  className = '',
}) => {
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);

  // Filtered states based on search query
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return MASTER_STATES;
    const query = stateSearch.toLowerCase();
    return MASTER_STATES.filter(s =>
      s.state_name.toLowerCase().includes(query) ||
      s.state_id.toLowerCase().includes(query)
    );
  }, [stateSearch]);

  // Districts for current state
  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  // Filtered districts based on search query
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return availableDistricts;
    const query = districtSearch.toLowerCase();
    return availableDistricts.filter(d =>
      d.district_name.toLowerCase().includes(query) ||
      d.district_id.toLowerCase().includes(query)
    );
  }, [availableDistricts, districtSearch]);

  const selectedStateObj = useMemo(() => {
    return MASTER_STATES.find(s => s.state_name.toLowerCase() === selectedState.toLowerCase());
  }, [selectedState]);

  const selectedDistrictObj = useMemo(() => {
    return availableDistricts.find(d => d.district_name.toLowerCase() === selectedDistrict.toLowerCase());
  }, [availableDistricts, selectedDistrict]);

  const handleSelectState = (state: StateMaster | null) => {
    if (!state) {
      onStateChange('');
      onDistrictChange('');
    } else {
      onStateChange(state.state_name);
      onDistrictChange(''); // reset district when state changes
    }
    setStateDropdownOpen(false);
    setStateSearch('');
  };

  const handleSelectDistrict = (district: DistrictMaster | null) => {
    if (!district) {
      onDistrictChange('');
    } else {
      onDistrictChange(district.district_name);
    }
    setDistrictDropdownOpen(false);
    setDistrictSearch('');
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {/* State Selector */}
      <div className="relative">
        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-600" />
            State / Union Territory
          </span>
          <span className="text-[10px] text-slate-500 font-normal">{MASTER_STATES.length} States & UTs</span>
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setStateDropdownOpen(!stateDropdownOpen);
              setDistrictDropdownOpen(false);
            }}
            className="w-full text-left bg-white border border-slate-300 hover:border-indigo-400 rounded-lg px-3 py-2 text-xs flex items-center justify-between shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <span className="truncate font-medium text-slate-900">
              {selectedStateObj ? (
                <span>
                  {selectedStateObj.state_name}
                  <span className="ml-1 text-[10px] text-slate-600">({selectedStateObj.state_type})</span>
                </span>
              ) : (
                <span className="text-slate-600 font-normal">
                  {showAllOption ? 'All States & Union Territories' : 'Select State / UT'}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {selectedState && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectState(null);
                  }}
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-700"
                  title="Clear State"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="text-[10px] text-slate-600">▼</span>
            </div>
          </button>

          {/* State Dropdown with Search */}
          {stateDropdownOpen && (
            <div className="absolute z-40 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-100">
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Search state (e.g. Telangana, Maharashtra)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {showAllOption && (
                  <button
                    type="button"
                    onClick={() => handleSelectState(null)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                      !selectedState ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span>All States & Union Territories</span>
                    {!selectedState && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                )}

                {filteredStates.map((state) => {
                  const isSelected = selectedState.toLowerCase() === state.state_name.toLowerCase();
                  return (
                    <button
                      key={state.state_id}
                      type="button"
                      onClick={() => handleSelectState(state)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                        isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{state.state_name}</div>
                        <div className="text-[10px] text-slate-600">
                          {state.state_type}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })}

                {filteredStates.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-600">
                    No matching official state or UT found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* District Selector */}
      <div className="relative">
        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-600" />
            District
          </span>
          <span className="text-[10px] text-slate-500 font-normal">
            {selectedState ? `${availableDistricts.length} Districts` : 'Select State First'}
          </span>
        </label>

        <div className="relative">
          <button
            type="button"
            disabled={!selectedState}
            onClick={() => {
              if (selectedState) {
                setDistrictDropdownOpen(!districtDropdownOpen);
                setStateDropdownOpen(false);
              }
            }}
            className={`w-full text-left bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs flex items-center justify-between shadow-2xs transition-colors ${
              !selectedState
                ? 'opacity-60 cursor-not-allowed bg-slate-50'
                : 'hover:border-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
            }`}
          >
            <span className="truncate font-medium text-slate-900">
              {selectedDistrictObj ? (
                <span>
                  {selectedDistrictObj.district_name}
                </span>
              ) : (
                <span className="text-slate-600 font-normal">
                  {!selectedState
                    ? 'Select a State first to view districts'
                    : showAllOption
                    ? `All Districts in ${selectedState}`
                    : 'Search & Select District'}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {selectedDistrict && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDistrict(null);
                  }}
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-700"
                  title="Clear District"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="text-[10px] text-slate-600">▼</span>
            </div>
          </button>

          {/* District Dropdown with Search */}
          {districtDropdownOpen && selectedState && (
            <div className="absolute z-40 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-100">
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    placeholder={`Search official districts in ${selectedState}...`}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {showAllOption && (
                  <button
                    type="button"
                    onClick={() => handleSelectDistrict(null)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                      !selectedDistrict ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span>All Districts in {selectedState}</span>
                    {!selectedDistrict && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                )}

                {filteredDistricts.map((dist) => {
                  const isSelected = selectedDistrict.toLowerCase() === dist.district_name.toLowerCase();
                  return (
                    <button
                      key={dist.district_id}
                      type="button"
                      onClick={() => handleSelectDistrict(dist)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                        isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{dist.district_name}</div>
                        <div className="text-[10px] text-slate-600">
                          {dist.status === 'ACTIVE' ? 'Administrative District' : dist.status}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })}

                {filteredDistricts.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-600">
                    No matching official district found in {selectedState}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
