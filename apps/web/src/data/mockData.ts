// ============================================================
// AEGIS — Mock Data
// Wayanad Scenario (DEMO / SIMULATION DATA)
// ============================================================

import type {
  KPIData,
  DataSource,
  HazardZone,
  Shelter,
  Route,
  RelocationPlan,
  ActionableInsight,
  DecisionContextData,
} from '../types';

// --- KPIs ---
export const mockKPIs: KPIData[] = [
  { id: 'high-risk', label: 'Active High-Risk Areas', value: 12, status: 'critical', trend: 'up', classification: 'DERIVED_DATA', isSimulated: true },
  { id: 'vulnerable', label: 'Vulnerable Households', value: 4827, status: 'warning', trend: 'stable', classification: 'SOURCE_DATA', isSimulated: true },
  { id: 'shelter-cap', label: 'Available Shelter Capacity', value: 18420, status: 'safe', trend: 'stable', classification: 'SOURCE_DATA', isSimulated: true },
  { id: 'gap', label: 'Capacity Gap', value: 1240, status: 'warning', trend: 'up', classification: 'DERIVED_DATA', isSimulated: true },
  { id: 'pending', label: 'Pending Approvals', value: 1, status: 'info', trend: 'stable', classification: 'AEGIS_RECOMMENDATION', isSimulated: true },
];

// --- Data Sources ---
export const mockDataSources: DataSource[] = [
  { id: 'imd', name: 'India Meteorological Department', abbreviation: 'IMD', status: 'verified', lastUpdated: new Date(Date.now() - 8 * 60000), confidence: 'high', sourceAgency: 'IMD Thiruvananthapuram' },
  { id: 'cwc', name: 'Central Water Commission', abbreviation: 'CWC', status: 'verified', lastUpdated: new Date(Date.now() - 12 * 60000), confidence: 'high', sourceAgency: 'CWC Southern Region' },
  { id: 'field', name: 'Field Observation Report', abbreviation: 'Field Report', status: 'verified', lastUpdated: new Date(Date.now() - 2 * 60000), confidence: 'high', sourceAgency: 'Taluk Revenue Field Squad' },
  { id: 'road', name: 'Road Infrastructure Status', abbreviation: 'Road Status', status: 'stale', lastUpdated: new Date(Date.now() - 222 * 60000), confidence: 'low', sourceAgency: 'PWD Roads Division' },
  { id: 'kseb', name: 'Kerala State Electricity Board', abbreviation: 'KSEB', status: 'verified', lastUpdated: new Date(Date.now() - 15 * 60000), confidence: 'high', sourceAgency: 'KSEB Section Office' },
  { id: 'kwa', name: 'Kerala Water Authority', abbreviation: 'KWA', status: 'verified', lastUpdated: new Date(Date.now() - 30 * 60000), confidence: 'medium', sourceAgency: 'KWA District Wing' },
];

// --- Hazard Zones ---
export const mockHazards: HazardZone[] = [
  {
    id: 'hz-mundakkai',
    name: 'Mundakkai',
    type: 'landslide',
    severity: 'critical',
    affectedHouseholds: 427,
    affectedPopulation: 1495,
    drivers: ['High landslide susceptibility', 'Rainfall escalation (>204mm/24h)', 'Steep slope saturation (94%)'],
    classification: 'DERIVED_DATA',
  },
  {
    id: 'hz-chooralmala',
    name: 'Chooralmala',
    type: 'landslide',
    severity: 'high',
    affectedHouseholds: 312,
    affectedPopulation: 1090,
    drivers: ['Steep terrain', 'Soil moisture threshold breach', 'Proximity to river channel'],
    classification: 'DERIVED_DATA',
  },
  {
    id: 'hz-meppadi',
    name: 'Meppadi Lowlands',
    type: 'flood',
    severity: 'high',
    affectedHouseholds: 189,
    affectedPopulation: 661,
    drivers: ['River level at warning stage', 'Upstream catchment deluge', 'Low-lying habitation basin'],
    classification: 'DERIVED_DATA',
  },
];

