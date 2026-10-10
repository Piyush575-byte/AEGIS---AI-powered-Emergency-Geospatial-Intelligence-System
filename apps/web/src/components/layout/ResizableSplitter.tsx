import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface ResizableSplitterProps {
  orientation: 'horizontal' | 'vertical';
  value: number; // Pixels for horizontal, Percentage for vertical
  min: number;
  max: number;
  onChange: (newValue: number) => void;
  onDragEnd?: () => void;
  ariaLabel: string;
  className?: string;
}

export const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  orientation,
  value,
  min,
  max,
  onChange,
  onDragEnd,
  ariaLabel,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ mouseX: 0, mouseY: 0, initialValue: 0 });
  const splitterRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialValue: value,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;

      if (orientation === 'horizontal') {
        const deltaY = e.clientY - startPosRef.current.mouseY;
        const rawNewValue = startPosRef.current.initialValue + deltaY;
        const clampedValue = Math.round(Math.min(Math.max(rawNewValue, min), max));
        onChange(clampedValue);
      } else {
        // Vertical splitter: calculating width percentage relative to parent container
        const parent = splitterRef.current?.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const rawPercent = (offsetX / rect.width) * 100;
          const clampedPercent = Math.round(Math.min(Math.max(rawPercent, min), max) * 10) / 10;
          onChange(clampedPercent);
        } else {
          // Fallback delta calculation
          const deltaX = e.clientX - startPosRef.current.mouseX;
          const deltaPercent = (deltaX / window.innerWidth) * 100;
          const rawPercent = startPosRef.current.initialValue + deltaPercent;
          const clampedPercent = Math.round(Math.min(Math.max(rawPercent, min), max) * 10) / 10;
          onChange(clampedPercent);
        }
      }
    },
    [isDragging, orientation, min, max, onChange]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (isDragging) {
        setIsDragging(false);
        try {
          if (splitterRef.current && splitterRef.current.hasPointerCapture(e.pointerId)) {
            splitterRef.current.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore pointer release errors
        }
        if (onDragEnd) {
          onDragEnd();
        }
      }
    },
    [isDragging, onDragEnd]
  );

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = orientation === 'horizontal' ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp, orientation]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = orientation === 'horizontal' ? 6 : 1.5;
    if (orientation === 'horizontal') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onChange(Math.min(value + step, max));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onChange(Math.max(value - step, min));
      }
    } else {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onChange(Math.min(value + step, max));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onChange(Math.max(value - step, min));
      }
    }
  };

  if (orientation === 'horizontal') {
    return (
      <div
        ref={splitterRef}
        role="separator"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        className={`w-full h-2.5 bg-slate-200/90 hover:bg-slate-300/90 active:bg-navy-700 cursor-ns-resize flex items-center justify-center border-y border-slate-300 transition-colors select-none shrink-0 z-20 ${
          isDragging ? 'bg-navy-800 border-navy-950' : ''
        } ${className}`}
        title="Drag vertically or use Arrow Up/Down to adjust timeline height"
      >
        <div className="flex items-center gap-1 opacity-70">
          <div className="w-6 h-[2px] bg-slate-600 rounded-full" />
          <div className="w-1 h-1 bg-slate-600 rounded-full" />
          <div className="w-6 h-[2px] bg-slate-600 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={splitterRef}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={`w-2.5 bg-slate-200/90 hover:bg-slate-300/90 active:bg-navy-700 cursor-ew-resize flex flex-col items-center justify-center border-x border-slate-300 transition-colors select-none shrink-0 z-20 ${
        isDragging ? 'bg-navy-800 border-navy-950' : ''
      } ${className}`}
      title="Drag horizontally or use Arrow Left/Right to adjust map vs command panel width"
    >
      <div className="flex flex-col items-center gap-1 opacity-70">
        <div className="w-[2px] h-6 bg-slate-600 rounded-full" />
        <div className="w-1 h-1 bg-slate-600 rounded-full" />
        <div className="w-[2px] h-6 bg-slate-600 rounded-full" />
      </div>
    </div>
  );
};

export default ResizableSplitter;
