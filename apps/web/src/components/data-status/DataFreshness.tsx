import type { DataSource } from '../../types';
import { timeAgo } from '../../utils/formatters';
import { DataSemanticBadge } from '../common/Badge';

interface DataFreshnessProps {
  sources: DataSource[];
}

export default function DataFreshness({ sources }: DataFreshnessProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
        <h4 className="text-[16px] font-bold text-[#172033]">
          Data provenance & freshness
        </h4>
        <DataSemanticBadge type="SOURCE_DATA" className="text-xs px-2 py-0.5" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
        {sources.slice(0, 4).map((source) => {
          const isStale = source.status === 'stale';
          return (
            <div
              key={source.id}
              className={`p-3 rounded-lg border ${
                isStale ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="font-bold text-[#172033] text-[14px] truncate" title={source.name}>
                  {source.abbreviation}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  isStale ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isStale ? '⚠ Stale' : '✓ Verified'}
                </span>
              </div>
              <div className="text-[13px] text-slate-700 font-mono tabular-nums">
                {timeAgo(source.lastUpdated)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
