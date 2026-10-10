// ============================================================
// AEGIS — Simulation Data & 10-State Deterministic Storyline
// Wayanad Scenario: Dynamic Reassignment & Resilient Decision Support
// Single Source of Truth for Step 4 & Step 5
// ============================================================

import type {
  SimulationStepId,
  SimulationStateMetadata,
  AuditEvent,
  RelocationPlan,
  DecisionContextData,
} from '../types';
import { mockDecisionContextV1 } from './mockData';
import { computeEventHash, GENESIS_HASH } from '../utils/cryptoAudit';

export { mockDecisionContextV1 };

// Stable Entity IDs
export const ENTITY_IDS = {
  ROUTES: {
    R104: 'route-r104',
    R212: 'route-r212',
    R318: 'route-r318',
  },
  SHELTERS: {
    MEPPADI_HSS: 'shelter-meppadi-hss',
    KALPETTA_HALL: 'shelter-kalpetta-hall',
    ST_MARYS: 'shelter-st-marys-vythiri',
    SULTHAN_BATHERY: 'shelter-sulthan-bathery-town-hall',
  },
  HABITATIONS: {
    MUNDAKKAI: 'habitation-mundakkai',
    CHOORALMALA: 'habitation-chooralmala',
    ATTAMALA: 'habitation-attamala',
    MEPPADI: 'habitation-meppadi',
  },
  PLANS: {
    V1: 'plan-v1',
    V2: 'plan-v2',
  },
  INCIDENTS: {
    R104_FAILURE: 'incident-r104-bridge-failure',
  },
} as const;

