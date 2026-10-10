import React from 'react';
import type { SimulationStepId } from '../../types';
import { SIMULATION_STATES } from '../../data/simulationData';

interface SimulationControllerProps {
  currentStep: SimulationStepId;
  onStepChange: (step: SimulationStepId) => void;
  onReset: () => void;
}

const STEP_MICRO_LABELS: Record<SimulationStepId, { num: string; tag: string }> = {
  1: { num: 'S1', tag: 'Baseline' },
  2: { num: 'S2', tag: 'Surge (94%)' },
  3: { num: 'S3', tag: 'Cap Deficit' },
  4: { num: 'S4', tag: 'Plan V1' },
  5: { num: 'S5', tag: 'V1 Approved' },
  6: { num: '⚡ S6', tag: 'Bridge Fail' },
  7: { num: 'S7', tag: 'Invalidate' },
  8: { num: 'S8', tag: 'Alt Search' },
  9: { num: 'S9', tag: 'Plan V2' },
  10: { num: 'S10', tag: 'Re-Approved' },
};

export const SimulationController: React.FC<SimulationControllerProps> = ({
  currentStep,
  onStepChange,
  onReset,
}) => {
  const stateMeta = SIMULATION_STATES[currentStep];

  const handlePrev = () => {
    if (currentStep > 1) {
      onStepChange((currentStep - 1) as SimulationStepId);
    }
  };

  const handleNext = () => {
    if (currentStep < 10) {
      onStepChange((currentStep + 1) as SimulationStepId);
    }
  };

  const getPhaseBadgeColor = (phase: string) => {
    switch (phase) {
      case 'BASELINE':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'ASSESSMENT':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'INITIAL_PLAN':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'FIELD_EVENT':
        return 'bg-red-100 text-red-900 border-red-300 animate-none';
      case 'REPLANNING':
        return 'bg-orange-100 text-orange-950 border-orange-300';
      case 'STATUTORY_SIGN_OFF':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white border-b border-slate-300 px-3 py-1.5 shadow-xs shrink-0 flex flex-col gap-1.5">
      {/* Top Row: State Header, Badge, Simulated Time, and Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              OPERATIONAL SCENARIO:
            </span>
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-mono-code">
              STATE {currentStep} / 10
            </span>
          </div>

          <span
            className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wider ${getPhaseBadgeColor(
              stateMeta.phaseCategory
            )}`}
          >
            {stateMeta.phaseCategory.replace('_', ' ')}
          </span>

          <span className="text-[11px] font-bold text-slate-900 truncate">
            {stateMeta.title}
          </span>
        </div>

        {/* Playback Controls & Timestamp */}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="text-[10.5px] font-mono-code font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mr-1">
            ⏱ {stateMeta.simulatedTime}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Reset simulation to State 1"
          >
            ⏮ Reset
          </button>

          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${
              currentStep === 1
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            ◀ Prev Event
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentStep === 10}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${
              currentStep === 10
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-navy-900 text-white border-navy-900 hover:bg-navy-800'
            }`}
          >
            Next Event ▶
          </button>
        </div>
      </div>

      {/* Narrative Detail Row */}
      <div className="text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 leading-snug flex items-center justify-between gap-2">
        <span className="truncate">
          <strong className="text-slate-900">Operational Event:</strong> {stateMeta.shortDescription}
        </span>
        <span className="text-[10px] text-slate-500 font-mono-code shrink-0">
          ID: {stateMeta.code}
        </span>
      </div>

      {/* Interactive 10-Step Timeline Buttons with Micro-Labels */}
      <div className="grid grid-cols-10 gap-1 pt-0.5">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as SimulationStepId[]).map((step) => {
          const isCurrent = step === currentStep;
          const isPassed = step < currentStep;
          const isEvent = step === 6;
          const label = STEP_MICRO_LABELS[step];

          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepChange(step)}
              className={`py-1 px-0.5 rounded text-center transition-all border flex flex-col items-center justify-center ${
                isCurrent
                  ? isEvent
                    ? 'bg-red-100 border-red-600 ring-2 ring-red-500 shadow-xs'
                    : 'bg-blue-100/90 border-blue-600 ring-2 ring-blue-500 shadow-xs'
                  : isPassed
                  ? 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300'
                  : isEvent
                  ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={`Jump to State ${step}: ${SIMULATION_STATES[step].title}`}
            >
              <span
                className={`text-[9.5px] font-extrabold leading-none ${
                  isCurrent
                    ? isEvent
                      ? 'text-red-950'
                      : 'text-navy-950'
                    : isEvent
                    ? 'text-red-900'
                    : 'text-slate-800'
                }`}
              >
                {label.num}
              </span>
              <span
                className={`text-[7.5px] font-bold leading-tight truncate max-w-full ${
                  isCurrent
                    ? isEvent
                      ? 'text-red-900'
                      : 'text-blue-900'
                    : isEvent
                    ? 'text-red-700'
                    : isPassed
                    ? 'text-slate-600'
                    : 'text-slate-500'
                }`}
              >
                {label.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SimulationController;
