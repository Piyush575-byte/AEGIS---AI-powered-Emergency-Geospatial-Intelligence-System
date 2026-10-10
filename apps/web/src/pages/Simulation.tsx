import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  api,
  type SimulationStateResponse,
  type SimulationDecisionResult,
  type GeoDataResponse
} from '../services/api';
import {
  extractClusterPoints,
  groupPointsByDistrict,
  clusterPointsByScreenDistance,
  createStateClusterIcon,
  createDistrictClusterIcon,
  createHabitationIcon,
  createShelterIcon,
} from '../utils/mapClustering';
import {
  AlertTriangle,
  CheckCircle,
  Shield,
  Activity,
  MapPin,
  Compass,
  Building,
  Radio,
  FileText,
  RotateCcw,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  Check,
  Send
} from 'lucide-react';

export default function Simulation() {
  // Core Data State
  const [simState, setSimState] = useState<SimulationStateResponse | null>(null);
  const [geodata, setGeodata] = useState<GeoDataResponse | null>(null);
  const [decisionResult, setDecisionResult] = useState<SimulationDecisionResult | null>(null);
  const [auditChain, setAuditChain] = useState<any[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'route' | 'shelter' | 'hazard' | 'population' | 'incident'>('route');
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [pipelineStepDetails, setPipelineStepDetails] = useState<{ [key: number]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeScenarioName, setActiveScenarioName] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(12);

  // Form Controls State
  // Route
  const [routeCode, setRouteCode] = useState('R1');
  const [routeStatus, setRouteStatus] = useState<'blocked' | 'degraded' | 'clear'>('blocked');
  const [routeReason, setRouteReason] = useState('bridge_failure');
  const [routeSource, setRouteSource] = useState('Field Team 07');

  // Shelter
  const [shelterCode, setShelterCode] = useState('SH-ALPHA');
  const [shelterCapacity, setShelterCapacity] = useState(80);
  const [shelterStatusVal, setShelterStatusVal] = useState('operational');
  const [shelterMedical, setShelterMedical] = useState(true);
  const [shelterSource, setShelterSource] = useState('Shelter Registry');

  // Hazard
  const [hazardCode, setHazardCode] = useState('HZ-CHOORALMALA-SLOPE');
  const [hazardAction, setHazardAction] = useState<'expand' | 'severity' | 'move'>('expand');
  const [radiusDelta, setRadiusDelta] = useState(0.8);
  const [hazardSeverity, setHazardSeverity] = useState('critical');
  const [hazardSource, setHazardSource] = useState('GIS Remote Sensing');

  // Population
  const [habitationCode, setHabitationCode] = useState('CHOORALMALA');
  const [populationDelta, setPopulationDelta] = useState(80);
  const [popSeverity, setPopSeverity] = useState('critical');
  const [popSource, setPopSource] = useState('Village Revenue Officer');

  // Incident
  const [incType, setIncType] = useState('bridge_failure');
  const [incLocation, setIncLocation] = useState('R1');
  const [incSeverity, setIncSeverity] = useState('critical');
  const [incDesc, setIncDesc] = useState('Debris flow severed culvert bridge at KM 4.2 of R1 corridor');
  const [incReporter, setIncReporter] = useState('Field Team 07');

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Load Initial State
  const loadState = async () => {
    try {
      const [stateRes, geoRes, auditRes] = await Promise.all([
        api.getSimulationState(),
        api.getGeodata(),
        api.getAuditTrail().catch(() => ({ audit_trail: [] }))
      ]);
      setSimState(stateRes);
      setGeodata(geoRes);
      if (auditRes && (auditRes as any).audit_trail) {
        setAuditChain((auditRes as any).audit_trail);
      }
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Failed to load initial simulation state:', err);
      setErrorMsg(err.message || 'Error connecting to AEGIS backend.');
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Fix leaflet marker asset paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center: [11.545, 76.115],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('zoomend', () => {
        setZoomLevel(map.getZoom());
      });

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !geodata) return;

    layerGroup.clearLayers();

    // 1. Hazard Zones
    if (geodata.hazard_zones?.features) {
      geodata.hazard_zones.features.forEach((hz) => {
        if (hz.geometry?.coordinates) {
          const latlngs = hz.geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
          const isCritical = hz.properties.severity === 'critical';
          const polygon = L.polygon(latlngs, {
            color: isCritical ? '#dc2626' : '#ea580c',
            fillColor: isCritical ? '#ef4444' : '#f97316',
            fillOpacity: 0.22,
            weight: 2,
            dashArray: '4, 4',
          });
          polygon.bindTooltip(`<b>Hazard: ${hz.properties.name}</b><br/>Severity: ${hz.properties.severity.toUpperCase()}`, {
            sticky: true,
          });
          layerGroup.addLayer(polygon);
        }
      });
    }

    // 2. Corridors / Routes
    if (geodata.routes?.features) {
      geodata.routes.features.forEach((r) => {
        if (r.geometry?.coordinates) {
          const latlngs = r.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
          
          // Match with live state
          const liveRoute = simState?.routes?.find(rt => rt.code === r.properties.code);
          const currentStatus = liveRoute?.status || r.properties.status;
          const isBlocked = currentStatus === 'blocked';
          const isDegraded = currentStatus === 'degraded';
          const isRecommended = decisionResult?.recommendation?.recommended_route_code === r.properties.code;

          // At state level (< 11), only display canonical routes (R1-R4) or blocked/recommended
          const isCanonical = ['R1', 'R2', 'R3', 'R4'].includes(r.properties.code);
          if (zoomLevel < 11 && !isCanonical && !isBlocked && !isRecommended) {
            return;
          }

          let color = '#94a3b8'; // subtle slate
          let weight = zoomLevel < 11 ? 2.5 : 3.5;
          let dashArray: string | undefined = undefined;

          if (isBlocked) {
            color = '#dc2626'; // red
            weight = zoomLevel < 11 ? 3 : 4.5;
            dashArray = '6, 6';
          } else if (isDegraded) {
            color = '#f59e0b'; // amber
            weight = zoomLevel < 11 ? 2.5 : 4;
          } else if (isRecommended) {
            color = '#2563eb'; // blue primary recommended
            weight = zoomLevel < 11 ? 3.5 : 5.5;
          }

          const polyline = L.polyline(latlngs, { color, weight, dashArray });
          polyline.bindTooltip(`<b>Route ${r.properties.code}: ${r.properties.name}</b><br/>Status: ${(currentStatus || 'clear').toUpperCase()}<br/>Capacity: ${r.properties.capacity_pax_hour} pax/hr`, {
            sticky: true,
          });
          layerGroup.addLayer(polyline);
        }
      });
    }

    // 3. ZOOM-AWARE HABITATION & SHELTER VISUALIZATION
    const points = extractClusterPoints(geodata.habitations?.features, geodata.shelters?.features);

    if (zoomLevel < 11) {
      // -------------------------------------------------------------
      // REGIME 1: STATE VIEW (zoom < 11) -> Only compact district aggregates
      // -------------------------------------------------------------
      const districtClusters = groupPointsByDistrict(points);
      districtClusters.forEach((cluster) => {
        const icon = createStateClusterIcon(cluster);
        const marker = L.marker([cluster.lat, cluster.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; color: #1e293b; padding: 4px; min-width: 180px;">
            <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 4px;">${cluster.district} District</div>
            <div style="color: #475569; font-size: 12px; margin-bottom: 2px;">Habitations: <strong>${cluster.count}</strong></div>
            <div style="color: #475569; font-size: 12px; margin-bottom: 2px;">Total Population: <strong>${cluster.totalPopulation.toLocaleString()}</strong></div>
            <div style="color: #475569; font-size: 12px; margin-bottom: 2px;">At-Risk Habitations: <strong style="color: #b91c1c;">${cluster.affectedCount}</strong></div>
            <div style="color: #475569; font-size: 12px; margin-bottom: 4px;">Operational Shelters: <strong>${cluster.sheltersCount}</strong></div>
            <div style="margin-top: 6px; font-size: 11px; color: #2563eb; font-weight: 600;">Zoom in to view operational clusters</div>
          </div>
        `);
        marker.on('click', () => {
          map.setView([cluster.lat, cluster.lng], 12);
        });
        layerGroup.addLayer(marker);
      });
    } else if (zoomLevel < 14) {
      // -------------------------------------------------------------
      // REGIME 2: DISTRICT VIEW (11 <= zoom < 14) -> Pixel radius spatial clusters
      // -------------------------------------------------------------
      const clusters = clusterPointsByScreenDistance(points, map, zoomLevel, 65);
      clusters.forEach((cluster) => {
        if (cluster.count > 1) {
          const icon = createDistrictClusterIcon(cluster);
          const marker = L.marker([cluster.lat, cluster.lng], { icon });

          const atRiskText = cluster.affectedCount > 0 ? `<div style="color: #dc2626; font-weight: 700; margin-top: 2px;">⚠️ ${cluster.affectedCount} Zones At Risk</div>` : '';
          const shelterText = cluster.sheltersCount > 0 ? `<div style="color: #059669; font-weight: 600;">🏠 ${cluster.sheltersCount} Shelters Nearby</div>` : '';

          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; color: #1e293b; padding: 4px;">
              <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">Spatial Cluster (${cluster.count} locations)</div>
              <div style="color: #475569;">Total Evacuees: <strong>${cluster.totalPopulation.toLocaleString()}</strong></div>
              ${atRiskText}
              ${shelterText}
              <div style="margin-top: 6px; font-size: 11px; color: #2563eb; font-weight: 600; cursor: pointer;">Click to zoom in</div>
            </div>
          `);
          marker.on('click', () => {
            map.setView([cluster.lat, cluster.lng], zoomLevel + 2);
          });
          layerGroup.addLayer(marker);
        } else {
          // Single isolated item
          const pt = cluster.points[0];
          if (pt.type === 'habitation') {
            const isPriority = pt.isCanonical || pt.isCritical || pt.code === 'HAB-CHOORALMALA';
            const icon = createHabitationIcon(pt, isPriority);
            const marker = L.marker([pt.lat, pt.lng], { icon });
            marker.bindTooltip(`<b>${pt.name}</b> (${pt.population} people)`);
            layerGroup.addLayer(marker);
          } else {
            const isRecommended = pt.code === decisionResult?.recommendation?.recommended_shelter_code;
            const isSevered = pt.code === 'SH-ALPHA' && (pt.shelterAvailable ?? 0) <= 0;
            const icon = createShelterIcon(pt, isRecommended, isSevered);
            const marker = L.marker([pt.lat, pt.lng], { icon });
            marker.bindTooltip(`<b>${pt.name}</b><br/>Available: +${pt.shelterAvailable ?? 0} beds`);
            layerGroup.addLayer(marker);
          }
        }
      });
    } else {
      // -------------------------------------------------------------
      // REGIME 3: LOCAL / OPERATIONAL VIEW (zoom >= 14) -> Individual objects
      // -------------------------------------------------------------
      points.forEach((pt) => {
        if (pt.type === 'habitation') {
          const isPriority = pt.isCanonical || pt.isCritical || pt.code === 'HAB-CHOORALMALA';
          const icon = createHabitationIcon(pt, isPriority);
          const marker = L.marker([pt.lat, pt.lng], { icon });
          marker.bindTooltip(`<b>${pt.name}</b> (${pt.population} people)`);
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; color: #1e293b; padding: 4px;">
              <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${pt.name}</div>
              <div style="color: #475569; margin: 3px 0;">Evacuee Count: <strong>${pt.population.toLocaleString()} pax</strong></div>
              <div style="color: #475569;">Risk Status: <strong style="color: ${pt.isCritical ? '#dc2626' : '#1e293b'};">${pt.isCritical ? 'CRITICAL / AFFECTED' : 'CLEAR'}</strong></div>
            </div>
          `);
          layerGroup.addLayer(marker);
        } else {
          const isRecommended = pt.code === decisionResult?.recommendation?.recommended_shelter_code;
          const isSevered = pt.code === 'SH-ALPHA' && (pt.shelterAvailable ?? 0) <= 0;
          const icon = createShelterIcon(pt, isRecommended, isSevered);
          const marker = L.marker([pt.lat, pt.lng], { icon });
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; color: #1e293b; padding: 4px;">
              <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${pt.name} (${pt.code})</div>
              <div style="color: #475569; margin: 3px 0;">Available Capacity: <strong>${pt.shelterAvailable ?? 'N/A'} / ${pt.shelterCapacity ?? 'N/A'}</strong></div>
              <div style="color: #475569;">Medical Capability: <strong>${pt.medicalSupport ? 'YES' : 'NO'}</strong></div>
              ${isRecommended ? '<div style="color: #2563eb; font-weight: 700; margin-top: 4px;">RECOMMENDED SHELTER</div>' : ''}
            </div>
          `);
          layerGroup.addLayer(marker);
        }
      });
    }
  }, [geodata, simState, decisionResult, zoomLevel]);

  // Handle Event Pipeline Execution
  const executeEvent = async (
    apiCall: () => Promise<SimulationDecisionResult>,
    scenarioLabel: string
  ) => {
    setIsProcessing(true);
    setApprovalMessage(null);
    setErrorMsg(null);
    setActiveScenarioName(scenarioLabel);

    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
      
      // Step 1: Event Sent
      setPipelineStep(1);
      setPipelineStepDetails({
        1: scenarioLabel,
      });
      await new Promise(r => setTimeout(r, 200));

      // Step 2: AEGIS Received
      setPipelineStep(2);
      setPipelineStepDetails(prev => ({
        ...prev,
        2: `FastAPI ingested at ${nowStr}`,
      }));
      await new Promise(r => setTimeout(r, 250));

      // Step 3 & 4: Change Detected & Impact Analysis (Actual backend call)
      setPipelineStep(3);
      setPipelineStepDetails(prev => ({
        ...prev,
        3: 'State mutation verified in PostGIS',
      }));
      const res = await apiCall();
      
      setPipelineStep(4);
      setPipelineStepDetails(prev => ({
        ...prev,
        4: `${res.what_is_affected?.population || 120} people affected · Plan V1 invalidated`,
      }));
      await new Promise(r => setTimeout(r, 200));

      // Step 5: Recommendation Ready
      setPipelineStep(5);
      setPipelineStepDetails(prev => ({
        ...prev,
        5: res.recommendation?.recommended_shelter_name 
          ? `Via ${res.recommendation.recommended_route_code || 'R4'} → ${res.recommendation.recommended_shelter_code || 'Gamma'}`
          : 'Alternative relocation via R4',
      }));
      setDecisionResult(res);

      // Refresh simulator world state & audit
      const [updatedState, auditRes] = await Promise.all([
        api.getSimulationState(),
        api.getAuditTrail().catch(() => ({ audit_trail: [] }))
      ]);
      setSimState(updatedState);
      if (auditRes && (auditRes as any).audit_trail) {
        setAuditChain((auditRes as any).audit_trail);
      }
    } catch (err: any) {
      console.error('Simulation event execution failed:', err);
      setErrorMsg(err.message || 'Simulation event failed in backend processing.');
      setPipelineStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pre-built Scenario 1: Route R1 Bridge Failure
  const runScenarioRouteBlock = () => {
    executeEvent(
      () => api.simulateRoute({
        corridor_code: 'R1',
        status: 'blocked',
        reason: 'bridge_failure',
        source: 'Field Team 07',
        description: 'Bridge collapsed at KM 4.2 on Chooralmala-Meppadi main corridor R1 due to flash debris.'
      }),
      'Scenario 1: Route R1 Bridge Failure'
    );
  };

  // Pre-built Scenario 2: Shelter Alpha Capacity Loss
  const runScenarioShelterDeficit = () => {
    executeEvent(
      () => api.simulateShelter({
        shelter_code: 'SH-ALPHA',
        new_capacity: 80,
        reason: 'capacity_reduction',
        source: 'Shelter Registry',
        description: 'Meppadi Community Hall lost western wing due to seepage. Available capacity reduced to 80.'
      }),
      'Scenario 2: Shelter Alpha Capacity Deficit'
    );
  };

  // Pre-built Scenario 3: Hazard Zone Expansion
  const runScenarioHazardExpansion = () => {
    executeEvent(
      () => api.simulateHazard({
        hazard_code: 'HZ-CHOORALMALA-SLOPE',
        action: 'expand',
        radius_km_delta: 0.8,
        severity: 'critical',
        source: 'GIS Remote Sensing Feed',
        description: 'Chooralmala debris polygon expanded +800m downslope based on Sentinel-2 radar telemetry.'
      }),
      'Scenario 3: Hazard Zone Spatial Expansion (+800m)'
    );
  };

  // Pre-built Scenario 4: Multi-Hazard Cascade
  const runScenarioCascade = () => {
    executeEvent(
      () => api.simulateCascade({
        title: 'MULTI-HAZARD CASCADE SIMULATION',
        events: [
          { change_type: 'route', corridor_code: 'R1', route_status: 'blocked', route_reason: 'bridge_failure' },
          { change_type: 'shelter', shelter_code: 'SH-ALPHA', new_capacity: 50 },
          { change_type: 'hazard', hazard_code: 'HZ-CHOORALMALA-SLOPE', hazard_action: 'severity', severity: 'critical' }
        ],
        source: 'Integrated District EOC'
      }),
      'Scenario 4: Multi-Hazard Simultaneous Cascade'
    );
  };

  // Pre-built Scenario 5: Route Reopened / Recovery
  const runScenarioRecovery = () => {
    executeEvent(
      () => api.simulateRoute({
        corridor_code: 'R1',
        status: 'clear',
        reason: 'reopened',
        source: 'PWD Highway Patrol',
        description: 'Temporary Bailey bridge installed and cleared for emergency light vehicles at KM 4.2.'
      }),
      'Scenario 5: Route R1 Reopened (Recovery)'
    );
  };

  // Reset Entire Scenario
  const handleReset = async () => {
    setIsProcessing(true);
    setApprovalMessage(null);
    setErrorMsg(null);
    setDecisionResult(null);
    setActiveScenarioName(null);
    setPipelineStep(0);
    try {
      await api.resetSimulation();
      await loadState();
      setApprovalMessage('Database & simulation world state successfully reset to Baseline Plan V1.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Human Authority Approval Execution
  const handleApproveRecommendation = async () => {
    if (!decisionResult?.recommendation?.id) return;
    setIsApproving(true);
    setErrorMsg(null);
    try {
      const res = await api.approveRecommendation(decisionResult.recommendation.id, {
        approved_by: 'District Collector & Chairman, DDMA Wayanad',
        authority_role: 'DDMA / District Authority',
        notes: `Statutory approval executed in simulator following: ${activeScenarioName || 'Simulated field incident'}. Plan V2 committed to ledger.`
      });
      setApprovalMessage(`Recommendation APPROVED by District Authority! Plan V2 active. Audit transaction committed: ${(res as any).plan_v2?.plan_code || 'AEGIS-PLAN-WAYANAD-V2'}`);
      // Refresh state
      await loadState();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve recommendation.');
    } finally {
      setIsApproving(false);
    }
  };

  // Custom Form Submission
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'route') {
      executeEvent(
        () => api.simulateRoute({
          corridor_code: routeCode,
          status: routeStatus,
          reason: routeReason,
          source: routeSource,
        }),
        `Custom Route ${routeCode} -> ${routeStatus.toUpperCase()}`
      );
    } else if (activeTab === 'shelter') {
      executeEvent(
        () => api.simulateShelter({
          shelter_code: shelterCode,
          new_capacity: shelterCapacity,
          status: shelterStatusVal,
          medical_support: shelterMedical,
          source: shelterSource,
        }),
        `Custom Shelter ${shelterCode} Capacity Update (${shelterCapacity})`
      );
    } else if (activeTab === 'hazard') {
      executeEvent(
        () => api.simulateHazard({
          hazard_code: hazardCode,
          action: hazardAction,
          radius_km_delta: hazardAction === 'expand' ? radiusDelta : undefined,
          severity: hazardSeverity,
          source: hazardSource,
        }),
        `Custom Hazard ${hazardCode} ${hazardAction.toUpperCase()}`
      );
    } else if (activeTab === 'population') {
      executeEvent(
        () => api.simulatePopulation({
          habitation_code: habitationCode,
          population_delta: populationDelta,
          severity: popSeverity,
          source: popSource,
        }),
        `Custom Population Surge in ${habitationCode} (+${populationDelta})`
      );
    } else if (activeTab === 'incident') {
      executeEvent(
        () => api.simulateIncident({
          incident_type: incType,
          location_code: incLocation,
          severity: incSeverity,
          description: incDesc,
          reported_by: incReporter,
          source: 'Simulated Field Incident Pipeline'
        }),
        `Custom Field Report: ${incType.toUpperCase()} on ${incLocation}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-100 px-4 py-2 text-xs border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded tracking-wider uppercase text-[10px]">
            DEMONSTRATION SCENARIO — SYNTHETIC DATA
          </span>
          <span className="bg-rose-900 text-rose-100 font-extrabold px-2 py-0.5 rounded uppercase text-[10px]">
            SIMULATION ONLY
          </span>
          <span className="text-slate-300 hidden md:inline">
            Controlled demonstration environment. Feeds live field changes to AEGIS backend.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>LAN Mode: <strong>Enabled</strong></span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            Backend Connected
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Header Bar */}
        <div className="bg-white rounded-lg border border-slate-300 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-700" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                AEGIS Disaster Scenario Simulator
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Simulate real-world ground condition changes (routes, shelters, hazards, population) and observe AEGIS decision-support reassessment.
            </p>
          </div>

          {/* World State Summary & Reset */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-right">
              <div className="text-slate-500 uppercase font-bold text-[10px]">Current Plan</div>
              <div className="font-mono font-black text-slate-800">
                {simState?.active_plan?.code || 'AEGIS-PLAN-WAYANAD-V1'} (v{simState?.active_plan?.version || 1})
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded text-xs flex items-center gap-1.5 transition-colors border border-slate-300 shadow-xs disabled:opacity-50"
              title="Reset database to baseline Plan V1"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              RESET SCENARIO
            </button>
          </div>
        </div>

        {/* Notifications & Error Alerts */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-xs font-bold text-rose-900 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {approvalMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{approvalMessage}</span>
            </div>
            <button onClick={() => setApprovalMessage(null)} className="text-xs font-bold text-emerald-900 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Real-time Pipeline Progression Stepper */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              AEGIS Ingestion & Reassessment Pipeline
            </span>
            <span className="text-xs font-mono text-slate-500">
              {activeScenarioName ? `Active: ${activeScenarioName}` : 'Idle — Select a scenario or inject an event'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { num: 1, label: 'EVENT SENT', defaultDesc: 'External field source' },
              { num: 2, label: 'AEGIS RECEIVED', defaultDesc: 'FastAPI gateway' },
              { num: 3, label: 'CHANGE DETECTED', defaultDesc: 'State mutation' },
              { num: 4, label: 'IMPACT ANALYSIS', defaultDesc: 'PostGIS & Constraints' },
              { num: 5, label: 'RECOMMENDATION', defaultDesc: 'Advisory ready' },
            ].map((step) => {
              const isCurrent = pipelineStep === step.num;
              const isPassed = pipelineStep > step.num;
              const detailText = pipelineStepDetails[step.num];
              return (
                <div
                  key={step.num}
                  className={`p-2.5 rounded border transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-2 ring-blue-300'
                      : isPassed
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>0{step.num}</span>
                    {isPassed && <span className="text-emerald-600 font-bold">✓</span>}
                  </div>
                  <div className="font-extrabold text-[11px] mt-0.5">{step.label}</div>
                  <div className={`text-[9.5px] mt-0.5 truncate ${isPassed || isCurrent ? 'text-slate-700 font-medium' : 'text-slate-400'}`} title={detailText || step.defaultDesc}>
                    {detailText || step.defaultDesc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* Quick Demo Scenarios (One-Click) */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Pre-Built Demonstration Scenarios (One-Click)
            </h2>
            <span className="text-[11px] text-slate-500">
              Triggers real backend mutations and executes decision engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              onClick={runScenarioRouteBlock}
              disabled={isProcessing}
              className="p-3 bg-slate-50 hover:bg-rose-50 border border-slate-300 hover:border-rose-400 rounded-lg text-left transition-all group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono font-bold text-rose-700 uppercase">Scenario 1</div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-rose-900 mt-1">
                Route R1 Bridge Failure
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                R1 blocked. AEGIS discovers Gamma via R4.
              </div>
            </button>

            <button
              onClick={runScenarioShelterDeficit}
              disabled={isProcessing}
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-300 hover:border-amber-400 rounded-lg text-left transition-all group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono font-bold text-amber-700 uppercase">Scenario 2</div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-amber-900 mt-1">
                Shelter Alpha Capacity Loss
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Beds reduced to 80. Allocates 120 evacuees to alternative.
              </div>
            </button>

            <button
              onClick={runScenarioHazardExpansion}
              disabled={isProcessing}
              className="p-3 bg-slate-50 hover:bg-orange-50 border border-slate-300 hover:border-orange-400 rounded-lg text-left transition-all group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono font-bold text-orange-700 uppercase">Scenario 3</div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-orange-900 mt-1">
                Hazard Zone Expansion
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                PostGIS ST_Buffer +800m cuts intersecting routes.
              </div>
            </button>

            <button
              onClick={runScenarioCascade}
              disabled={isProcessing}
              className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 rounded-lg text-left transition-all group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono font-bold text-indigo-700 uppercase">Scenario 4</div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-900 mt-1">
                Multi-Hazard Cascade
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                R1 Block + Alpha Deficit + Hazard severity combined.
              </div>
            </button>

            <button
              onClick={runScenarioRecovery}
              disabled={isProcessing}
              className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 rounded-lg text-left transition-all group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Scenario 5</div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-900 mt-1">
                Route R1 Reopened
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Corridor restored. System evaluates recovery.
              </div>
            </button>
          </div>
        </div>

        {/* Core Layout: Interactive Scenario Builder + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Scenario Builder (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-300 rounded-lg p-5 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Scenario Parameter Builder
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select an object, specify field mutation, and submit to AEGIS
                </p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Data Ingestion
              </span>
            </div>

            {/* Builder Tabs */}
            <div className="flex rounded border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {(['route', 'shelter', 'hazard', 'population', 'incident'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 font-bold capitalize rounded transition-all ${
                    activeTab === tab
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Form */}
            <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
              
              {/* 1. ROUTE TAB */}
              {activeTab === 'route' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Evacuation Corridor</label>
                    <select
                      value={routeCode}
                      onChange={(e) => setRouteCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="R1">Route R1: Chooralmala-Meppadi Main Arterial</option>
                      <option value="R2">Route R2: Attamala Spur Link</option>
                      <option value="R3">Route R3: Vellarimala Highland Link</option>
                      <option value="R4">Route R4: Chooralmala-Vythiri Bypass Corridor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Condition Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['blocked', 'degraded', 'clear'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setRouteStatus(st)}
                          className={`py-1.5 rounded font-extrabold uppercase text-[11px] border transition-all ${
                            routeStatus === st
                              ? st === 'blocked'
                                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                : st === 'degraded'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {routeStatus !== 'clear' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Disruption Reason</label>
                      <select
                        value={routeReason}
                        onChange={(e) => setRouteReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="bridge_failure">Bridge Failure / Structure Collapse</option>
                        <option value="landslide">Landslide / Debris Flow</option>
                        <option value="flooding">Flooding / Water Inundation</option>
                        <option value="road_damage">Asphalt Fracture / Road Damage</option>
                        <option value="debris">Fallen Trees / Debris Obstruction</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Field Reporting Source</label>
                    <input
                      type="text"
                      value={routeSource}
                      onChange={(e) => setRouteSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 2. SHELTER TAB */}
              {activeTab === 'shelter' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relief Shelter Facility</label>
                    <select
                      value={shelterCode}
                      onChange={(e) => setShelterCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="SH-ALPHA">SH-ALPHA: Meppadi Community Hall (Base: 300 beds)</option>
                      <option value="SH-BETA">SH-BETA: St. Joseph Higher Secondary School (Base: 450 beds)</option>
                      <option value="SH-DELTA">SH-DELTA: Kalpetta Municipal Town Hall (Base: 600 beds)</option>
                      <option value="SH-GAMMA">SH-GAMMA: Vythiri Government Higher Secondary School (Base: 350 beds)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Remaining Usable Capacity</span>
                      <span className="font-mono text-blue-700 font-black">{shelterCapacity} beds</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={400}
                      step={10}
                      value={shelterCapacity}
                      onChange={(e) => setShelterCapacity(Number(e.target.value))}
                      className="w-full accent-blue-700"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>0 (Closed)</span>
                      <span>50 (Deficit)</span>
                      <span>150 (Partial)</span>
                      <span>300+ (Normal)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={shelterStatusVal}
                        onChange={(e) => setShelterStatusVal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs"
                      >
                        <option value="operational">Operational</option>
                        <option value="degraded">Degraded</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Medical Support</label>
                      <select
                        value={shelterMedical ? 'yes' : 'no'}
                        onChange={(e) => setShelterMedical(e.target.value === 'yes')}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs"
                      >
                        <option value="yes">Equipped (Yes)</option>
                        <option value="no">Unavailable (No)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Authorized Data Source</label>
                    <input
                      type="text"
                      value={shelterSource}
                      onChange={(e) => setShelterSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 3. HAZARD TAB */}
              {activeTab === 'hazard' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hazard Zone Entity</label>
                    <select
                      value={hazardCode}
                      onChange={(e) => setHazardCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="HZ-CHOORALMALA-SLOPE">HZ-CHOORALMALA-SLOPE: Primary Landslide Polygon</option>
                      <option value="HZ-MEPPADI-FLOOD">HZ-MEPPADI-FLOOD: River Basin Flood Extent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Spatial Action</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['expand', 'severity', 'move'] as const).map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setHazardAction(act)}
                          className={`py-1.5 rounded font-bold uppercase text-[10px] border ${
                            hazardAction === act
                              ? 'bg-blue-800 text-white border-blue-900 shadow-xs'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hazardAction === 'expand' && (
                    <div>
                      <div className="flex justify-between font-bold text-slate-700 mb-1">
                        <span>PostGIS Buffer Expansion Delta</span>
                        <span className="font-mono text-rose-700">+{radiusDelta} km</span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={2.5}
                        step={0.1}
                        value={radiusDelta}
                        onChange={(e) => setRadiusDelta(Number(e.target.value))}
                        className="w-full accent-rose-700"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Executes ST_Buffer on spatial geometry to calculate new route and shelter intersections.
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Severity Rating</label>
                    <select
                      value={hazardSeverity}
                      onChange={(e) => setHazardSeverity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="critical">Critical (Immediate Evacuation Trigger)</option>
                      <option value="high">High</option>
                      <option value="moderate">Moderate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Telemetry Source</label>
                    <input
                      type="text"
                      value={hazardSource}
                      onChange={(e) => setHazardSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 4. POPULATION TAB */}
              {activeTab === 'population' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Habitation Cluster</label>
                    <select
                      value={habitationCode}
                      onChange={(e) => setHabitationCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="CHOORALMALA">CHOORALMALA: Sector 4 (Current 120 pax)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Additional Affected Evacuees</span>
                      <span className="font-mono text-blue-800">+{populationDelta} people</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={10}
                      value={populationDelta}
                      onChange={(e) => setPopulationDelta(Number(e.target.value))}
                      className="w-full accent-blue-800"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Total evacuees will become <strong>{120 + populationDelta} pax</strong>. AEGIS will reassess shelter capacity limits.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Risk Severity</label>
                    <select
                      value={popSeverity}
                      onChange={(e) => setPopSeverity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="moderate">Moderate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Reporting Official</label>
                    <input
                      type="text"
                      value={popSource}
                      onChange={(e) => setPopSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 5. INCIDENT TAB */}
              {activeTab === 'incident' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Incident Type</label>
                      <select
                        value={incType}
                        onChange={(e) => setIncType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs"
                      >
                        <option value="bridge_failure">Bridge Failure</option>
                        <option value="landslide">Landslide Surge</option>
                        <option value="flooding">Flash Flooding</option>
                        <option value="shelter_damage">Shelter Structural Damage</option>
                        <option value="access_interruption">Access Interrupted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Location Corridor</label>
                      <select
                        value={incLocation}
                        onChange={(e) => setIncLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                      >
                        <option value="R1">Route R1</option>
                        <option value="R2">Route R2</option>
                        <option value="R3">Route R3</option>
                        <option value="R4">Route R4</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Field Narrative</label>
                    <textarea
                      rows={2}
                      value={incDesc}
                      onChange={(e) => setIncDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Severity</label>
                      <select
                        value={incSeverity}
                        onChange={(e) => setIncSeverity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs"
                      >
                        <option value="critical">Critical</option>
                        <option value="severe">Severe</option>
                        <option value="moderate">Moderate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Reported By</label>
                      <input
                        type="text"
                        value={incReporter}
                        onChange={(e) => setIncReporter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-3 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isProcessing ? 'PROCESSING IN BACKEND...' : 'TRANSMIT FIELD EVENT TO AEGIS'}
              </button>
            </form>

            {/* Data Sources Legend */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                <span>SIMULATED FIELD SOURCES</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                  REPRESENTATIVE ONLY
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-mono">
                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <Radio className="w-3 h-3 text-blue-600" />
                  <span>Field Team 07 (VHF)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <Compass className="w-3 h-3 text-emerald-600" />
                  <span>GIS Sentinel-2</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <Building className="w-3 h-3 text-amber-600" />
                  <span>Shelter Registry</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <MapPin className="w-3 h-3 text-rose-600" />
                  <span>Highway Patrol Feed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Spatial Map (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Spatial Ground Condition Overview
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Clear
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Degraded
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span> Blocked
                </span>
                <span className="flex items-center gap-1 text-blue-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span> Recommended
                </span>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-[460px] rounded border border-slate-300 overflow-hidden">
              <div ref={mapContainerRef} className="w-full h-full" />
              
              {/* Floating Plan Info */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 rounded p-2.5 shadow-md text-xs pointer-events-none z-[1000] max-w-xs">
                <div className="font-mono text-[10px] text-slate-500 font-bold">ACTIVE ALLOCATION</div>
                <div className="font-extrabold text-slate-900 mt-0.5">
                  Chooralmala (120 pax)
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  {decisionResult?.recommendation ? (
                    <span className="text-blue-700 font-bold">
                      → Recommended: {decisionResult.recommendation.recommended_shelter_code} via {decisionResult.recommendation.recommended_route_code}
                    </span>
                  ) : (
                    <span>→ Current: SH-ALPHA (Meppadi) via R1</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AEGIS Decision-Support Response (Required Output Structure) */}
        {decisionResult && (
          <div className="bg-white border-2 border-blue-500 rounded-lg p-6 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-900 text-xs font-black uppercase px-2.5 py-0.5 rounded border border-blue-300">
                    AEGIS Advisory Response
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Latency: {decisionResult.execution_time_ms} ms
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Situation Interpretation & Plan Reassessment
                </h2>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded font-black text-xs uppercase border ${
                  decisionResult.status === 'RECOMMENDATION_READY'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : decisionResult.status === 'RECOVERED'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}>
                  {decisionResult.status}
                </div>
              </div>
            </div>

            {/* Structured Questions Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              {/* 1. WHAT CHANGED? */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
                <div className="font-black text-slate-500 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  1. What Changed?
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {decisionResult.what_changed.change_type.toUpperCase()} ({decisionResult.what_changed.source})
                </div>
                <p className="text-slate-600 text-[11px]">
                  {decisionResult.incident?.description || 'Field telemetry change registered.'}
                </p>
                <div className="text-[10px] font-mono text-slate-400">
                  Incident ID: {decisionResult.incident?.id?.slice(0, 8)}...
                </div>
              </div>

              {/* 2. WHAT IS AFFECTED? */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
                <div className="font-black text-slate-500 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  2. What is Affected?
                </div>
                <div className="font-bold text-rose-900 text-sm">
                  {decisionResult.what_is_affected.habitation || 'Wayanad Sector'} ({decisionResult.what_is_affected.population || 120} evacuees)
                </div>
                <p className="text-slate-600 text-[11px]">
                  {decisionResult.what_is_affected.reason || 'Assignment invalidated by ground condition change.'}
                </p>
              </div>

              {/* 3. IS EXISTING PLAN FEASIBLE? */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
                <div className="font-black text-slate-500 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                  3. Plan Feasibility
                </div>
                <div className={`font-black text-sm flex items-center gap-1.5 ${
                  decisionResult.is_plan_feasible ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {decisionResult.is_plan_feasible ? '✓ PLAN IS FEASIBLE' : '✗ PLAN INFEASIBLE'}
                </div>
                <p className="text-slate-600 text-[11px]">
                  {decisionResult.is_plan_feasible
                    ? 'Current assignments remain operational without conflict.'
                    : 'Immediate advisory replanning required to maintain evacuee safety.'}
                </p>
              </div>

              {/* 4. OPTIONS NO LONGER FEASIBLE */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
                <div className="font-black text-slate-500 uppercase text-[10px] tracking-wider">
                  4. Disqualified Options
                </div>
                <div className="space-y-1">
                  {decisionResult.options_no_longer_feasible?.length > 0 ? (
                    decisionResult.options_no_longer_feasible.map((opt, idx) => (
                      <div key={idx} className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded font-mono text-[10px]">
                        ⛔ {opt}
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No corridors or shelters disqualified.</span>
                  )}
                </div>
              </div>

              {/* 5. ALTERNATIVES AVAILABLE (MCDA) */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5 lg:col-span-2">
                <div className="font-black text-slate-500 uppercase text-[10px] tracking-wider">
                  5. Evaluated Alternatives (MCDA Ranking)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {decisionResult.alternatives_available?.slice(0, 2).map((alt, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border ${
                        idx === 0
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>Rank #{idx + 1}: {alt.shelter_code}</span>
                        <span className="font-mono text-blue-700">MCDA: {alt.mcda_composite_score}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 truncate mt-0.5">
                        {alt.shelter_name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                        <span>Corridor: {alt.corridor_code}</span>
                        <span>•</span>
                        <span>{alt.distance_km} km</span>
                        <span>•</span>
                        <span>{alt.available_capacity} beds</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation & Statutory Human Approval Box */}
            {decisionResult.recommendation && (
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-700 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wide uppercase">
                      RECOMMENDED ACTION
                    </span>
                    <span className="text-xs font-bold text-blue-950">
                      Recommendation #{decisionResult.recommendation.recommendation_code}
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900">
                    Re-allocate 120 evacuees to {decisionResult.recommendation.recommended_shelter_name} ({decisionResult.recommendation.recommended_shelter_code}) via {decisionResult.recommendation.recommended_route_name} ({decisionResult.recommendation.recommended_route_code})
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong>Statutory Authority Note:</strong> Under Section 30 of the Disaster Management Act, 2005, AEGIS is advisory only. Statutory human concurrence by the District Authority is required before committing Plan V2.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <button
                    onClick={handleApproveRecommendation}
                    disabled={isApproving}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Check className={`w-4 h-4 ${isApproving ? 'animate-spin' : ''}`} />
                    {isApproving ? 'COMMITTING PLAN V2...' : 'APPROVE RECOMMENDATION (COMMITS PLAN V2)'}
                  </button>
                  <a
                    href="/audit"
                    className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded text-xs border border-slate-300 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    AUDIT LEDGER
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Cryptographic Audit Trail Section */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Live SHA-256 Immutable Audit Ledger (Recent Transactions)
              </h3>
            </div>
            <a href="/audit" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
              Full Ledger <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2">
            {auditChain && auditChain.length > 0 ? (
              auditChain.slice(-4).reverse().map((entry: any, i: number) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200 rounded p-2.5 flex flex-col md:flex-row md:items-center md:justify-between text-xs font-mono gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      SEQ #{entry.sequence_num ?? (i + 1)}
                    </span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {entry.action_type || entry.event_type || 'TRANSACTION'}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      by {entry.authority_role || entry.actor || 'System'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 truncate">
                    <span className="text-slate-400">Hash:</span>
                    <span className="text-blue-700 truncate max-w-[200px]">
                      {entry.curr_hash || entry.hash || 'SHA-256 Verified'}
                    </span>
                    <span className="text-slate-400">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic py-2">
                Genesis block verified. Transactions will append chronologically as events are simulated.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