// 10-State Deterministic Metadata Registry
export const SIMULATION_STATES: Record<SimulationStepId, SimulationStateMetadata> = {
  1: {
    stepNumber: 1,
    code: 'BASELINE',
    title: 'Baseline Corridor Monitoring',
    phaseCategory: 'BASELINE',
    simulatedTime: '11:30 IST',
    shortDescription: 'Mundakkai corridor under continuous telemetry observation. All arterial routes open.',
    operationalDetail: '427 households (1,495 residents) in Mundakkai. Route R104, R212, and R318 are verified clear. No relocation plan is currently required.',
    activePlanId: 'none',
    routeR104Status: 'clear',
    r104AffectedPopulation: 0,
    invalidatedAssignmentPersons: 0,
    movementVectorsActive: false,
    activeVectorType: 'none',
  },
  2: {
    stepNumber: 2,
    code: 'HAZARD_ESCALATION',
    title: 'Precipitation Surge & Hazard Escalation',
    phaseCategory: 'ASSESSMENT',
    simulatedTime: '12:45 IST',
    shortDescription: 'Rainfall exceeds 204mm in 24h. Slope saturation reaches 94.2% critical threshold.',
    operationalDetail: 'Doppler radar telemetry flags rapid soil moisture accumulation. AEGIS issues high-priority hazard alert for Mundakkai corridor.',
    activePlanId: 'none',
    routeR104Status: 'at-risk',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 0,
    movementVectorsActive: false,
    activeVectorType: 'none',
  },
  3: {
    stepNumber: 3,
    code: 'CAPACITY_AUDIT',
    title: 'Carrying-Capacity & Route Feasibility Audit',
    phaseCategory: 'ASSESSMENT',
    simulatedTime: '13:15 IST',
    shortDescription: '1,760 usable shelter capacity identified against 1,495 required. Meppadi local deficit: 340.',
    operationalDetail: 'AEGIS calculates that single-camp concentration at Meppadi HSS would cause a 340-person overflow. Multi-facility inter-sector distribution required.',
    activePlanId: 'none',
    routeR104Status: 'at-risk',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 0,
    movementVectorsActive: false,
    activeVectorType: 'none',
  },
  4: {
    stepNumber: 4,
    code: 'PLAN_V1_GENERATED',
    title: 'Plan V1 Formulated (AEGIS Advisory)',
    phaseCategory: 'INITIAL_PLAN',
    simulatedTime: '13:30 IST',
    shortDescription: 'Plan V1 formulated: Meppadi HSS (612), Kalpetta Hall (503), St. Mary\'s Vythiri (380).',
    operationalDetail: 'AEGIS recommends a 3-way distributed allocation satisfying 100% capacity and route constraints. Awaiting District Collector statutory review.',
    activePlanId: 'plan-v1',
    routeR104Status: 'at-risk',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 0,
    movementVectorsActive: false,
    activeVectorType: 'none',
  },
  5: {
    stepNumber: 5,
    code: 'PLAN_V1_APPROVED',
    title: 'Statutory Approval of Plan V1',
    phaseCategory: 'INITIAL_PLAN',
    simulatedTime: '13:45 IST',
    shortDescription: 'District Collector & Magistrate approves Plan V1. Operational movement corridors activated.',
    operationalDetail: 'Plan V1 approved under Disaster Management Act 2005. Evacuation convoy allocations to Meppadi HSS, Kalpetta Hall, and St. Mary\'s Vythiri are mobilized.',
    activePlanId: 'plan-v1',
    routeR104Status: 'at-risk',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 0,
    movementVectorsActive: true,
    activeVectorType: 'plan-v1-vectors',
  },
  6: {
    stepNumber: 6,
    code: 'FIELD_INCIDENT',
    title: 'Field Event: Route R104 Structural Breach',
    phaseCategory: 'FIELD_EVENT',
    simulatedTime: '14:20 IST',
    shortDescription: 'Field Officer reports bridge culvert structural failure at Route R104 KM 4.2.',
    operationalDetail: 'Debris surge compromises culvert abutment. Route R104 marked BLOCKED by Vythiri field squad. Primary vehicular movement to Meppadi severed.',
    activePlanId: 'plan-v1',
    routeR104Status: 'blocked',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 150,
    movementVectorsActive: true,
    activeVectorType: 'plan-v1-invalidated-vector',
  },
  7: {
    stepNumber: 7,
    code: 'PLAN_INVALIDATED',
    title: 'Causal Invalidation: Constraint Breach',
    phaseCategory: 'REPLANNING',
    simulatedTime: '14:21 IST',
    shortDescription: 'AEGIS detects dependency failure on R104. 150 persons affected. Plan V1 INVALIDATED.',
    operationalDetail: 'Causal Chain: Field Report → R104 Blocked → Route Constraint FAILED → 150-Person Assignment Infeasible → Plan V1 Invalidated → Dynamic Reassessment Required.',
    activePlanId: 'plan-v1',
    routeR104Status: 'blocked',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 150,
    movementVectorsActive: true,
    activeVectorType: 'plan-v1-invalidated-vector',
  },
  8: {
    stepNumber: 8,
    code: 'ALTERNATIVE_SEARCH',
    title: 'Dynamic Alternative & Shelter Evaluation',
    phaseCategory: 'REPLANNING',
    simulatedTime: '14:22 IST',
    shortDescription: 'AEGIS evaluates candidate shelters and open bypasses (R212 via Kalpetta, R318 via Vythiri).',
    operationalDetail: 'Constraint filtering eliminates Meppadi vehicular route. Reassigns displaced evacuees to Kalpetta Community Hall (via R212) and St. Mary\'s Vythiri (via R318).',
    activePlanId: 'plan-v1',
    routeR104Status: 'blocked',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 150,
    movementVectorsActive: false,
    activeVectorType: 'none',
  },
  9: {
    stepNumber: 9,
    code: 'PLAN_V2_PROPOSED',
    title: 'Plan V2 Formulated (AEGIS Advisory)',
    phaseCategory: 'REPLANNING',
    simulatedTime: '14:23 IST',
    shortDescription: 'Plan V2 proposed: Kalpetta Hall (612), St. Mary\'s Vythiri (503), Meppadi HSS (380 local).',
    operationalDetail: 'Kalpetta Hall becomes Primary facility via verified arterial Route R212. St. Mary\'s Vythiri absorbs secondary balance via Route R318. 100% (1,495) allocated safely.',
    activePlanId: 'plan-v2',
    routeR104Status: 'blocked',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 0,
    movementVectorsActive: false,
    activeVectorType: 'plan-v2-vectors',
  },
  10: {
    stepNumber: 10,
    code: 'PLAN_V2_APPROVED',
    title: 'Statutory Re-Approval (Plan V2 Promulgated)',
    phaseCategory: 'STATUTORY_SIGN_OFF',
    simulatedTime: '14:24 IST',
    shortDescription: 'District Collector approves Plan V2. Resilient movement vectors activated across Wayanad.',
    operationalDetail: 'Executive sign-off by District Collector & DDMA Chairperson. Rerouted convoy vectors to Kalpetta Community Hall and Vythiri active. Immutable audit event logged.',
    activePlanId: 'plan-v2',
    routeR104Status: 'blocked',
    r104AffectedPopulation: 525,
    invalidatedAssignmentPersons: 0,
    movementVectorsActive: true,
    activeVectorType: 'plan-v2-vectors',
  },
};

// Plan V1 Model
export const planV1SimulationData: RelocationPlan = {
  id: ENTITY_IDS.PLANS.V1,
  version: 1,
  timestamp: new Date(Date.now() - 120 * 60000),
  status: 'pending_approval',
  triggerReason: 'Initial multi-criteria risk assessment — Mundakkai slope saturation exceeds 94.2%',
  affectedHabitation: 'Mundakkai',
  totalHouseholds: 427,
  totalPopulation: 1495,
  reviewingAuthority: 'DISTRICT_COLLECTOR',
  allocations: [
    {
      shelterId: ENTITY_IDS.SHELTERS.MEPPADI_HSS,
      shelterName: 'Meppadi Govt. HSS',
      persons: 612,
      distanceKm: 4.1,
      capacityOk: true,
      routeOk: true,
      transitRouteId: ENTITY_IDS.ROUTES.R104,
      transitRouteName: 'Route R104 (Mundakkai-Meppadi)',
      isInvalidated: false,
    },
    {
      shelterId: ENTITY_IDS.SHELTERS.KALPETTA_HALL,
      shelterName: 'Kalpetta Community Hall',
      persons: 503,
      distanceKm: 5.7,
      capacityOk: true,
      routeOk: true,
      transitRouteId: ENTITY_IDS.ROUTES.R212,
      transitRouteName: 'Route R212 (Meppadi-Kalpetta Arterial)',
      isInvalidated: false,
    },
    {
      shelterId: ENTITY_IDS.SHELTERS.ST_MARYS,
      shelterName: "St. Mary's School Vythiri",
      persons: 380,
      distanceKm: 6.2,
      capacityOk: true,
      routeOk: true,
      transitRouteId: ENTITY_IDS.ROUTES.R318,
      transitRouteName: 'Route R318 (Chooralmala-Vythiri Bypass)',
      isInvalidated: false,
    },
  ],
  rationale: [
    'Carrying-capacity satisfied across 3 distributed relief facilities',
    'Average transit distance minimized to 5.3 km',
    'Meppadi PHC on-site medical health desk linked to primary camp',
    'Zero evacuees routed through critical red hazard perimeter',
  ],
};

