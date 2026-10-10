import { Link } from 'react-router-dom';
import { DataSemanticBadge } from '../components/common/Badge';

export default function SheltersPage() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Shelter Management & Carrying-Capacity Registry
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-navy-900 text-white font-mono-code">
              DDMA RELIEF CAMPS
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Verified structural capacity, medical readiness, accessibility status, and dynamic relocation allocations.
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

      {/* 2. Shelter Capacity Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Total Usable Capacity
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono-code mt-0.5">1,760 Beds</div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">3 Designated Relief Centers</div>
        </div>

        <div className="bg-white border-l-4 border-l-slate-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Required Allocation (Mundakkai)
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-code mt-0.5">1,495 Persons</div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">100% Demand Target</div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Net Sector Surplus
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono-code mt-0.5">+265 Beds</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Safety Buffer Maintained</div>
        </div>

        <div className="bg-white border-l-4 border-l-amber-600 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Meppadi Sector Deficit
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono-code mt-0.5">-340 Beds</div>
          <div className="text-[10px] text-amber-800 font-bold mt-0.5">Resolved via Kalpetta Corridor</div>
        </div>
      </div>

      {/* 3. Facility Readiness & Evolution Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>⛺</span>
            <span>Designated Relief Facilities & Allocation History</span>
          </div>
          <span className="text-[10.5px] font-mono-code font-bold text-slate-600">
            Plan V1 → Plan V2 Capacity Balance
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px]">
                <th className="p-2.5">Facility Name</th>
                <th className="p-2.5">Location Sector</th>
                <th className="p-2.5">Total Capacity</th>
                <th className="p-2.5">Plan V1 (Pre-Incident)</th>
                <th className="p-2.5">Plan V2 (Post-Bridge Failure)</th>
                <th className="p-2.5">Net Delta</th>
                <th className="p-2.5">Medical Readiness</th>
                <th className="p-2.5">Transit Route Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-xs">
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Meppadi Govt. HSS</td>
                <td className="p-2.5 text-slate-600">Meppadi Town</td>
                <td className="p-2.5 font-mono-code font-bold">755 beds</td>
                <td className="p-2.5 font-mono-code text-slate-700">612 persons</td>
                <td className="p-2.5 font-mono-code text-amber-900 font-extrabold">380 persons</td>
                <td className="p-2.5 font-mono-code text-red-700 font-extrabold">−232</td>
                <td className="p-2.5 text-[11px] text-emerald-800 font-bold">On-Site Triage (Meppadi PHC)</td>
                <td className="p-2.5 text-[10.5px] text-red-700 font-mono-code font-bold">R104 Blocked (Bypass Only)</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Kalpetta Community Hall</td>
                <td className="p-2.5 text-slate-600">Kalpetta Municipality</td>
                <td className="p-2.5 font-mono-code font-bold">628 beds</td>
                <td className="p-2.5 font-mono-code text-slate-700">503 persons</td>
                <td className="p-2.5 font-mono-code text-emerald-900 font-extrabold">612 persons (Primary)</td>
                <td className="p-2.5 font-mono-code text-emerald-700 font-extrabold">+109</td>
                <td className="p-2.5 text-[11px] text-emerald-800 font-bold">District Hospital Link (5 min)</td>
                <td className="p-2.5 text-[10.5px] text-emerald-700 font-mono-code font-bold">Route R212 CLEAR (Arterial)</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">St. Mary's School Vythiri</td>
                <td className="p-2.5 text-slate-600">Vythiri Center</td>
                <td className="p-2.5 font-mono-code font-bold">500 beds</td>
                <td className="p-2.5 font-mono-code text-slate-700">380 persons</td>
                <td className="p-2.5 font-mono-code text-emerald-900 font-extrabold">503 persons (Secondary)</td>
                <td className="p-2.5 font-mono-code text-emerald-700 font-extrabold">+123</td>
                <td className="p-2.5 text-[11px] text-emerald-800 font-bold">Vythiri Taluk Squad Standby</td>
                <td className="p-2.5 text-[10.5px] text-emerald-700 font-mono-code font-bold">Route R318 CLEAR (Bypass)</td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300 font-mono-code">
                <td className="p-2.5 font-sans">Total Planned Allocations</td>
                <td className="p-2.5">—</td>
                <td className="p-2.5">1,760 Usable</td>
                <td className="p-2.5">1,495 / 1,495 (100%)</td>
                <td className="p-2.5 text-emerald-900">1,495 / 1,495 (100%)</td>
                <td className="p-2.5 text-slate-800">0 (Balanced)</td>
                <td className="p-2.5 font-sans text-emerald-800 text-[11px]">All 3 Facilities Medically Linked</td>
                <td className="p-2.5 font-sans text-emerald-800 text-[11px]">Resilient Transit Corridors</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-300">
        <div className="text-slate-700 font-medium text-xs">
          Multi-camp distribution prevents single-point capacity failures and avoids local valley basin overcrowding.
        </div>
        <div className="flex gap-2">
          <Link
            to="/planning/routes"
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 hover:bg-slate-100 text-xs"
          >
            VIEW EVACUATION ROUTES ▶
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
