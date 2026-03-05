import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronRight, Factory, Package, Layers, Ruler, Hammer, PaintBucket, Building2, Home, Trees, Droplets, Send, DoorOpen } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/BackButton";

const vendorCategories = [
  {
    icon: Factory,
    title: "Roofing Systems",
    items: ["GAF architectural shingles","Standing seam metal roofing","ZIP System roof sheathing","Ice & water shield / underlayments","Flashing kits & vents"],
    note: "Preferred certifications and system warranties are a plus.",
  },
  {
    icon: Layers,
    title: "Structural Lumber & Framing",
    items: ["Dimensional lumber (SPF/DF)","LVLs / PSLs / Glulams","Steel beams & columns","Flitch plates","ZIP System wall sheathing (insulated/non)"],
    note: "Stamped engineering docs for steel/flitch components welcome.",
  },
  {
    icon: Home,
    title: "Masonry & Hardscape",
    items: ["CMU block","Cambridge pavers","Retaining wall blocks","Exterior patio tiles","Mortars, geogrid, base aggregates"],
    note: "ICPI-compliant systems and installer guides preferred.",
  },
  {
    icon: DoorOpen,
    title: "Windows & Doors",
    items: ["Andersen, Pella, Marvin windows","Exterior doors (fiberglass, steel, wood)","Interior doors","Casing, baseboard, and trim packages","Hardware and weatherstripping"],
    note: "Provide U-values, energy ratings, and finish options.",
  },
  {
    icon: Trees,
    title: "Decking & Exterior Millwork",
    items: ["Trex decking & railings","PVC/Composite trim","Fasteners & hidden clip systems","Deck footings & hardware","Cable rail kits"],
    note: "Load tables and span charts appreciated.",
  },
  {
    icon: Hammer,
    title: "Interior Finishes",
    items: ["Hardwood flooring","Kitchen cabinets","MSI tile & countertops","Interior doors & millwork","Underlayments & adhesives"],
    note: "Lead times and colorways catalog required for listing.",
  },
  {
    icon: PaintBucket,
    title: "Paints & Coatings",
    items: ["Benjamin Moore paints","Sherwin-Williams paints","Primers, stains, specialty coatings","Low/zero-VOC lines","Exterior sealers"],
    note: "Provide spec sheets and coverage calculators.",
  },
  {
    icon: Ruler,
    title: "Counters, Tile & Surfaces",
    items: ["MSI quartz & porcelain","Ceramic/porcelain tile","Grout, waterproofing membranes","Slab sinks & edges","Schluter profiles"],
    note: "Stock lists and slab yard locations help us route orders.",
  },
  {
    icon: Package,
    title: "Waste & Logistics",
    items: ["Dumpster providers (10–30 yd)","Material delivery & boom services","Haul-away & recycling","Jobsite sanitary & fencing","After-hours delivery windows"],
    note: "Serve Bergen/Passaic/Morris/Hudson? Tell us service radii.",
  },
  {
    icon: Droplets,
    title: "Weather, Water & Envelope",
    items: ["WRBs & air barriers","Flashing tapes","Sealants & foams","Housewrap accessories","Rainscreen systems"],
    note: "Compatible system components preferred for warranty continuity.",
  },
  {
    icon: Building2,
    title: "Cabinetry & Millwork Shops",
    items: ["Custom kitchen/bath cabinetry","Shop drawings & install","Lead-time tiers","Hardware catalogs","Finish samples"],
    note: "Local shops with install crews get priority for rush projects.",
  },
];

function VendorForm({ onSuccess }: { onSuccess?: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = React.useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    categories: "",
    serviceAreas: "",
    message: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('vendor_applications')
        .insert({
          company_name: formData.companyName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          product_categories: formData.categories,
          service_areas: formData.serviceAreas,
          message: formData.message,
        });

      if (error) throw error;

      // Send notification email to SmartReno team
      try {
        await supabase.functions.invoke('send-vendor-notification', {
          body: {
            company_name: formData.companyName,
            contact_name: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            product_categories: formData.categories,
            service_areas: formData.serviceAreas,
            message: formData.message,
          },
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the whole submission if email fails
      }

      toast({
        title: "Application Submitted!",
        description: "Now let's create your account password.",
      });

      // Redirect to password creation
      navigate(`/create-password?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.contactName)}`);
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        categories: "",
        serviceAreas: "",
        message: "",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Could not submit application. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Company Name"
        value={formData.companyName}
        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        required
        disabled={submitting}
      />
      <Input
        placeholder="Contact Name"
        value={formData.contactName}
        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
        required
        disabled={submitting}
      />
      <Input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        disabled={submitting}
      />
      <Input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
        disabled={submitting}
      />
      <Input
        placeholder="Product Categories (e.g., Roofing, Windows)"
        value={formData.categories}
        onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
        required
        disabled={submitting}
      />
      <Input
        placeholder="Service Areas (e.g., Bergen, Passaic, Morris Counties)"
        value={formData.serviceAreas}
        onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
        disabled={submitting}
      />
      <Textarea
        placeholder="Tell us about your products and services..."
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        rows={4}
        required
        disabled={submitting}
      />
      <Button type="submit" className="w-full" disabled={submitting}>
        <Send className="mr-2 h-4 w-4" />
        {submitting ? "Submitting..." : "Submit Vendor Inquiry"}
      </Button>
    </form>
  );
}

export default function VendorsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <>
      <Helmet>
        <title>Vendor Partnership - SmartReno | Join Our Trusted Supplier Network</title>
        <meta 
          name="description" 
          content="Partner with SmartReno and connect with qualified contractors on active residential construction projects across North Jersey. Join our trusted vendor network for roofing, lumber, windows, doors, and more." 
        />
      </Helmet>

      <SiteNavbar />

      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <BackButton className="mb-6" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Partner with SmartReno
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Join our trusted network of material suppliers and service providers serving North Jersey's residential construction market.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  Become a Vendor Partner <ChevronRight className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Vendor Partnership Inquiry</DialogTitle>
                </DialogHeader>
                <VendorForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Product Categories We Need</h2>
            <p className="text-muted-foreground">
              We're looking for reliable partners across all phases of residential construction
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vendorCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="mb-4 space-y-1 text-sm text-muted-foreground">
                        {category.items.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <ChevronRight className="mr-1 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs italic text-muted-foreground border-t pt-3">
                        {category.note}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">How Vendor Partnership Works</h2>
          </div>
          
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <CardTitle>Apply to Join</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Submit your company info, product categories, and service areas. We review all applications within 2 business days.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <CardTitle>Get Listed</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Once approved, your products appear in our contractor marketplace with pricing, availability, and delivery terms.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <CardTitle>Fulfill Orders</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Receive project-specific material requests, provide quotes, and deliver to active job sites across North Jersey.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-8 text-center md:p-12">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Partner?</h2>
              <p className="mb-6 text-lg text-muted-foreground">
                Join SmartReno's trusted vendor network and connect with qualified contractors on active projects.
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    Apply Now <ChevronRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Vendor Partnership Inquiry</DialogTitle>
                  </DialogHeader>
                  <VendorForm onSuccess={() => setDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </section>
      </div>
    </>
  );
}
