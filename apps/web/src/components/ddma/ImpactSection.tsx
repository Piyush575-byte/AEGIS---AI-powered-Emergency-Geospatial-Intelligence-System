import { AlertCircle } from 'lucide-react';

interface ImpactSectionProps {
  r1Blocked: boolean;
  affectedPopulation: number;
  planVersion?: number;
  previousShelter: string;
  previousRoute: string;
}

export default function ImpactSection({
  r1Blocked,
  affectedPopulation,
  previousShelter,
  previousRoute,
}: ImpactSectionProps) {
  return (
    <div className={`rounded-lg border p-5 shadow-sm flex flex-col justify-between h-full transition-colors ${
      r1Blocked
        ? 'bg-amber-950/30 border-amber-800/80 text-slate-100'
        : 'bg-slate-900/90 border-slate-800 text-slate-100'
    }`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. What Is The Impact?
          </span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            r1Blocked
              ? 'bg-amber-500/20 text-amber-300 border border-amber-600'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            {r1Blocked ? 'RELOCATION SEVERED' : 'ASSIGNMENT CLEAR'}
          </span>
        </div>

        {/* Large Impact Callout: 120 People Affected */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md">
          <div className="text-xs text-slate-400 font-semibold uppercase">
            {r1Blocked ? 'Affected Population' : 'Evacuation Population'}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-white">
              {affectedPopulation}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              People Affected
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Habitation: <span className="font-semibold text-slate-200">Chooralmala (35 Households)</span>
          </div>
        </div>

        {/* Impact Context Details */}
        <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-md border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Current Assignment:</span>
            <span className="font-semibold text-slate-200">{previousShelter}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Primary Route:</span>
            <span className={`font-bold ${r1Blocked ? 'text-red-400' : 'text-emerald-400'}`}>
              Route {previousRoute} ({r1Blocked ? 'BLOCKED' : 'CLEAR'})
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 mt-1.5">
            <span className="text-slate-400">Plan V1 Status:</span>
            <span className={`font-bold ${r1Blocked ? 'text-red-400' : 'text-emerald-400'}`}>
              {r1Blocked ? 'INVALIDATED (No longer feasible)' : 'ACTIVE (Approved)'}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Note Footer */}
      <div className="border-t border-slate-800/80 pt-3 mt-3 text-xs text-slate-400 flex items-center gap-1.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          {r1Blocked
            ? '120 evacuees cannot proceed safely along Route R1.'
            : 'Normal transit active along assigned evacuation route.'}
        </span>
      </div>
    </div>
  );
}
