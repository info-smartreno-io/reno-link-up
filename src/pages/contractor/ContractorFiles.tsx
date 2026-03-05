import React, { useState } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, 
  Upload, 
  Download, 
  Search, 
  FileText, 
  Image, 
  File,
  Trash2,
  MoreVertical,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/context/DemoModeContext";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  category: string;
  project?: string;
}

const demoFiles: FileItem[] = [
  { id: "1", name: "Kitchen_Renovation_Plans.pdf", type: "pdf", size: "2.4 MB", uploadedAt: "2024-12-15", category: "plans", project: "Johnson Kitchen Remodel" },
  { id: "2", name: "Site_Photos_Dec.zip", type: "archive", size: "45.2 MB", uploadedAt: "2024-12-14", category: "photos", project: "Smith Bathroom Addition" },
  { id: "3", name: "Permit_Application.pdf", type: "pdf", size: "890 KB", uploadedAt: "2024-12-13", category: "permits", project: "Johnson Kitchen Remodel" },
  { id: "4", name: "Material_Specs.docx", type: "doc", size: "1.2 MB", uploadedAt: "2024-12-12", category: "specs", project: "Williams Basement Finish" },
  { id: "5", name: "Contract_Final.pdf", type: "pdf", size: "3.1 MB", uploadedAt: "2024-12-10", category: "contracts", project: "Johnson Kitchen Remodel" },
  { id: "6", name: "Before_Photos.jpg", type: "image", size: "8.5 MB", uploadedAt: "2024-12-09", category: "photos", project: "Smith Bathroom Addition" },
];

const categories = [
  { id: "all", label: "All Files" },
  { id: "plans", label: "Plans & Drawings" },
  { id: "photos", label: "Photos" },
  { id: "permits", label: "Permits" },
  { id: "contracts", label: "Contracts" },
  { id: "specs", label: "Specifications" },
];

export default function ContractorFiles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { isDemoMode } = useDemoMode();

  const filteredFiles = demoFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (file.project?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "all" || file.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "doc":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "image":
        return <Image className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">File Management</h1>
            <p className="text-muted-foreground">
              {isDemoMode ? "Demo mode - sample files shown" : "Manage your project files and documents"}
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoFiles.length}</p>
                  <p className="text-xs text-muted-foreground">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Image className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoFiles.filter(f => f.category === "photos").length}</p>
                  <p className="text-xs text-muted-foreground">Photos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoFiles.filter(f => f.category === "plans").length}</p>
                  <p className="text-xs text-muted-foreground">Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <File className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{demoFiles.filter(f => f.category === "contracts").length}</p>
                  <p className="text-xs text-muted-foreground">Contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs sm:text-sm">
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {categories.find(c => c.id === activeCategory)?.label}
                </CardTitle>
                <CardDescription>
                  {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No files found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(file.type)}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{file.size}</span>
                              <span>•</span>
                              <span>{file.uploadedAt}</span>
                              {file.project && (
                                <>
                                  <span>•</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {file.project}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ContractorLayout>
  );
}
