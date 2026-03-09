import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Star, MapPin, Shield, Award, CheckCircle2, Phone, Mail, Globe,
  Calendar, FileText, Hammer, ArrowRight, ArrowLeft, Camera, Clock,
  BadgeCheck, Users, Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import kitchenImage from "@/assets/kitchen-remodel.jpg";
import bathroomImage from "@/assets/bathroom-remodel.jpg";
import basementImage from "@/assets/basement-finished.jpg";
import additionImage from "@/assets/home-addition.jpg";

// Mock data - in production this would come from the database
const MOCK_CONTRACTORS: Record<string, {
  id: string;
  name: string;
  trade: string;
  rating: number;
  reviews: number;
  location: string;
  zip: string;
  verified: boolean;
  licensed: boolean;
  insured: boolean;
  yearsExp: number;
  specialties: string[];
  completedProjects: number;
  phone: string;
  email: string;
  website: string;
  licenseNumber: string;
  licenseType: string;
  licenseState: string;
  licenseStatus: string;
  businessType: string;
  founded: number;
  description: string;
  serviceArea: string[];
  photos: { src: string; alt: string }[];
  reviewsList: { author: string; rating: number; date: string; text: string; project: string }[];
}> = {
  "1": {
    id: "1",
    name: "Apex Home Renovations",
    trade: "General Contractor",
    rating: 4.9,
    reviews: 127,
    location: "Ridgewood, NJ",
    zip: "07450",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 18,
    specialties: ["Kitchen", "Bathroom", "Additions"],
    completedProjects: 340,
    phone: "(201) 555-0142",
    email: "info@apexhomereno.com",
    website: "www.apexhomereno.com",
    licenseNumber: "13VH09812400",
    licenseType: "Home Improvement Contractor",
    licenseState: "New Jersey",
    licenseStatus: "Active",
    businessType: "General Contractor",
    founded: 2008,
    description: "Apex Home Renovations has been transforming homes across Northern New Jersey for over 18 years. We specialize in full kitchen and bathroom remodels, home additions, and whole-home renovations. Our team of experienced craftsmen takes pride in delivering exceptional quality, on time and on budget.",
    serviceArea: ["Ridgewood", "Glen Rock", "Wyckoff", "Midland Park", "Waldwick", "Ho-Ho-Kus", "Saddle River"],
    photos: [
      { src: kitchenImage, alt: "Modern kitchen remodel with white shaker cabinets" },
      { src: bathroomImage, alt: "Luxury master bathroom renovation" },
      { src: basementImage, alt: "Finished basement entertainment room" },
      { src: additionImage, alt: "Two-story home addition" },
    ],
    reviewsList: [
      { author: "Sarah M.", rating: 5, date: "2026-01-15", text: "Apex did an incredible job on our kitchen remodel. From design through completion, the team was professional, communicative, and the craftsmanship was outstanding. Highly recommend!", project: "Kitchen Remodel" },
      { author: "Michael R.", rating: 5, date: "2025-11-28", text: "We hired Apex for a full bathroom renovation and couldn't be happier. They handled every detail and the finished product exceeded our expectations.", project: "Bathroom Renovation" },
      { author: "Jennifer L.", rating: 5, date: "2025-10-12", text: "Professional from start to finish. The addition blends seamlessly with our existing home. Great attention to detail.", project: "Home Addition" },
      { author: "David K.", rating: 4, date: "2025-08-20", text: "Solid work on our basement finishing. Minor delays due to permits but the team kept us informed throughout the process.", project: "Basement Finishing" },
    ],
  },
  "2": {
    id: "2",
    name: "Bergen Kitchen & Bath",
    trade: "Kitchen Specialist",
    rating: 4.8,
    reviews: 89,
    location: "Glen Rock, NJ",
    zip: "07452",
    verified: true,
    licensed: true,
    insured: true,
    yearsExp: 12,
    specialties: ["Kitchen", "Bathroom"],
    completedProjects: 215,
    phone: "(201) 555-0198",
    email: "info@bergenkb.com",
    website: "www.bergenkb.com",
    licenseNumber: "13VH09234100",
    licenseType: "Home Improvement Contractor",
    licenseState: "New Jersey",
    licenseStatus: "Active",
    businessType: "Kitchen & Bath Specialist",
    founded: 2014,
    description: "Bergen Kitchen & Bath is Northern NJ's premier kitchen and bathroom renovation specialist. We bring design expertise and skilled craftsmanship to every project, creating beautiful, functional spaces that homeowners love.",
    serviceArea: ["Glen Rock", "Ridgewood", "Fair Lawn", "Paramus", "Hackensack"],
    photos: [
      { src: kitchenImage, alt: "Custom kitchen with quartz countertops" },
      { src: bathroomImage, alt: "Spa-style bathroom with walk-in shower" },
    ],
    reviewsList: [
      { author: "Linda T.", rating: 5, date: "2026-02-01", text: "Amazing kitchen transformation! Bergen Kitchen & Bath understood our vision perfectly and delivered beyond expectations.", project: "Kitchen Remodel" },
      { author: "Tom H.", rating: 5, date: "2025-12-10", text: "Our new bathroom is stunning. The tile work is impeccable and the design is exactly what we wanted.", project: "Bathroom Renovation" },
    ],
  },
};

