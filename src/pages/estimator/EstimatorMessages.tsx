import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function EstimatorMessages() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Messages</h1>
        <p className="text-muted-foreground">Communication with homeowners and admin</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No messages yet</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Messages from homeowners and admin will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
