import { Button } from '../components/common/Button';
import { RiskBadge, DataSemanticBadge } from '../components/common/Badge';
import { AuthorityBadge } from '../components/common/AuthorityBadge';
import { Card, CardHeader, CardBody, CardFooter } from '../components/common/Card';
import { StatusIndicator } from '../components/common/StatusIndicator';

export default function DesignFoundationPreview() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-title-lg">Step 1 — Design System Foundation</h1>
          <p className="text-body-regular text-slate-600">
            Government Disaster-Management Decision Support UI Foundation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSemanticBadge type="DEMO_DATA" />
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
            Phase 1B · Step 1 Ready
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Risk Semantics & Status Tokens */}
        <Card>
          <CardHeader
            title="1. Semantic Risk & Status Tokens"
            badge={<DataSemanticBadge type="DERIVED_DATA" />}
          />
          <CardBody className="space-y-4">
            <div>
              <div className="text-caption-bold mb-2">Static Risk Levels (No Flashing / No Glow)</div>
              <div className="flex flex-wrap gap-2">
                <RiskBadge level="critical">Critical Hazard (Slope Failure)</RiskBadge>
                <RiskBadge level="high">High Risk (Rainfall Escalation)</RiskBadge>
                <RiskBadge level="warning">Warning (Stale Telemetry)</RiskBadge>
                <RiskBadge level="safe">Verified Safe (Route R212)</RiskBadge>
                <RiskBadge level="info">Advisory Info</RiskBadge>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-caption-bold mb-2">Status & Freshness Indicators</div>
              <div className="flex flex-wrap items-center gap-4">
                <StatusIndicator status="operational" label="Sensor Online" />
                <StatusIndicator status="stale" label="Stale Telemetry (3h 42m)" />
                <StatusIndicator status="critical" label="Route Impassable" />
                <StatusIndicator status="info" label="Standing Advisory" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 2. Data Provenance & Classification */}
        <Card>
          <CardHeader
            title="2. Data Classification Semantics"
            badge={<DataSemanticBadge type="SOURCE_DATA" />}
          />
          <CardBody className="space-y-4">
            <p className="text-xs text-slate-600">
              Every data item explicitly identifies whether it is verified source data, calculated analytics, an AEGIS advisory option, or simulated demo data:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <DataSemanticBadge type="SOURCE_DATA" />
                <div className="text-xs font-semibold text-slate-800 mt-1">IMD Doppler Gauge</div>
                <div className="text-[11px] text-slate-500 font-mono-code">204mm / 24h · 8m ago</div>
              </div>
              <div className="p-2.5 rounded bg-purple-50/50 border border-purple-200">
                <DataSemanticBadge type="DERIVED_DATA" />
                <div className="text-xs font-semibold text-purple-900 mt-1">Soil Saturation Index</div>
                <div className="text-[11px] text-purple-700 font-mono-code">94.2% Critical Threshold</div>
              </div>
              <div className="p-2.5 rounded bg-indigo-50/50 border border-indigo-200">
                <DataSemanticBadge type="AEGIS_RECOMMENDATION" />
                <div className="text-xs font-semibold text-indigo-950 mt-1">Relocation Plan V1</div>
                <div className="text-[11px] text-indigo-700">Advisory: 3 Shelters</div>
              </div>
              <div className="p-2.5 rounded bg-amber-50/50 border border-amber-200">
                <DataSemanticBadge type="DEMO_DATA" />
                <div className="text-xs font-semibold text-amber-950 mt-1">Wayanad Scenario</div>
                <div className="text-[11px] text-amber-700">Mundakkai Mock Telemetry</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 3. Human Authority vs AEGIS Roles */}
        <Card>
          <CardHeader
            title="3. Statutory Authority Hierarchy"
            badge={<span className="text-[10px] font-bold text-slate-600">DMA 2005 COMPLIANT</span>}
          />
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-600">
              Clear distinction between human executive powers and algorithmic decision support:
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <AuthorityBadge role="SRC_KSEOC" />
                <span className="text-[11px] text-slate-600">State Resource Concurrence</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <AuthorityBadge role="DISTRICT_COLLECTOR" />
                <span className="text-[11px] text-slate-600">Statutory Relocation Sign-off</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <AuthorityBadge role="TAHSILDAR" />
                <span className="text-[11px] text-slate-600">Taluk Incident Verification</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <AuthorityBadge role="FIELD_OFFICER" />
                <span className="text-[11px] text-slate-600">Ground Observation & Obstacles</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200">
                <AuthorityBadge role="AEGIS_ADVISORY" />
                <span className="text-[11px] font-semibold text-blue-900">Optimization & Recommendation</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 4. Action Buttons & Approval Workflow */}
        <Card>
          <CardHeader
            title="4. Operational Actions & Review"
            badge={<span className="text-[10px] font-bold text-amber-700">HUMAN IN THE LOOP</span>}
          />
          <CardBody className="space-y-4">
            {/* Human Approval Banner */}
            <div className="human-approval-banner">
              <div>
                <div className="human-approval-title">
                  <span>⚠</span>
                  <span>Human Approval Required</span>
                </div>
                <div className="human-approval-subtitle">
                  Reviewing Authority: District Collector (DDMA Incident Commander)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="success" size="sm">APPROVE</Button>
                <Button variant="secondary" size="sm">MODIFY</Button>
                <Button variant="danger" size="sm">REJECT</Button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-caption-bold mb-2">Standard Action Button Styles</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Generate Plan</Button>
                <Button variant="secondary">View Analysis</Button>
                <Button variant="success">Approve Reassignment</Button>
                <Button variant="danger">Invalidate Assignment</Button>
                <Button variant="secondary" disabled>Disabled Action</Button>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex items-center justify-between text-xs text-slate-500">
            <span>Audit Standard: Immutable Event-Sourced Log</span>
            <span className="font-mono-code">Step 1 Verification</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