// Plan V2 Model (Dynamic Reassignment)
export const planV2SimulationData: RelocationPlan = {
  id: ENTITY_IDS.PLANS.V2,
  version: 2,
  timestamp: new Date(Date.now() - 5 * 60000),
  status: 'pending_approval',
  triggerReason: 'Route R104 severed at KM 4.2 — Dynamic reassignment away from failed bridge corridor',
  affectedHabitation: 'Mundakkai',
  totalHouseholds: 427,
  totalPopulation: 1495,
  reviewingAuthority: 'DISTRICT_COLLECTOR',
  allocations: [
    {
      shelterId: ENTITY_IDS.SHELTERS.KALPETTA_HALL,
      shelterName: 'Kalpetta Community Hall (Primary)',
      persons: 612,
      distanceKm: 5.7,
      capacityOk: true,
      routeOk: true,
      transitRouteId: ENTITY_IDS.ROUTES.R212,
      transitRouteName: 'Route R212 (Confirmed Clear)',
      isInvalidated: false,
    },
    {
      shelterId: ENTITY_IDS.SHELTERS.ST_MARYS,
      shelterName: "St. Mary's School Vythiri (Secondary)",
      persons: 503,
      distanceKm: 6.2,
      capacityOk: true,
      routeOk: true,
      transitRouteId: ENTITY_IDS.ROUTES.R318,
      transitRouteName: 'Route R318 (Confirmed Clear)',
      isInvalidated: false,
    },
    {
      shelterId: ENTITY_IDS.SHELTERS.MEPPADI_HSS,
      shelterName: 'Meppadi Govt. HSS (Local Sector)',
      persons: 380,
      distanceKm: 4.1,
      capacityOk: true,
      routeOk: true,
      transitRouteId: ENTITY_IDS.ROUTES.R212,
      transitRouteName: 'Meppadi North Bypass (Non-R104)',
      isInvalidated: false,
    },
  ],
  rationale: [
    'Failed Route R104 eliminated from vehicular movement corridor',
    'Kalpetta Community Hall reassigned as Primary Shelter via Route R212',
    'St. Mary\'s Vythiri absorbs secondary balance via Route R318',
    '100% of exposed population (1,495 / 1,495) re-routed via confirmed passable roads',
    'Zero camp capacity limits breached',
  ],
};

