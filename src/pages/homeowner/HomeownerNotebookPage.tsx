import { HomeownerNotebook } from "@/components/homeowner/HomeownerNotebook";

export default function HomeownerNotebookPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Notebook</h1>
        <p className="text-muted-foreground mt-1">
          Save links, ideas, and notes for your renovation so your SmartReno team can see what matters most.
        </p>
      </div>
      <HomeownerNotebook />
    </div>
  );
}

