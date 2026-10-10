import type { ActionableInsight } from '../../types';

interface InsightCardProps {
  data: ActionableInsight;
  onAction?: (actionId: string) => void;
}

function InsightCard({ data, onAction }: InsightCardProps) {
  const handleClick = () => {
    if (onAction) {
      onAction(data.id);
    }
  };

  const isCritical = data.priority === 'critical';
  const isHigh = data.priority === 'high';

  return (
    <div className={`p-4 rounded-xl border bg-white shadow-xs flex flex-col gap-3 transition-all ${
      isCritical
        ? 'border-l-4 border-l-[#B42318] border-red-200 bg-red-50/20'
        : isHigh
        ? 'border-l-4 border-l-[#B54708] border-amber-200 bg-amber-50/20'
        : 'border-l-4 border-l-[#1D5B99] border-slate-200'
    }`}>
      {/* 1. Header: Severity Badge, Title & Verification Time */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
            isCritical
              ? 'bg-red-100 text-red-900 border border-red-200'
              : isHigh
              ? 'bg-amber-100 text-amber-900 border border-amber-200'
              : 'bg-blue-100 text-blue-900 border border-blue-200'
          }`}>
            {isCritical ? '● Critical severity' : isHigh ? '▲ High priority' : 'Notice'}
          </span>
          <h4 className="text-[16px] font-bold text-[#172033] leading-snug">
            {data.title}
          </h4>
        </div>
        <span className="text-[13px] text-slate-600 font-medium font-mono tabular-nums shrink-0 whitespace-nowrap">
          {data.freshness}
        </span>
      </div>

      {/* 2. Narrative Content: What Happened & Operational Impact */}
      <div className="text-[14px] space-y-2 leading-relaxed text-[#172033]">
        <div>
          <span className="font-semibold text-slate-900 mr-1.5">What happened:</span>
          <span className="text-slate-800">{data.whatHappened}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-900 mr-1.5">Operational impact:</span>
          <span className="text-slate-800">{data.whyItMatters}</span>
        </div>
      </div>

      {/* 3. Footer: Source Attribution & Direct Action Button */}
      <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-3">
        <span className="text-[13px] text-slate-600 font-medium truncate" title={data.source}>
          Source: {data.source}
        </span>
        <button
          type="button"
          onClick={handleClick}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-[#172033] bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs whitespace-nowrap cursor-pointer shrink-0 min-h-[38px]"
        >
          {data.actionLabel}
        </button>
      </div>
    </div>
  );
}

interface InsightsPanelProps {
  insights: ActionableInsight[];
  onAction?: (actionId: string) => void;
}

export default function InsightsPanel({ insights, onAction }: InsightsPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div className="text-[18px] font-bold text-[#172033] flex items-center gap-2">
          <span>Operational alerts</span>
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          Derived sensor data
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} data={insight} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
