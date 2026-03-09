import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Building2, Palette, Search, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { bergen, essex, hudson, morris, passaic } from "@/data/towns";

const allTowns = [...bergen, ...essex, ...hudson, ...morris, ...passaic].sort();

const CONTRACTOR_QUERIES = [
  "general contractor",
  "home remodeling contractor",
  "kitchen remodeler",
  "bathroom remodeler",
  "basement finishing contractor",
  "home addition contractor",
];

const DESIGNER_QUERIES = [
  "interior designer",
  "kitchen designer",
  "renovation designer",
  "home designer",
];

export function AdminGooglePlacesImport() {
  const [loading, setLoading] = useState(false);
  const [businessType, setBusinessType] = useState<"contractor" | "designer">("contractor");
  const [selectedTown, setSelectedTown] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [results, setResults] = useState<{ success: boolean; results_found: number; new_imported: number; duplicates_skipped: number } | null>(null);

  // Fetch import logs
  const { data: importLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["google-import-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_places_import_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
  });

  const runImport = async (query: string) => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("google-places-import", {
        body: {
          searchQuery: query,
          businessType,
          userId: user?.id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResults(data);
      toast.success(`Imported ${data.new_imported} new businesses`);
      refetchLogs();
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const runBulkImport = async () => {
    if (!selectedTown) {
      toast.error("Please select a town");
      return;
    }

    const queries = businessType === "contractor" ? CONTRACTOR_QUERIES : DESIGNER_QUERIES;
    let totalNew = 0;
    let totalDuplicates = 0;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const baseQuery of queries) {
        const fullQuery = `${baseQuery} near ${selectedTown} NJ`;
        toast.info(`Searching: ${fullQuery}`);

        const { data, error } = await supabase.functions.invoke("google-places-import", {
          body: {
            searchQuery: fullQuery,
            businessType,
            userId: user?.id,
          },
        });

        if (!error && data && !data.error) {
          totalNew += data.new_imported || 0;
          totalDuplicates += data.duplicates_skipped || 0;
        }

        // Small delay between requests
        await new Promise((r) => setTimeout(r, 500));
      }

      setResults({ success: true, results_found: totalNew + totalDuplicates, new_imported: totalNew, duplicates_skipped: totalDuplicates });
      toast.success(`Bulk import complete: ${totalNew} new, ${totalDuplicates} duplicates`);
      refetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Google Places Import</h2>
        <p className="text-muted-foreground">Import contractors and designers from Google Places API</p>
      </div>

      <Tabs value={businessType} onValueChange={(v) => setBusinessType(v as "contractor" | "designer")}>
        <TabsList>
          <TabsTrigger value="contractor" className="gap-2">
            <Building2 className="h-4 w-4" /> Contractors
          </TabsTrigger>
          <TabsTrigger value="designer" className="gap-2">
            <Palette className="h-4 w-4" /> Designers
          </TabsTrigger>
        </TabsList>

        <TabsContent value={businessType} className="space-y-6 mt-6">
          {/* Custom Query */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> Custom Search
              </CardTitle>
              <CardDescription>Enter a custom Google Places search query</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder={`e.g. "${businessType === "contractor" ? "kitchen remodeler" : "interior designer"} near Ridgewood NJ"`}
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => runImport(customQuery)} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Import by Town */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Bulk Import by Town
              </CardTitle>
              <CardDescription>
                Import all {businessType}s for a specific town using predefined search queries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <select
                  value={selectedTown}
                  onChange={(e) => setSelectedTown(e.target.value)}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a town...</option>
                  {allTowns.map((town) => (
                    <option key={town} value={town}>{town}</option>
                  ))}
                </select>
                <Button onClick={runBulkImport} disabled={loading || !selectedTown}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Bulk Import
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Will run {businessType === "contractor" ? CONTRACTOR_QUERIES.length : DESIGNER_QUERIES.length} searches for the selected town
              </p>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card className="border-success bg-success-muted/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{results.results_found}</p>
                    <p className="text-sm text-muted-foreground">Results Found</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{results.new_imported}</p>
                    <p className="text-sm text-muted-foreground">New Imported</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">{results.duplicates_skipped}</p>
                    <p className="text-sm text-muted-foreground">Duplicates Skipped</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Imports</CardTitle>
            </CardHeader>
            <CardContent>
              {importLogs && importLogs.length > 0 ? (
                <div className="space-y-2">
                  {importLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{log.search_query}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.business_type} • {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <span className="text-success">+{log.new_imported}</span>
                        <span className="text-muted-foreground"> / {log.results_found} found</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No imports yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