// Plan V2 Decision Context (Step 3 Reusable Component Feed)
export const mockDecisionContextV2: DecisionContextData = {
  decisionId: 'dec-wyd-mnd-02',
  planVersion: 2,
  status: 'pending_approval',
  problem: {
    targetHabitation: 'Mundakkai (Vythiri Taluk, Wayanad)',
    exposedHouseholds: 427,
    exposedPopulation: 1495,
    riskSeverity: 'CRITICAL',
    riskIndex: 94.2,
    narrative: 'Re-assess relocation plan for 1,495 residents following structural failure of primary evacuation bridge at Route R104 KM 4.2.',
  },
  evidence: [
    {
      id: 'ev-v2-1',
      sourceAgency: 'Field Officer (Vythiri Revenue Squad)',
      sourceType: 'On-Scene Ground Report',
      observation: 'Route R104 KM 4.2 bridge culvert washed out by debris flow at 14:20 IST; road impassable for motor vehicles',
      timestamp: 'Verified 4 min ago',
      confidence: 'high',
      status: 'verified',
      classification: 'SOURCE_DATA',
    },
    {
      id: 'ev-v2-2',
      sourceAgency: 'PWD Roads Division (Wayanad)',
      sourceType: 'Infrastructure Telemetry',
      observation: 'Route R212 (Meppadi-Kalpetta Arterial) confirmed structurally intact and clear',
      timestamp: 'Verified 10 min ago',
      confidence: 'high',
      status: 'verified',
      classification: 'SOURCE_DATA',
    },
    {
      id: 'ev-v2-3',
      sourceAgency: 'Taluk Emergency Squad',
      sourceType: 'Route Inspection',
      observation: 'Route R318 (Chooralmala-Vythiri Bypass) confirmed clear and passable for evacuation buses',
      timestamp: 'Verified 15 min ago',
      confidence: 'high',
      status: 'verified',
      classification: 'SOURCE_DATA',
    },
    {
      id: 'ev-v2-4',
      sourceAgency: 'India Meteorological Department (IMD)',
      sourceType: 'Doppler Radar Telemetry',
      observation: 'Continued high-intensity rainfall forecast (>25mm/hr) across Meppadi catchment',
      timestamp: 'Updated 5 min ago',
      confidence: 'high',
      status: 'verified',
      classification: 'SOURCE_DATA',
    },
  ],
  derivedFindings: [
    {
      id: 'df-v2-1',
      label: 'Route R104 Constraint State',
      value: 'FAILED (BLOCKED)',
      finding: 'Primary link R104 is completely severed at KM 4.2; all direct vehicular transit to Meppadi HSS aborted.',
      classification: 'DERIVED_DATA',
    },
    {
      id: 'df-v2-2',
      label: 'Plan V1 Invalidation Impact',
      value: '150 Persons Affected',
      finding: '150 evacuees assigned to Meppadi HSS via R104 lost transit feasibility; replanning required.',
      classification: 'DERIVED_DATA',
    },
    {
      id: 'df-v2-3',
      label: 'Viable Alternate Capacity',
      value: '1,128 Usable Beds',
      finding: 'Kalpetta Community Hall (628 remaining) and St. Mary\'s Vythiri (500 remaining) provide ample capacity via open roads.',
      classification: 'DERIVED_DATA',
    },
    {
      id: 'df-v2-4',
      label: 'Rerouting Viability',
      value: '100% Feasible',
      finding: 'R212 and R318 bypass corridors absorb full 1,495 population with zero red-zone crossings.',
      classification: 'DERIVED_DATA',
    },
  ],
  constraints: [
    {
      id: 'con-v2-1',
      name: 'Route R104 Integrity Constraint',
      description: 'Evacuation corridors must avoid severed Route R104 KM 4.2 culvert.',
      status: 'FAILED',
      impact: 'R104 eliminated from vehicular movement. Rerouted via northern R212 corridor.',
    },
    {
      id: 'con-v2-2',
      name: 'Alternate Corridor Feasibility (R212 / R318)',
      description: 'Transit routes must be verified open by PWD and Taluk squads.',
      status: 'SATISFIED',
      impact: 'Kalpetta (via R212) and Vythiri (via R318) confirmed 100% passable.',
    },
    {
      id: 'con-v2-3',
      name: 'Shelter Carrying-Capacity Envelope',
      description: 'Reassigned allocations must not breach individual shelter bed capacities.',
      status: 'SATISFIED',
      impact: 'Kalpetta (612/650), St. Mary\'s (503/500+cots), Meppadi (380/800) strictly compliant.',
    },
    {
      id: 'con-v2-4',
      name: '100% Population Coverage',
      description: 'All 1,495 exposed residents must have an active assigned destination.',
      status: 'SATISFIED',
      impact: '1,495 / 1,495 persons assigned under Plan V2.',
    },
  ],
  criteria: [
    {
      id: 'crit-v2-1',
      name: 'Route Safety & Redundancy',
      weightDescription: 'Highest priority — Hard rule avoiding severed infrastructure',
      status: 'satisfied',
    },
    {
      id: 'crit-v2-2',
      name: 'Shelter Carrying Capacity',
      weightDescription: 'High priority — Prevents dangerous camp overcrowding',
      status: 'satisfied',
    },
    {
      id: 'crit-v2-3',
      name: 'Distance Optimization',
      weightDescription: 'Medium priority — Average transit distance adjusted from 5.1 km to 5.6 km',
      status: 'satisfied',
    },
    {
      id: 'crit-v2-4',
      name: 'Medical Accessibility',
      weightDescription: 'Medium priority — Kalpetta District Hospital linkage mobilized',
      status: 'satisfied',
    },
  ],
  alternatives: [
    {
      id: 'alt-v2-1',
      name: 'Plan V2: Reassignment to Kalpetta Hall (Primary) & St. Mary\'s (Secondary)',
      status: 'SELECTED',
      summary: 'Shifts primary vehicle convoy to Kalpetta Hall via Route R212; St. Mary\'s absorbs secondary balance via R318.',
      reason: '100% bypasses failed Route R104; uses verified open arterial highways; zero capacity breaches.',
      candidateRouteId: ENTITY_IDS.ROUTES.R212,
      candidateShelterId: ENTITY_IDS.SHELTERS.KALPETTA_HALL,
      candidateDistanceKm: 5.7,
    },
    {
      id: 'alt-v2-2',
      name: 'Candidate A: Continue Plan V1 via Route R104',
      status: 'INFEASIBLE',
      summary: 'Maintain original Plan V1 allocation to Meppadi HSS.',
      reason: 'Culvert abutment structural failure at KM 4.2 presents catastrophic transit risk.',
      constraintViolations: ['Route R104 Severed & Impassable', 'Immediate Life-Safety Hazard'],
      candidateRouteId: ENTITY_IDS.ROUTES.R104,
      candidateShelterId: ENTITY_IDS.SHELTERS.MEPPADI_HSS,
    },
    {
      id: 'alt-v2-3',
      name: 'Candidate B: Long-Distance Convoy to Sulthan Bathery Town Hall',
      status: 'REJECTED',
      summary: 'Redirect entire population 12.4 km east to Sulthan Bathery.',
      reason: 'Excessive transit distance during severe precipitation; Kalpetta Hall closer and verified.',
      constraintViolations: ['Transit Distance > 10 km', 'Target Camp Near-Full'],
      candidateRouteId: ENTITY_IDS.ROUTES.R212,
      candidateShelterId: ENTITY_IDS.SHELTERS.SULTHAN_BATHERY,
      candidateDistanceKm: 12.4,
    },
  ],
  recommendation: {
    summary: 'AEGIS advises promulgation of Plan V2: Reassign 612 residents to Kalpetta Community Hall via Route R212 and 503 residents to St. Mary\'s School Vythiri via Route R318.',
    totalAllocated: 1495,
    totalRequired: 1495,
    percentAllocated: 100,
    allocations: planV2SimulationData.allocations,
    classification: 'AEGIS_RECOMMENDATION',
  },
  impacts: [
    'Eliminates transit exposure along the severed R104 culvert corridor.',
    'Kalpetta Community Hall becomes the primary reception hub with District Hospital support.',
    'Average evacuation distance slightly increases from 5.1 km to 5.6 km (+0.5 km) to ensure safety.',
    'KSRTC bus dispatch redirected from Meppadi road to northern Kalpetta arterial (R212).',
  ],
  assumptions: [
    'Route R212 and R318 remain clear of landslides during the convoy movement window.',
    'Kalpetta Community Hall reception team deployed and operational.',
    'Field revenue squad maintains perimeter roadblock at R104 KM 4.2.',
  ],
  uncertainties: [
    'Rainfall intensity may cause localized flooding near Vythiri pass if deluge continues.',
    'Communication latency from field officers in remote estate sectors.',
  ],
  humanDecision: {
    reviewingAuthority: 'DISTRICT_COLLECTOR',
    designation: 'District Collector & District Magistrate (Wayanad DDMA)',
    statutoryBasis: 'Sections 30 and 34 of the Disaster Management Act, 2005',
    allowedActions: ['APPROVE', 'MODIFY', 'REJECT'],
  },
};

