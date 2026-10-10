import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ShieldCheck, History } from 'lucide-react';

export type PlanStatusType =
  | 'draft'
  | 'formulated'
  | 'pending_approval'
  | 'pending_human_approval'
  | 'approved'
  | 'rejected'
  | 'superseded'
  | 'invalidated'
  | 'archived'
  | 'not_created';

export interface PlanVersionItem {
  id?: string;
  version: number;
  code: string;
  title?: string;
  status: PlanStatusType;
  statusLabel: string;
  statusDescription?: string;
  isCurrentActive: boolean;
  evacueesCount?: number;
  shelterName?: string;
  routeCode?: string;
  routeName?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

interface PlanSelectorPopoverProps {
  plans: PlanVersionItem[];
  viewingVersion: number;
  activeOperationalVersion: number;
  onSelectPlan: (version: number) => void;
  statusDescriptor?: string;
  incidentNotice?: string;
  secondaryControls?: React.ReactNode;
}

export default function PlanSelectorPopover({
  plans,
  viewingVersion,
  activeOperationalVersion,
  onSelectPlan,
  statusDescriptor,
  incidentNotice,
  secondaryControls,
}: PlanSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const viewingPlan = plans.find((p) => p.version === viewingVersion) || plans[0];
  const isViewingHistorical = viewingVersion !== activeOperationalVersion;

  // Helper for status dot color
  const getStatusDotColor = (status: PlanStatusType) => {
    switch (status) {
      case 'approved':
        return 'bg-[#027A48]'; // Green
      case 'pending_approval':
      case 'pending_human_approval':
        return 'bg-amber-500'; // Amber
      case 'rejected':
        return 'bg-[#DC2626]'; // Red
      case 'draft':
      case 'formulated':
        return 'bg-[#2563A6]'; // Blue
      case 'superseded':
      case 'invalidated':
      case 'archived':
        return 'bg-slate-400'; // Slate
      case 'not_created':
      default:
        return 'bg-slate-300';
    }
  };

  // Helper for status badge styling
  const getStatusBadgeClasses = (status: PlanStatusType) => {
    switch (status) {
      case 'approved':
        return 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]';
      case 'pending_approval':
      case 'pending_human_approval':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      case 'rejected':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      case 'draft':
      case 'formulated':
        return 'bg-[#EFF6FF] text-[#1D5B99] border-[#BFDBFE]';
      case 'superseded':
      case 'invalidated':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2 select-none" ref={containerRef}>
      {/* 1. Main Header Pill Container */}
      <div className="glass-pill-light rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-sm shadow-xs border border-slate-300">
        {/* Toggleable Plan Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[14px] transition cursor-pointer border ${
            isOpen
              ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20'
              : isViewingHistorical
              ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          title="Click to view and select available plan versions"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDotColor(
              viewingPlan?.status || 'approved'
            )}`}
          />
          <span className="tracking-tight font-bold text-[#172033]">
            Plan V{viewingVersion}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-700 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Operational Status Descriptor */}
        <div className="flex items-center gap-2 pr-1 min-w-0">
          {statusDescriptor ? (
            <span
              className={`px-3 py-1 rounded-md text-[13px] font-semibold border whitespace-nowrap truncate max-w-[180px] sm:max-w-[280px] md:max-w-none ${getStatusBadgeClasses(
                viewingPlan?.status || 'approved'
              )}`}
              title={statusDescriptor}
            >
              {statusDescriptor}
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-md text-[13px] font-semibold border whitespace-nowrap truncate max-w-[180px] sm:max-w-[280px] md:max-w-none ${getStatusBadgeClasses(
                viewingPlan?.status || 'approved'
              )}`}
              title={viewingPlan?.statusLabel || 'Active Operational Plan'}
            >
              {viewingPlan?.statusLabel || 'Active operational plan'}
            </span>
          )}

          {/* Inspection Mode Indicator Banner (when viewing historical plan) */}
          {isViewingHistorical && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-[12px] text-amber-900">
              <History className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-semibold">Viewing historical Plan V{viewingVersion}</span>
              <span className="text-amber-800">· Active: V{activeOperationalVersion}</span>
              <button
                type="button"
                onClick={() => onSelectPlan(activeOperationalVersion)}
                className="underline font-bold text-amber-900 hover:text-black ml-1 cursor-pointer"
                title="Switch back to current active operational plan"
              >
                Return to active
              </button>
            </div>
          )}
        </div>

        {/* Secondary Simulator & Reset Controls */}
        {secondaryControls && (
          <>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-1.5">{secondaryControls}</div>
          </>
        )}
      </div>

      {/* 2. Floating Popover Anchored Directly Below the Button */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-2xl z-[1200] overflow-hidden text-sm text-[#172033] border border-slate-300 animate-in fade-in duration-150">
          {/* Popover Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 block leading-tight">
                Relocation plans
              </span>
              <span className="text-[13px] text-slate-900 font-semibold">
                {incidentNotice || 'Operational versions & decision ledger'}
              </span>
            </div>
            <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {plans.filter((p) => p.status !== 'not_created').length}{' '}
              {plans.filter((p) => p.status !== 'not_created').length === 1
                ? 'plan available'
                : 'plans available'}
            </span>
          </div>

          {/* Popover Plan Version List */}
          <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto" role="listbox">
            {plans.map((plan) => {
              const isSelected = plan.version === viewingVersion;
              const isClickable = plan.status !== 'not_created';

              return (
                <div
                  key={plan.version}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (isClickable) {
                      onSelectPlan(plan.version);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 rounded-lg transition border ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 text-[#172033] shadow-xs'
                      : isClickable
                      ? 'bg-white hover:bg-slate-50 border-slate-200 text-[#172033] cursor-pointer'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Row 1: Radio Indicator + Plan Code + Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded-full border ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : isClickable
                            ? 'border-slate-400 bg-white'
                            : 'border-slate-300 bg-slate-100'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="font-bold text-[14px] text-[#172033]">
                        {plan.code || `Plan V${plan.version}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.isCurrentActive ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                          Current active
                        </span>
                      ) : plan.status === 'superseded' || plan.status === 'invalidated' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                          Superseded
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Row 2: Status Text with Colored Semantic Dot */}
                  <div className="mt-1.5 pl-6 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(
                        plan.status
                      )}`}
                    />
                    <span className="text-[13px] font-semibold text-slate-800">
                      {plan.statusLabel}
                    </span>
                  </div>

                  {/* Row 3: Operational Allocation Details (Shelter, Route, Evacuees) */}
                  {(plan.shelterName || plan.routeCode || plan.evacueesCount) && (
                    <div className="mt-1 pl-6 text-[13px] text-slate-700 font-medium flex items-center gap-1.5 flex-wrap tabular-nums">
                      {plan.evacueesCount && <span>{plan.evacueesCount} evacuees</span>}
                      {plan.routeCode && <span>· Corridor {plan.routeCode}</span>}
                      {plan.shelterName && (
                        <span className="truncate max-w-[200px]">· {plan.shelterName}</span>
                      )}
                    </div>
                  )}

                  {/* Row 4: Statutory Approval / Invalidation Metadata */}
                  {plan.approvedBy && (
                    <div className="mt-1 pl-6 text-xs text-slate-600">
                      Authorized by: {plan.approvedBy}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Popover Footer: Calm Government Audit Ledger Notice */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 font-medium flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="font-semibold text-slate-800">Cryptographically linked audit ledger</span>
            </div>
            <span className="font-mono text-xs text-slate-600">PostGIS & MCDA</span>
          </div>
        </div>
      )}
    </div>
  );
}
