// ============================================================
// AEGIS — Type Definitions
// Kerala Disaster Management Decision Support Platform
// ============================================================

/**
 * Administrative and Operational Authority Roles
 * Clearly distinguishes human executive powers from AEGIS advisory recommendations.
 */
export type AuthorityRole =
  | 'SRC_KSEOC'            // State Relief Commissioner / State EOC (State Authority)
  | 'DISTRICT_COLLECTOR'   // District Collector / DDMA Incident Commander (District Executive)
  | 'TAHSILDAR'            // Tahsildar / Taluk Incident Commander (Taluk Operational Authority)
  | 'HAZARD_ANALYST'       // State/District Hazard Analyst (Scientific & Planning Section)
  | 'OPERATIONS_OFFICER'   // Incident Operations Section Chief
  | 'LOGISTICS_OFFICER'    // Relief & Supply Logistics Section
  | 'HEALTH_OFFICER'       // District Health & Medical Safety Officer
  | 'FIELD_OFFICER'        // Village / Ground Field Officer (Ground Verification)
  | 'PUBLIC'               // Public Citizen Advisory View
  | 'AEGIS_ADVISORY';      // AEGIS Analytical Engine (Advisory Only — No Statutory Powers)

/**
 * Data Provenance and Classification Semantics
 * Distinguishes raw official feeds, calculated indices, system recommendations, and demo data.
 */
export type DataClassification =
  | 'SOURCE_DATA'          // Raw verified telemetry (IMD, CWC, PWD, Ground Report)
  | 'DERIVED_DATA'         // Computed metric (Composite Vulnerability Index, Saturation %)
  | 'AEGIS_RECOMMENDATION' // Generated advisory option requiring human approval
  | 'DEMO_DATA';           // Simulated Wayanad scenario data for prototyping

/**
 * Actor Origin Classification for Forensic Auditing
 */
export type AuditOriginType =
  | 'SYSTEM_ADVISORY'     // AEGIS automated analytical derivation (Advisory only)
  | 'FIELD_REPORT'        // On-ground official observation / field officer report
  | 'HUMAN_STATUTORY';    // Constitutional / Statutory Executive action (District Collector)

/**
 * System Operational Modes
 */
export type OperationalMode = 'PLANNING' | 'EMERGENCY';

/**
 * Risk and Severity Levels
 */
export type RiskLevel = 'critical' | 'high' | 'warning' | 'safe' | 'info';

/**
 * KPI Metric Model
 */
export interface KPIData {
  id: string;
  label: string;
  value: number;
  unit?: string;
  status: RiskLevel;
  trend?: 'up' | 'down' | 'stable';
  classification?: DataClassification;
  isSimulated?: boolean;
}

/**
 * Data Source Provenance Model
 */
export interface DataSource {
  id: string;
  name: string;
  abbreviation: string;
  status: 'verified' | 'stale' | 'unconfirmed';
  lastUpdated: Date;
  confidence: 'high' | 'medium' | 'low';
  sourceAgency: string;
}

/**
 * Hazard Zone Entity
 */
export interface HazardZone {
  id: string;
  name: string;
  type: 'landslide' | 'flood' | 'coastal' | 'cyclone';
  severity: RiskLevel;
  affectedHouseholds: number;
  affectedPopulation: number;
  drivers: string[];
  classification: DataClassification;
}

/**
 * Shelter Entity
 */
export interface Shelter {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentOccupancy: number;
  latitude: number;
  longitude: number;
  distanceKm: number;
  capacityStatus: 'available' | 'near-full' | 'full';
  routeStatus: 'clear' | 'at-risk' | 'blocked';
  hasMedicalDesk: boolean;
  amenities: {
    potableWater: boolean;
    backupPower: boolean;
    sanitationBlocks: number;
  };
}

/**
 * Road / Route Entity
 */
export interface Route {
  id: string;
  name: string;
  status: 'clear' | 'at-risk' | 'blocked';
  lastVerified: Date;
  sourceOfficer: string;
  confidence: 'high' | 'medium' | 'low';
  affectedHouseholds: number;
}

/**
 * Relocation Plan Allocation Item
 */
export interface RelocationAllocation {
  shelterId: string;
  shelterName: string;
  persons: number;
  distanceKm: number;
  capacityOk: boolean;
  routeOk: boolean;
  transitRouteId?: string;
  transitRouteName?: string;
  isInvalidated?: boolean;
}

/**
 * Proactive Relocation Plan Model
 */
export interface RelocationPlan {
  id: string;
  version: number;
  timestamp: Date;
  status: 'pending_approval' | 'approved' | 'rejected' | 'invalidated' | 'draft';
  triggerReason: string;
  affectedHabitation: string;
  totalHouseholds: number;
  totalPopulation: number;
  reviewingAuthority: AuthorityRole;
  approvedBy?: string;
  approvalTimestamp?: Date;
  allocations: RelocationAllocation[];
  rationale: string[];
  affectedAssignmentsCount?: number;
}

/**
 * Structured Constraint Item
 */
