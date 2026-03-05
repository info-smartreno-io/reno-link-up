import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      const getCurrentPortal = () => {
        if (location.pathname.startsWith("/admin")) return "admin";
        if (location.pathname.startsWith("/contractor")) return "contractor";
        if (location.pathname.startsWith("/architect")) return "architect";
        if (location.pathname.startsWith("/estimator")) return "estimator";
        if (location.pathname.startsWith("/interiordesigner")) return "interiordesigner";
        return "public";
      };

      const portal = getCurrentPortal();

      // 'D' - Navigate to Dashboard
      if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        switch (portal) {
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "contractor":
            navigate("/contractor/dashboard");
            break;
          case "architect":
            navigate("/architect/dashboard");
            break;
          case "estimator":
            navigate("/estimator-dashboard");
            break;
          case "interiordesigner":
            navigate("/interiordesigner/dashboard");
            break;
          default:
            navigate("/");
        }
      }

      // 'N' - New/Create actions (context-sensitive)
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        // This can be expanded based on the current page
        // For now, navigate to common "create" pages
        if (location.pathname.includes("/leads")) {
          // Trigger create lead action if on leads page
          window.dispatchEvent(new CustomEvent("trigger-create-lead"));
        } else if (location.pathname.includes("/projects")) {
          // Trigger create project action if on projects page
          window.dispatchEvent(new CustomEvent("trigger-create-project"));
        } else if (location.pathname.includes("/estimates")) {
          // Trigger create estimate action if on estimates page
          window.dispatchEvent(new CustomEvent("trigger-create-estimate"));
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate, location]);
}
