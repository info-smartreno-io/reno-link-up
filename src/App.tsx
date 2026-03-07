import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePageTracking } from "@/hooks/usePageTracking";
import { OrganizationSchema } from "@/components/seo/JsonLd";
import { DemoModeProvider } from "@/context/DemoModeContext";
import { LeadDataProvider } from "@/context/LeadDataContext";
import Index from "./pages/Index";
import GetEstimate from "./pages/GetEstimate";
import NotFound from "./pages/NotFound";
import SubBidPublicForm from "./pages/SubBidPublicForm";
import Partner from "./pages/Partner";
import ContractorDemo from "./pages/ContractorDemo";
import ContractorOnboarding from "./pages/ContractorOnboarding";
import ApplicationConfirmation from "./pages/ApplicationConfirmation";
import CreatePassword from "./pages/CreatePassword";
import ArchitectLanding from "./pages/ArchitectLanding";
import InteriorDesignerLanding from "./pages/InteriorDesignerLanding";
import InteriorDesignerApplication from "./pages/InteriorDesignerApplication";
import Vendors from "./pages/Vendors";
import Auth from "./pages/Auth";
import ProfessionalAuth from "./pages/ProfessionalAuth";
import ProfileSetup from "./pages/ProfileSetup";
import Homeowners from "./pages/Homeowners";
import HomeownerTimeline from "./pages/HomeownerTimeline";
import HomeownerPortal from "./pages/HomeownerPortal";
import HomeownerBidDemo from "./pages/HomeownerBidDemo";
import HomeownerWarrantyClaim from "./pages/HomeownerWarrantyClaim";
import HomeownerAppointments from "./pages/HomeownerAppointments";
import HomeownerIntake from "./pages/HomeownerIntake";
import HomeownerEstimateConfirmed from "./pages/HomeownerEstimateConfirmed";
import HomeownerEstimateCancelled from "./pages/HomeownerEstimateCancelled";
import AccountSettings from "./pages/homeowner/AccountSettings";
import HomeownerFiles from "./pages/homeowner/HomeownerFiles";
import About from "./pages/About";
import Careers from "./pages/Careers";
import CareersApply from "./pages/CareersApply";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogCategory from "./pages/BlogCategory";
import BlogTag from "./pages/BlogTag";
import LocationsIndex from "./pages/LocationsIndex";
import CountyPage from "./pages/CountyPage";
import TownPage from "./pages/TownPage";
import GlenRockLanding from "./pages/GlenRockLanding";
import ProjectsIndex from "./pages/ProjectsIndex";
import ProjectTypePage from "./pages/ProjectTypePage";
import ServicesIndex from "./pages/services/ServicesIndex";
import ServiceDetailPage from "./pages/services/ServiceDetailPage";
import Software from "./pages/Software";
import StartYourRenovation from "./pages/StartYourRenovation";
import ContractorsJoin from "./pages/ContractorsJoin";
import ContractorsDirectory from "./pages/ContractorsDirectory";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDashboardHome from "./pages/admin/AdminDashboardHome";
import AdminIntakeReview from "./pages/admin/AdminIntakeReview";
import AdminContractorManagement from "./pages/admin/AdminContractorManagement";
import AdminRFPManagement from "./pages/admin/AdminRFPManagement";
import AdminBidReview from "./pages/admin/AdminBidReview";
import AdminLiveProjects from "./pages/admin/AdminLiveProjects";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminWorkflow from "./pages/AdminWorkflow";
import AdminApplications from "./pages/AdminApplications";
import ContractorApplications from "./pages/admin/ContractorApplications";
import AdminVendorApplications from "./pages/AdminVendorApplications";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminRoleManagement from "./pages/AdminRoleManagement";
import AdminPricing from "./pages/AdminPricing";
import AdminCRM from "./pages/AdminCRM";
import AdminProjectAssignments from "./pages/AdminProjectAssignments";
import AdminArchitectAssignments from "./pages/AdminArchitectAssignments";
import AdminArchitectProposals from "./pages/AdminArchitectProposals";
import EstimatorProjectDashboard from "./pages/estimator/EstimatorProjectDashboard";
import EstimatorProjectDetail from "./pages/estimator/EstimatorProjectDetail";
import AdminEstimatorManagement from "./pages/AdminEstimatorManagement";
import AdminInteriorDesignerApplications from "./pages/AdminInteriorDesignerApplications";
import AdminEstimateRequests from "./pages/AdminEstimateRequests";
import SalesPerformance from "./pages/SalesPerformance";
import AdminSelections from "./pages/AdminSelections";
import AdminSecurityDashboard from "./pages/AdminSecurityDashboard";
import AdminWarranty from "./pages/AdminWarranty";
import AdminWarrantyDetail from "./pages/AdminWarrantyDetail";
import AdminWarrantyMessaging from "./pages/AdminWarrantyMessaging";
import AgentConsole from "./pages/admin/AgentConsole";
import AdminContractorNetwork from "./pages/AdminContractorNetwork";
import AdminChangeOrders from "./pages/AdminChangeOrders";
import AdminQuickbooks from "./pages/AdminQuickbooks";
import AdminInvoicing from "./pages/AdminInvoicing";
import AdminPurchasing from "./pages/AdminPurchasing";
import AdminVendors from "./pages/AdminVendors";
import AdminPermits from "./pages/AdminPermits";
import AdminSchedule from "./pages/AdminSchedule";
import HomeownerApplicants from "./pages/admin/applicants/HomeownerApplicants";
import EstimatorApplicants from "./pages/admin/applicants/EstimatorApplicants";
import GCApplicants from "./pages/admin/applicants/GCApplicants";
import AIOverview from "./pages/admin/ai/AIOverview";
import ProjectAI from "./pages/admin/ai/ProjectAI";
import ContractorAI from "./pages/admin/ai/ContractorAI";
import TimelineAI from "./pages/admin/ai/TimelineAI";
import PermitAI from "./pages/admin/ai/PermitAI";
import WarrantyAI from "./pages/admin/ai/WarrantyAI";
import AIFeedback from "./pages/admin/ai/AIFeedback";
import ArchitectApplicants from "./pages/admin/applicants/ArchitectApplicants";
import VendorApplicants from "./pages/admin/applicants/VendorApplicants";
import PartnerApplicants from "./pages/admin/applicants/PartnerApplicants";
import SubcontractorApplicants from "./pages/admin/applicants/SubcontractorApplicants";
import FinancingInquiries from "./pages/admin/applicants/FinancingInquiries";
import CostCalculatorSubmissions from "./pages/admin/applicants/CostCalculatorSubmissions";
import AdminCalendars from "./pages/AdminCalendars";
import DailyLogs from "./pages/admin/DailyLogs";
import AdminSmartPlan from "./pages/AdminSmartPlan";
import AdminAIAutomation from "./pages/AdminAIAutomation";
import AdminRevenueOptimization from "./pages/AdminRevenueOptimization";
import AdminAutonomousCoordinator from "./pages/AdminAutonomousCoordinator";
import AdminProMonetization from "./pages/AdminProMonetization";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import AdminMarketplace from "./pages/AdminMarketplace";
import AdminNationalExpansion from "./pages/AdminNationalExpansion";
import AdminAutonomousOps from "./pages/AdminAutonomousOps";
import AdminWebsiteAI from "./pages/AdminWebsiteAI";
import AdminAIImages from "./pages/AdminAIImages";
import AdminAIImageSlot from "./pages/AdminAIImageSlot";
import AdminResources from "./pages/AdminResources";
import AdminAI from "./pages/AdminAI";
import ResourceCapacity from "./pages/ResourceCapacity";
import ProfessionalQuickbooks from "./pages/ProfessionalQuickbooks";
import ProfessionalInvoicing from "./pages/ProfessionalInvoicing";
import QuickbooksCallback from "./pages/QuickbooksCallback";
import ProfessionalChangeOrders from "./pages/ProfessionalChangeOrders";
import EstimatorAuth from "./pages/estimator/EstimatorAuth";
import EstimatorDashboard from "./pages/EstimatorDashboard";
import EstimatorLeads from "./pages/estimator/Leads";
import BidReviewDashboard from "./pages/estimator/BidReviewDashboard";
import BidAnalytics from "./pages/estimator/BidAnalytics";
import EstimateRequests from "./pages/estimator/EstimateRequests";
import EstimatorEstimates from "./pages/estimator/Estimates";
import EstimatorWalkthroughs from "./pages/estimator/Walkthroughs";
import EstimatorCalendar from "./pages/estimator/CalendarView";
import PrepareEstimate from "./pages/estimator/PrepareEstimate";
import ReviewLead from "./pages/estimator/ReviewLead";
import UploadPhotos from "./pages/estimator/UploadPhotos";
import GenerateScope from "./pages/estimator/GenerateScope";
import LostLeadAnalytics from "./pages/estimator/LostLeadAnalytics";
import EstimatorProfile from "./pages/estimator/EstimatorProfile";
import WinbackCampaigns from "./pages/estimator/WinbackCampaigns";
import LeadPipeline from "./pages/estimator/LeadPipeline";
import UnifiedLogin from "./pages/UnifiedLogin";
import SmartRenoSsoLogin from "./pages/SmartRenoSsoLogin";
import SmartRenoSsoCallback from "./pages/SmartRenoSsoCallback";
import ContractorAuth from "./pages/contractor/ContractorAuth";
import ContractorComingSoon from "./pages/contractor/ContractorComingSoon";
import ContractorDashboard from "./pages/contractor/ContractorDashboard";
import NewContractorDashboard from "./pages/contractor/NewContractorDashboard";
import ContractorOnboardingWizard from "./pages/contractor/ContractorOnboardingWizard";
import ContractorPortalHub from "./pages/contractor/ContractorPortalHub";
import SalesPipeline from "./pages/contractor/SalesPipeline";
import Collections from "./pages/contractor/Collections";
import ContractorEstimatorDashboard from "./pages/contractor/ContractorEstimatorDashboard";
import ContractorProjects from "./pages/contractor/ContractorProjects";
import ContractorProjectsList from "./pages/contractor/ContractorProjectsList";
import ContractorProjectWorkspace from "./pages/contractor/ContractorProjectWorkspace";
import ContractorProjectDashboard from "./pages/contractor/ContractorProjectDashboard";
import ContractorProjectDetail from "./pages/contractor/ContractorProjectDetail";
import ContractorBids from "./pages/contractor/ContractorBids";
import ContractorOpportunities from "./pages/contractor/ContractorOpportunities";
import ContractorRFPDetail from "./pages/contractor/ContractorRFPDetail";
import ContractorMyBids from "./pages/contractor/ContractorMyBids";
import ContractorCalendar from "./pages/contractor/ContractorCalendar";
import ContractorSmartPlan from "./pages/contractor/ContractorSmartPlan";
import ContractorAIHub from "./pages/contractor/ContractorAIHub";
import ContractorPricing from "./pages/contractor/ContractorPricing";
import ContractorEstimates from "./pages/contractor/ContractorEstimates";
import ContractorTimelines from "./pages/contractor/ContractorTimelines";
import ContractorVendors from "./pages/contractor/ContractorVendors";
import ContractorMessages from "./pages/contractor/ContractorMessages";
import ContractorInvoices from "./pages/contractor/ContractorInvoices";
import ContractorChangeOrders from "./pages/contractor/ContractorChangeOrders";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import ContractDetail from "./pages/finance/ContractDetail";
import VendorPerformance from "./pages/contractor/VendorPerformance";
import PurchaseOrders from "./pages/contractor/PurchaseOrders";
import ContractorBidRoom from "./pages/contractor/ContractorBidRoom";
import ContractorProjectManagement from "./pages/contractor/ContractorProjectManagement";
import CoordinatorPipeline from "./pages/contractor/CoordinatorPipeline";
import ProjectManagerPipeline from "./pages/contractor/ProjectManagerPipeline";
import PMAppointmentsDashboard from "./pages/contractor/PMAppointmentsDashboard";
import PMDashboard from "./pages/contractor/PMDashboard";
import SubcontractorAppointments from "./pages/contractor/SubcontractorAppointments";
import HomeownerMeeting from "./pages/coordinator/HomeownerMeeting";
import MaterialsManagement from "./pages/coordinator/MaterialsManagement";
import PermitTracking from "./pages/coordinator/PermitTracking";
import ScheduleLocking from "./pages/coordinator/ScheduleLocking";
import ContractorForemanPortal from "./pages/contractor/ContractorForemanPortal";
import ContractorTeamManagement from "./pages/contractor/ContractorTeamManagement";
import ContractorRoleManagement from "./pages/contractor/ContractorRoleManagement";
import SalesManagement from "./pages/contractor/SalesManagement";
import ContractorOverview from "./pages/contractor/ContractorOverview";
import TeamInvitations from "./pages/contractor/TeamInvitations";
import TeamManagement from "./pages/contractor/TeamManagement";
import TeamJoin from "./pages/contractor/TeamJoin";
import ContractorUserApplicants from "./pages/contractor/ContractorUserApplicants";
import ContractorWarranty from "./pages/contractor/ContractorWarranty";
import ContractorWarrantyDetail from "./pages/contractor/ContractorWarrantyDetail";
import ContractorDocuments from "./pages/contractor/ContractorDocuments";
import ContractorDocumentDetail from "./pages/contractor/ContractorDocumentDetail";
import ContractorFiles from "./pages/contractor/ContractorFiles";
import ContractorSettings from "./pages/contractor/ContractorSettings";
import ContractorHelpCenter from "./pages/contractor/ContractorHelpCenter";
import PortalLoginGateway from "./pages/PortalLoginGateway";
import EstimatorBidRoom from "./pages/estimator/EstimatorBidRoom";
import EstimatorBidSubmissions from "./pages/estimator/EstimatorBidSubmissions";
import SubcontractorPortal from "./pages/contractor/SubcontractorPortal";
import InviteAccept from "./pages/InviteAccept";
import InsideSales from "./pages/contractor/InsideSales";
import OutsideSales from "./pages/contractor/OutsideSales";
import ForemanPortal from "./pages/contractor/ForemanPortal";
import PMAppointments from "./pages/contractor/PMAppointments";
import ContractorPermitTracking from "./pages/contractor/ContractorPermitTracking";
import Expenses from "./pages/contractor/Expenses";
import ExpenseReports from "./pages/contractor/ExpenseReports";
import ContractorDemoLanding from "./pages/contractor/ContractorDemoLanding";
import ContractorLeads from "./pages/contractor/ContractorLeads";
import ContractorLeadDetail from "./pages/contractor/ContractorLeadDetail";
import MarketingDashboard from "./pages/contractor/MarketingDashboard";

