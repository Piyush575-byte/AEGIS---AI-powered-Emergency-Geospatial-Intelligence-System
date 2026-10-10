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
    <header className="aegis-header select-none h-12 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 text-white z-50 shrink-0">
      {/* Left Cluster: Menu Toggle, Brand & Subtitle */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer border shrink-0 backdrop-blur-md ${
              isSidebarCollapsed
                ? 'bg-blue-600 text-white border-blue-400/40 shadow-xs'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title={isSidebarCollapsed ? 'Expand Navigation Menu (Ctrl+B)' : 'Collapse Navigation Menu (Ctrl+B)'}
            aria-label={isSidebarCollapsed ? 'Expand navigation menu' : 'Collapse navigation menu'}
          >
            {isSidebarCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px] font-bold">{isSidebarCollapsed ? 'Menu' : 'Menu'}</span>
          </button>
        )}

        {/* Brand & Subtitle */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 font-extrabold text-xs text-white tracking-wider shadow-sm border border-white/25 shrink-0">
            A
          </div>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-extrabold text-sm text-white tracking-tight shrink-0">AEGIS</span>
            <span className="text-[11px] text-white/95 font-medium truncate hidden xl:inline">
              Disaster Relocation Decision Support · {isSdmaView ? 'Kerala State Disaster Management Authority' : 'Wayanad DDMA'}
            </span>
            <span className="text-[11px] text-white/95 font-medium truncate hidden md:inline xl:hidden">
              · {isSdmaView ? 'Kerala SDMA' : 'Wayanad DDMA'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Cluster: Operational Level Switcher, Scenario Notice, Incident Pill */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Operational Level Switcher */}
        <div className="flex items-center bg-white/[0.10] border border-white/20 rounded-full p-0.5 text-[10.5px] backdrop-blur-md shadow-inner">
          <Link
            to="/sdma"
            className={`px-2.5 py-0.5 rounded-full font-medium transition whitespace-nowrap ${
              isSdmaView
                ? 'bg-white/25 text-white font-bold shadow-xs border border-white/30'
                : 'text-white/90 hover:text-white hover:bg-white/15'
            }`}
          >
            <span className="hidden sm:inline">State </span>(SDMA)
          </Link>
          <Link
            to="/ddma"
            className={`px-2.5 py-0.5 rounded-full font-medium transition whitespace-nowrap ${
              !isSdmaView
                ? 'bg-white/25 text-white font-bold shadow-xs border border-white/30'
                : 'text-white/90 hover:text-white hover:bg-white/15'
            }`}
          >
            <span className="hidden sm:inline">District </span>(DDMA)
          </Link>
        </div>

        {/* Demonstration Scenario Notice */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/20 text-[10.5px] font-semibold text-white whitespace-nowrap backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
          <span className="text-white/80 hidden lg:inline">Demonstration Scenario — </span>
          <span className="text-white font-bold">Synthetic Data</span>
        </div>

        {/* Incident Status Pill */}
        {incidentName && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-400/50 text-[10.5px] font-bold text-white shadow-xs whitespace-nowrap backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-pulse"></span>
            <span className="truncate max-w-[140px] sm:max-w-[220px]">Incident: {incidentName}</span>
          </div>
        )}
      </div>

      {/* Right Cluster: Timestamp */}
      <div className="flex items-center gap-2 text-xs text-white shrink-0">
        <span className="font-mono text-[11px] text-white font-semibold whitespace-nowrap hidden sm:inline">
          {dateTime}
        </span>
        <span className="font-mono text-[10px] text-white font-semibold whitespace-nowrap sm:hidden">
          {dateTime.split(' ').slice(-2).join(' ')}
        </span>
      </div>
    </header>
  );
}

