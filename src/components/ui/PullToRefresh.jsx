import React, { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

const THRESHOLD = 72; // px to pull before triggering

export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    if (containerRef.current?.scrollTop > 0) { startY.current = null; return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullY(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = null;
  }, [pullY, refreshing, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const showing = pullY > 4 || refreshing;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-y-auto relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{ height: showing ? `${Math.max(pullY, refreshing ? THRESHOLD : 0)}px` : 0 }}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center transition-transform",
            refreshing && "animate-spin"
          )}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)` }}
        >
          <RefreshCw className="w-4 h-4 text-purple-600" />
        </div>
      </div>
      {children}
    </div>
  );
}