import ArchitectAuth from "./pages/architect/ArchitectAuth";
import ArchitectDashboard from "./pages/architect/ArchitectDashboard";
import ArchitectProjects from "./pages/architect/ArchitectProjects";
import ArchitectProposals from "./pages/architect/ArchitectProposals";
import ArchitectMessages from "./pages/architect/ArchitectMessages";
import ArchitectBidRoom from "./pages/architect/ArchitectBidRoom";
import ArchitectBidSubmissions from "./pages/architect/ArchitectBidSubmissions";
import InteriorDesignerBidRoom from "./pages/interiordesigner/InteriorDesignerBidRoom";
import InteriorDesignerDashboard from "./pages/interiordesigner/InteriorDesignerDashboard";
import InteriorDesignerAuth from "./pages/interiordesigner/InteriorDesignerAuth";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import TestDashboard from "./pages/TestDashboard";

const queryClient = new QueryClient();

function AppRoutes() {
  // Track page views automatically
  usePageTracking();

  return (
    <>
      {/* Site-wide Organization Schema */}
      <OrganizationSchema />
      
      <Routes>
        <Route path="/" element={<Index />} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/login/:portal" element={<PortalLoginGateway />} />
            <Route path="/auth/smartreno" element={<SmartRenoSsoLogin />} />
            <Route path="/auth/smartreno/callback" element={<SmartRenoSsoCallback />} />
            <Route path="/get-estimate" element={<GetEstimate />} />
            <Route path="/homeowners" element={<Homeowners />} />
            <Route path="/homeowner-intake" element={
              <ProtectedRoute>
                <HomeownerIntake />
              </ProtectedRoute>
            } />
            <Route path="/homeowner/estimate-confirmed" element={
              <ProtectedRoute>
                <HomeownerEstimateConfirmed />
              </ProtectedRoute>
            } />
            <Route path="/homeowner/estimate-cancelled" element={
              <ProtectedRoute>
                <HomeownerEstimateCancelled />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId/timeline" element={<HomeownerTimeline />} />
            <Route path="/homeowner-portal" element={
              <ProtectedRoute>
                <HomeownerPortal />
              </ProtectedRoute>
            } />
            <Route path="/homeowner/portal" element={
              <ProtectedRoute>
                <HomeownerPortal />
              </ProtectedRoute>
            } />
            <Route path="/homeowner/account-settings" element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            } />
            <Route path="/homeowner/files" element={
              <ProtectedRoute>
                <HomeownerFiles />
              </ProtectedRoute>
            } />
            <Route path="/homeowner/warranty-claim" element={
              <ProtectedRoute>
                <HomeownerWarrantyClaim />
              </ProtectedRoute>
            } />
            <Route path="/homeowner/appointments" element={
              <ProtectedRoute>
                <HomeownerAppointments />
              </ProtectedRoute>
            } />
            <Route path="/homeowner-bid-demo" element={<HomeownerBidDemo />} />
            <Route path="/contractors" element={<ContractorsDirectory />} />
            <Route path="/contractors/join" element={<ContractorsJoin />} />
            <Route path="/contractors/apply" element={<ContractorComingSoon />} />
            <Route path="/contractors/confirmation" element={<ApplicationConfirmation />} />
            <Route path="/architects" element={<ArchitectLanding />} />
          <Route path="/interiordesigners" element={<InteriorDesignerLanding />} />
          <Route path="/interiordesigner/apply" element={<InteriorDesignerApplication />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/apply" element={<CareersApply />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/professionals/auth" element={<ProfessionalAuth />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/create-password" element={<CreatePassword />} />
            <Route path="/login" element={<UnifiedLogin />} />
            <Route path="/unified-login" element={<UnifiedLogin />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/blog/categories/:category" element={<BlogCategory />} />
            <Route path="/blog/tags/:tag" element={<BlogTag />} />
            <Route path="/locations" element={<LocationsIndex />} />
            <Route path="/glenrock" element={<GlenRockLanding />} />
            <Route path="/locations/:county" element={<CountyPage />} />
            <Route path="/locations/:county/:town" element={<TownPage />} />
            <Route path="/projects" element={<ProjectsIndex />} />
            <Route path="/projects/:projectType" element={<ProjectTypePage />} />
            <Route path="/services" element={<ServicesIndex />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/software" element={<Software />} />
            <Route path="/start-your-renovation" element={<StartYourRenovation />} />
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/calendars" element={
              <ProtectedRoute requiredRole="admin">
                <AdminCalendars />
              </ProtectedRoute>
            } />
            <Route path="/admin/smartplan" element={
              <ProtectedRoute requiredRole="admin">
                <AdminSmartPlan />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai-automation" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAIAutomation />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAI />
              </ProtectedRoute>
            } />
            <Route path="/admin/revenue-optimization" element={
              <ProtectedRoute requiredRole="admin">
                <AdminRevenueOptimization />
              </ProtectedRoute>
            } />
            <Route path="/admin/schedule" element={
              <ProtectedRoute requiredRole="admin">
                <AdminSchedule />
              </ProtectedRoute>
            } />
            <Route path="/admin/resources" element={
              <ProtectedRoute requiredRole="admin">
                <AdminResources />
              </ProtectedRoute>
            } />
            <Route path="/admin/resource-capacity" element={
              <ProtectedRoute requiredRole="admin">
                <ResourceCapacity />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/security" element={
              <ProtectedRoute requiredRole="admin">
                <AdminSecurityDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/agents" element={
              <ProtectedRoute requiredRole="admin">
                <AgentConsole />
              </ProtectedRoute>
            } />
            <Route path="/admin/applications" element={
              <ProtectedRoute requiredRole="admin">
                <AdminApplications />
              </ProtectedRoute>
            } />
            <Route path="/admin/contractor-applications" element={
              <ProtectedRoute requiredRole="admin">
                <ContractorApplications />
              </ProtectedRoute>
            } />
            <Route path="/admin/vendors" element={
              <ProtectedRoute requiredRole="admin">
                <AdminVendorApplications />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <AdminUserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/role-management" element={
              <ProtectedRoute requiredRole="admin">
                <AdminRoleManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/workflow" element={
              <ProtectedRoute requiredRole="admin">
                <AdminWorkflow />
              </ProtectedRoute>
            } />
            <Route path="/admin/pricing" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPricing />
              </ProtectedRoute>
            } />
            <Route path="/admin/crm" element={
              <ProtectedRoute requiredRole="admin">
                <AdminCRM />
              </ProtectedRoute>
            } />
            <Route path="/admin/project-assignments" element={
              <ProtectedRoute requiredRole="admin">
                <AdminProjectAssignments />
              </ProtectedRoute>
            } />
            <Route path="/admin/architect-assignments" element={
              <ProtectedRoute requiredRole="admin">
                <AdminArchitectAssignments />
              </ProtectedRoute>
            } />
            <Route path="/admin/architect-proposals" element={
              <ProtectedRoute requiredRole="admin">
                <AdminArchitectProposals />
              </ProtectedRoute>
            } />
            <Route path="/admin/interior-designer-applications" element={
              <ProtectedRoute requiredRole="admin">
                <AdminInteriorDesignerApplications />
              </ProtectedRoute>
            } />
            <Route path="/admin/estimator-management" element={
              <ProtectedRoute requiredRole="admin">
                <AdminEstimatorManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/selections" element={
              <ProtectedRoute requiredRole="admin">
                <AdminSelections />
              </ProtectedRoute>
            } />
            <Route path="/admin/change-orders" element={
              <ProtectedRoute requiredRole="admin">
                <AdminChangeOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/quickbooks" element={
              <ProtectedRoute requiredRole="admin">
                <AdminQuickbooks />
              </ProtectedRoute>
            } />
            <Route path="/admin/invoicing" element={
              <ProtectedRoute requiredRole="admin">
                <AdminInvoicing />
              </ProtectedRoute>
            } />
            <Route path="/admin/procurement" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPurchasing />
              </ProtectedRoute>
            } />
            <Route path="/admin/vendors" element={
              <ProtectedRoute requiredRole="admin">
                <AdminVendors />
              </ProtectedRoute>
            } />
            <Route path="/admin/contractors" element={
              <ProtectedRoute requiredRole="admin">
                <AdminContractorNetwork />
              </ProtectedRoute>
            } />
            <Route path="/admin/revenue-optimization" element={
              <ProtectedRoute requiredRole="admin">
                <AdminRevenueOptimization />
              </ProtectedRoute>
            } />
            <Route path="/admin/autonomous-coordinator" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAutonomousCoordinator />
              </ProtectedRoute>
            } />
            <Route path="/admin/knowledge-base" element={
              <ProtectedRoute requiredRole="admin">
                <AdminKnowledgeBase />
              </ProtectedRoute>
            } />
            <Route path="/admin/permits" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPermits />
              </ProtectedRoute>
            } />
            <Route path="/admin/warranty" element={
              <ProtectedRoute requiredRole="admin">
                <AdminWarranty />
              </ProtectedRoute>
            } />
            <Route path="/admin/warranty/messages" element={
              <ProtectedRoute requiredRole="admin">
                <AdminWarrantyMessaging />
              </ProtectedRoute>
            } />
            <Route path="/admin/warranty/claims/:claimId" element={
              <ProtectedRoute requiredRole="admin">
                <AdminWarrantyDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/warranty/:claimId" element={
              <ProtectedRoute requiredRole="admin">
                <AdminWarrantyDetail />
              </ProtectedRoute>
            } />
            <Route path="/quickbooks" element={<ProfessionalQuickbooks />} />
            <Route path="/quickbooks/callback" element={<QuickbooksCallback />} />
            <Route path="/invoicing" element={<ProfessionalInvoicing />} />
            <Route path="/admin/vendor-applications" element={
              <ProtectedRoute requiredRole="admin">
                <AdminVendorApplications />
              </ProtectedRoute>
            } />
            <Route path="/admin/estimate-requests" element={
              <ProtectedRoute requiredRole="admin">
                <AdminEstimateRequests />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai-images" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAIImages />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai-images/:slotId" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAIImageSlot />
              </ProtectedRoute>
            } />
            <Route path="/admin/sales-performance" element={
              <ProtectedRoute requiredRole="admin">
                <SalesPerformance />
              </ProtectedRoute>
            } />
            
            {/* AI Sections */}
            <Route path="/admin/ai/overview" element={
              <ProtectedRoute requiredRole="admin">
                <AIOverview />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai/project" element={
              <ProtectedRoute requiredRole="admin">
                <ProjectAI />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai/contractor" element={
              <ProtectedRoute requiredRole="admin">
                <ContractorAI />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai/timeline" element={
              <ProtectedRoute requiredRole="admin">
                <TimelineAI />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai/permit" element={
              <ProtectedRoute requiredRole="admin">
                <PermitAI />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai/warranty" element={
              <ProtectedRoute requiredRole="admin">
                <WarrantyAI />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai/feedback" element={
              <ProtectedRoute requiredRole="admin">
                <AIFeedback />
              </ProtectedRoute>
            } />
            <Route path="/admin/national-expansion" element={
              <ProtectedRoute requiredRole="admin">
                <AdminNationalExpansion />
              </ProtectedRoute>
            } />
            <Route path="/admin/autonomous-ops" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAutonomousOps />
              </ProtectedRoute>
            } />
            <Route path="/admin/website-ai" element={
              <ProtectedRoute requiredRole="admin">
                <AdminWebsiteAI />
              </ProtectedRoute>
            } />
            <Route path="/contractor/sales-performance" element={
              <ProtectedRoute requireSalesAccess={true}>
                <SalesPerformance />
              </ProtectedRoute>
            } />
            <Route path="/estimator/auth" element={<EstimatorAuth />} />
            <Route path="/estimator/dashboard" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/estimator/leads" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorLeads />
              </ProtectedRoute>
            } />
            <Route path="/estimator/pipeline" element={
              <ProtectedRoute requiredRole="estimator">
                <LeadPipeline />
              </ProtectedRoute>
            } />
            <Route path="/estimator/lost-lead-analytics" element={
              <ProtectedRoute requiredRole="estimator">
                <LostLeadAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/estimator/winback-campaigns" element={
              <ProtectedRoute requiredRole="estimator">
                <WinbackCampaigns />
              </ProtectedRoute>
            } />
            <Route path="/estimator/profile" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorProfile />
              </ProtectedRoute>
            } />
            <Route path="/estimator/requests" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimateRequests />
              </ProtectedRoute>
            } />
            <Route path="/estimator/estimates" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorEstimates />
              </ProtectedRoute>
            } />
            <Route path="/estimator/walkthroughs" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorWalkthroughs />
              </ProtectedRoute>
            } />
            <Route path="/estimator/calendar" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorCalendar />
              </ProtectedRoute>
            } />
            <Route path="/estimator/prepare-estimate/:id?" element={
              <ProtectedRoute requiredRoles={["estimator", "contractor", "admin"]}>
                <PrepareEstimate />
              </ProtectedRoute>
            } />
            <Route path="/estimator/review-lead/:id?" element={
              <ProtectedRoute requiredRole="estimator">
                <ReviewLead />
              </ProtectedRoute>
            } />
            <Route path="/estimator/upload-photos/:id?" element={
              <ProtectedRoute requiredRole="estimator">
                <UploadPhotos />
              </ProtectedRoute>
            } />
            <Route path="/estimator/generate-scope/:id?" element={
              <ProtectedRoute requiredRole="estimator">
                <GenerateScope />
              </ProtectedRoute>
            } />
            <Route path="/estimator/bid-review" element={
              <ProtectedRoute requiredRole="estimator">
                <BidReviewDashboard />
              </ProtectedRoute>
            } />
            <Route path="/estimator/bid-analytics" element={
              <ProtectedRoute requiredRole="estimator">
                <BidAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/estimator/bid-room" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorBidRoom />
              </ProtectedRoute>
            } />
            <Route path="/estimator/bid-submissions" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorBidSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/estimator/projects" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorProjectDashboard />
              </ProtectedRoute>
            } />
            <Route path="/estimator/project/:projectId" element={
              <ProtectedRoute requiredRole="estimator">
                <EstimatorProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/contractor/auth" element={<ContractorComingSoon />} />
            <Route path="/contractor/demo" element={<ContractorComingSoon />} />
            <Route path="/contractor/overview" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorOverview />
              </ProtectedRoute>
            } />
            <Route path="/contractor/team" element={
              <ProtectedRoute requiredRole="contractor">
                <TeamManagement />
              </ProtectedRoute>
            } />
            <Route path="/contractor/team/join" element={<TeamJoin />} />
            <Route path="/contractor/team-old" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorTeamManagement />
              </ProtectedRoute>
            } />
            <Route path="/contractor/roles" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorRoleManagement />
              </ProtectedRoute>
            } />
            <Route path="/contractor/sales-kpi" element={
              <ProtectedRoute requiredRoles={["admin", "contractor", "inside_sales", "vp_of_sales"]}>
                <SalesManagement />
              </ProtectedRoute>
            } />
            {/* Redirect /contractor/portal to /contractor/dashboard */}
            <Route path="/contractor/portal" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/dashboard" element={
              <ProtectedRoute requiredRole="contractor">
                <NewContractorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/onboarding" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorOnboardingWizard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/profile" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorOnboardingWizard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/opportunities" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorOpportunities />
              </ProtectedRoute>
            } />
            <Route path="/contractor/rfp/:rfpId" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorRFPDetail />
              </ProtectedRoute>
            } />
            <Route path="/contractor/leads" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorLeads />
              </ProtectedRoute>
            } />
            <Route path="/contractor/leads/:id" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorLeadDetail />
              </ProtectedRoute>
            } />
            <Route path="/contractor/sales-pipeline" element={
              <ProtectedRoute requiredRole="contractor">
                <SalesPipeline />
              </ProtectedRoute>
            } />
            <Route path="/contractor/collections" element={
              <ProtectedRoute requiredRole="contractor">
                <Collections />
              </ProtectedRoute>
            } />
            <Route path="/contractor/finance" element={
              <ProtectedRoute requiredRole="contractor">
                <FinanceDashboard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/expenses" element={
              <ProtectedRoute requiredRole="contractor">
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="/contractor/expense-reports" element={
              <ProtectedRoute requiredRole="contractor">
                <ExpenseReports />
              </ProtectedRoute>
            } />
            <Route path="/contractor/estimator" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorEstimatorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/projects" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorProjectsList />
              </ProtectedRoute>
            } />
            <Route path="/contractor/projects/:projectId" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorProjectWorkspace />
              </ProtectedRoute>
            } />
            <Route path="/contractor/projects/:projectId/:tab" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorProjectWorkspace />
              </ProtectedRoute>
            } />
            <Route path="/contractor/project-dashboard" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorProjectDashboard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/project/:id" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/contractor/bids" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorMyBids />
              </ProtectedRoute>
            } />
            <Route path="/contractor/estimates" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorEstimates />
              </ProtectedRoute>
            } />
            <Route path="/contractor/pricing" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorPricing />
              </ProtectedRoute>
            } />
            <Route path="/contractor/timelines" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorTimelines />
              </ProtectedRoute>
            } />
            <Route path="/contractor/calendar" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorCalendar />
              </ProtectedRoute>
            } />
            <Route path="/contractor/smartplan" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorSmartPlan />
              </ProtectedRoute>
            } />
            <Route path="/contractor/ai" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorAIHub />
              </ProtectedRoute>
            } />
            <Route path="/contractor/marketing" element={
              <ProtectedRoute requiredRoles={["admin", "contractor", "inside_sales", "estimator"]}>
                <MarketingDashboard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/bid-room" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorBidRoom />
              </ProtectedRoute>
            } />
            <Route path="/contractor/vendors" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorVendors />
              </ProtectedRoute>
            } />
            <Route path="/contractor/vendor-performance" element={
              <ProtectedRoute requiredRole="contractor">
                <VendorPerformance />
              </ProtectedRoute>
            } />
            <Route path="/contractor/purchase-orders" element={
              <ProtectedRoute requiredRole="contractor">
                <PurchaseOrders />
              </ProtectedRoute>
            } />
            <Route path="/contractor/project-management" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorProjectManagement />
              </ProtectedRoute>
            } />
            <Route path="/contractor/project-manager-pipeline" element={
              <ProtectedRoute requiredRoles={["contractor", "project_manager"]}>
                <ProjectManagerPipeline />
              </ProtectedRoute>
            } />
            <Route path="/contractor/pm-dashboard" element={
              <ProtectedRoute requiredRoles={["contractor", "project_manager", "admin"]}>
                <PMDashboard />
              </ProtectedRoute>
            } />
            <Route path="/contractor/pm-appointments" element={
              <ProtectedRoute requiredRoles={["contractor", "project_manager", "admin"]}>
                <PMAppointments />
              </ProtectedRoute>
            } />
            <Route path="/contractor/subcontractor-appointments" element={
              <ProtectedRoute requiredRoles={["contractor", "foreman", "subcontractor"]}>
                <SubcontractorAppointments />
              </ProtectedRoute>
            } />
            <Route path="/contractor/coordinator-pipeline" element={
              <ProtectedRoute requiredRoles={["contractor", "project_coordinator"]}>
                <CoordinatorPipeline />
              </ProtectedRoute>
            } />
            <Route path="/coordinator/project/:projectId/homeowner-meeting" element={
              <ProtectedRoute requiredRoles={["contractor", "project_coordinator"]}>
                <HomeownerMeeting />
              </ProtectedRoute>
            } />
            <Route path="/coordinator/project/:projectId/materials" element={
              <ProtectedRoute requiredRoles={["contractor", "project_coordinator"]}>
                <MaterialsManagement />
              </ProtectedRoute>
            } />
            <Route path="/coordinator/project/:projectId/permits" element={
              <ProtectedRoute requiredRoles={["contractor", "project_coordinator"]}>
                <PermitTracking />
              </ProtectedRoute>
            } />
            <Route path="/coordinator/project/:projectId/schedule" element={
              <ProtectedRoute requiredRoles={["contractor", "project_coordinator"]}>
                <ScheduleLocking />
              </ProtectedRoute>
            } />
            <Route path="/contractor/foreman-portal" element={
              <ProtectedRoute requiredRoles={["contractor", "foreman", "admin"]}>
                <ForemanPortal />
              </ProtectedRoute>
            } />
            <Route path="/contractor/permit-tracking" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorPermitTracking />
              </ProtectedRoute>
            } />
            <Route path="/contractor/team-management" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorTeamManagement />
              </ProtectedRoute>
            } />
            <Route path="/contractor/user-applicants" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorUserApplicants />
              </ProtectedRoute>
            } />
            <Route path="/contractor/role-management" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorRoleManagement />
              </ProtectedRoute>
            } />
            <Route path="/contractor/team-invitations" element={
              <ProtectedRoute requiredRole="contractor">
                <TeamInvitations />
              </ProtectedRoute>
            } />
            <Route path="/contractor/inside-sales" element={
              <ProtectedRoute requiredRoles={["admin", "contractor", "inside_sales", "vp_of_sales"]}>
                <InsideSales />
              </ProtectedRoute>
            } />
            <Route path="/contractor/outside-sales" element={
              <ProtectedRoute requiredRoles={["admin", "contractor", "outside_sales", "vp_of_sales"]}>
                <OutsideSales />
              </ProtectedRoute>
            } />
            <Route path="/invite/accept" element={<InviteAccept />} />
            <Route path="/contractor/subcontractor-portal" element={
              <ProtectedRoute requiredRoles={["contractor", "subcontractor", "admin"]}>
                <SubcontractorPortal />
              </ProtectedRoute>
            } />
            <Route path="/contractor/warranty" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorWarranty />
              </ProtectedRoute>
            } />
            <Route path="/contractor/warranty/:id" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorWarrantyDetail />
              </ProtectedRoute>
            } />
            <Route path="/contractor/documents" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorDocuments />
              </ProtectedRoute>
            } />
            <Route path="/contractor/documents/:id" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorDocumentDetail />
              </ProtectedRoute>
            } />
            <Route path="/contractor/files" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorFiles />
              </ProtectedRoute>
            } />
            <Route path="/contractor/settings" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorSettings />
              </ProtectedRoute>
            } />
            <Route path="/contractor/help-center" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorHelpCenter />
              </ProtectedRoute>
            } />
            <Route path="/contractor/messages" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorMessages />
              </ProtectedRoute>
            } />
            <Route path="/contractor/invoices" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorInvoices />
              </ProtectedRoute>
            } />
            <Route path="/contractor/change-orders" element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorChangeOrders />
              </ProtectedRoute>
            } />
            <Route path="/finance/dashboard" element={
              <ProtectedRoute requiredRoles={["contractor", "finance", "admin"]}>
                <FinanceDashboard />
              </ProtectedRoute>
            } />
            <Route path="/finance/contracts/:contractId" element={
              <ProtectedRoute requiredRoles={["contractor", "finance", "admin"]}>
                <ContractDetail />
              </ProtectedRoute>
            } />
            <Route path="/finance/contracts/new" element={
              <ProtectedRoute requiredRoles={["contractor", "finance", "admin"]}>
                <ContractDetail />
              </ProtectedRoute>
            } />
            <Route path="/professional/change-orders" element={
              <ProtectedRoute>
                <ProfessionalChangeOrders />
              </ProtectedRoute>
            } />
            <Route path="/interiordesigner/auth" element={<InteriorDesignerAuth />} />
            <Route path="/interiordesigner/dashboard" element={
              <ProtectedRoute requiredRole="interior_designer">
                <InteriorDesignerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/interiordesigner/bid-room" element={
              <ProtectedRoute requiredRole="interior_designer">
                <InteriorDesignerBidRoom />
              </ProtectedRoute>
            } />
            <Route path="/interiordesigner/bids" element={
              <ProtectedRoute requiredRole="interior_designer">
                <InteriorDesignerBidRoom />
              </ProtectedRoute>
            } />
            <Route path="/architect/auth" element={<ArchitectAuth />} />
            <Route path="/architect/dashboard" element={
              <ProtectedRoute requiredRole="architect">
                <ArchitectDashboard />
              </ProtectedRoute>
            } />
            <Route path="/architect/projects" element={
              <ProtectedRoute requiredRole="architect">
                <ArchitectProjects />
              </ProtectedRoute>
            } />
            <Route path="/architect/proposals" element={
              <ProtectedRoute requiredRole="architect">
                <ArchitectProposals />
              </ProtectedRoute>
            } />
            <Route path="/architect/messages" element={
              <ProtectedRoute requiredRole="architect">
                <ArchitectMessages />
              </ProtectedRoute>
            } />
            <Route path="/architect/bid-room" element={
              <ProtectedRoute requiredRole="architect">
                <ArchitectBidRoom />
              </ProtectedRoute>
            } />
            <Route path="/architect/bid-submissions" element={
              <ProtectedRoute requiredRole="architect">
                <ArchitectBidSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route path="/sub-bid/:projectId/:trade" element={<SubBidPublicForm />} />
            <Route path="/admin/applicants/homeowner" element={
              <ProtectedRoute requiredRole="admin">
                <HomeownerApplicants />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/estimator" element={
              <ProtectedRoute requiredRole="admin">
                <EstimatorApplicants />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/general-contractor" element={
              <ProtectedRoute requiredRole="admin">
                <GCApplicants />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/architect-designers" element={
              <ProtectedRoute requiredRole="admin">
                <ArchitectApplicants />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/vendors" element={
              <ProtectedRoute requiredRole="admin">
                <VendorApplicants />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/partners" element={
              <ProtectedRoute requiredRole="admin">
                <PartnerApplicants />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/subcontractors" element={
              <ProtectedRoute requiredRole="admin">
                <SubcontractorApplicants />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/financing" element={
              <ProtectedRoute requiredRole="admin">
                <FinancingInquiries />
              </ProtectedRoute>
            } />
            <Route path="/admin/applicants/cost-calculator" element={
              <ProtectedRoute requiredRole="admin">
                <CostCalculatorSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/vendor/dashboard" element={
              <ProtectedRoute requiredRole="vendor">
                <VendorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/test-dashboard" element={<TestDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <KeyboardShortcutsDialog />
          <CommandPalette />
        </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <DemoModeProvider>
        <LeadDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <KeyboardShortcutsProvider>
                <AppRoutes />
              </KeyboardShortcutsProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LeadDataProvider>
      </DemoModeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
