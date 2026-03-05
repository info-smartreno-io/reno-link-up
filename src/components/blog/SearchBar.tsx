import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import Fuse from "fuse.js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  badge: string;
  secondaryBadge?: string;
  details: string[];
  path: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchData, setSearchData] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPortal = () => {
    const path = location.pathname;
    if (path.startsWith('/estimator')) return 'estimator';
    if (path.startsWith('/contractor')) return 'contractor';
    if (path.startsWith('/homeowner')) return 'homeowner';
    if (path.startsWith('/architect')) return 'architect';
    if (path.startsWith('/admin')) return 'admin';
    return 'public';
  };

  useEffect(() => {
    async function fetchData() {
      const portal = getCurrentPortal();
      const data: SearchResult[] = [];

      if (portal === 'estimator' || portal === 'admin') {
        // Search leads
        const { data: leads } = await supabase
          .from('leads')
          .select('id, name, email, phone, location, project_type, status');
        
        if (leads) {
          data.push(...leads.map(lead => ({
            id: lead.id,
            title: lead.name,
            subtitle: lead.email,
            badge: 'Lead',
            secondaryBadge: lead.project_type,
            details: [
              lead.phone,
              lead.location,
              `Status: ${lead.status}`
            ].filter(Boolean),
            path: `/estimator/leads/${lead.id}`
          })));
        }

        // Search estimates
        const { data: estimates } = await supabase
          .from('estimates')
          .select('id, client_name, project_name, estimate_number, status, amount');
        
        if (estimates) {
          data.push(...estimates.map(est => ({
            id: est.id,
            title: est.client_name,
            subtitle: est.project_name,
            badge: 'Estimate',
            secondaryBadge: est.estimate_number,
            details: [
              `Status: ${est.status}`,
              `Amount: $${est.amount.toLocaleString()}`
            ],
            path: `/estimator/estimates/${est.id}`
          })));
        }
      }

      if (portal === 'contractor' || portal === 'admin') {
        // Search contractor projects
        const { data: projects } = await supabase
          .from('contractor_projects')
          .select('id, client_name, project_name, location, project_type, status');
        
        if (projects) {
          data.push(...projects.map(proj => ({
            id: proj.id,
            title: proj.client_name,
            subtitle: proj.project_name,
            badge: 'Project',
            secondaryBadge: proj.project_type,
            details: [
              proj.location,
              `Status: ${proj.status}`
            ],
            path: `/contractor/projects/${proj.id}`
          })));
        }

        // Search foreman tasks
        const { data: tasks } = await supabase
          .from('foreman_tasks')
          .select('id, task_title, status, priority, project_id');
        
        if (tasks) {
          data.push(...tasks.map(task => ({
            id: task.id,
            title: task.task_title,
            badge: 'Task',
            secondaryBadge: task.priority,
            details: [`Status: ${task.status}`],
            path: `/contractor/foreman-tasks`
          })));
        }
      }

      if (portal === 'architect' || portal === 'admin') {
        // Search architect projects
        const { data: archProjects } = await supabase
          .from('architect_projects')
          .select('id, client_name, project_name, location, project_type, status');
        
        if (archProjects) {
          data.push(...archProjects.map(proj => ({
            id: proj.id,
            title: proj.client_name,
            subtitle: proj.project_name,
            badge: 'Architect Project',
            secondaryBadge: proj.project_type,
            details: [
              proj.location,
              `Status: ${proj.status}`
            ],
            path: `/architect/projects/${proj.id}`
          })));
        }
      }

      if (portal === 'homeowner' || portal === 'admin') {
        // Search homeowner projects
        const { data: homeownerProjects } = await supabase
          .from('contractor_projects')
          .select('id, client_name, project_name, location, status');
        
        if (homeownerProjects) {
          data.push(...homeownerProjects.map(proj => ({
            id: proj.id,
            title: proj.project_name,
            subtitle: proj.client_name,
            badge: 'My Project',
            details: [
              proj.location,
              `Status: ${proj.status}`
            ],
            path: `/homeowner/projects/${proj.id}`
          })));
        }
      }

      setSearchData(data);
    }

    fetchData();
  }, [location.pathname]);

  const fuse = useMemo(
    () =>
      new Fuse(searchData, {
        keys: ["title", "subtitle", "badge", "secondaryBadge", "details"],
        threshold: 0.3,
        includeScore: true,
      }),
    [searchData]
  );

  useEffect(() => {
    if (query.trim()) {
      const searchResults = fuse.search(query);
      setResults(searchResults.map((r) => r.item));
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query, fuse]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects, clients, tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          className="pl-10 pr-10 h-12"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
          {results.map((result) => (
            <div
              key={result.id}
              className="block p-4 hover:bg-muted transition-colors border-b last:border-b-0 cursor-pointer"
              onClick={() => {
                navigate(result.path);
                setQuery("");
                setShowResults(false);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {result.badge}
                    </Badge>
                    {result.secondaryBadge && (
                      <Badge variant="outline" className="text-xs">
                        {result.secondaryBadge}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mb-1">
                    {result.title}
                  </h4>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {result.subtitle}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {result.details.map((detail, idx) => (
                      <p key={idx}>{detail}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-lg p-6 text-center z-50">
          <p className="text-muted-foreground">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
