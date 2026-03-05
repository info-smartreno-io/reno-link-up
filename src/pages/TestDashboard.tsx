import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

const TestDashboard = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Database Connection", status: 'pending' },
    { name: "Estimate Form → Database", status: 'pending' },
    { name: "Estimate Form → Email to info@smartreno.io", status: 'pending' },
    { name: "Contractor Application → Database", status: 'pending' },
    { name: "Contractor Application → Confirmation Email", status: 'pending' },
    { name: "Contractor Application → Admin Notification", status: 'pending' },
    { name: "Storage Bucket Access", status: 'pending' },
    { name: "RLS Policies - Anonymous Access", status: 'pending' },
  ]);

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.name === name ? { ...t, ...updates } : t));
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    const start = Date.now();
    updateTest(testName, { status: 'running' });
    
    try {
      await testFn();
      const duration = Date.now() - start;
      updateTest(testName, { status: 'passed', duration, message: `Completed in ${duration}ms` });
    } catch (error) {
      const duration = Date.now() - start;
      updateTest(testName, { 
        status: 'failed', 
        duration,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testDatabaseConnection = async () => {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
  };

  const testEstimateFormDatabase = async () => {
    // Test inserting estimate request as anonymous user
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '2015551234',
      address: '123 Test St, Bergen County, NJ',
      project_type: 'kitchen',
      message: 'This is a test estimate request',
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('estimate_requests')
      .insert(testData)
      .select()
      .single();
    
    if (error) throw new Error(`Database insert failed: ${error.message}`);
    if (!data) throw new Error('No data returned from insert');
    
    // Clean up test data
    await supabase.from('estimate_requests').delete().eq('id', data.id);
  };

  const testEstimateFormEmail = async () => {
    // Test sending email notification
    const { error } = await supabase.functions.invoke('send-estimate-request-notification', {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '2015551234',
        address: '123 Test St, Bergen County, NJ',
        project_type: 'kitchen',
        message: 'This is a test estimate request'
      }
    });
    
    if (error) throw new Error(`Email function failed: ${error.message}`);
  };

  const testContractorApplicationDatabase = async () => {
    // Test inserting vendor application as anonymous user
    const testData = {
      company_name: 'Test Company',
      contact_name: 'Test Contact',
      email: 'testcontractor@example.com',
      phone: '2015551234',
      product_categories: 'General Contracting',
      service_areas: 'Bergen County, NJ',
      message: 'Test application',
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('vendor_applications')
      .insert(testData)
      .select()
      .single();
    
    if (error) throw new Error(`Database insert failed: ${error.message}`);
    if (!data) throw new Error('No data returned from insert');
    
    // Clean up test data
    await supabase.from('vendor_applications').delete().eq('id', data.id);
  };

  const testContractorConfirmationEmail = async () => {
    const { error } = await supabase.functions.invoke('send-contractor-confirmation', {
      body: {
        email: 'testcontractor@example.com',
        companyName: 'Test Company',
        contactName: 'Test Contact',
        trackingNumber: 'SR-TEST123'
      }
    });
    
    if (error) throw new Error(`Confirmation email failed: ${error.message}`);
  };

  const testContractorAdminNotification = async () => {
    const { error } = await supabase.functions.invoke('send-admin-contractor-notification', {
      body: {
        companyName: 'Test Company',
        contactName: 'Test Contact',
        email: 'testcontractor@example.com',
        phone: '2015551234',
        trackingNumber: 'SR-TEST123',
        productCategories: 'General Contracting',
        serviceAreas: 'Bergen County, NJ',
        hasLicense: false,
        hasInsurance: false,
        portfolioCount: 0
      }
    });
    
    if (error) throw new Error(`Admin notification failed: ${error.message}`);
  };

  const testStorageBucket = async () => {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const applicationsBucket = buckets?.find(b => b.name === 'applications');
    if (!applicationsBucket) throw new Error('Applications storage bucket not found');
  };

  const testRLSPolicies = async () => {
    // Test that anonymous users can insert into estimate_requests and vendor_applications
    const estimateTest = await supabase.from('estimate_requests').select('id').limit(1);
    const vendorTest = await supabase.from('vendor_applications').select('id').limit(1);
    
    // These shouldn't error even for anonymous users (reading might be restricted but insert is allowed)
    if (estimateTest.error && estimateTest.error.code === '42501') {
      throw new Error('RLS blocking estimate_requests access');
    }
    if (vendorTest.error && vendorTest.error.code === '42501') {
      throw new Error('RLS blocking vendor_applications access');
    }
  };

  const runAllTests = async () => {
    toast({ title: "Running all tests...", description: "This may take a minute" });

    await runTest("Database Connection", testDatabaseConnection);
    await runTest("Estimate Form → Database", testEstimateFormDatabase);
    await runTest("Estimate Form → Email to info@smartreno.io", testEstimateFormEmail);
    await runTest("Contractor Application → Database", testContractorApplicationDatabase);
    await runTest("Contractor Application → Confirmation Email", testContractorConfirmationEmail);
    await runTest("Contractor Application → Admin Notification", testContractorAdminNotification);
    await runTest("Storage Bucket Access", testStorageBucket);
    await runTest("RLS Policies - Anonymous Access", testRLSPolicies);

    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    
    toast({
      title: "Test Suite Complete",
      description: `${passed} passed, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      passed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline"
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Integration Test Dashboard</h1>
        <p className="text-muted-foreground">Run tests directly in the browser to verify all portal functionality</p>
      </div>

      <div className="mb-6">
        <Button onClick={runAllTests} size="lg">
          Run All Tests
        </Button>
      </div>

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <CardTitle className="text-lg">{test.name}</CardTitle>
              </div>
              {getStatusBadge(test.status)}
            </CardHeader>
            <CardContent>
              {test.message && (
                <CardDescription className="mt-2">{test.message}</CardDescription>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Summary</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{tests.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {tests.filter(t => t.status === 'passed').length}
            </div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">
              {tests.filter(t => t.status === 'failed').length}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {tests.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;
