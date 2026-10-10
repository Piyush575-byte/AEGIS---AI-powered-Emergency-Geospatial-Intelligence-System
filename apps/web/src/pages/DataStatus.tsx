import { mockDataSources } from '../data/mockData';
import { timeAgo } from '../utils/formatters';
import { DataSemanticBadge } from '../components/common/Badge';

export default function DataStatus() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-title-lg">Data Provenance & Freshness Status</h1>
          <p className="text-body-regular text-slate-600">
            Real-time verification status, telemetry timestamps, and confidence levels across all active sensor sources.
          </p>
        </div>
        <DataSemanticBadge type="DEMO_DATA" />
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded shadow-xs">
          <div className="text-xl font-black text-emerald-950">18</div>
          <div className="text-xs font-bold text-emerald-900 uppercase">Sources Current</div>
        </div>
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded shadow-xs">
          <div className="text-xl font-black text-amber-950">2</div>
          <div className="text-xs font-bold text-amber-900 uppercase">Sources Stale</div>
        </div>
        <div className="p-3.5 bg-slate-50 border border-slate-300 rounded shadow-xs">
          <div className="text-xl font-black text-slate-800">0</div>
          <div className="text-xs font-bold text-slate-600 uppercase">Sources Unavailable</div>
        </div>
      </div>

      {/* Source Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Active Telemetry Ingestion Nodes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockDataSources.map((source) => (
            <div key={source.id} className="p-3.5 bg-white border border-slate-200 rounded shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">{source.name}</div>
                  <div className="text-[10.5px] text-slate-500 font-mono-code">{source.sourceAgency} ({source.abbreviation})</div>
                </div>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                    source.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {source.status === 'verified' ? '✓ Verified' : '⚠ Stale'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500">
                  Last Updated: <strong className="text-slate-800">{timeAgo(source.lastUpdated)}</strong>
                </span>
                <span className="text-slate-500 font-mono-code">
                  Confidence: <strong className="text-navy-900 uppercase">{source.confidence}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
