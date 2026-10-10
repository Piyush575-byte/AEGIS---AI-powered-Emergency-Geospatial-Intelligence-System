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
        return 'bg-[#94A3B8]'; // Muted slate
      case 'not_created':
      default:
        return 'bg-[#CBD5E1]';
    }
  };

  // Helper for status badge styling
  const getStatusBadgeClasses = (status: PlanStatusType) => {
    switch (status) {
      case 'approved':
        return 'bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]';
      case 'pending_approval':
      case 'pending_human_approval':
        return 'bg-[#FEF7C3] text-[#B54708] border-[#FEDF89]';
      case 'rejected':
        return 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA]';
      case 'draft':
      case 'formulated':
        return 'bg-[#EFF6FF] text-[#2563A6] border-[#BFDBFE]';
      case 'superseded':
      case 'invalidated':
        return 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]';
      default:
        return 'bg-[#F8FAFC] text-[#718096] border-[#D9E1EA]';
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2 select-none" ref={containerRef}>
      {/* 1. Main Header Pill Container */}
      <div className="glass-pill-light rounded-full px-2.5 py-1 flex items-center gap-2 text-xs">
        {/* Toggleable Plan Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-xs transition cursor-pointer border ${
            isOpen
              ? 'bg-[#EEF4FB] border-[#2563A6] text-[#172033] ring-2 ring-[#2563A6]/20'
              : isViewingHistorical
              ? 'bg-[#FFFBEB] border-amber-300 text-amber-900 hover:bg-[#FEF3C7]'
              : 'bg-white/80 hover:bg-white border-white/80 text-[#172033] shadow-2xs'
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
          <span className="tracking-tight font-extrabold text-black">
            PLAN V{viewingVersion}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-black transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Operational Status Descriptor */}
        <div className="flex items-center gap-2 pr-1 min-w-0">
          {statusDescriptor ? (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap truncate max-w-[150px] sm:max-w-[240px] md:max-w-none ${getStatusBadgeClasses(
                viewingPlan?.status || 'approved'
              )}`}
              title={statusDescriptor}
            >
              {statusDescriptor}
            </span>
          ) : (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap truncate max-w-[150px] sm:max-w-[240px] md:max-w-none ${getStatusBadgeClasses(
                viewingPlan?.status || 'approved'
              )}`}
              title={viewingPlan?.statusLabel || 'Active Operational Plan'}
            >
              {viewingPlan?.statusLabel || 'Active Operational Plan'}
            </span>
          )}

          {/* Inspection Mode Indicator Banner (when viewing historical plan) */}
          {isViewingHistorical && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FEF3C7] border border-[#FCD34D] text-[10.5px] text-[#92400E]">
              <History className="w-3 h-3 text-[#B45309]" />
              <span className="font-semibold">Viewing Historical Plan V{viewingVersion}</span>
              <span className="text-[#B45309]/70">· Active: V{activeOperationalVersion}</span>
              <button
                type="button"
                onClick={() => onSelectPlan(activeOperationalVersion)}
                className="underline font-bold text-[#78350F] hover:text-black ml-1 cursor-pointer"
                title="Switch back to current active operational plan"
              >
                Return to Active
              </button>
            </div>
          )}

          {/* Secondary Incident Notice - accessible via title/drawer, hidden in top pill to avoid toolbar overlap */}
        </div>

        {/* Secondary Simulator & Reset Controls (Subtly Placed) */}
        {secondaryControls && (
          <>
            <div className="h-3.5 w-px bg-black/15"></div>
            <div className="flex items-center gap-1">{secondaryControls}</div>
          </>
        )}
      </div>

      {/* 2. Floating Popover Anchored Directly Below the Button */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 glass-surface-light rounded-2xl shadow-2xl z-[1200] overflow-hidden text-xs text-black animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Popover Header */}
          <div className="px-3.5 py-2.5 bg-white/40 border-b border-black/10 backdrop-blur-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-black block leading-tight">
                Relocation Plans
              </span>
              <span className="text-[11px] text-black font-semibold">
                {incidentNotice || 'Operational versions & decision ledger'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#2563A6] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-full">
              {plans.filter((p) => p.status !== 'not_created').length}{' '}
              {plans.filter((p) => p.status !== 'not_created').length === 1
                ? 'Plan Available'
                : 'Plans Available'}
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
                  className={`p-2.5 rounded-lg transition border ${
                    isSelected
                      ? 'bg-[#F0F6FE] border-[#BFDBFE] text-black shadow-xs'
                      : isClickable
                      ? 'bg-white hover:bg-[#F8FAFC] border-black/15 text-black cursor-pointer'
                      : 'bg-[#F8FAFC] border-black/10 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Row 1: Radio Indicator + Plan Code + Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded-full border ${
                          isSelected
                            ? 'border-[#2563A6] bg-[#2563A6]'
                            : isClickable
                            ? 'border-[#94A3B8] bg-white'
                            : 'border-[#CBD5E1] bg-[#F1F5F9]'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span
                        className="font-extrabold text-xs text-black"
                      >
                        {plan.code || `PLAN V${plan.version}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.isCurrentActive ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                          Current
                        </span>
                      ) : plan.status === 'superseded' || plan.status === 'invalidated' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-black/5 text-black border border-black/15">
                          Superseded
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Row 2: Status Text with Colored Semantic Dot */}
                  <div className="mt-1.5 pl-6 flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDotColor(
                        plan.status
                      )}`}
                    />
                    <span className="text-[11px] font-bold text-black">
                      {plan.statusLabel}
                    </span>
                  </div>

                  {/* Row 3: Operational Allocation Details (Shelter, Route, Evacuees) */}
                  {(plan.shelterName || plan.routeCode || plan.evacueesCount) && (
                    <div className="mt-1 pl-6 text-[10.5px] text-black font-semibold flex items-center gap-1.5 flex-wrap">
                      {plan.evacueesCount && <span>{plan.evacueesCount} evacuees</span>}
                      {plan.routeCode && <span>· Corridor {plan.routeCode}</span>}
                      {plan.shelterName && (
                        <span className="truncate max-w-[200px]">· {plan.shelterName}</span>
                      )}
                    </div>
                  )}

                  {/* Row 4: Statutory Approval / Invalidation Metadata */}
                  {plan.approvedBy && (
                    <div className="mt-1 pl-6 text-[10px] text-black font-semibold">
                      Auth: {plan.approvedBy}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Popover Footer: Calm Government Audit Ledger Notice */}
          <div className="px-3.5 py-2 bg-[#F8FAFC] border-t border-black/10 text-[10px] text-black font-semibold flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563A6]" />
              <span className="font-bold text-black">Cryptographically Linked Audit Ledger</span>
            </div>
            <span className="font-mono text-[9px] text-black font-bold">PostGIS & MCDA</span>
          </div>
        </div>
      )}
    </div>
  );
}
