"use client";

import * as React from "react";

import { useViewportUnits } from "@/lib/useViewportUnits";

export function ViewportUnitsInitializer(): React.ReactNode {
  useViewportUnits();
  return null;
}
