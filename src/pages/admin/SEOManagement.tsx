import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  useSEOPages, 
  useGenerateTownPage, 
  useGenerateCostGuide,
  usePublishPage,
  useBulkGenerateCountyPages,
  useRefreshPageContent,
  useRunSEOMaintenance
} from "@/hooks/useSEOPages";
import { ALL_COUNTIES, PROJECT_TYPES } from "@/data/locations";
import { FileText, Globe, TrendingUp, RefreshCw, Play, Zap } from "lucide-react";

export default function SEOManagement() {
  const [countyFilter, setCountyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');

  const { data: pages, isLoading } = useSEOPages({
    county: countyFilter || undefined,
    page_type: typeFilter || undefined,
    published: publishedFilter === 'true' ? true : publishedFilter === 'false' ? false : undefined,
  });

  const generateTownPage = useGenerateTownPage();
  const generateCostGuide = useGenerateCostGuide();
  const publishPage = usePublishPage();
  const bulkGenerate = useBulkGenerateCountyPages();
  const refreshContent = useRefreshPageContent();
  const runMaintenance = useRunSEOMaintenance();

  const stats = {
    total: pages?.length || 0,
    published: pages?.filter(p => p.published).length || 0,
    draft: pages?.filter(p => !p.published).length || 0,
    needsRefresh: pages?.filter(p => p.needs_refresh).length || 0,
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Management</h1>
        <p className="text-muted-foreground">
          Manage programmatic SEO pages and AI content generation
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Refresh</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needsRefresh}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => runMaintenance.mutate()}
            disabled={runMaintenance.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            Run AI Maintenance
          </Button>

          {ALL_COUNTIES.map(county => (
            <Button
              key={county.slug}
              variant="outline"
              size="sm"
              onClick={() => bulkGenerate.mutate(county.slug)}
              disabled={bulkGenerate.isPending}
            >
              Generate {county.name} Pages
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">All Pages</TabsTrigger>
          <TabsTrigger value="generate">Generate Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="w-[200px]">
                <Select value={countyFilter} onValueChange={setCountyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Counties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Counties</SelectItem>
                    {ALL_COUNTIES.map(county => (
                      <SelectItem key={county.slug} value={county.name}>
                        {county.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[200px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="town_page">Town Pages</SelectItem>
                    <SelectItem value="cost_guide">Cost Guides</SelectItem>
                    <SelectItem value="contractor_directory">Contractor Directory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[200px]">
                <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pages Table */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Pages</CardTitle>
              <CardDescription>
                {pages?.length || 0} pages found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : pages?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No pages found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pages?.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{page.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {page.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {page.town || page.county || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{page.page_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-col">
                            {page.published ? (
                              <Badge>Published</Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                            {page.needs_refresh && (
                              <Badge variant="destructive" className="text-xs">
                                Needs Refresh
                              </Badge>
                            )}
                            {page.ai_generated && (
                              <Badge variant="outline" className="text-xs">
                                AI Generated
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{page.monthly_views} views</div>
                            <div className="text-muted-foreground">
                              {page.monthly_conversions} conversions
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!page.published && (
                              <Button
                                size="sm"
                                onClick={() => publishPage.mutate(page.id)}
                                disabled={publishPage.isPending}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {page.needs_refresh && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => refreshContent.mutate({ 
                                  pageId: page.id, 
                                  refreshType: 'content_refresh' 
                                })}
                                disabled={refreshContent.isPending}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate New SEO Pages</CardTitle>
              <CardDescription>
                Use AI to generate programmatic SEO pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pages are generated using AI and location/project data. Use "Quick Actions" above to bulk generate entire counties.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
