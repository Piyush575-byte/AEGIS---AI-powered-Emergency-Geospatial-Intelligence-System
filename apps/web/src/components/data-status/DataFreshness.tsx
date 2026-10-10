import type { DataSource } from '../../types';
import { timeAgo } from '../../utils/formatters';
import { DataSemanticBadge } from '../common/Badge';

interface DataFreshnessProps {
  sources: DataSource[];
}

export default function DataFreshness({ sources }: DataFreshnessProps) {
  return (
    <div className="bg-white border border-slate-200 rounded p-2.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-black/10 pb-1.5 mb-1.5">
        <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-black">
          Data Provenance & Freshness
        </div>
        <DataSemanticBadge type="SOURCE_DATA" className="text-[8px] px-1 py-0" />
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {sources.slice(0, 4).map((source) => {
          const isStale = source.status === 'stale';
          return (
            <div
              key={source.id}
              className={`p-1.5 rounded-lg border ${
                isStale ? 'bg-amber-50/70 border-amber-200' : 'bg-white/80 border-black/10'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-extrabold text-black text-[10.5px] truncate" title={source.name}>
                  {source.abbreviation}
                </span>
                <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                  isStale ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isStale ? '⚠ Stale' : '✓ Verified'}
                </span>
              </div>
              <div className="text-[10px] text-black font-semibold font-mono-code">
                {timeAgo(source.lastUpdated)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