export interface HabitationExposure {
  id: string;
  name: string;
  households: number;
  population: number;
  riskLevel: 'critical' | 'high' | 'warning' | 'safe';
  priority: string;
  transitCorridor: string;
}

export const mockHabitations: HabitationExposure[] = [
  { id: 'hab-mundakkai', name: 'Mundakkai', households: 427, population: 1495, riskLevel: 'critical', priority: 'Priority 1 (Proactive)', transitCorridor: 'Route R104 (Severed) → R212/R318' },
  { id: 'hab-chooralmala', name: 'Chooralmala', households: 210, population: 735, riskLevel: 'high', priority: 'Priority 2 (Standby)', transitCorridor: 'Route R318 (Bypass)' },
  { id: 'hab-attamala', name: 'Attamala', households: 145, population: 490, riskLevel: 'warning', priority: 'Priority 3 (Monitoring)', transitCorridor: 'Route R104 / Local Track' },
  { id: 'hab-meppadi', name: 'Meppadi Valley Basin', households: 580, population: 1980, riskLevel: 'warning', priority: 'Priority 4 (Standby)', transitCorridor: 'Route R212 (Arterial)' },
];

// --- Shelters ---
export const mockShelters: Shelter[] = [
  {
    id: 'sh-a',
    name: 'Meppadi Govt. Higher Secondary School',
    type: 'Government School',
    capacity: 800,
    currentOccupancy: 45,
    latitude: 11.5550,
    longitude: 76.1320,
    distanceKm: 4.1,
    capacityStatus: 'available',
    routeStatus: 'clear',
    hasMedicalDesk: true,
    amenities: { potableWater: true, backupPower: true, sanitationBlocks: 12 },
  },
  {
    id: 'sh-b',
    name: 'Kalpetta Community Hall',
    type: 'Community Hall',
    capacity: 650,
    currentOccupancy: 22,
    latitude: 11.6090,
    longitude: 76.0820,
    distanceKm: 5.7,
    capacityStatus: 'available',
    routeStatus: 'clear',
    hasMedicalDesk: false,
    amenities: { potableWater: true, backupPower: true, sanitationBlocks: 8 },
  },
  {
    id: 'sh-c',
    name: 'St. Mary\'s School Vythiri',
    type: 'Aided School',
    capacity: 500,
    currentOccupancy: 0,
    latitude: 11.5340,
    longitude: 76.0440,
    distanceKm: 6.2,
    capacityStatus: 'available',
    routeStatus: 'clear',
    hasMedicalDesk: false,
    amenities: { potableWater: true, backupPower: false, sanitationBlocks: 6 },
  },
  {
    id: 'sh-d',
    name: 'Sulthan Bathery Town Hall',
    type: 'Town Hall',
    capacity: 400,
    currentOccupancy: 150,
    latitude: 11.6640,
    longitude: 76.2560,
    distanceKm: 12.4,
    capacityStatus: 'near-full',
    routeStatus: 'at-risk',
    hasMedicalDesk: true,
    amenities: { potableWater: true, backupPower: true, sanitationBlocks: 10 },
  },
];

// --- Routes ---
export const mockRoutes: Route[] = [
  {
    id: 'r-104',
    name: 'Route R104 (Mundakkai-Meppadi)',
    status: 'at-risk',
    lastVerified: new Date(Date.now() - 137 * 60000),
    sourceOfficer: 'Village Officer (Vythiri)',
    confidence: 'low',
    affectedHouseholds: 150,
  },
  {
    id: 'r-212',
    name: 'Route R212 (Meppadi-Kalpetta)',
    status: 'clear',
    lastVerified: new Date(Date.now() - 25 * 60000),
    sourceOfficer: 'PWD Assistant Engineer',
    confidence: 'high',
    affectedHouseholds: 0,
  },
  {
    id: 'r-318',
    name: 'Route R318 (Mundakkai-Vythiri)',
    status: 'clear',
    lastVerified: new Date(Date.now() - 40 * 60000),
    sourceOfficer: 'Village Officer (Vythiri)',
    confidence: 'medium',
    affectedHouseholds: 0,
  },
];

