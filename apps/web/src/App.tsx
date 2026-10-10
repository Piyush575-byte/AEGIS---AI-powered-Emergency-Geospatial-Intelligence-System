import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DDMADashboard from './pages/DDMADashboard';
import AuditPage from './pages/AuditPage';
import Dashboard from './pages/Dashboard';
import DesignFoundationPreview from './pages/DesignFoundationPreview';
import ComparePlans from './pages/ComparePlans';
import DataStatus from './pages/DataStatus';
import Simulation from './pages/Simulation';
import HazardsPage from './pages/HazardsPage';
import VulnerabilityPage from './pages/VulnerabilityPage';
import SheltersPage from './pages/SheltersPage';
import RoutesPage from './pages/RoutesPage';
import RelocationPage from './pages/RelocationPage';
import IncidentsPage from './pages/IncidentsPage';
import ResourcesPage from './pages/ResourcesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Primary Demo: DDMA Incident Command Center on Root and /ddma */}
          <Route index element={<DDMADashboard />} />
          <Route path="ddma" element={<DDMADashboard />} />
          <Route path="simulation" element={<Simulation />} />
          <Route path="audit" element={<AuditPage />} />

          {/* Regional SDMA Overview */}
          <Route path="sdma" element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="design-foundation" element={<DesignFoundationPreview />} />


          {/* Planning Routes */}
          <Route path="planning/hazards" element={<HazardsPage />} />
          <Route path="planning/vulnerability" element={<VulnerabilityPage />} />
          <Route path="planning/shelters" element={<SheltersPage />} />
          <Route path="planning/routes" element={<RoutesPage />} />
          <Route path="planning/relocation" element={<RelocationPage />} />

          {/* Analysis Routes */}
          <Route path="analysis/simulation" element={<Simulation />} />
          <Route path="analysis/compare" element={<ComparePlans />} />

          {/* Operations Routes */}
          <Route path="operations/incidents" element={<IncidentsPage />} />
          <Route path="operations/resources" element={<ResourcesPage />} />

          {/* System Routes & Forensic Audit Trail */}
          <Route path="system/data-status" element={<DataStatus />} />
          <Route path="system/audit-log" element={<AuditPage />} />
          <Route path="operations/audit" element={<AuditPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
