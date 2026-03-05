import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface WorkflowSection {
  title: string;
  items: string[];
  route?: string;
}

const workflowSections: WorkflowSection[] = [
  {
    title: "CRM",
    items: [
      "Create New Lead",
      "Needs Scheduling",
      "Assigned Lead",
      "Walk Through",
      "Action Needed",
      "Estimate Status",
      "Bid Room",
      "Quote Accepted",
      "Project Handoff",
      "Project Complete",
      "Smart Bid",
    ],
    route: "/admin/crm",
  },
  {
    title: "SMART ESTIMATE",
    items: [
      "Walkthrough",
      "Pictures/Videos",
      "Measurements",
      "Whiteboard",
      "Estimate in Progress",
      "AI Generated Scope",
      "3D Rendering",
      "Architect Bid",
      "Interior Design Bid",
      "Scope Sent",
      "Scope Approved",
      "Sent to Bidroom",
    ],
  },
  {
    title: "HOMEOWNERS",
    items: [
      "Active Projects",
      "Needs Assistance",
      "Site Visit Request",
      "Needs Survey",
      "Needs Architect",
      "Action Needed",
    ],
  },
  {
    title: "SMART HUB",
    items: [
      "Estimators",
      "Project Coordinator",
      "Success Manager",
      "Contractor Onboarding",
      "Architect Onboarding",
      "Vendor Onboarding",
    ],
  },
  {
    title: "CONTRACTOR HUB",
    items: [],
    route: "/contractors",
  },
  {
    title: "ARCHITECT HUB",
    items: [],
    route: "/architects",
  },
  {
    title: "VENDOR HUB",
    items: [],
    route: "/admin/vendors",
  },
  {
    title: "MY OFFICE",
    items: [
      "Accounting",
      "Reports",
      "2 Year",
      "5 Year",
      "10 Year",
    ],
  },
  {
    title: "SMART WARRANTY",
    items: [
      "Create Warranty",
      "Warranty Inquiry",
    ],
  },
  {
    title: "MESSAGING",
    items: [],
  },
];

export function WorkflowNav() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  const handleItemClick = (section: string, item: string) => {
    toast({
      title: "Workflow Action",
      description: `${section}: ${item}`,
    });
    setOpenSection(null);
    
    // Navigate to workflow view with filter
    navigate(`/admin/workflow?section=${encodeURIComponent(section)}&item=${encodeURIComponent(item)}`);
  };

  const handleSectionClick = (section: WorkflowSection) => {
    if (section.route) {
      navigate(section.route);
    } else if (section.items.length > 0) {
      toggleSection(section.title);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={navRef} className="hidden md:block border-b bg-background sticky top-0 z-40">
      <div className="flex overflow-x-auto scrollbar-thin scroll-smooth">
        {workflowSections.map((section) => (
          <div key={section.title} className="relative group">
            <button
              onClick={() => handleSectionClick(section)}
              className={cn(
                "px-4 py-3 text-xs font-medium whitespace-nowrap border-r transition-colors flex items-center gap-1",
                "hover:bg-muted/50 active:bg-muted",
                openSection === section.title && "bg-muted",
                (section.items.length > 0 || section.route) && "cursor-pointer"
              )}
            >
              <span>{section.title}</span>
              {section.items.length > 0 && (
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform flex-shrink-0",
                    openSection === section.title && "rotate-180"
                  )}
                />
              )}
            </button>

            {/* Dropdown menu */}
            {section.items.length > 0 && openSection === section.title && (
              <div className="absolute top-full left-0 z-50 min-w-[220px] bg-background border border-border rounded-md shadow-lg animate-fade-in">
                <div className="py-1 max-h-[400px] overflow-y-auto">
                  {section.items.map((item) => (
                    <button
                      key={item}
                      className="w-full px-4 py-2.5 text-xs text-left text-foreground hover:bg-muted hover:text-foreground transition-colors active:bg-muted/70"
                      onClick={() => handleItemClick(section.title, item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