// --- Relocation Plans ---
export const mockPlanV1: RelocationPlan = {
  id: 'plan-v1',
  version: 1,
  timestamp: new Date(Date.now() - 120 * 60000),
  status: 'pending_approval',
  triggerReason: 'Initial multi-criteria risk assessment — Mundakkai slope saturation exceeds 94%',
  affectedHabitation: 'Mundakkai',
  totalHouseholds: 427,
  totalPopulation: 1495,
  reviewingAuthority: 'DISTRICT_COLLECTOR',
  allocations: [
    { shelterId: 'sh-a', shelterName: 'Meppadi Govt. HSS', persons: 612, distanceKm: 4.1, capacityOk: true, routeOk: true },
    { shelterId: 'sh-b', shelterName: 'Kalpetta Community Hall', persons: 503, distanceKm: 5.7, capacityOk: true, routeOk: true },
    { shelterId: 'sh-c', shelterName: "St. Mary's School Vythiri", persons: 380, distanceKm: 6.2, capacityOk: true, routeOk: true },
  ],
  rationale: [
    'Hazard exposure minimized (0 evacuees routed through red zones)',
    'Shelter carrying-capacity constraints strictly satisfied',
    'Route feasibility verified under current conditions',
    'Average transit distance minimized to 5.1 km',
    'Medical triage coverage ensured via Meppadi Govt HSS',
  ],
};

export const mockPlanV2: RelocationPlan = {
  id: 'plan-v2',
  version: 2,
  timestamp: new Date(Date.now() - 60 * 60000),
  status: 'pending_approval',
  triggerReason: 'Route R104 blocked — Bridge structural failure at KM 4.2 reported by Field Officer',
  affectedHabitation: 'Mundakkai',
  totalHouseholds: 427,
  totalPopulation: 1495,
  reviewingAuthority: 'DISTRICT_COLLECTOR',
  allocations: [
    { shelterId: 'sh-b', shelterName: 'Kalpetta Community Hall', persons: 612, distanceKm: 5.7, capacityOk: true, routeOk: true },
    { shelterId: 'sh-c', shelterName: "St. Mary's School Vythiri", persons: 503, distanceKm: 6.2, capacityOk: true, routeOk: true },
    { shelterId: 'sh-a', shelterName: 'Meppadi Govt. HSS', persons: 380, distanceKm: 4.1, capacityOk: true, routeOk: false },
  ],
  rationale: [
    'Previous route R104 became infeasible after verified ground failure',
    'Kalpetta Community Hall reassigned as Primary via Route R212',
    'St. Mary\'s Vythiri absorbs secondary balance via Route R318',
    'Meppadi Govt HSS allocation reduced; vehicular access severed',
    'Medical accessibility maintained via Kalpetta transit link',
  ],
};

export const mockPlanV3: RelocationPlan = {
  id: 'plan-v3',
  version: 3,
  timestamp: new Date(Date.now() - 30 * 60000),
  status: 'draft',
  triggerReason: 'Shelter capacity rebalance — Sulthan Bathery sector near full',
  affectedHabitation: 'Mundakkai',
  totalHouseholds: 427,
  totalPopulation: 1495,
  reviewingAuthority: 'DISTRICT_COLLECTOR',
  allocations: [
    { shelterId: 'sh-b', shelterName: 'Kalpetta Community Hall', persons: 628, distanceKm: 5.7, capacityOk: true, routeOk: true },
    { shelterId: 'sh-c', shelterName: "St. Mary's School Vythiri", persons: 500, distanceKm: 6.2, capacityOk: true, routeOk: true },
    { shelterId: 'sh-a', shelterName: 'Meppadi Govt. HSS', persons: 367, distanceKm: 4.1, capacityOk: true, routeOk: false },
  ],
  rationale: [
    'Capacity rebalanced across northern corridors',
    'Meppadi vehicular bypass remains closed',
  ],
};

