import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface ProjectMessagesProps {
  projectId: string;
}

export function ProjectMessages({ projectId }: ProjectMessagesProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="font-medium text-lg mb-1">Project Messages</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Messaging for this project is available through the main Messages tab. 
          Filter by this project to see relevant conversations.
        </p>
      </CardContent>
    </Card>
  );
}
