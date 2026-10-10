import { Link } from 'react-router-dom';
import { DataSemanticBadge } from '../components/common/Badge';

export default function RelocationPage() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Proactive Relocation & Dynamic Reassignment Planning
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-navy-900 text-white font-mono-code">
              PLAN EVOLUTION MATRIX
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Operational distribution modeling, multi-criteria capacity optimization, and statutory approval boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSemanticBadge type="AEGIS_RECOMMENDATION" />
          <Link
            to="/ddma"
            className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 font-bold text-[11px] hover:bg-slate-700 transition-colors shadow-xs"
          >
            ◀ BACK TO DDMA COMMAND CENTER
          </Link>
        </div>
      </div>

      {/* 2. Plan Status Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border-l-4 border-l-navy-900 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Target Habitation
          </div>
          <div className="text-xl font-black text-slate-900 font-mono-code mt-0.5">Mundakkai</div>
          <div className="text-[10px] text-red-700 font-bold mt-0.5">427 HH · 1,495 Residents</div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Allocated Population
          </div>
          <div className="text-xl font-black text-emerald-900 font-mono-code mt-0.5">1,495 / 1,495</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">100% Demand Preserved</div>
        </div>

        <div className="bg-white border-l-4 border-l-blue-800 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Active Plan Evolution
          </div>
          <div className="text-xl font-black text-blue-900 font-mono-code mt-0.5">Plan V1 → Plan V2</div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">Post-Bridge Collapse Revision</div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Statutory Authority
          </div>
          <div className="text-xl font-black text-emerald-950 font-mono-code mt-0.5">District Collector</div>
          <div className="text-[10px] text-slate-600 font-mono-code mt-0.5">DM Act 2005 (Sec. 30 & 34)</div>
        </div>
      </div>

      {/* 3. Reassignment Evolution Matrix */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>⚖</span>
            <span>Relocation Plan Evolution & Facility Rebalancing Matrix</span>
          </div>
          <span className="text-[10.5px] font-mono-code font-bold text-slate-600">
            100% Demographic Baseline Preservation
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px]">
                <th className="p-2.5">Shelter Facility</th>
                <th className="p-2.5">Plan V1 (Pre-Incident)</th>
                <th className="p-2.5">Plan V2 (Post-Bridge Failure)</th>
                <th className="p-2.5">Net Delta</th>
                <th className="p-2.5">Transit Corridor</th>
                <th className="p-2.5">Causal Operational Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-xs">
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Meppadi Govt. HSS</td>
                <td className="p-2.5 font-mono-code text-slate-700">612 persons (via R104)</td>
                <td className="p-2.5 font-mono-code text-amber-900 font-extrabold">380 persons (bypass)</td>
                <td className="p-2.5 font-mono-code text-red-700 font-extrabold">−232 persons</td>
                <td className="p-2.5 text-red-700 font-mono-code font-bold text-[10.5px]">R104 Blocked (KM 4.2)</td>
                <td className="p-2.5 text-slate-600 text-[11px]">
                  Culvert bridge structural collapse severed main convoy transit.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Kalpetta Community Hall</td>
                <td className="p-2.5 font-mono-code text-slate-700">503 persons (via R212)</td>
                <td className="p-2.5 font-mono-code text-emerald-900 font-extrabold">612 persons (Primary)</td>
                <td className="p-2.5 font-mono-code text-emerald-700 font-extrabold">+109 persons</td>
                <td className="p-2.5 text-emerald-700 font-mono-code font-bold text-[10.5px]">Route R212 (Arterial)</td>
                <td className="p-2.5 text-slate-600 text-[11px]">
                  Promoted to Primary Hub; verified open arterial linked to District Hospital.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">St. Mary's School Vythiri</td>
                <td className="p-2.5 font-mono-code text-slate-700">380 persons (via R318)</td>
                <td className="p-2.5 font-mono-code text-emerald-900 font-extrabold">503 persons (Secondary)</td>
                <td className="p-2.5 font-mono-code text-emerald-700 font-extrabold">+123 persons</td>
                <td className="p-2.5 text-emerald-700 font-mono-code font-bold text-[10.5px]">Route R318 (Bypass)</td>
                <td className="p-2.5 text-slate-600 text-[11px]">
                  Absorbs secondary evacuee balance via verified Chooralmala bypass corridor.
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300 font-mono-code">
                <td className="p-2.5 font-sans">Total Displaced Population</td>
                <td className="p-2.5">1,495 / 1,495 (100%)</td>
                <td className="p-2.5 text-emerald-900">1,495 / 1,495 (100%)</td>
                <td className="p-2.5 text-slate-800">0 (Balanced)</td>
                <td className="p-2.5 font-sans text-emerald-800 text-[11px]">Resilient Corridors</td>
                <td className="p-2.5 font-sans text-emerald-800 text-[11px]">Zero evacuees stranded. Complete demographic preservation.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-300">
        <div className="text-slate-700 font-medium text-xs">
          Plan V1 remains historically inspectable as the invalidated baseline; Plan V2 operates as the current promulgated plan.
        </div>
        <div className="flex gap-2">
          <Link
            to="/analysis/compare"
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 hover:bg-slate-100 text-xs"
          >
            COMPARE PLAN DETAILS ▶
          </Link>
          <Link
            to="/dashboard"
            className="px-3 py-1 bg-navy-900 text-white rounded font-bold hover:bg-navy-800 text-xs"
          >
            OPEN COMMAND CENTER ▶
          </Link>
        </div>
      </div>
    </div>
  );
}
