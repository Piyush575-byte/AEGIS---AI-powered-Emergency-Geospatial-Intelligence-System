import { Link } from 'react-router-dom';
import { DataSemanticBadge } from '../components/common/Badge';
import { StatusIndicator } from '../components/common/StatusIndicator';

export default function RoutesPage() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Route Network & Evacuation Corridor Constraints
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-navy-900 text-white font-mono-code">
              PWD & TALUK REVENUE SQUADS
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time road viability, infrastructure structural integrity, bottleneck telemetry, and resilient bypass corridors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSemanticBadge type="SOURCE_DATA" />
          <Link
            to="/ddma"
            className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 font-bold text-[11px] hover:bg-slate-700 transition-colors shadow-xs"
          >
            ◀ BACK TO DDMA COMMAND CENTER
          </Link>
        </div>
      </div>

      {/* 2. Route Corridor Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border-l-4 border-l-red-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Route R104 Status
          </div>
          <div className="text-xl font-black text-red-700 font-mono-code mt-0.5">BLOCKED (KM 4.2)</div>
          <div className="text-[10px] text-red-700 font-bold mt-0.5">Bridge Culvert Failure</div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Route R212 (Arterial)
          </div>
          <div className="text-xl font-black text-emerald-900 font-mono-code mt-0.5">CLEAR (Passable)</div>
          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">Plan V2 Primary Corridor (612)</div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Route R318 (Bypass)
          </div>
          <div className="text-xl font-black text-emerald-900 font-mono-code mt-0.5">CLEAR (Passable)</div>
          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">Plan V2 Secondary Bypass (503)</div>
        </div>

        <div className="bg-white border-l-4 border-l-slate-600 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Active Transport Vectors
          </div>
          <div className="text-xl font-black text-slate-900 font-mono-code mt-0.5">2 Corridors Active</div>
          <div className="text-[10px] text-slate-600 font-mono-code mt-0.5">100% Demand Accommodated</div>
        </div>
      </div>

      {/* 3. Evacuation Corridor Register */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>🛣</span>
            <span>Evacuation Corridor Register & Real-Time Status</span>
          </div>
          <span className="text-[10.5px] font-mono-code font-bold text-slate-600">
            PWD Infrastructure Telemetry
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px]">
                <th className="p-2.5">Route Identifier</th>
                <th className="p-2.5">Corridor Scope</th>
                <th className="p-2.5">Operational Status</th>
                <th className="p-2.5">Plan Dependency</th>
                <th className="p-2.5">Alternative Bypass</th>
                <th className="p-2.5">Reporting Agency</th>
                <th className="p-2.5">Telemetry Freshness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-xs">
              <tr className="bg-red-50/40 font-semibold">
                <td className="p-2.5 font-bold text-red-900 font-mono-code">Route R104</td>
                <td className="p-2.5 text-slate-800 font-mono-code">Mundakkai → Meppadi (KM 4.2)</td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-red-700 text-white">
                    BLOCKED (Bridge Collapse)
                  </span>
                </td>
                <td className="p-2.5 text-red-800 font-mono-code">
                  Plan V1 Severed (150 Evacuees Isolated)
                </td>
                <td className="p-2.5 text-slate-600 italic text-[11px]">
                  Rerouted via R212 / R318 (Plan V2)
                </td>
                <td className="p-2.5 text-[10.5px] text-slate-600 font-mono-code">
                  Field Officer (Vythiri) · 14:20 IST
                </td>
                <td className="p-2.5">
                  <StatusIndicator status="critical" label="Verified On-Scene" />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Route R212</td>
                <td className="p-2.5 text-slate-800 font-mono-code">Meppadi → Kalpetta Arterial (5.7 km)</td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                    CLEAR (Open for Convoys)
                  </span>
                </td>
                <td className="p-2.5 text-emerald-900 font-bold font-mono-code">
                  Plan V2 Primary Link (612 Persons)
                </td>
                <td className="p-2.5 text-slate-600 text-[11px]">
                  Direct link to District Hospital & Kalpetta Hall
                </td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">
                  PWD Roads Division
                </td>
                <td className="p-2.5">
                  <StatusIndicator status="operational" label="Verified 25m ago" />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Route R318</td>
                <td className="p-2.5 text-slate-800 font-mono-code">Chooralmala → Vythiri Bypass (6.2 km)</td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                    CLEAR (Open for Convoys)
                  </span>
                </td>
                <td className="p-2.5 text-emerald-900 font-bold font-mono-code">
                  Plan V2 Secondary Link (503 Persons)
                </td>
                <td className="p-2.5 text-slate-600 text-[11px]">
                  Northern bypass avoiding Meppadi bottleneck
                </td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">
                  Taluk Revenue Squad
                </td>
                <td className="p-2.5">
                  <StatusIndicator status="operational" label="Verified 40m ago" />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-700 font-mono-code">NH 766 Eastern Corridor</td>
                <td className="p-2.5 text-slate-600 font-mono-code">Kalpetta → Sulthan Bathery (12.4 km)</td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-200 text-slate-800">
                    CLEAR (Standby Highway)
                  </span>
                </td>
                <td className="p-2.5 text-slate-600 font-mono-code">
                  Infeasible (Distance &gt;10 km)
                </td>
                <td className="p-2.5 text-slate-500 text-[11px]">
                  Rejected during alternative candidate search
                </td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">
                  NHAI South Wing
                </td>
                <td className="p-2.5">
                  <StatusIndicator status="info" label="Standing Trunk Link" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-300">
        <div className="text-slate-700 font-medium text-xs">
          Route constraint failure on R104 automatically triggers causal replanning to preserve zero stranded evacuees.
        </div>
        <div className="flex gap-2">
          <Link
            to="/planning/relocation"
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 hover:bg-slate-100 text-xs"
          >
            VIEW RELOCATION PLAN ▶
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
