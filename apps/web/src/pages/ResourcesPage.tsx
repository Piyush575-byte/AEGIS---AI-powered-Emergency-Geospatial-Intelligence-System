import { Link } from 'react-router-dom';
import { DataSemanticBadge } from '../components/common/Badge';
import { StatusIndicator } from '../components/common/StatusIndicator';

export default function ResourcesPage() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Resource Management & Operational Readiness Registry
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-navy-900 text-white font-mono-code">
              LOGISTICS & READINESS
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Emergency transport convoys, on-site medical health desks, field inspection squads, and relief supplies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSemanticBadge type="SOURCE_DATA" />
          <Link
            to="/dashboard"
            className="px-2.5 py-1 rounded bg-navy-900 text-white font-extrabold text-[11px] hover:bg-navy-800 transition-colors shadow-xs"
          >
            ◀ OPEN SDMA OVERVIEW
          </Link>
        </div>
      </div>

      {/* 2. Readiness Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Relief Bed Readiness
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono-code mt-0.5">1,760 Beds</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">100% Demand Ready (+265 Buffer)</div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Transport Convoys
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-code mt-0.5">KSRTC Vythiri</div>
          <div className="text-[10px] text-slate-600 font-mono-code mt-0.5">Mobilized via R212 / R318</div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Medical Triage Readiness
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono-code mt-0.5">3 / 3 Facilities</div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">PHC & District Hospital Squads</div>
        </div>

        <div className="bg-white border-l-4 border-l-slate-600 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Field Squad Surveillance
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-code mt-0.5">Active On-Scene</div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">Vythiri Taluk Revenue Unit</div>
        </div>
      </div>

      {/* 3. Operational Resource Readiness Registry Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>📦</span>
            <span>Operational Resource Readiness Registry</span>
          </div>
          <span className="text-[10.5px] font-mono-code font-bold text-slate-600">
            Directly Bound Operational Dependencies
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px]">
                <th className="p-2.5">Resource Category</th>
                <th className="p-2.5">Designated Unit / Provider</th>
                <th className="p-2.5">Operational Scope</th>
                <th className="p-2.5">Linked Facilities / Corridors</th>
                <th className="p-2.5">Deployment Status</th>
                <th className="p-2.5">Telemetry Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-xs">
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Shelter Facilities</td>
                <td className="p-2.5 text-slate-800">DDMA Designated Relief Camp Network</td>
                <td className="p-2.5 font-mono-code font-bold">1,760 Usable Bed Capacity</td>
                <td className="p-2.5 font-mono-code">Meppadi (755), Kalpetta (628), Vythiri (500)</td>
                <td className="p-2.5"><StatusIndicator status="operational" label="Ready for Intake" /></td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">DDMA Shelter Registry</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Evacuation Convoys</td>
                <td className="p-2.5 text-slate-800">KSRTC Vythiri Depot & Revenue Fleet</td>
                <td className="p-2.5 font-mono-code font-bold">Vehicular Evacuation Squads</td>
                <td className="p-2.5 font-mono-code">Active on Route R212 & R318 (R104 Bypassed)</td>
                <td className="p-2.5"><StatusIndicator status="operational" label="Mobilized (Plan V2)" /></td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">Motor Vehicles Dept / PWD</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Medical Triage Squads</td>
                <td className="p-2.5 text-slate-800">District Medical Office (Health Services)</td>
                <td className="p-2.5 font-mono-code font-bold">On-Site Camp Health Desks</td>
                <td className="p-2.5 font-mono-code">Meppadi PHC & Kalpetta District Hospital Link</td>
                <td className="p-2.5"><StatusIndicator status="operational" label="On-Site Active" /></td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">DMO Health Registry</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Field Inspection Units</td>
                <td className="p-2.5 text-slate-800">Taluk Revenue Squad & PWD Roads Wing</td>
                <td className="p-2.5 font-mono-code font-bold">Corridor Verification & Damage Assessment</td>
                <td className="p-2.5 font-mono-code">Route R104 (KM 4.2 Breach Inspection)</td>
                <td className="p-2.5"><StatusIndicator status="critical" label="Incident Verified" /></td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">Taluk Control Room Feed</td>
              </tr>
              <tr className="hover:bg-slate-50/80 text-slate-500">
                <td className="p-2.5 font-bold font-mono-code">Heavy Earthmoving Equipment</td>
                <td className="p-2.5">State Disaster Emergency Procurement</td>
                <td className="p-2.5 font-mono-code italic text-[11px]">Debris Clearance Squads</td>
                <td className="p-2.5 font-mono-code italic text-[11px]">Bridge R104 Culvert Reconstruction</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">Ingestion Staged</span></td>
                <td className="p-2.5 text-[10.5px] text-slate-400 font-mono-code">Undeclared in Prototype</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-300">
        <div className="text-slate-700 font-medium text-xs">
          All resources operate under the statutory supervision of the Wayanad District Disaster Management Authority (DDMA).
        </div>
        <div className="flex gap-2">
          <Link
            to="/system/data-status"
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 hover:bg-slate-100 text-xs"
          >
            VIEW DATA STATUS REGISTRY ▶
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
