import { Link } from 'react-router-dom';
import { mockHazards } from '../data/mockData';
import { RiskBadge, DataSemanticBadge } from '../components/common/Badge';
import { StatusIndicator } from '../components/common/StatusIndicator';

export default function HazardsPage() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Hazard Analysis & Multi-Hazard Susceptibility
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-navy-900 text-white font-mono-code">
              GSI / IMD TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Multi-hazard susceptibility modeling, precipitation accumulation, and real-time slope saturation monitoring.
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

      {/* 2. Executive Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border-l-4 border-l-red-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Active High-Risk Areas
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-code mt-0.5">12</div>
          <div className="text-[10px] text-red-700 font-bold mt-0.5">▲ Critical slope alert active</div>
        </div>

        <div className="bg-white border-l-4 border-l-red-700 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Mundakkai Slope Saturation
          </div>
          <div className="text-2xl font-black text-red-700 font-mono-code mt-0.5">94.2%</div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">Threshold: 90.0% (Breached)</div>
        </div>

        <div className="bg-white border-l-4 border-l-amber-600 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            24h Cumulative Precipitation
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono-code mt-0.5">204.6 mm</div>
          <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">Threshold: 180.0 mm (IMD Doppler)</div>
        </div>

        <div className="bg-white border-l-4 border-l-slate-600 border border-slate-300 rounded p-3 shadow-xs">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Designated Exposure Envelope
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-code mt-0.5">Zone HZ-01</div>
          <div className="text-[10px] text-slate-600 font-mono-code mt-0.5">427 HH · 1,495 Residents</div>
        </div>
      </div>

      {/* 3. Active Hazard Register Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>⚠</span>
            <span>Active Hazard Register & Threshold Tracking</span>
          </div>
          <span className="text-[10.5px] font-mono-code font-bold text-slate-600">
            Vythiri Taluk Regional Grid
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px]">
                <th className="p-2.5">Hazard Perimeter</th>
                <th className="p-2.5">Type & Severity</th>
                <th className="p-2.5">Exposed Demographic</th>
                <th className="p-2.5">Current Telemetry Indicator</th>
                <th className="p-2.5">Primary Physical Drivers</th>
                <th className="p-2.5">Source Telemetry</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-xs">
              {mockHazards.map((hazard) => (
                <tr key={hazard.id} className="hover:bg-slate-50/80">
                  <td className="p-2.5 font-bold text-slate-900 font-mono-code">
                    {hazard.name} (Zone HZ-01)
                  </td>
                  <td className="p-2.5">
                    <RiskBadge level={hazard.severity}>
                      {hazard.severity.toUpperCase()} ({hazard.type})
                    </RiskBadge>
                  </td>
                  <td className="p-2.5 font-mono-code">
                    <strong>{hazard.affectedHouseholds} HH</strong> · {hazard.affectedPopulation} Persons
                  </td>
                  <td className="p-2.5 font-mono-code">
                    <span className="text-red-700 font-bold">94.2% Saturation</span> · 204.6 mm / 24h
                  </td>
                  <td className="p-2.5 text-[11px] text-slate-700">
                    {hazard.drivers.join(' · ')}
                  </td>
                  <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">
                    IMD Doppler (Kochi) + InSAR Model
                  </td>
                  <td className="p-2.5">
                    <StatusIndicator status="critical" label="Threshold Breached" />
                  </td>
                </tr>
              ))}
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Chooralmala Drainage Basin</td>
                <td className="p-2.5">
                  <RiskBadge level="high">HIGH (Debris Runoff)</RiskBadge>
                </td>
                <td className="p-2.5 font-mono-code">210 HH · 735 Persons</td>
                <td className="p-2.5 font-mono-code text-amber-900">162.4 mm / 24h Runoff Surge</td>
                <td className="p-2.5 text-[11px] text-slate-700">Excessive surface water accumulation; secondary slope instability</td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">CWC Southern Region</td>
                <td className="p-2.5">
                  <StatusIndicator status="operational" label="Elevated Monitoring" />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-2.5 font-bold text-slate-900 font-mono-code">Attamala Ridge Corridor</td>
                <td className="p-2.5">
                  <RiskBadge level="warning">WARNING (Soil Creep)</RiskBadge>
                </td>
                <td className="p-2.5 font-mono-code">145 HH · 490 Persons</td>
                <td className="p-2.5 font-mono-code text-slate-700">138.0 mm / 24h</td>
                <td className="p-2.5 text-[11px] text-slate-700">Steep terrace fissures observed by village revenue squad</td>
                <td className="p-2.5 text-[10.5px] text-slate-500 font-mono-code">GSI Regional Center</td>
                <td className="p-2.5">
                  <StatusIndicator status="operational" label="Standard Surveillance" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Links Footer */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-300">
        <div className="text-slate-700 font-medium text-xs">
          Hazard assessment informs the proactive relocation model for Mundakkai corridor (1,495 persons).
        </div>
        <div className="flex gap-2">
          <Link
            to="/planning/vulnerability"
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 hover:bg-slate-100 text-xs"
          >
            VIEW VULNERABILITY FOOTPRINT ▶
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
