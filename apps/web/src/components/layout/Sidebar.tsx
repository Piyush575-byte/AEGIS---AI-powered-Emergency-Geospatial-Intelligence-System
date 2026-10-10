import { NavLink } from 'react-router-dom';
import { 
  Building2, 
  Map, 
  ShieldAlert, 
  MapPin, 
  Compass, 
  FileText, 
  Sliders, 
  BarChart3, 
  Truck, 
  Database, 
  History, 
  AlertTriangle, 
  Layers 
} from 'lucide-react';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

function SidebarNavItem({ to, label, icon, badge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg mx-2 mb-1 transition-all duration-150 ${
          isActive
            ? 'bg-white/20 text-white font-bold border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.30),0_3px_10px_rgba(0,0,0,0.30)] backdrop-blur-md'
            : 'text-white/90 hover:bg-white/12 hover:text-white border border-transparent hover:border-white/15'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-2 truncate">
            <span className={`shrink-0 transition-colors ${isActive ? 'text-[#38BDF8]' : 'text-white/80 group-hover:text-white'}`}>
              {icon}
            </span>
            <span className="truncate text-white font-medium">{label}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {badge && (
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                isActive 
                  ? 'bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/40'
                  : 'bg-white/10 text-white border border-white/15'
              }`}>
                {badge}
              </span>
            )}
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <nav className="h-full overflow-y-auto aegis-scroll py-2.5 flex flex-col select-none" aria-label="Operational Navigation">
      {/* 1. OVERVIEW */}
      <div className="px-3.5 pt-1.5 pb-1 text-[9.5px] font-extrabold uppercase tracking-widest text-white">
        Overview
      </div>
      <SidebarNavItem 
        to="/sdma" 
        label="State SDMA" 
        icon={<Map className="w-3.5 h-3.5" />}
        badge="State"
      />
      <SidebarNavItem 
        to="/ddma" 
        label="District DDMA" 
        icon={<Building2 className="w-3.5 h-3.5" />}
        badge="Wayanad"
      />

      {/* 2. PLANNING */}
      <div className="px-3.5 pt-3 pb-1 text-[9.5px] font-extrabold uppercase tracking-widest text-white">
        Planning
      </div>
      <SidebarNavItem 
        to="/planning/hazards" 
        label="Hazards" 
        icon={<AlertTriangle className="w-3.5 h-3.5" />}
      />
      <SidebarNavItem 
        to="/planning/vulnerability" 
        label="Vulnerability" 
        icon={<Layers className="w-3.5 h-3.5" />}
      />
      <SidebarNavItem 
        to="/planning/shelters" 
        label="Shelters" 
        icon={<MapPin className="w-3.5 h-3.5" />}
      />
      <SidebarNavItem 
        to="/planning/routes" 
        label="Routes" 
        icon={<Compass className="w-3.5 h-3.5" />}
      />
      <SidebarNavItem 
        to="/planning/relocation" 
        label="Relocation Plans" 
        icon={<FileText className="w-3.5 h-3.5" />}
      />

      {/* 3. ANALYSIS */}
      <div className="px-3.5 pt-3 pb-1 text-[9.5px] font-extrabold uppercase tracking-widest text-white">
        Analysis
      </div>
      <SidebarNavItem 
        to="/analysis/simulation" 
        label="Simulation" 
        icon={<Sliders className="w-3.5 h-3.5" />}
      />
      <SidebarNavItem 
        to="/analysis/compare" 
        label="Compare Plans" 
        icon={<BarChart3 className="w-3.5 h-3.5" />}
      />

      {/* 4. OPERATIONS */}
      <div className="px-3.5 pt-3 pb-1 text-[9.5px] font-extrabold uppercase tracking-widest text-white">
        Operations
      </div>
      <SidebarNavItem 
        to="/operations/incidents" 
        label="Incidents" 
        icon={<ShieldAlert className="w-3.5 h-3.5" />}
      />
      <SidebarNavItem 
        to="/operations/resources" 
        label="Resources" 
        icon={<Truck className="w-3.5 h-3.5" />}
      />

      {/* 5. SYSTEM */}
      <div className="px-3.5 pt-3 pb-1 text-[9.5px] font-extrabold uppercase tracking-widest text-white">
        System
      </div>
      <SidebarNavItem 
        to="/system/data-status" 
        label="Data Status" 
        icon={<Database className="w-3.5 h-3.5" />}
      />
      <SidebarNavItem 
        to="/audit" 
        label="Audit Trail" 
        icon={<History className="w-3.5 h-3.5" />}
      />
    </nav>
  );
}
