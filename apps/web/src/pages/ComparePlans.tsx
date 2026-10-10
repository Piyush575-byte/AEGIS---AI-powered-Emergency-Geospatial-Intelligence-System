import { mockPlanV1, mockPlanV2, mockPlanV3 } from '../data/mockData';
import { formatDateTime } from '../utils/formatters';
import { DataSemanticBadge } from '../components/common/Badge';

export default function ComparePlans() {
  const plans = [mockPlanV1, mockPlanV2, mockPlanV3];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-title-lg">Compare Relocation Plans</h1>
          <p className="text-body-regular text-slate-600">
            Track how relocation plans evolved in response to changing field conditions.
          </p>
        </div>
        <DataSemanticBadge type="DEMO_DATA" />
      </div>

      {/* Plan Version Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="aegis-card">
            <div className="aegis-card-header">
              <span className="font-bold text-xs">Plan V{plan.version}</span>
              <span className={`aegis-badge ${
                plan.status === 'approved' ? 'aegis-badge-safe' : 'aegis-badge-warning'
              }`}>
                {plan.status === 'pending_approval' ? 'PENDING' : plan.status.toUpperCase()}
              </span>
            </div>
            <div className="aegis-card-body text-xs space-y-1.5">
              <div className="text-slate-500 font-mono-code">
                {formatDateTime(plan.timestamp)}
              </div>
              <div className="text-slate-800">
                {plan.triggerReason}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="aegis-card">
        <div className="aegis-card-header">
          <span className="text-title-md">Allocation Comparison: V1 → V2</span>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                <th className="p-3">Shelter</th>
                <th className="p-3">Plan V1</th>
                <th className="p-3">Plan V2</th>
                <th className="p-3">Delta</th>
                <th className="p-3">Causal Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-semibold text-slate-900">Meppadi Govt. HSS</td>
                <td className="p-3 text-slate-700">612 persons</td>
                <td className="p-3 text-red-700 font-bold">380 persons</td>
                <td className="p-3 text-red-700 font-bold">−232</td>
                <td className="p-3 text-slate-500 italic">Route R104 at risk / bridge damaged</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Kalpetta Community Hall</td>
                <td className="p-3 text-slate-700">503 persons</td>
                <td className="p-3 text-emerald-700 font-bold">612 persons</td>
                <td className="p-3 text-emerald-700 font-bold">+109</td>
                <td className="p-3 text-slate-500 italic">Absorbs displaced allocation via R212</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">St. Mary's School Vythiri</td>
                <td className="p-3 text-slate-700">380 persons</td>
                <td className="p-3 text-emerald-700 font-bold">503 persons</td>
                <td className="p-3 text-emerald-700 font-bold">+123</td>
                <td className="p-3 text-slate-500 italic">Secondary absorption via R318</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
