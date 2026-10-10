import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getCurrentDateTime } from '../../utils/formatters';
import { api } from '../../services/api';
import { PanelLeft, PanelLeftClose } from 'lucide-react';

interface HeaderProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ isSidebarCollapsed = false, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const [dateTime, setDateTime] = useState(getCurrentDateTime());
  const [incidentName, setIncidentName] = useState<string | null>(null);

  const isSdmaView = location.pathname.startsWith('/sdma') || 
                     location.pathname === '/dashboard' ||
                     location.pathname.startsWith('/planning') ||
                     location.pathname.startsWith('/analysis');

  useEffect(() => {
    const interval = setInterval(() => setDateTime(getCurrentDateTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkIncident = async () => {
      try {
        const inc = await api.getLatestIncident();
        if ('corridor_code' in inc && inc.corridor_code) {
          setIncidentName(`${inc.corridor_code} Bridge Failure (Blocked)`);
        } else if ('description' in inc && inc.description) {
          setIncidentName('R1 Bridge Failure');
        } else {
          setIncidentName(null);
        }
      } catch {
        setIncidentName(null);
      }
    };
    checkIncident();
    const interval = setInterval(checkIncident, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="aegis-header select-none h-[52px] px-3 sm:px-4 flex items-center justify-between gap-3 text-white z-50 shrink-0">
      {/* Left Cluster: Menu Toggle, Brand & Subtitle */}
      <div className="flex items-center gap-3 min-w-0 shrink">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border shrink-0 ${
              isSidebarCollapsed
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title={isSidebarCollapsed ? 'Expand navigation menu (Ctrl+B)' : 'Collapse navigation menu (Ctrl+B)'}
            aria-label={isSidebarCollapsed ? 'Expand navigation menu' : 'Collapse navigation menu'}
          >
            {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs font-semibold">Menu</span>
          </button>
        )}

        {/* Brand & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 font-extrabold text-sm text-white tracking-wider shadow-sm border border-blue-400 shrink-0">
            A
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-bold text-base text-white tracking-tight shrink-0">AEGIS</span>
            <span className="text-[13px] text-slate-200 font-medium truncate hidden xl:inline">
              Disaster relocation decision support · {isSdmaView ? 'Kerala State Disaster Management Authority' : 'Wayanad District DDMA'}
            </span>
            <span className="text-[13px] text-slate-200 font-medium truncate hidden md:inline xl:hidden">
              · {isSdmaView ? 'Kerala SDMA' : 'Wayanad DDMA'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Cluster: Operational Level Switcher, Scenario Notice, Incident Pill */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Operational Level Switcher */}
        <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-0.5 text-xs shadow-inner">
          <Link
            to="/sdma"
            className={`px-3 py-1 rounded-md text-[13px] font-semibold transition whitespace-nowrap ${
              isSdmaView
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span className="hidden sm:inline">State </span>(SDMA)
          </Link>
          <Link
            to="/ddma"
            className={`px-3 py-1 rounded-md text-[13px] font-semibold transition whitespace-nowrap ${
              !isSdmaView
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span className="hidden sm:inline">District </span>(DDMA)
          </Link>
        </div>

        {/* Demonstration Scenario Notice */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-200 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
          <span className="text-slate-300 hidden lg:inline">Demonstration scenario · </span>
          <span className="text-white font-semibold">Synthetic data</span>
        </div>

        {/* Incident Status Pill */}
        {incidentName && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-950/80 border border-rose-700/80 text-xs font-bold text-rose-100 shadow-xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-ping"></span>
            <span className="truncate max-w-[160px] sm:max-w-[240px]">Incident: {incidentName}</span>
          </div>
        )}
      </div>

      {/* Right Cluster: Timestamp with Tabular Numbers */}
      <div className="flex items-center gap-2 text-xs text-white shrink-0">
        <span className="font-mono text-xs text-slate-200 font-medium tabular-nums whitespace-nowrap hidden sm:inline">
          {dateTime}
        </span>
        <span className="font-mono text-xs text-slate-200 font-medium tabular-nums whitespace-nowrap sm:hidden">
          {dateTime.split(' ').slice(-2).join(' ')}
        </span>
      </div>
    </header>
  );
}
