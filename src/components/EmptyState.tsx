import React from 'react';
import { Database, AlertOctagon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  isUnavailableSource?: boolean;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message = 'No data available for this selection.',
  isUnavailableSource = false,
  actionText,
  onAction
}) => {
  const Icon = isUnavailableSource ? AlertOctagon : Database;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-500">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">
        {title || (isUnavailableSource ? 'Data currently unavailable from the selected source.' : 'No data available for this selection.')}
      </h4>
      <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-4">
        {message}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
