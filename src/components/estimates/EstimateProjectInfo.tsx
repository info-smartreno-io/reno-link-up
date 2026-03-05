import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Calendar, Star, Building2 } from "lucide-react";

interface ProjectInfoData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceAddress: string;
  serviceCity: string;
  serviceState: string;
  serviceZip: string;
  isGatedProperty: boolean;
  projectCategory: string;
  projectDescription: string;
  requestedDate: string;
  status: string;
  referralSource: string;
  opportunityRating: number;
  assignedEstimator: string;
  estimateNumber: string;
}

interface EstimateProjectInfoProps {
  data: ProjectInfoData;
  onUpdate: (field: keyof ProjectInfoData, value: any) => void;
  leadData?: any;
}

const PROJECT_CATEGORIES = [
  "Addition",
  "Kitchen Renovation",
  "Bathroom Renovation",
  "Full Home Renovation",
  "Basement Finishing",
  "Deck/Patio",
  "Roofing",
  "Siding",
  "Window Replacement",
  "HVAC",
  "Electrical",
  "Plumbing",
  "Other",
];

const REFERRAL_SOURCES = [
  "Google",
  "Facebook",
  "Instagram",
  "Referral",
  "Thumbtack",
  "HomeAdvisor",
  "Angi",
  "Yelp",
  "Website",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-700" },
  { value: "sent", label: "Sent", color: "bg-blue-500/10 text-blue-700" },
  { value: "accepted", label: "Accepted", color: "bg-green-500/10 text-green-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-700" },
];

export function EstimateProjectInfo({ data, onUpdate, leadData }: EstimateProjectInfoProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={data.customerName}
              onChange={(e) => onUpdate('customerName', e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={data.customerEmail}
                onChange={(e) => onUpdate('customerEmail', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={data.customerPhone}
                onChange={(e) => onUpdate('customerPhone', e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Service Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceAddress">Street Address</Label>
            <Input
              id="serviceAddress"
              value={data.serviceAddress}
              onChange={(e) => onUpdate('serviceAddress', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceCity">City</Label>
              <Input
                id="serviceCity"
                value={data.serviceCity}
                onChange={(e) => onUpdate('serviceCity', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceState">State</Label>
              <Input
                id="serviceState"
                value={data.serviceState}
                onChange={(e) => onUpdate('serviceState', e.target.value)}
                placeholder="NJ"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceZip">Zip Code</Label>
              <Input
                id="serviceZip"
                value={data.serviceZip}
                onChange={(e) => onUpdate('serviceZip', e.target.value)}
                placeholder="07001"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGatedProperty"
              checked={data.isGatedProperty}
              onCheckedChange={(checked) => onUpdate('isGatedProperty', checked)}
            />
            <Label htmlFor="isGatedProperty" className="text-sm font-normal">
              Gated Property
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project Category</Label>
              <Select 
                value={data.projectCategory} 
                onValueChange={(value) => onUpdate('projectCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={data.status} 
                onValueChange={(value) => onUpdate('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={opt.color}>
                          {opt.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project Description</Label>
            <Textarea
              value={data.projectDescription}
              onChange={(e) => onUpdate('projectDescription', e.target.value)}
              placeholder="Describe the scope of work..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Additional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Requested Date</Label>
              <Input
                type="date"
                value={data.requestedDate}
                onChange={(e) => onUpdate('requestedDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Referral Source</Label>
              <Select 
                value={data.referralSource} 
                onValueChange={(value) => onUpdate('referralSource', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map(src => (
                    <SelectItem key={src} value={src}>{src}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Opportunity Rating
              <Star className="h-4 w-4 text-yellow-500" />
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onUpdate('opportunityRating', rating)}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      rating <= data.opportunityRating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estimate Number</Label>
            <Input
              value={data.estimateNumber}
              onChange={(e) => onUpdate('estimateNumber', e.target.value)}
              placeholder="Auto-generated"
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
