import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';

const DEFAULT_SIDEBAR_WIDTH = 185;
const MIN_SIDEBAR_WIDTH = 150;
const MAX_SIDEBAR_WIDTH = 280;

export default function AppShell() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('aegis.sidebar.collapsed');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth < 1024;
    } catch {
      return false;
    }
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aegis.sidebar.width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= MIN_SIDEBAR_WIDTH && val <= MAX_SIDEBAR_WIDTH) {
          return val;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);

  // Monitor screen width changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aegis.sidebar.collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl + B toggles navigation rail
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCollapsed || isMobile) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const newWidth = Math.min(Math.max(dragStartWidth.current + deltaX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
    setSidebarWidth(newWidth);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        localStorage.setItem('aegis.sidebar.width', sidebarWidth.toString());
      } catch {}
    }
  };

  const currentWidth = (isMobile || isCollapsed) ? 0 : sidebarWidth;

  return (
    <div 
      className="aegis-shell"
      style={{
        gridTemplateColumns: `${currentWidth}px 1fr`,
        transition: isDragging ? 'none' : 'grid-template-columns 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <Header isSidebarCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />
      
      {/* Mobile Backdrop Overlay */}
      {isMobile && !isCollapsed && (
        <div 
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/60 z-[550] backdrop-blur-xs transition-opacity"
          aria-label="Close navigation overlay"
        />
      )}

      {/* Sidebar Rail Container */}
      <div 
        className={`${
          isMobile 
            ? 'fixed inset-y-0 left-0 z-[600] top-12 shadow-2xl transition-transform duration-200' 
            : 'overflow-hidden relative flex flex-col h-full'
        } aegis-sidebar-container`}
        style={{
          width: isMobile ? '240px' : `${currentWidth}px`,
          transform: isMobile && isCollapsed ? 'translateX(-100%)' : 'none',
          visibility: !isMobile && isCollapsed ? 'hidden' : 'visible',
          transition: isDragging ? 'none' : isMobile ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <Sidebar />
      </div>

      {/* Main Workspace Canvas */}
      <main className="aegis-main relative overflow-hidden">
        <Outlet />

        {/* ============================================================ */}
        {/* SLIDER TOGGLE BAR (Vertical Divider between Sidebar & Map)   */}
        {/* ============================================================ */}
        {!isMobile && (
          <div 
            className="absolute inset-y-0 left-0 z-[500] pointer-events-none select-none"
            style={{ width: '24px', marginLeft: isCollapsed ? '0px' : '-4px' }}
          >
            {/* Draggable Rail Strip */}
            {!isCollapsed && (
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
                className={`pointer-events-auto absolute inset-y-0 left-0 w-2 cursor-col-resize group flex items-center justify-center transition-colors ${
                  isDragging ? 'bg-[#2563A6]' : 'hover:bg-[#2563A6]/40'
                }`}
                title="Drag horizontally to slide/resize navigation rail · Double click to reset"
              >
                <div className={`w-0.5 h-full transition-colors ${isDragging ? 'bg-[#38BDF8]' : 'group-hover:bg-[#2563A6]'}`} />
              </div>
            )}

            {/* Toggle Tab Button (Slider Handle) */}
            <button
              type="button"
              onClick={toggleSidebar}
              className={`pointer-events-auto absolute top-24 z-50 flex items-center justify-center bg-black/90 text-white border border-white/20 hover:text-white hover:bg-black hover:border-white/40 shadow-xl backdrop-blur-md transition-all cursor-pointer ${
                isCollapsed
                  ? 'left-0 w-5 h-11 rounded-r-xl border-l-0'
                  : 'left-0 w-4 h-10 rounded-r-lg -ml-0.5'
              }`}
              title={isCollapsed ? 'Expand Navigation Rail (Ctrl+B)' : 'Collapse Navigation Rail (Ctrl+B)'}
              aria-label={isCollapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ChevronLeft className="w-3 h-3 stroke-[2.5]" />
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