export interface DecisionConstraint {
  id: string;
  name: string;
  description: string;
  status: 'SATISFIED' | 'FAILED' | 'UNKNOWN' | 'REQUIRES_VERIFICATION';
  impact: string;
}

/**
 * Multi-Criteria Decision Evaluation Item
 */
export interface DecisionCriterion {
  id: string;
  name: string;
  weightDescription: string;
  status: 'satisfied' | 'partial' | 'violated';
}

/**
 * Alternative Candidate Plan
 */
export interface DecisionAlternative {
  id: string;
  name: string;
  status: 'SELECTED' | 'REJECTED' | 'INFEASIBLE' | 'NOT_EVALUATED';
  summary: string;
  reason: string;
  constraintViolations?: string[];
  candidateRouteId?: string;
  candidateShelterId?: string;
  candidateDistanceKm?: number;
}

/**
 * Evidence Item for Decision Context
 */
export interface DecisionEvidenceItem {
  id: string;
  sourceAgency: string;
  sourceType: string;
  observation: string;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'verified' | 'stale' | 'unconfirmed';
  classification: DataClassification;
}

/**
 * Derived Analytical Finding
 */
export interface DecisionDerivedFinding {
  id: string;
  label: string;
  value: string | number;
  finding: string;
  classification: DataClassification;
}

/**
 * Comprehensive Decision Context Data Model
 */
export interface DecisionContextData {
  decisionId: string;
  planVersion: number | string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'invalidated' | 'draft';
  problem: {
    targetHabitation: string;
    exposedHouseholds: number;
    exposedPopulation: number;
    riskSeverity: string;
    riskIndex: number;
    narrative: string;
  };
  evidence: DecisionEvidenceItem[];
  derivedFindings: DecisionDerivedFinding[];
  constraints: DecisionConstraint[];
  criteria: DecisionCriterion[];
  alternatives: DecisionAlternative[];
  recommendation: {
    summary: string;
    totalAllocated: number;
    totalRequired: number;
    percentAllocated: number;
    allocations: RelocationAllocation[];
    classification: DataClassification;
  };
  impacts: string[];
  assumptions: string[];
  uncertainties: string[];
  humanDecision: {
    reviewingAuthority: AuthorityRole;
    designation: string;
    statutoryBasis: string;
    allowedActions: ('APPROVE' | 'MODIFY' | 'REJECT')[];
  };
}

/**
 * Simulation Step Definitions (10-State Deterministic Storyline)
 */
export type SimulationStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface SimulationStateMetadata {
  stepNumber: SimulationStepId;
  code: string;
  title: string;
  phaseCategory: 'BASELINE' | 'ASSESSMENT' | 'INITIAL_PLAN' | 'FIELD_EVENT' | 'REPLANNING' | 'STATUTORY_SIGN_OFF';
  simulatedTime: string;
  shortDescription: string;
  operationalDetail: string;
  activePlanId: 'none' | 'plan-v1' | 'plan-v2';
  routeR104Status: 'clear' | 'at-risk' | 'blocked';
  r104AffectedPopulation: number;
  invalidatedAssignmentPersons: number;
  movementVectorsActive: boolean;
  activeVectorType: 'none' | 'plan-v1-vectors' | 'plan-v1-invalidated-vector' | 'plan-v2-vectors';
}

/**
 * Audit Event Type Enumeration
 */
export type AuditEventType =
  | 'BASELINE_ESTABLISHED'
  | 'HAZARD_ESCALATED'
  | 'CAPACITY_AUDITED'
  | 'PLAN_GENERATED'
  | 'PLAN_APPROVED'
  | 'ROUTE_STATUS_CHANGED'
  | 'PLAN_INVALIDATED'
  | 'ALTERNATIVES_EVALUATED'
  | 'PLAN_V2_GENERATED'
  | 'PLAN_V2_APPROVED';

/**
 * Comprehensive Event-Sourced Forensic Audit Model (Step 5)
 */
export interface AuditEvent {
  eventId: string;
  sequenceNumber: number;
  simulationState?: SimulationStepId;
  simulatedTimestamp: string;
  realTimestamp: string;
  eventType: AuditEventType;
  title: string;
  actor: string;
  actorName: string;
  actorRole: AuthorityRole;
  originType: AuditOriginType;
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
  previousHash: string;
  currentHash: string;
  verificationStatus: 'VALID' | 'TAMPERED' | 'UNVERIFIED';
  classification: DataClassification;
}

/**
 * Legacy Simulation Event & Audit Entry Aliases for compatibility
 */
export type SimulationEvent = AuditEvent;
export type AuditEntry = AuditEvent;

/**
 * Actionable Insight Card
 */
export interface ActionableInsight {
  id: string;
  priority: 'critical' | 'high' | 'warning' | 'info';
  type: 'hazard' | 'capacity' | 'route' | 'resource';
  title: string;
  location: string;
  whatHappened: string;
  whyItMatters: string;
  affectedHouseholds: number;
  affectedPopulation: number;
  source: string;
  freshness: string;
  actionLabel: string;
  actionRoute: string;
}
