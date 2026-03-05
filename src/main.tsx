import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGA4, initGTM } from "./utils/analytics";

// Initialize analytics
if (import.meta.env.PROD) {
  initGA4();
  initGTM();
}

createRoot(document.getElementById("root")!).render(<App />);
