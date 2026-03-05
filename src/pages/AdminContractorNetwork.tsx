import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContractorAnalyzerPanel } from "@/components/admin/ContractorAnalyzerPanel";
import { Search, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contractor {
  id: string;
  name: string;
  trade_focus: string;
  is_active: boolean;
  email: string;
  phone: string;
}

export default function AdminContractorNetwork() {
  const { toast } = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  useEffect(() => {
    fetchContractors();
  }, []);

  async function fetchContractors() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .order("name");

      if (error) throw error;
      setContractors(data || []);
    } catch (error: any) {
      console.error("Error fetching contractors:", error);
      toast({
        title: "Error loading contractors",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredContractors = contractors.filter((contractor) =>
    contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.trade_focus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout role="admin">
      <div className="space-y-6">
        <Breadcrumbs />

        <div>
          <h1 className="text-3xl font-bold mb-2">Contractor Network</h1>
          <p className="text-muted-foreground">
            Manage and analyze contractor performance across the network
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contractors by name or trade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contractor List */}
          <Card>
            <CardHeader>
              <CardTitle>Contractors</CardTitle>
              <CardDescription>
                Select a contractor to analyze their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading contractors...
                </div>
              ) : filteredContractors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No contractors found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContractors.map((contractor) => (
                    <div
                      key={contractor.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedContractor?.id === contractor.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => setSelectedContractor(contractor)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-semibold">{contractor.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {contractor.trade_focus || "General Contractor"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={contractor.is_active ? "default" : "secondary"}>
                          {contractor.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis Panel */}
          <div>
            {selectedContractor ? (
              <ContractorAnalyzerPanel
                contractorId={selectedContractor.id}
                trade={selectedContractor.trade_focus || "General Contractor"}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a contractor to analyze their performance</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