// Alternative Search Candidate Table (Used in State 8)
export interface CandidateEvaluationRow {
  candidateName: string;
  candidateRouteName: string;
  routeId: string;
  shelterId: string;
  distanceKm: string;
  capacityStatus: string;
  routeStatus: 'CLEAR' | 'AT_RISK' | 'BLOCKED';
  evaluationResult: 'VIABLE' | 'REJECTED' | 'INFEASIBLE';
  rejectionReason?: string;
}

export const mockAlternativeEvaluationTable: CandidateEvaluationRow[] = [
  {
    candidateName: 'Meppadi Govt. HSS (Original Plan V1)',
    candidateRouteName: 'Route R104 (Mundakkai-Meppadi)',
    routeId: ENTITY_IDS.ROUTES.R104,
    shelterId: ENTITY_IDS.SHELTERS.MEPPADI_HSS,
    distanceKm: '4.1 km',
    capacityStatus: '755 Available',
    routeStatus: 'BLOCKED',
    evaluationResult: 'REJECTED',
    rejectionReason: 'Bridge culvert failure at KM 4.2. Impassable for vehicular convoy.',
  },
  {
    candidateName: 'Kalpetta Community Hall (Primary)',
    candidateRouteName: 'Route R212 (Meppadi-Kalpetta)',
    routeId: ENTITY_IDS.ROUTES.R212,
    shelterId: ENTITY_IDS.SHELTERS.KALPETTA_HALL,
    distanceKm: '5.7 km',
    capacityStatus: '628 Available',
    routeStatus: 'CLEAR',
    evaluationResult: 'VIABLE',
    rejectionReason: 'Confirmed passable by PWD. Linked to District Hospital.',
  },
  {
    candidateName: "St. Mary's School Vythiri (Secondary)",
    candidateRouteName: 'Route R318 (Chooralmala-Vythiri)',
    routeId: ENTITY_IDS.ROUTES.R318,
    shelterId: ENTITY_IDS.SHELTERS.ST_MARYS,
    distanceKm: '6.2 km',
    capacityStatus: '500 Available',
    routeStatus: 'CLEAR',
    evaluationResult: 'VIABLE',
    rejectionReason: 'Confirmed passable by Taluk Squad. Standby medical officer on-site.',
  },
  {
    candidateName: 'Sulthan Bathery Town Hall',
    candidateRouteName: 'NH 766 Eastern Corridor',
    routeId: 'route-nh766',
    shelterId: ENTITY_IDS.SHELTERS.SULTHAN_BATHERY,
    distanceKm: '12.4 km',
    capacityStatus: 'Near Full (150/400)',
    routeStatus: 'AT_RISK',
    evaluationResult: 'INFEASIBLE',
    rejectionReason: 'Excessive transit distance (>10km) and limited reception capacity.',
  },
];

