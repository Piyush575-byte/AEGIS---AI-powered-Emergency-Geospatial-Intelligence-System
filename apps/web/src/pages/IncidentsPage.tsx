import { Link } from 'react-router-dom';
import { DataSemanticBadge, RiskBadge } from '../components/common/Badge';

export default function IncidentsPage() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Active Operational Incidents & Field Situation Reports
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-700 text-white font-mono-code">
              1 CRITICAL INCIDENT ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time incident log, field squad telemetry, infrastructure constraint breaches, and causal replanning triggers.
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

      {/* 2. Critical Incident Dossier Card */}
      <div className="p-3.5 rounded bg-red-50 border-2 border-red-500 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-red-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-700 animate-none"></span>
            <span className="text-sm font-black text-red-950 uppercase tracking-tight">
              INCIDENT #INC-WYD-R104: Route R104 Culvert Bridge Collapse
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono-code">
            <span className="text-[10px] font-bold bg-red-200 text-red-900 px-2 py-0.5 rounded">
              14:20 IST · Verified On-Scene
            </span>
            <RiskBadge level="critical">CRITICAL SEVERANCE</RiskBadge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-white/90 border border-red-200 rounded">
            <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Incident Location</span>
            <strong className="text-slate-900 font-mono-code">Route R104 (KM 4.2)</strong>
            <div className="text-[10px] text-slate-600">Mundakkai-Meppadi Link</div>
          </div>

          <div className="p-2 bg-white/90 border border-red-200 rounded">
            <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Reporting Source</span>
            <strong className="text-slate-900">Taluk Revenue Field Squad</strong>
            <div className="text-[10px] text-slate-600">Vythiri Field Unit (On-Scene)</div>
          </div>

          <div className="p-2 bg-white/90 border border-red-200 rounded">
            <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Direct Evacuee Impact</span>
            <strong className="text-red-700 font-mono-code">150 Evacuees Severed</strong>
            <div className="text-[10px] text-slate-600">Meppadi HSS Transit Blocked</div>
          </div>

          <div className="p-2 bg-white/90 border border-red-200 rounded">
            <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Operational Action</span>
            <strong className="text-emerald-800 font-mono-code">Reassigned in Plan V2</strong>
            <div className="text-[10px] text-slate-600">Rerouted via R212 / R318</div>
          </div>
        </div>

        <div className="p-2.5 bg-white/80 border border-red-200 rounded text-xs text-slate-800 space-y-1">
          <div>
            <strong>Physical Assessment:</strong> Flash flood runoff and debris accumulation caused structural scouring and failure of the box culvert bridge at KM 4.2. Road surface breached; vehicular transit completely impassable.
          </div>
          <div>
            <strong>Causal System Response:</strong> AEGIS detected dependency failure on Route R104 $\rightarrow$ Invalidated Plan V1 $\rightarrow$ Executed dynamic alternative candidate search $\rightarrow$ Formulated Plan V2 ($100\%$ population preserved) $\rightarrow$ Submitted to District Collector for statutory re-approval.
          </div>
        </div>
      </div>

      {/* 3. Incidents History Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>📋</span>
            <span>Incident Log & Telemetry Reports</span>
          </div>
          <span className="text-[10.5px] font-mono-code font-bold text-slate-600">
            Wayanad District Control Room Feed
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px]">
                <th className="p-2.5">Incident ID</th>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5">Severity</th>
                <th className="p-2.5">Affected Constraint</th>
                <th className="p-2.5">Resolution Posture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-xs">
              <tr className="bg-red-50/40 font-semibold">
                <td className="p-2.5 font-mono-code font-bold text-red-900">INC-WYD-R104</td>
                <td className="p-2.5 font-mono-code">14:20 IST</td>
                <td className="p-2.5 font-mono-code">Route R104 (KM 4.2)</td>
                <td className="p-2.5">Culvert bridge structural collapse; road severed.</td>
                <td className="p-2.5"><RiskBadge level="critical">CRITICAL</RiskBadge></td>
                <td className="p-2.5 text-red-800 font-mono-code">Route Feasibility Constraint Failed</td>
                <td className="p-2.5 text-emerald-800 font-bold">Plan V2 Promulgated (Reassigned)</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-mono-code font-bold text-slate-800">INC-WYD-RAIN-02</td>
                <td className="p-2.5 font-mono-code">12:45 IST</td>
                <td className="p-2.5 font-mono-code">Mundakkai Slope (HZ-01)</td>
                <td className="p-2.5">Precipitation exceeded 204mm/24h; saturation 94.2%.</td>
                <td className="p-2.5"><RiskBadge level="high">HIGH</RiskBadge></td>
                <td className="p-2.5 text-slate-700 font-mono-code">Slope Stability Threshold Breached</td>
                <td className="p-2.5 text-slate-700">Proactive Relocation Triggered</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-300">
        <div className="text-slate-700 font-medium text-xs">
          Forensic causal timeline traces every incident to its cryptographic SHA-256 audit entry.
        </div>
        <div className="flex gap-2">
          <Link
            to="/system/audit-log"
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 hover:bg-slate-100 text-xs"
          >
            INSPECT AUDIT TRAIL ▶
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
