import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Building2 } from "lucide-react";

interface AuthorBioProps {
  author: string;
  date: string;
}

export function AuthorBio({ author, date }: AuthorBioProps) {
  const initials = author.split(' ').map(n => n[0]).join('');
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{author}</h3>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Expert renovation advisors helping North Jersey homeowners make informed decisions about their projects.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <a href="mailto:hello@smartreno.io" className="hover:text-primary transition-colors">
                  hello@smartreno.io
                </a>
              </div>
              <div className="text-muted-foreground">
                Published {new Date(date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
