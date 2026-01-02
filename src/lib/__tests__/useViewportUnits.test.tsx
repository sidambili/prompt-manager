import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

import { useViewportUnits } from "@/lib/useViewportUnits";

function TestComponent() {
  useViewportUnits();
  return <div />;
}

describe("useViewportUnits", () => {
  const originalInnerHeight = window.innerHeight;
  const originalRaf = window.requestAnimationFrame;
  const originalCaf = window.cancelAnimationFrame;
  const originalVisualViewport = window.visualViewport;

  beforeEach(() => {
    vi.useFakeTimers();

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return window.setTimeout(() => cb(performance.now()), 0);
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      window.clearTimeout(id);
    });

    document.documentElement.style.removeProperty("--app-vh");

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();

    vi.restoreAllMocks();

    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCaf;

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport,
    });
  });

  it("sets --app-vh on mount", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 777,
    });

    render(<TestComponent />);

    expect(document.documentElement.style.getPropertyValue("--app-vh")).toBe(
      "777px"
    );
  });

  it("updates --app-vh on resize", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 600,
    });

    render(<TestComponent />);

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.style.getPropertyValue("--app-vh")).toBe(
      "500px"
    );
  });

  it("removes listeners on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<TestComponent />);

    unmount();

    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith(
      "orientationchange",
      expect.any(Function)
    );

    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith(
      "orientationchange",
      expect.any(Function)
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
