import React, { useState, useMemo } from 'react';
import { MASTER_SECTORS } from '../data/masterSectors';
import { SectorMaster } from '../types';
import { Layers, Search, X, Check, Building2 } from 'lucide-react';

interface MasterSectorSelectProps {
  selectedSector: string;
  onSectorChange: (sectorName: string) => void;
  showAllOption?: boolean;
  className?: string;
}

export const MasterSectorSelect: React.FC<MasterSectorSelectProps> = ({
  selectedSector,
  onSectorChange,
  showAllOption = true,
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredSectors = useMemo(() => {
    if (!search.trim()) return MASTER_SECTORS;
    const query = search.toLowerCase();
    return MASTER_SECTORS.filter(s =>
      s.sector_name.toLowerCase().includes(query) ||
      s.source_sector_name.toLowerCase().includes(query) ||
      (s.category && s.category.toLowerCase().includes(query))
    );
  }, [search]);

  const selectedSectorObj = useMemo(() => {
    return MASTER_SECTORS.find(s =>
      s.sector_name.toLowerCase() === selectedSector.toLowerCase() ||
      s.source_sector_name.toLowerCase() === selectedSector.toLowerCase()
    );
  }, [selectedSector]);

  const handleSelect = (sec: SectorMaster | null) => {
    if (!sec) {
      onSectorChange('');
    } else {
      onSectorChange(sec.sector_name);
    }
    setDropdownOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-indigo-600" />
          Industry Sector
        </span>
        <span className="text-[10px] text-slate-500 font-normal">
          {MASTER_SECTORS.length} Sectors
        </span>
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full text-left bg-white border border-slate-300 hover:border-indigo-400 rounded-lg px-3 py-2 text-xs flex items-center justify-between shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <span className="truncate font-medium text-slate-900">
            {selectedSectorObj ? (
              <span>
                {selectedSectorObj.sector_name}
              </span>
            ) : selectedSector ? (
              <span>{selectedSector}</span>
            ) : (
              <span className="text-slate-600 font-normal">
                {showAllOption ? 'All Industry Sectors' : 'Select Sector'}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {selectedSector && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(null);
                }}
                className="p-0.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-700"
                title="Clear Sector"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="text-[10px] text-slate-600">▼</span>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute z-40 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-100">
            <div className="p-2 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sector (Healthcare, IT, Manufacturing, Green Jobs)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
              {showAllOption && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                    !selectedSector ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span>All Industry Sectors</span>
                  {!selectedSector && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              )}

              {filteredSectors.map((sec) => {
                const isSelected = selectedSector.toLowerCase() === sec.sector_name.toLowerCase() ||
                  selectedSector.toLowerCase() === sec.source_sector_name.toLowerCase();
                return (
                  <button
                    key={sec.sector_id}
                    type="button"
                    onClick={() => handleSelect(sec)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{sec.sector_name}</div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-600 font-mono text-[9px] uppercase">{sec.category}</span>
                        <span>•</span>
                        <span className="truncate">{sec.sector_source}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })}

              {filteredSectors.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-600">
                  No matching sector found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
