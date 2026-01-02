"use client";

import * as React from "react";

type UseViewportUnitsResult = Readonly<Record<never, never>>;

function setAppViewportHeight(): void {
  const height = window.visualViewport?.height ?? window.innerHeight;
  const nextVh = `${height}px`;
  document.documentElement.style.setProperty("--app-vh", nextVh);
}

export function useViewportUnits(): UseViewportUnitsResult {
  const stableResult = React.useMemo<UseViewportUnitsResult>(() => ({}), []);

  React.useEffect(() => {
    let rafId: number | null = null;

    const scheduleUpdate = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setAppViewportHeight();
      });
    };

    setAppViewportHeight();

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener("resize", scheduleUpdate);
      visualViewport.addEventListener("scroll", scheduleUpdate);
    }

    return () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);

      if (visualViewport) {
        visualViewport.removeEventListener("resize", scheduleUpdate);
        visualViewport.removeEventListener("scroll", scheduleUpdate);
      }
    };
  }, []);

  return stableResult;
}
