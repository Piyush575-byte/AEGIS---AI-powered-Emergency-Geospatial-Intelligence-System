import { CheckCircle2, ShieldAlert, ArrowDown } from 'lucide-react';

interface ActionRequiredSectionProps {
  r1Blocked: boolean;
  recommendationPending: boolean;
  planVersion: number;
  approvedBy?: string | null;
}

export default function ActionRequiredSection({
  r1Blocked,
  recommendationPending,
  planVersion,
  approvedBy,
}: ActionRequiredSectionProps) {
  return (
    <div className={`rounded-lg border p-5 shadow-sm flex flex-col justify-between h-full transition-colors ${
      planVersion === 2
        ? 'bg-emerald-950/30 border-emerald-800 text-slate-100'
        : r1Blocked && recommendationPending
        ? 'bg-amber-950/30 border-amber-700 text-slate-100'
        : 'bg-slate-900/90 border-slate-800 text-slate-100'
    }`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            4. What Action Is Required?
          </span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            planVersion === 2
              ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
              : r1Blocked
              ? 'bg-amber-500 text-slate-950 font-extrabold'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            {planVersion === 2
              ? 'PLAN V2 ACTIVE'
              : r1Blocked
              ? 'DECISION REQUIRED'
              : 'MONITORING'}
          </span>
        </div>

        {/* Action Decision Status */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-md">
          {planVersion === 2 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>PLAN V2 COMMITTED & ACTIVE</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Statutory approval confirmed by {approvedBy || 'DDMA District Authority'}. Operational execution in progress.
              </p>
            </div>
          ) : r1Blocked && recommendationPending ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>DDMA APPROVAL REQUIRED</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Route R1 bridge is severed. Approving AEGIS recommendation will seal Plan V2 and re-route Chooralmala to Vythiri GHSS.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>BASELINE PLAN V1 ACTIVE</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All monitoring parameters normal. No emergency human reassessment needed.
              </p>
            </div>
          )}
        </div>

        {/* Statutory Role Notice */}
        <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Decision Authority:</span>
            <span className="font-semibold text-slate-200">District Collector, DDMA</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Statutory Mandate:</span>
            <span className="text-slate-200">Disaster Management Act 2005</span>
          </div>
        </div>
      </div>

      {/* Footer Call to Action */}
      <div className="border-t border-slate-800/80 pt-3 mt-3 text-xs flex items-center justify-between">
        {r1Blocked && planVersion !== 2 ? (
          <a
            href="#recommendation-panel"
            className="text-amber-300 hover:text-white font-bold flex items-center gap-1.5 underline"
          >
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>Review & Approve Recommendation Below</span>
          </a>
        ) : (
          <span className="text-slate-400">Human authority holds final execution authority.</span>
        )}
      </div>
    </div>
  );
}