// Raw Unhashed Audit Events Prototype Definitions
interface RawEventDef {
  eventId: string;
  sequenceNumber: number;
  simulatedTimestamp: string;
  realTimestamp: string;
  eventType: AuditEvent['eventType'];
  title: string;
  actor: string;
  actorName: string;
  actorRole: AuditEvent['actorRole'];
  originType: AuditEvent['originType'];
  sourceEvidence: string;
  affectedEntityId: string;
  affectedEntityName: string;
  previousState?: string;
  newState?: string;
  planId?: string;
  planVersion?: number | string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  consequence: string;
  payloadSummary: string;
  classification: AuditEvent['classification'];
}

const rawAuditEvents: RawEventDef[] = [
  {
    eventId: 'evt-01-baseline',
    sequenceNumber: 1,
    simulatedTimestamp: '11:30 IST',
    realTimestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    eventType: 'BASELINE_ESTABLISHED',
    title: 'Baseline Corridor Monitoring Active',
    actor: 'AEGIS Telemetry System',
    actorName: 'AEGIS Monitoring Node 01',
    actorRole: 'AEGIS_ADVISORY',
    originType: 'SYSTEM_ADVISORY',
    sourceEvidence: 'KSDMA Geospatial Registry & Sensor Ingestion Pipeline',
    affectedEntityId: ENTITY_IDS.HABITATIONS.MUNDAKKAI,
    affectedEntityName: 'Mundakkai Habitation (427 Households / 1,495 Residents)',
    previousState: 'Unmonitored / Stale',
    newState: 'Active Telemetry Monitoring',
    confidence: 'high',
    reason: 'Routine pre-monsoon baseline parameter initialization across Vythiri Taluk.',
    consequence: 'Sensor sampling rate set to 5-minute interval; no active emergency posture.',
    payloadSummary: 'INIT_BASELINE|MUNDAKKAI|427_HH|1495_POP|ROUTES_CLEAR',
    classification: 'SOURCE_DATA',
  },
  {
    eventId: 'evt-02-escalation',
    sequenceNumber: 2,
    simulatedTimestamp: '12:45 IST',
    realTimestamp: new Date(Date.now() - 105 * 60000).toISOString(),
    eventType: 'HAZARD_ESCALATED',
    title: 'Precipitation Threshold & Slope Saturation Breach',
    actor: 'State Hazard Analyst',
    actorName: 'KSEOC Scientific Officer (Thiruvananthapuram)',
    actorRole: 'HAZARD_ANALYST',
    originType: 'SYSTEM_ADVISORY',
    sourceEvidence: 'IMD Doppler Radar Telemetry (Kochi) & Automated Rain Gauge Network',
    affectedEntityId: ENTITY_IDS.HABITATIONS.MUNDAKKAI,
    affectedEntityName: 'Mundakkai Slope Hazard Perimeter (Zone HZ-01)',
    previousState: 'Normal / Yellow Advisory',
    newState: 'Critical Slope Saturation (94.2%)',
    confidence: 'high',
    reason: '24-hour cumulative rainfall exceeded 204.6mm; pore-water pressure models crossed critical stability envelope.',
    consequence: 'High-priority landslide advisory dispatched to Wayanad District Control Room.',
    payloadSummary: 'SURGE_ALERT|RAINFALL_204MM|SATURATION_94.2%|CRITICAL_RISK',
    classification: 'DERIVED_DATA',
  },
  {
    eventId: 'evt-03-audit',
    sequenceNumber: 3,
    simulatedTimestamp: '13:15 IST',
    realTimestamp: new Date(Date.now() - 75 * 60000).toISOString(),
    eventType: 'CAPACITY_AUDITED',
    title: 'Shelter Carrying-Capacity & Route Feasibility Audit',
    actor: 'AEGIS Constraint Engine',
    actorName: 'AEGIS Optimization Engine (v1.2)',
    actorRole: 'AEGIS_ADVISORY',
    originType: 'SYSTEM_ADVISORY',
    sourceEvidence: 'DDMA District Shelter Database & PWD Road Clearance Records',
    affectedEntityId: ENTITY_IDS.SHELTERS.MEPPADI_HSS,
    affectedEntityName: 'Meppadi Govt. Higher Secondary School',
    previousState: 'Unallocated',
    newState: 'Sector Deficit Identified (-340 Beds)',
    confidence: 'high',
    reason: 'Meppadi local usable capacity (755 beds) insufficient for projected 2,100 evacuee surge.',
    consequence: 'AEGIS determines single-camp concentration is infeasible; multi-facility inter-sector distribution required.',
    payloadSummary: 'CAPACITY_AUDIT|TOTAL_REQ_1495|USABLE_CAP_1760|DEFICIT_340',
    classification: 'DERIVED_DATA',
  },
  {
    eventId: 'evt-04-v1-gen',
    sequenceNumber: 4,
    simulatedTimestamp: '13:30 IST',
    realTimestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    eventType: 'PLAN_GENERATED',
    title: 'Relocation Plan V1 Formulated (AEGIS Advisory)',
    actor: 'AEGIS Optimization Engine',
    actorName: 'AEGIS Relocation Formulator',
    actorRole: 'AEGIS_ADVISORY',
    originType: 'SYSTEM_ADVISORY',
    sourceEvidence: 'Linear Programming Constraint Matrix (Capacity + Distance + Route Safety)',
    affectedEntityId: ENTITY_IDS.PLANS.V1,
    affectedEntityName: 'Relocation Plan V1 (Mundakkai Corridor)',
    previousState: 'Draft / Analyzing',
    newState: 'Pending Statutory Human Approval',
    planId: ENTITY_IDS.PLANS.V1,
    planVersion: 1,
    confidence: 'high',
    reason: 'Optimal 3-camp distribution balancing proximity and carrying capacity.',
    consequence: 'Plan V1 submitted to District Collector dashboard for review: Meppadi (612), Kalpetta (503), St. Mary\'s (380).',
    payloadSummary: 'GEN_PLAN_V1|MEPPADI_612|KALPETTA_503|VYTHIRI_380|TOTAL_1495',
    classification: 'AEGIS_RECOMMENDATION',
  },
  {
    eventId: 'evt-05-v1-app',
    sequenceNumber: 5,
    simulatedTimestamp: '13:45 IST',
    realTimestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    eventType: 'PLAN_APPROVED',
    title: 'Statutory Approval of Plan V1 [District Collector]',
    actor: 'District Collector & District Magistrate',
    actorName: 'District Collector (Chairperson, DDMA Wayanad)',
    actorRole: 'DISTRICT_COLLECTOR',
    originType: 'HUMAN_STATUTORY',
    sourceEvidence: 'Executive Order under Sections 30 & 34 of the Disaster Management Act, 2005',
    affectedEntityId: ENTITY_IDS.PLANS.V1,
    affectedEntityName: 'Relocation Plan V1 (Approved)',
    previousState: 'Pending Statutory Approval',
    newState: 'Plan V1 Approved & Active',
    planId: ENTITY_IDS.PLANS.V1,
    planVersion: 1,
    confidence: 'high',
    reason: 'Incident Commander concurrence with AEGIS multi-shelter distribution.',
    consequence: 'Transit movement corridors activated on GIS. KSRTC convoys and camp reception desks mobilized.',
    payloadSummary: 'STATUTORY_APPROVE|PLAN_V1|ACTOR_COLLECTOR|STATUTE_DM_ACT_2005',
    classification: 'SOURCE_DATA',
  },
  {
    eventId: 'evt-06-r104-fail',
    sequenceNumber: 6,
    simulatedTimestamp: '14:20 IST',
    realTimestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    eventType: 'ROUTE_STATUS_CHANGED',
    title: 'Field Report: Route R104 Culvert Structural Breach at KM 4.2',
    actor: 'Village Officer (Vythiri Revenue Squad)',
    actorName: 'Shri. K. R. Suresh (Ground Verification Squad Lead)',
    actorRole: 'FIELD_OFFICER',
    originType: 'FIELD_REPORT',
    sourceEvidence: 'On-scene field inspection and radio transmission to Taluk EOC',
    affectedEntityId: ENTITY_IDS.ROUTES.R104,
    affectedEntityName: 'Route R104 (Mundakkai-Meppadi Road at KM 4.2)',
    previousState: 'AT RISK / PASSABLE',
    newState: 'BLOCKED / SEVERED',
    confidence: 'high',
    reason: 'Debris avalanche compromised concrete bridge culvert abutment; road impassable for motor vehicles.',
    consequence: 'Route R104 flagged BLOCKED across all GIS displays. Revenue squad erects physical perimeter barrier.',
    payloadSummary: 'FIELD_INCIDENT|R104_KM4.2|CULVERT_COLLAPSE|STATUS_BLOCKED',
    classification: 'SOURCE_DATA',
  },
  {
    eventId: 'evt-07-v1-inval',
    sequenceNumber: 7,
    simulatedTimestamp: '14:21 IST',
    realTimestamp: new Date(Date.now() - 9 * 60000).toISOString(),
    eventType: 'PLAN_INVALIDATED',
    title: 'Causal Invalidation of Plan V1 (150 Evacuees Severed)',
    actor: 'AEGIS Dependency Graph Engine',
    actorName: 'AEGIS Dynamic Resiliency Engine',
    actorRole: 'AEGIS_ADVISORY',
    originType: 'SYSTEM_ADVISORY',
    sourceEvidence: 'Automated Topological Dependency Graph Evaluation',
    affectedEntityId: ENTITY_IDS.PLANS.V1,
    affectedEntityName: 'Relocation Plan V1 (Invalidated)',
    previousState: 'Plan V1 Approved & Active',
    newState: 'Plan V1 Invalidated',
    planId: ENTITY_IDS.PLANS.V1,
    planVersion: 1,
    confidence: 'high',
    reason: 'Primary transit dependency severed for 150 persons assigned to Meppadi HSS via R104.',
    consequence: 'AEGIS halts reliance on Plan V1; marks affected assignment invalid; triggers dynamic alternative search.',
    payloadSummary: 'INVALIDATE_PLAN_V1|DEPENDENCY_R104_FAILED|SEVERED_150_PERSONS',
    classification: 'DERIVED_DATA',
  },
  {
    eventId: 'evt-08-alt-search',
    sequenceNumber: 8,
    simulatedTimestamp: '14:22 IST',
    realTimestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    eventType: 'ALTERNATIVES_EVALUATED',
    title: 'Dynamic Multi-Criteria Candidate Search',
    actor: 'AEGIS Optimization Engine',
    actorName: 'AEGIS Alternative Evaluator',
    actorRole: 'AEGIS_ADVISORY',
    originType: 'SYSTEM_ADVISORY',
    sourceEvidence: 'Real-Time Multi-Criteria Constraint Filtering',
    affectedEntityId: ENTITY_IDS.PLANS.V2,
    affectedEntityName: 'Candidate Routing Matrix (R212 & R318 Corridors)',
    previousState: 'Searching',
    newState: 'Candidate Alternatives Ranked',
    planId: ENTITY_IDS.PLANS.V2,
    planVersion: 2,
    confidence: 'high',
    reason: 'Evaluation of open arterial bypasses avoiding severed Route R104.',
    consequence: 'Meppadi vehicular route rejected; Kalpetta Hall (R212) and St. Mary\'s (R318) selected as viable targets.',
    payloadSummary: 'ALT_SEARCH|R104_REJECTED|R212_VIABLE_5.7KM|R318_VIABLE_6.2KM',
    classification: 'DERIVED_DATA',
  },
  {
    eventId: 'evt-09-v2-gen',
    sequenceNumber: 9,
    simulatedTimestamp: '14:23 IST',
    realTimestamp: new Date(Date.now() - 7 * 60000).toISOString(),
    eventType: 'PLAN_V2_GENERATED',
    title: 'Relocation Plan V2 Formulated (AEGIS Advisory)',
    actor: 'AEGIS Optimization Engine',
    actorName: 'AEGIS Reassignment Engine',
    actorRole: 'AEGIS_ADVISORY',
    originType: 'SYSTEM_ADVISORY',
    sourceEvidence: 'Rebalanced Dynamic Allocation Model (1,495 / 1,495 Reassigned)',
    affectedEntityId: ENTITY_IDS.PLANS.V2,
    affectedEntityName: 'Relocation Plan V2 (Dynamic Reassignment)',
    previousState: 'Draft / Replanned',
    newState: 'Pending Statutory Human Approval',
    planId: ENTITY_IDS.PLANS.V2,
    planVersion: 2,
    confidence: 'high',
    reason: 'Reroutes displaced population to Kalpetta Hall (612) and St. Mary\'s (503); preserves total 1,495 population baseline.',
    consequence: 'Plan V2 diff matrix presented to District Collector dashboard for statutory review.',
    payloadSummary: 'GEN_PLAN_V2|KALPETTA_612|VYTHIRI_503|MEPPADI_380|TOTAL_1495',
    classification: 'AEGIS_RECOMMENDATION',
  },
  {
    eventId: 'evt-10-v2-app',
    sequenceNumber: 10,
    simulatedTimestamp: '14:24 IST',
    realTimestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    eventType: 'PLAN_V2_APPROVED',
    title: 'Statutory Re-Approval of Plan V2 [District Collector]',
    actor: 'District Collector & District Magistrate',
    actorName: 'District Collector (Chairperson, DDMA Wayanad)',
    actorRole: 'DISTRICT_COLLECTOR',
    originType: 'HUMAN_STATUTORY',
    sourceEvidence: 'Executive Promulgation under Sections 30 & 34 of the Disaster Management Act, 2005',
    affectedEntityId: ENTITY_IDS.PLANS.V2,
    affectedEntityName: 'Relocation Plan V2 (Promulgated & Operational)',
    previousState: 'Pending Statutory Approval',
    newState: 'Plan V2 Approved & Operational',
    planId: ENTITY_IDS.PLANS.V2,
    planVersion: 2,
    confidence: 'high',
    reason: 'Collector concurrence with dynamic reassignment bypassing damaged infrastructure.',
    consequence: 'Plan V2 movement vectors mobilized across Wayanad; bus convoys redirected to northern R212 corridor. Immutable audit receipt logged.',
    payloadSummary: 'STATUTORY_APPROVE|PLAN_V2|ACTOR_COLLECTOR|STATUTE_DM_ACT_2005',
    classification: 'SOURCE_DATA',
  },
];

/**
 * Builds the authoritative, cryptographically linked SHA-256 audit ledger.
 */
function buildCanonicalAuditChain(): AuditEvent[] {
  const chain: AuditEvent[] = [];
  let prevHash = GENESIS_HASH;

  for (const raw of rawAuditEvents) {
    const eventBase: Omit<AuditEvent, 'currentHash' | 'verificationStatus'> = {
      ...raw,
      simulationState: raw.sequenceNumber as SimulationStepId,
      previousHash: prevHash,
    };

    const currentHash = computeEventHash(eventBase, prevHash);

    const fullEvent: AuditEvent = {
      ...eventBase,
      currentHash,
      verificationStatus: 'VALID',
    };

    chain.push(fullEvent);
    prevHash = currentHash;
  }

  return chain;
}

// Authoritative Canonical Audit Trail (Exported for Step 5)
export const canonicalAuditEvents: AuditEvent[] = buildCanonicalAuditChain();

// Legacy alias for compatibility
export const mockSimulationEvents: AuditEvent[] = canonicalAuditEvents;
