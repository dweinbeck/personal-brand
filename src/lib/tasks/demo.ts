"use client";

import { createContext, useContext } from "react";

const DemoModeContext = createContext<boolean>(false);

export const DemoModeProvider = DemoModeContext.Provider;

export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}
