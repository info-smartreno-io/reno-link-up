import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServicePricingCardProps {
  name: string;
  description: string;
  price: number;
  popular?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function ServicePricingCard({
  name,
  description,
  price,
  popular = false,
  selected = false,
  onSelect,
}: ServicePricingCardProps) {
  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
        selected && "border-primary ring-2 ring-primary/20",
        popular && "border-primary/30"
      )}
      onClick={onSelect}
    >
      {popular && (
        <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <div className="flex items-center gap-2">
            {selected && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <span className="text-xl font-bold text-primary">${price}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
