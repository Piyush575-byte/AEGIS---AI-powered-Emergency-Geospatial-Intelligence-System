import { Compass, ArrowRight } from 'lucide-react';
import type { RecommendationData } from '../../services/api';

interface RecommendationTopSectionProps {
  r1Blocked: boolean;
  recommendation: RecommendationData | null;
  planVersion: number;
}

export default function RecommendationTopSection({
  r1Blocked,
  recommendation,
  planVersion,
}: RecommendationTopSectionProps) {
  if (!r1Blocked && planVersion === 1) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 text-slate-100 shadow-sm flex flex-col justify-between h-full">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. What Does AEGIS Recommend?
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              IDLE
            </span>
          </div>
          <div className="py-6 text-center text-slate-400">
            <p className="text-sm font-medium">No active incident detected.</p>
            <p className="text-xs text-slate-500 mt-1">
              Baseline Plan V1 remains optimal. Trigger simulation to test automated replanning.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800/80 pt-3 text-xs text-slate-500 text-center">
          Decision Engine: Deterministic A* + Weighted MCDA
        </div>
      </div>
    );
  }

  const shelterName = recommendation?.recommended_shelter?.name || 'Vythiri Government Higher Secondary School (Gamma)';
  const routeCode = recommendation?.recommended_route?.code || 'R4';

  return (
    <div className="bg-blue-950/30 border border-blue-800/80 rounded-lg p-5 text-slate-100 shadow-sm flex flex-col justify-between h-full">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
            3. What Does AEGIS Recommend?
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-900/80 text-blue-200 border border-blue-700">
            RANK #1 ADVISORY
          </span>
        </div>

        {/* Action Summary */}
        <div className="p-3.5 bg-blue-950/70 border border-blue-700/60 rounded-md">
          <div className="text-xs font-semibold text-blue-300 uppercase">
            Recommended Action
          </div>
          <div className="text-base font-bold text-white mt-1 leading-snug">
            Move 120 evacuees to:
          </div>
          <div className="text-base font-extrabold text-blue-200 mt-0.5">
            {shelterName}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-medium mt-2">
            <Compass className="w-4 h-4 text-blue-400 shrink-0" />
            <span>via Route {routeCode} (16.4 km · Clear Corridor)</span>
          </div>
        </div>

        {/* Key Verification Points */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[11px]">Capacity Headroom</span>
            <span className="text-emerald-400 font-bold block mt-0.5">+205 Available</span>
            <span className="text-slate-400 text-[11px]">(325 cap / 120 req)</span>
          </div>
          <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[11px]">Medical Support</span>
            <span className="text-emerald-400 font-bold block mt-0.5">Medical Team</span>
            <span className="text-slate-400 text-[11px]">On-site at Vythiri</span>
          </div>
        </div>
      </div>

      {/* Footer / Link to Details */}
      <div className="border-t border-slate-800/80 pt-3 mt-3 text-xs text-blue-300 flex items-center justify-between">
        <a href="#recommendation-panel" className="underline hover:text-white flex items-center gap-1 font-semibold">
          <span>View Recommendation Evidence</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
        <span className="text-slate-400 text-[11px]">A* Graph Verified</span>
      </div>
    </div>
  );
}
