import { NavLink } from 'react-router-dom';
import { 
  Building2, 
  Map, 
  MapPin, 
  Compass, 
  FileText, 
  Layers, 
  BarChart3, 
  Truck, 
  Database, 
  History, 
  AlertTriangle 
} from 'lucide-react';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

function SidebarNavItem({ to, label, icon, badge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center justify-between px-3 py-2 text-[14px] font-medium rounded-lg mx-2 mb-1 transition-all duration-150 min-h-[40px] ${
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-2.5 truncate">
            <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {badge && (
              <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md tabular-nums ${
                isActive 
                  ? 'bg-blue-700 text-white border border-blue-400/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {badge}
              </span>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <nav className="h-full overflow-y-auto aegis-scroll py-3 flex flex-col select-none" aria-label="Operational Navigation">
      {/* 1. Overview */}
      <div className="px-3.5 pt-2 pb-1.5 text-xs font-semibold text-slate-400">
        Overview
      </div>
      <SidebarNavItem 
        to="/sdma" 
        label="State SDMA" 
        icon={<Map className="w-4 h-4" />}
        badge="State"
      />
      <SidebarNavItem 
        to="/ddma" 
        label="District DDMA" 
        icon={<Building2 className="w-4 h-4" />}
        badge="Wayanad"
      />

      {/* 2. Planning */}
      <div className="px-3.5 pt-4 pb-1.5 text-xs font-semibold text-slate-400">
        Planning
      </div>
      <SidebarNavItem 
        to="/planning/hazards" 
        label="Hazards" 
        icon={<AlertTriangle className="w-4 h-4" />}
      />
      <SidebarNavItem 
        to="/planning/vulnerability" 
        label="Vulnerability" 
        icon={<Layers className="w-4 h-4" />}
      />
      <SidebarNavItem 
        to="/planning/shelters" 
        label="Shelters" 
        icon={<MapPin className="w-4 h-4" />}
      />
      <SidebarNavItem 
        to="/planning/routes" 
        label="Routes" 
        icon={<Compass className="w-4 h-4" />}
      />
      <SidebarNavItem 
        to="/planning/relocation" 
        label="Relocation plans" 
        icon={<FileText className="w-4 h-4" />}
      />

      {/* 3. Analysis */}
      <div className="px-3.5 pt-4 pb-1.5 text-xs font-semibold text-slate-400">
        Analysis
      </div>
      <SidebarNavItem 
        to="/simulation" 
        label="Simulation" 
        icon={<BarChart3 className="w-4 h-4" />}
      />
      <SidebarNavItem 
        to="/analysis/compare" 
        label="Compare plans" 
        icon={<Layers className="w-4 h-4" />}
      />

      {/* 4. Operations */}
      <div className="px-3.5 pt-4 pb-1.5 text-xs font-semibold text-slate-400">
        Operations
      </div>
      <SidebarNavItem 
        to="/operations/incidents" 
        label="Incidents" 
        icon={<AlertTriangle className="w-4 h-4" />}
      />
      <SidebarNavItem 
        to="/operations/resources" 
        label="Resources" 
        icon={<Truck className="w-4 h-4" />}
      />

      {/* 5. System */}
      <div className="px-3.5 pt-4 pb-1.5 text-xs font-semibold text-slate-400">
        System
      </div>
      <SidebarNavItem 
        to="/system/data-status" 
        label="Data status" 
        icon={<Database className="w-4 h-4" />}
      />
      <SidebarNavItem 
        to="/audit" 
        label="Audit log" 
        icon={<History className="w-4 h-4" />}
      />
    </nav>
  );
}
