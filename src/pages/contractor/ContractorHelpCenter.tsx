import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ContractorSidebar } from "@/components/contractor/ContractorSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoTutorialCard } from "@/components/contractor/help/VideoTutorialCard";
import { ScreenshotGallery } from "@/components/contractor/help/ScreenshotGallery";
import { QuickGuideCard } from "@/components/contractor/help/QuickGuideCard";
import { FAQAccordion } from "@/components/contractor/help/FAQAccordion";
import {
  Search,
  HelpCircle,
  PlayCircle,
  Image,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  TrendingUp,
  DollarSign,
  FolderKanban,
  Users,
  Menu,
} from "lucide-react";

// Sample data - replace with real content later
const videoTutorials = [
  {
    title: "Getting Started with SmartReno",
    description: "Learn the basics of navigating your contractor portal and key features.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "5:30",
    category: "Getting Started",
  },
  {
    title: "Managing Your Sales Pipeline",
    description: "Master lead tracking, estimates, and converting prospects to projects.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "8:15",
    category: "Sales Pipeline",
  },
  {
    title: "Collections Walkthrough",
    description: "Track payments, manage invoices, and monitor your cash flow effectively.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "4:45",
    category: "Collections",
  },
  {
    title: "Project Management Essentials",
    description: "Organize projects, timelines, and team coordination in one place.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "10:20",
    category: "Projects",
  },
  {
    title: "Team Management & Roles",
    description: "Add team members, assign roles, and manage permissions.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "6:00",
    category: "Team",
  },
  {
    title: "File Management & SmartReno Drive",
    description: "Upload, organize, and share files with your team and clients.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "3:45",
    category: "Files",
  },
];

const screenshots = [
  { src: "/placeholder.svg", alt: "Dashboard Overview", caption: "Dashboard Overview" },
  { src: "/placeholder.svg", alt: "Sales Pipeline", caption: "Sales Pipeline Board" },
  { src: "/placeholder.svg", alt: "Collections", caption: "Collections Tracker" },
  { src: "/placeholder.svg", alt: "Projects", caption: "Project Management" },
  { src: "/placeholder.svg", alt: "Calendar", caption: "Calendar View" },
];

const quickGuides = [
  {
    title: "Sales Pipeline",
    icon: TrendingUp,
    steps: [
      { step: 1, title: "Navigate to Sales Pipeline", description: "Click 'Sales Pipeline' in the sidebar to access your pipeline board." },
      { step: 2, title: "Add a New Lead", description: "Click '+ New Lead' button to create a new prospect entry." },
      { step: 3, title: "Fill in Details", description: "Enter contact information, project scope, and estimated value." },
      { step: 4, title: "Move Through Stages", description: "Drag and drop leads between stages as they progress." },
    ],
  },
  {
    title: "Collections",
    icon: DollarSign,
    steps: [
      { step: 1, title: "Access Collections", description: "Navigate to Collections from the sidebar menu." },
      { step: 2, title: "View Pending Payments", description: "Check the overview for all pending and collected amounts." },
      { step: 3, title: "Record a Payment", description: "Click on an invoice and mark it as collected when paid." },
      { step: 4, title: "Filter by Status", description: "Use filters to view this week's collections or uncollected items." },
    ],
  },
  {
    title: "Project Manager",
    icon: FolderKanban,
    steps: [
      { step: 1, title: "Create a Project", description: "Go to Project Manager and click '+ New Project'." },
      { step: 2, title: "Set Timeline", description: "Define project phases, milestones, and deadlines." },
      { step: 3, title: "Assign Team", description: "Add team members and assign responsibilities." },
      { step: 4, title: "Track Progress", description: "Update status and log daily activities." },
    ],
  },
  {
    title: "Team Management",
    icon: Users,
    steps: [
      { step: 1, title: "Access Team Section", description: "Navigate to Team Management in the sidebar." },
      { step: 2, title: "Invite Members", description: "Click 'Team Invitations' to send email invites." },
      { step: 3, title: "Assign Roles", description: "Use Role Management to set permissions." },
      { step: 4, title: "Manage Access", description: "Control what each team member can view and edit." },
    ],
  },
];

const faqItems = [
  {
    question: "How do I add a new team member?",
    answer: "Navigate to Team Management > Team Invitations. Enter the email address of the person you want to invite, select their role, and click 'Send Invite'. They'll receive an email with instructions to join your team.",
  },
  {
    question: "How do I track a collection payment?",
    answer: "Go to Collections > Overview. Find the invoice you want to update, click on it, and change the status to 'Collected'. You can also add notes about the payment method and date received.",
  },
  {
    question: "How do I create a new project?",
    answer: "Navigate to Project Manager > Overview. Click the '+ New Project' button, fill in the project details including client information, timeline, and budget. Then add team members and set up milestones.",
  },
  {
    question: "How do I export my data?",
    answer: "Most tables and reports have an export button (usually in the top-right corner). Click it to download your data in CSV or PDF format. You can also access bulk exports from Settings > Data Export.",
  },
  {
    question: "How do I reset my password?",
    answer: "Click on your profile in the top-right corner, then select 'Account Settings'. Under the Security section, click 'Change Password' and follow the prompts to set a new password.",
  },
  {
    question: "How do I connect with a subcontractor?",
    answer: "Go to Team Management > Subcontractor. You can search for existing subcontractors in our network or invite new ones by email. Once connected, you can assign them to projects and track their work.",
  },
];

export default function ContractorHelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ContractorSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold">Help Center & Demos</h1>
          </header>
          <main className="flex-1 overflow-auto bg-background p-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <HelpCircle className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Help Center</h1>
              </div>
              <p className="text-muted-foreground">
                Learn how to use every feature with videos, guides, and examples.
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-8 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{videoTutorials.length}</p>
                    <p className="text-sm text-muted-foreground">Video Tutorials</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Image className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{screenshots.length}</p>
                    <p className="text-sm text-muted-foreground">Screenshots</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{quickGuides.length}</p>
                    <p className="text-sm text-muted-foreground">Quick Guides</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{faqItems.length}</p>
                    <p className="text-sm text-muted-foreground">FAQs</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Video Tutorials Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Video Tutorials</h2>
                </div>
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {videoTutorials.map((video, index) => (
                  <VideoTutorialCard key={index} {...video} />
                ))}
              </div>
            </section>

            {/* Quick Start Guides */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Quick Start Guides</h2>
              </div>
              <div className="space-y-3">
                {quickGuides.map((guide, index) => (
                  <QuickGuideCard
                    key={index}
                    title={guide.title}
                    icon={guide.icon}
                    steps={guide.steps}
                    defaultOpen={index === 0}
                    onWatchVideo={() => console.log("Watch video for", guide.title)}
                    onViewScreenshots={() => console.log("View screenshots for", guide.title)}
                  />
                ))}
              </div>
            </section>

            {/* Screenshots Gallery */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Portal Screenshots</h2>
                </div>
                <Button variant="ghost" size="sm">
                  View Gallery →
                </Button>
              </div>
              <ScreenshotGallery screenshots={screenshots} />
            </section>

            {/* FAQ Section */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              </div>
              <Card>
                <CardContent className="p-4">
                  <FAQAccordion items={faqItems} />
                </CardContent>
              </Card>
            </section>

            {/* Support Contact */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Need More Help?</h2>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">support@smartreno.io</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-muted-foreground">Mon-Fri 9am-5pm</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
