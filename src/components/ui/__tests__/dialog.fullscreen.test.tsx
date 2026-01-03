import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

import { Dialog, FullscreenDialogContent } from "@/components/ui/dialog";
import { useViewportUnits } from "@/lib/useViewportUnits";
import { DialogTitle } from "@radix-ui/react-dialog";

function Harness() {
  useViewportUnits();

  return (
    <Dialog open>
      <FullscreenDialogContent id="fullscreen-dialog-content-test">
        <DialogTitle>Test Dialog</DialogTitle>
        <div id="fullscreen-dialog-child">Hello</div>
      </FullscreenDialogContent>
    </Dialog>
  );
}

describe("FullscreenDialogContent", () => {
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    vi.useFakeTimers();

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return window.setTimeout(() => cb(performance.now()), 0);
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      window.clearTimeout(id);
    });

    document.documentElement.style.removeProperty("--app-vh");
  });

  afterEach(() => {
    vi.useRealTimers();

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });

    vi.restoreAllMocks();
  });

  it("uses dynamic viewport height class and reacts to resize", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 700,
    });

    const { container } = render(<Harness />);

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.style.getPropertyValue("--app-vh")).toBe(
      "700px"
    );

    const content = document.querySelector(
      "#fullscreen-dialog-content-test"
    ) as HTMLElement | null;

    expect(content).not.toBeNull();
    expect(content?.className).toContain("h-[var(--app-vh)]");
    expect(content?.className).toContain("overflow-x-hidden");

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
});