// --- Structured Decision Context (Reusable Data-Driven Model) ---
export const mockDecisionContextV1: DecisionContextData = {
  decisionId: 'dec-wyd-mnd-01',
  planVersion: 1,
  status: 'pending_approval',
  problem: {
    targetHabitation: 'Mundakkai (Vythiri Taluk, Wayanad)',
    exposedHouseholds: 427,
    exposedPopulation: 1495,
    riskSeverity: 'CRITICAL',
    riskIndex: 94.2,
    narrative: 'Assess proactive relocation feasibility for 1,495 residents in Mundakkai under critical slope saturation and 24h precipitation threshold breach.',
  },
  evidence: [
    {
      id: 'ev-1',
      sourceAgency: 'India Meteorological Department (IMD)',
      sourceType: 'Doppler Radar Telemetry',
      observation: 'Rainfall accumulation exceeded 204 mm in 24h (Threshold: 180 mm)',
      timestamp: 'Updated 8 min ago',
      confidence: 'high',
      status: 'verified',
      classification: 'SOURCE_DATA',
    },
    {
      id: 'ev-2',
      sourceAgency: 'Field Revenue Squad (Vythiri)',
      sourceType: 'Ground Inspection Report',
      observation: 'Route R104 bridge culvert distress at KM 4.2; vehicle weight restriction advised',
      timestamp: 'Verified 2h 17m ago',
      confidence: 'low',
      status: 'stale',
      classification: 'SOURCE_DATA',
    },
    {
      id: 'ev-3',
      sourceAgency: 'Central Water Commission (CWC)',
      sourceType: 'Hydrological Telemetry',
      observation: 'Iruvanjippuzha basin discharge rising toward warning level (3.8m)',
      timestamp: 'Updated 12 min ago',
      confidence: 'high',
      status: 'verified',
      classification: 'SOURCE_DATA',
    },
    {
      id: 'ev-4',
      sourceAgency: 'Panchayat Registry & Census',
      sourceType: 'Official Demographic Baseline',
      observation: '427 households (1,495 persons) documented in designated slope hazard envelope',
      timestamp: 'Verified 24h ago',
      confidence: 'high',
      status: 'verified',
      classification: 'SOURCE_DATA',
    },
  ],
  derivedFindings: [
    {
      id: 'df-1',
      label: 'Mundakkai Slope Saturation',
      value: '94.2%',
      finding: 'Critical slope instability threshold exceeded under sustained saturation and runoff accumulation.',
      classification: 'DERIVED_DATA',
    },
    {
      id: 'df-2',
      label: 'Exposed Habitation Footprint',
      value: '427 HH / 1,495 Persons',
      finding: 'Direct exposure footprint within GSI critical susceptibility corridor requiring proactive relocation.',
      classification: 'DERIVED_DATA',
    },
    {
      id: 'df-3',
      label: 'Meppadi Sector Capacity Deficit',
      value: '340 Persons Deficit',
      finding: 'Projected local displacement (2,100) exceeds immediate in-taluk suitable capacity (1,760).',
      classification: 'DERIVED_DATA',
    },
    {
      id: 'df-4',
      label: 'Route R104 Vulnerability',
      value: 'At Risk (Low Confidence)',
      finding: 'Primary link R104 is constrained; secondary corridors (R212, R318) required to avert transit failure.',
      classification: 'DERIVED_DATA',
    },
  ],
  constraints: [
    {
      id: 'con-1',
      name: 'Shelter Carrying-Capacity Bounds',
      description: 'No designated relief camp may exceed verified structural bed carrying-capacity.',
      status: 'SATISFIED',
      impact: 'Allocations (612, 503, 380) strictly satisfy individual capacity limits with +265 buffer.',
    },
    {
      id: 'con-2',
      name: 'Evacuation Route Feasibility',
      description: 'Transit route must be verified passable for vehicular evacuation convoys.',
      status: 'SATISFIED',
      impact: 'Primary transit routed via verified open arterial links (R212, R318).',
    },
    {
      id: 'con-3',
      name: '100% Population Allocation',
      description: 'Total assigned evacuees must equal 1,495 exposed residents.',
      status: 'SATISFIED',
      impact: '1,495 / 1,495 persons assigned across 3 designated shelters (100% complete).',
    },
    {
      id: 'con-4',
      name: 'Critical Hazard Perimeter Avoidance',
      description: 'Zero evacuees routed through active red hazard zones.',
      status: 'SATISFIED',
      impact: 'All evacuation corridors bypass the primary red slope hazard zone.',
    },
    {
      id: 'con-5',
      name: 'Transit Distance Envelope',
      description: 'Average transit distance must remain under 7.0 km.',
      status: 'SATISFIED',
      impact: 'Average transit distance optimized to 5.3 km across 3 facilities.',
    },
    {
      id: 'con-6',
      name: 'Medical Triage Readiness',
      description: 'Primary shelter must possess on-site medical health desk linkage.',
      status: 'SATISFIED',
      impact: 'Meppadi Govt. HSS connected to Meppadi PHC medical squad on-site.',
    },
    {
      id: 'con-7',
      name: 'Route R104 Telemetry Freshness',
      description: 'R104 telemetry is stale (>2h) and requires on-scene field re-verification.',
      status: 'REQUIRES_VERIFICATION',
      impact: 'Primary convoy traffic routed via R212/R318 to prevent unexpected stranding.',
    },
  ],
  criteria: [
    {
      id: 'crit-1',
      name: 'Carrying-Capacity Feasibility',
      weightDescription: 'Highest weight — hard constraint against dangerous camp overcrowding',
      status: 'satisfied',
    },
    {
      id: 'crit-2',
      name: 'Route Viability & Safety',
      weightDescription: 'High weight — avoids compromised infrastructure and flood corridors',
      status: 'satisfied',
    },
    {
      id: 'crit-3',
      name: 'Transit Distance Minimization',
      weightDescription: 'Medium weight — prioritizes closest viable facilities',
      status: 'satisfied',
    },
    {
      id: 'crit-4',
      name: 'Medical & Triage Availability',
      weightDescription: 'Medium weight — ensures emergency medical desk connectivity',
      status: 'satisfied',
    },
  ],
  alternatives: [
    {
      id: 'alt-1',
      name: 'Plan V1: Distributed Multi-Shelter Allocation (Meppadi + Kalpetta + Vythiri)',
      status: 'SELECTED',
      summary: 'Distributes 1,495 evacuees across 3 viable shelters with verified routes.',
      reason: 'Optimal multi-criteria satisfaction; zero capacity breaches; uses confirmed passable routes.',
    },
    {
      id: 'alt-2',
      name: 'Alternative A: Single-Camp Consolidation at Meppadi Govt. HSS',
      status: 'REJECTED',
      summary: 'Attempts to house all 1,495 evacuees at the nearest school in Meppadi.',
      reason: 'Rejected due to 340-person carrying-capacity breach and excessive reliance on Route R104.',
      constraintViolations: ['Shelter Capacity Exceeded by 340 Persons', 'Single-Point Route Failure Risk'],
    },
    {
      id: 'alt-3',
      name: 'Alternative B: Long-Distance Transit to Sulthan Bathery Town Hall',
      status: 'INFEASIBLE',
      summary: 'Re-routes evacuees 12.4 km east to Sulthan Bathery municipal sector.',
      reason: 'Excessive transit distance and Sulthan Bathery sector is near full capacity.',
      constraintViolations: ['Transit Distance > 10 km', 'Target Camp Near-Full (150/400 occupied)'],
    },
  ],
  recommendation: {
    summary: 'AEGIS advises distributing the 1,495 residents of Mundakkai across 3 designated shelters (Meppadi Govt. HSS: 612, Kalpetta Community Hall: 503, St. Mary\'s School Vythiri: 380).',
    totalAllocated: 1495,
    totalRequired: 1495,
    percentAllocated: 100,
    allocations: mockPlanV1.allocations,
    classification: 'AEGIS_RECOMMENDATION',
  },
  impacts: [
    '1,495 exposed residents have a feasible preliminary shelter allocation.',
    'Distributed shelter usage avoids dangerous overcrowding in the Meppadi valley basin.',
    'Evacuation corridors R212 and R318 are prioritized; R104 transit load is minimized.',
    'Approved allocation remains subject to continuous on-scene ground verification.',
  ],
  assumptions: [
    'Designated shelter structures remain structurally sound and free from localized water ingress.',
    'Secondary routes R212 and R318 remain clear during the active transit window.',
    'KSRTC transport fleet and local revenue convoys are available for deployment.',
  ],
  uncertainties: [
    'Route R104 status has low telemetry confidence due to stale verification (2h 17m ago).',
    'IMD radar predicts continuing high-intensity precipitation over the next 6 hours.',
    'Secondary slope failures may occur on unpaved village access lanes.',
  ],
  humanDecision: {
    reviewingAuthority: 'DISTRICT_COLLECTOR',
    designation: 'District Collector & District Magistrate (Wayanad DDMA)',
    statutoryBasis: 'Sections 30 and 34 of the Disaster Management Act, 2005',
    allowedActions: ['APPROVE', 'MODIFY', 'REJECT'],
  },
};

