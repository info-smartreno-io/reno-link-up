import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export default function ContractorDemoLanding() {
  // Demo mode is disabled - redirect to auth page
  return <Navigate to="/contractor/auth" replace />;
}
