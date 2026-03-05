import { Navigate } from "react-router-dom";

export default function TeamJoin() {
  // Redirect all team join requests to the Coming Soon page
  return <Navigate to="/contractor/auth" replace />;
}
