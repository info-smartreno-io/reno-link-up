import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    path?: string;
  };
}

const routeConfig: BreadcrumbConfig = {
  // Architect routes
  "/architect/dashboard": { label: "Dashboard" },
  "/architect/bid-room": { label: "Bid Room" },
  "/architect/bid-submissions": { label: "Bid Submissions" },
  "/architect/messages": { label: "Messages" },
  "/architect/projects": { label: "Projects" },
  "/architect/proposals": { label: "Proposals" },
  
  // Estimator routes
  "/estimator/dashboard": { label: "Dashboard" },
  "/estimator/leads": { label: "Leads" },
  "/estimator/review-lead": { label: "Review Lead" },
  "/estimator/estimates": { label: "Estimates" },
  "/estimator/prepare-estimate": { label: "Prepare Estimate" },
  "/estimator/walkthroughs": { label: "Walkthroughs" },
  "/estimator/calendar": { label: "Calendar" },
  "/estimator/estimate-requests": { label: "Estimate Requests" },
  "/estimator/generate-scope": { label: "Generate Scope" },
  "/estimator/upload-photos": { label: "Upload Photos" },
  "/estimator/bid-review": { label: "Bid Review" },
  "/estimator/bid-analytics": { label: "Bid Analytics" },
  
  // Interior Designer routes
  "/interiordesigner/dashboard": { label: "Dashboard" },
  "/interiordesigner/bid-room": { label: "Bid Room" },
  
  // Contractor routes
  "/contractor/portal": { label: "Portal Home" },
  "/contractor/dashboard": { label: "Dashboard" },
  "/contractor/bid-room": { label: "Bid Room" },
  "/contractor/bids": { label: "My Bids" },
  "/contractor/calendar": { label: "Calendar" },
  "/contractor/estimates": { label: "Estimates" },
  "/contractor/pricing": { label: "Pricing" },
  "/contractor/projects": { label: "Projects" },
  "/contractor/project-management": { label: "Project Management" },
  "/contractor/team-management": { label: "Team Management" },
  "/contractor/user-applicants": { label: "User Applicants" },
  "/contractor/timelines": { label: "Timelines" },
  "/contractor/foreman-portal": { label: "Foreman Portal" },
  "/contractor/subcontractor-portal": { label: "Subcontractor Portal" },
  "/contractor/collections": { label: "Collections" },
  "/contractor/files": { label: "File Management" },
  "/contractor/outside-sales": { label: "Outside Sales" },
  "/contractor/inside-sales": { label: "Inside Sales" },
  "/contractor/coordinator-pipeline": { label: "Coordinator Pipeline" },
  "/contractor/project-manager-pipeline": { label: "Project Manager Pipeline" },
  "/contractor/ai": { label: "SmartReno AI Hub" },
  "/contractor/smartplan": { label: "SmartPlan Tasks" },
  "/contractor/warranty": { label: "Warranty & Service" },
  "/contractor/expenses": { label: "Expenses" },
  "/contractor/expense-reports": { label: "Expense Reports" },
  "/contractor/drive": { label: "SmartReno Drive" },
  "/contractor/photos": { label: "Photos" },
  "/contractor/finance": { label: "Finance & Billing" },
  "/contractor/messages": { label: "Messages" },
  "/contractor/help-center": { label: "Help Center" },
  "/contractor/vendors": { label: "Vendors" },
  "/contractor/orders": { label: "Orders" },
  "/contractor/contracts": { label: "Contracts" },
  "/contractor/change-orders": { label: "Change Orders" },
  "/contractor/invoices": { label: "Invoices" },
  "/contractor/permit-tracking": { label: "Permit Tracking" },
  "/contractor/sales-pipeline": { label: "Sales Pipeline" },
  "/contractor/sales-kpi": { label: "Sales Management" },
  "/contractor/team": { label: "Team" },
  
  // Admin routes
  "/admin/dashboard": { label: "Dashboard" },
  "/admin/analytics": { label: "Analytics" },
  "/admin/applications": { label: "Contractor Applications" },
  "/admin/architect-applications": { label: "Architect Assignments" },
  "/admin/architect-proposals": { label: "Architect Proposals" },
  "/admin/interior-designer-applications": { label: "Interior Designer Applications" },
  "/admin/vendor-applications": { label: "Vendor Applications" },
  "/admin/crm": { label: "CRM" },
  "/admin/change-orders": { label: "Change Orders" },
  "/admin/estimate-requests": { label: "Estimate Requests" },
  "/admin/invoicing": { label: "Invoicing" },
  "/admin/pricing": { label: "Pricing" },
  "/admin/project-assignments": { label: "Project Assignments" },
  "/admin/purchasing": { label: "Purchasing" },
  "/admin/quickbooks": { label: "QuickBooks" },
  "/admin/resources": { label: "Resources" },
  "/admin/schedule": { label: "Schedule" },
  "/admin/selections": { label: "Selections" },
  "/admin/user-management": { label: "User Management" },
  "/admin/vendors": { label: "Vendors" },
  "/admin/workflow": { label: "Workflow" },
  
  // Sales routes
  "/sales-performance": { label: "Sales Performance" },
  "/resource-capacity": { label: "Resource Capacity" },
};

const portalNames: { [key: string]: string } = {
  architect: "Architect Portal",
  estimator: "Construction Agent Portal",
  interiordesigner: "Interior Designer Portal",
  contractor: "Contractor Portal",
  admin: "Admin Portal",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  if (pathSegments.length === 0) return null;
  
  // Determine the portal type from the first segment
  const portalType = pathSegments[0];
  const portalName = portalNames[portalType];
  
  // Build breadcrumb items
  const breadcrumbItems: Array<{ label: string; path?: string; isLast: boolean }> = [];
  
  // Add portal home
  if (portalName) {
    breadcrumbItems.push({
      label: portalName,
      path: `/${portalType}/dashboard`,
      isLast: false,
    });
  }
  
  // Build path progressively
  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const config = routeConfig[currentPath];
    
    // Skip the first segment if it's the portal type (already added)
    if (index === 0 && portalName) return;
    
    if (config) {
      breadcrumbItems.push({
        label: config.label,
        path: index === pathSegments.length - 1 ? undefined : currentPath,
        isLast: index === pathSegments.length - 1,
      });
    }
  });
  
  // Don't show breadcrumbs if we're on the dashboard
  if (breadcrumbItems.length <= 1 && breadcrumbItems[0]?.path?.endsWith("/dashboard")) {
    return null;
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={index}>
            {item.isLast ? (
              <BreadcrumbPage className="text-foreground font-medium">
                {item.label}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link to={item.path!} className="text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
                {index < breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