// --- Actionable Insights ---
export const mockInsights: ActionableInsight[] = [
  {
    id: 'ins-1',
    priority: 'critical',
    type: 'hazard',
    title: 'Mundakkai — Slope Saturation Warning',
    location: 'Mundakkai (Vythiri Taluk, Wayanad)',
    whatHappened: 'Rainfall accumulation exceeded 204mm in 24 hours, pushing slope saturation index to 94.2%.',
    whyItMatters: '427 households (1,495 persons) located directly in high landslide susceptibility corridor.',
    affectedHouseholds: 427,
    affectedPopulation: 1495,
    source: 'IMD Doppler Radar + InSAR Slope Model',
    freshness: 'Updated 8 min ago',
    actionLabel: 'VIEW HAZARD ANALYSIS',
    actionRoute: '/planning/hazards',
  },
  {
    id: 'ins-2',
    priority: 'high',
    type: 'capacity',
    title: 'Shelter Capacity Gap — Meppadi Sector',
    location: 'Meppadi Sector, Wayanad',
    whatHappened: 'Projected displacement of 2,100 persons exceeds immediate suitable shelter capacity (1,760).',
    whyItMatters: 'Deficit of 340 shelter beds requires inter-sector rebalancing toward Kalpetta.',
    affectedHouseholds: 98,
    affectedPopulation: 340,
    source: 'DDMA Shelter Carrying-Capacity Registry',
    freshness: 'Updated 15 min ago',
    actionLabel: 'FIND ADDITIONAL CAPACITY',
    actionRoute: '/planning/shelters',
  },
  {
    id: 'ins-3',
    priority: 'high',
    type: 'route',
    title: 'Route Constraint — Route R104',
    location: 'Mundakkai-Meppadi Road (KM 4.2 Bridge)',
    whatHappened: 'Culvert structural distress reported; road marked AT RISK with LOW telemetry confidence.',
    whyItMatters: '150 households dependent on R104 for primary vehicular evacuation to Meppadi HSS.',
    affectedHouseholds: 150,
    affectedPopulation: 525,
    source: 'Field Officer (Vythiri)',
    freshness: 'Verified 2h 17m ago (Stale)',
    actionLabel: 'ANALYSE ALTERNATIVES',
    actionRoute: '/planning/routes',
  },
];