// Fallback for IDs not in mock data
function getContractor(id: string) {
  return MOCK_CONTRACTORS[id] || null;
}

export default function ContractorProfile() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const contractor = getContractor(id);
  const [showBidDialog, setShowBidDialog] = useState(false);

  if (!contractor) {
    return (
      <>
        <SiteNavbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Contractor Not Found</h1>
            <p className="text-muted-foreground">This contractor profile doesn't exist.</p>
            <Button onClick={() => navigate("/contractors")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
            </Button>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const initials = contractor.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <>
      <Helmet>
        <title>{contractor.name} | SmartReno Contractor Network</title>
        <meta name="description" content={`${contractor.name} — ${contractor.trade} in ${contractor.location}. ${contractor.yearsExp} years experience, ${contractor.completedProjects} projects completed. Licensed & insured.`} />
      </Helmet>

      <SiteNavbar />

      <main className="min-h-screen bg-background">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-br from-primary via-accent to-primary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 mb-6"
              onClick={() => navigate("/contractors")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Directory
            </Button>

            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-3xl shadow-lg border border-white/20">
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{contractor.name}</h1>
                  {contractor.verified && (
                    <Badge className="bg-white/20 text-white border-white/30 gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-white/70 text-lg mt-1">{contractor.trade}</p>

                <div className="flex flex-wrap items-center gap-4 mt-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <strong className="text-white">{contractor.rating}</strong> ({contractor.reviews} reviews)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {contractor.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Est. {contractor.founded}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> {contractor.completedProjects} projects
                  </span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {contractor.licensed && (
                    <Badge variant="outline" className="border-white/30 text-white gap-1">
                      <Shield className="h-3 w-3" /> Licensed
                    </Badge>
                  )}
                  {contractor.insured && (
                    <Badge variant="outline" className="border-white/30 text-white gap-1">
                      <Shield className="h-3 w-3" /> Insured
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-white/30 text-white gap-1">
                    <Award className="h-3 w-3" /> {contractor.yearsExp} yrs experience
                  </Badge>
                </div>
              </div>

              {/* CTA Sidebar */}
              <div className="w-full md:w-64 flex-shrink-0">
                <Card className="bg-white/95 backdrop-blur shadow-xl border-0">
                  <CardContent className="p-5 space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setShowBidDialog(true)}
                    >
                      <FileText className="mr-2 h-4 w-4" /> Request to Bid
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      SmartReno will scope your project and this contractor can bid
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Content */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0">
              {[
                { value: "about", label: "About" },
                { value: "photos", label: `Photos (${contractor.photos.length})` },
                { value: "services", label: "Services" },
                { value: "license", label: "License" },
                { value: "reviews", label: `Reviews (${contractor.reviewsList.length})` },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3 text-sm font-medium"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="mt-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-3">About {contractor.name}</h2>
                    <p className="text-muted-foreground leading-relaxed">{contractor.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3">Service Area</h3>
                    <div className="flex flex-wrap gap-2">
                      {contractor.serviceArea.map(area => (
                        <Badge key={area} variant="secondary" className="gap-1">
                          <MapPin className="h-3 w-3" /> {area}, NJ
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {contractor.specialties.map(s => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <BadgeCheck className="h-8 w-8 text-accent" />
                        <div>
                          <p className="font-bold text-sm text-foreground">SmartReno Verified</p>
                          <p className="text-xs text-muted-foreground">License & insurance confirmed</p>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{contractor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{contractor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <span>{contractor.website}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-5 space-y-3">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        SmartReno protects your time, money and home
                      </p>
                      <p className="text-xs text-muted-foreground italic">The first step before you renovate.</p>
                      <Button className="w-full" size="sm" onClick={() => setShowBidDialog(true)}>
                        Request to Bid <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="mt-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" /> Project Photos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractor.photos.map((photo, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl overflow-hidden shadow-md group"
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Services Offered</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {contractor.specialties.map(specialty => (
                  <Card key={specialty} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-start gap-3">
                      <Hammer className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-foreground">{specialty} Renovation</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Full-service {specialty.toLowerCase()} renovations including design, materials, and installation.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* License Tab */}
            <TabsContent value="license" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">License Information</h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <BadgeCheck className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">Verified License</p>
                          <p className="text-sm text-muted-foreground">SmartReno confirmed this contractor's license</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        {[
                          { label: "License #", value: contractor.licenseNumber },
                          { label: "Status", value: contractor.licenseStatus },
                          { label: "State", value: contractor.licenseState },
                          { label: "Type", value: contractor.licenseType },
                          { label: "Business Type", value: contractor.businessType },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium text-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Insurance</h2>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-accent" />
                        <div>
                          <p className="font-bold text-foreground">Fully Insured</p>
                          <p className="text-sm text-muted-foreground">General liability & workers' compensation</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        SmartReno verifies that all contractors in our network maintain active insurance policies to protect homeowners during renovation projects.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Reviews</h2>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold">{contractor.rating}</span>
                  <span className="text-muted-foreground">({contractor.reviews} reviews)</span>
                </div>
              </div>

              <div className="space-y-4">
                {contractor.reviewsList.map((review, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-foreground">{review.author}</p>
                            <p className="text-xs text-muted-foreground">{review.project} • {new Date(review.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className={`h-4 w-4 ${si < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Bottom CTA */}
        <section className="bg-primary py-12 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-3">
              Interested in {contractor.name}?
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              Start your project with SmartReno and this contractor can bid on your renovation.
            </p>
            <Button
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 px-8 py-4 h-auto text-lg font-bold rounded-xl shadow-md"
              onClick={() => setShowBidDialog(true)}
            >
              <FileText className="mr-2 h-5 w-5" /> Request to Bid
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Request to Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Hammer className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Start Your Project First</DialogTitle>
            <DialogDescription className="text-center">
              To request a bid from {contractor.name}, start by telling us about your project. A SmartReno construction agent will scope the work, and you'll receive 3 qualified bids — including from this contractor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                SmartReno protects your time, money and home
              </p>
              <p className="text-xs text-muted-foreground italic">The first step before you renovate.</p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setShowBidDialog(false);
                navigate("/start-your-renovation");
              }}
            >
              Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => {
                  setShowBidDialog(false);
                  navigate("/login");
                }}
              >
                Sign in
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
