import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface TelanganaCoverageWarningProps {
  selectedState?: string;
  selectedDistrict?: string;
  className?: string;
}

export const TelanganaCoverageWarning: React.FC<TelanganaCoverageWarningProps> = ({
  selectedState,
  selectedDistrict,
  className = '',
}) => {
  const isTelangana =
    selectedState?.toLowerCase() === 'telangana' ||
    ['hyderabad', 'rangareddy', 'medchal-malkajgiri'].includes(selectedDistrict?.toLowerCase() || '');

  // Show if Telangana or one of its districts is selected, OR in national comparisons where Telangana records are included
  if (!isTelangana && selectedState) return null;

  return (
    <div
      className={`p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 text-xs space-y-1.5 shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-2 font-bold text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>Important Data Coverage Notice: Telangana Demand vs Workforce Scope</span>
      </div>
      <p className="text-[11px] leading-relaxed text-amber-900">
        When evaluating figures for Telangana:
      </p>
      <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90 pl-1">
        <li>
          <strong>Demand Coverage:</strong> Employer vacancies currently represent <strong>Hyderabad district only</strong> (1 of 33 districts in Telangana).
        </li>
        <li>
          <strong>Workforce Supply Coverage:</strong> Registered workforce supply currently represents <strong>3 districts</strong> (Hyderabad, Rangareddy, and Medchal-Malkajgiri).
        </li>
        <li>
          <strong>Different Labour Populations:</strong> High-tech engineering demand (Python, Generative AI, VLSI) reflects formal corporate vacancies, whereas worker registry counts are derived from <strong>e-Shram (Unorganised Workforce)</strong>. These represent distinct labour pools and must not be directly subtracted.
        </li>
        <li>
          <strong>Interpretation Limit:</strong> These figures must <em>not</em> be interpreted as a complete statewide Telangana workforce balance.
        </li>
      </ul>
    </div>
  );
};
