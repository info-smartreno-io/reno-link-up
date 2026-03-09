import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileJson, AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { AdminGooglePlacesImport } from "@/components/admin/AdminGooglePlacesImport";

export function BulkImport() {
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "Missing Data",
        description: "Please paste JSON data to import",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const contractors = JSON.parse(jsonData);
      
      if (!Array.isArray(contractors)) {
        throw new Error("JSON must be an array of contractors");
      }

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('bulk-import-contractors', {
        body: {
          contractors,
          source: 'manual',
          importedBy: userData.user?.id,
        },
      });

      if (error) throw error;

      setResult(data);
      setJsonData("");
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.successful} of ${data.total} contractors`,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = `[
  {
    "contractor_name": "ABC Construction",
    "contact_name": "John Smith",
    "email": "john@abcconstruction.com",
    "phone": "(201) 555-0123",
    "service_areas": ["Bergen County", "Passaic County"],
    "specialties": ["Kitchen Remodel", "Bathroom Remodel"],
    "license_number": "NJ-12345",
    "insurance_verified": true,
    "average_rating": 4.8,
    "review_count": 45,
    "source": "clay",
    "seo_ranking_page": 2
  }
]`;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="google-places">
        <TabsList>
          <TabsTrigger value="google-places" className="gap-2">
            <MapPin className="h-4 w-4" /> Google Places
          </TabsTrigger>
          <TabsTrigger value="json-import" className="gap-2">
            <FileJson className="h-4 w-4" /> JSON Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google-places" className="mt-6">
          <AdminGooglePlacesImport />
        </TabsContent>

        <TabsContent value="json-import" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Contractor Import
              </CardTitle>
              <CardDescription>
                Import contractors from Clay.com, CSV, or JSON data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>JSON Data</Label>
                <Textarea
                  placeholder={exampleJson}
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  rows={12}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Paste JSON array of contractor objects. See example format above.
                </p>
              </div>

              <Button onClick={handleImport} disabled={loading} className="w-full">
                {loading ? "Importing..." : "Import Contractors"}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold">{result.total}</div>
                    <div className="text-xs text-muted-foreground">Total Records</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                    <div className="text-xs text-muted-foreground">Successful</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Errors
                    </Label>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {result.errors.map((error: string, idx: number) => (
                        <div key={idx} className="bg-destructive/10 p-2 rounded text-xs">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.successful > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Import completed successfully
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Clay.com Webhook</CardTitle>
              <CardDescription>
                Configure Clay to automatically send contractor data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded font-mono text-xs break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/clay-webhook
              </div>
              <p className="text-sm text-muted-foreground">
                Set this URL as your Clay webhook endpoint. Contractors will be automatically imported
                and scored when Clay enrichment completes.
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Expected Fields:</Label>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>company_name or name (required)</li>
                  <li>email (required)</li>
                  <li>phone, contact_name</li>
                  <li>service_areas, specialties</li>
                  <li>license_number, rating, review_count</li>
                  <li>search_rank, website</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
