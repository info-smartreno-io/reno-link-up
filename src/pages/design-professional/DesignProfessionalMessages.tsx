import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function DesignProfessionalMessages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Communicate with homeowners, contractors, and the SmartReno team</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-muted-foreground">When you're connected to a project, messaging will be enabled here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
