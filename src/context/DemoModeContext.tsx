import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface DemoContractor {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface DemoModeContextType {
  isDemoMode: boolean;
  demoContractor: DemoContractor | null;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_CONTRACTOR: DemoContractor = {
  id: "demo-contractor-001",
  full_name: "Demo Contractor",
  company_name: "Demo Construction LLC",
  email: "demo@smartreno.io",
  role: "contractor",
  avatar_url: null,
};

const DEMO_MODE_KEY = "smartreno_demo_mode";

export function DemoModeProvider({ children }: { children: ReactNode }) {
  // Demo mode is permanently disabled
  const enterDemoMode = () => {
    // Demo mode is disabled - do nothing
    console.log("Demo mode is disabled");
  };

  const exitDemoMode = () => {
    // No-op since demo mode is disabled
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode: false,
        demoContractor: null,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
}
