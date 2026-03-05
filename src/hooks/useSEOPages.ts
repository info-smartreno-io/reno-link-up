import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { seoPageGenerationService } from "@/services/seoPageGeneration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SEOPage } from "@/types/seo-pages";

export const useSEOPages = (filters?: {
  page_type?: string;
  county?: string;
  published?: boolean;
  needs_refresh?: boolean;
}) => {
  return useQuery({
    queryKey: ['seo-pages', filters],
    queryFn: () => seoPageGenerationService.getSEOPages(filters),
  });
};

export const useGenerateTownPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ town, county, projectType }: { 
      town: string; 
      county: string; 
      projectType?: string 
    }) =>
      seoPageGenerationService.generateTownPage(town, county, projectType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-pages'] });
      toast.success('Town page generated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to generate town page: ${error.message}`);
    },
  });
};

export const useGenerateCostGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectType, county }: { 
      projectType: string; 
      county?: string 
    }) =>
      seoPageGenerationService.generateCostGuide(projectType, county),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-pages'] });
      toast.success('Cost guide generated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to generate cost guide: ${error.message}`);
    },
  });
};

export const usePublishPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) =>
      seoPageGenerationService.publishPage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-pages'] });
      toast.success('Page published successfully');
    },
    onError: (error) => {
      toast.error(`Failed to publish page: ${error.message}`);
    },
  });
};

export const useBulkGenerateCountyPages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (countySlug: string) =>
      seoPageGenerationService.bulkGenerateCountyPages(countySlug),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seo-pages'] });
      toast.success(`Successfully generated ${data.length} pages`);
    },
    onError: (error) => {
      toast.error(`Failed to bulk generate pages: ${error.message}`);
    },
  });
};

export const useRefreshPageContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, refreshType }: { 
      pageId: string; 
      refreshType: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-seo-content-generator', {
        body: {
          page_id: pageId,
          refresh_type: refreshType,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-pages'] });
      toast.success('Content refreshed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to refresh content: ${error.message}`);
    },
  });
};

export const useRunSEOMaintenance = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-seo-maintenance');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `SEO maintenance complete: ${data.pages_scanned} pages scanned, ${data.recommendations} recommendations`
      );
    },
    onError: (error) => {
      toast.error(`SEO maintenance failed: ${error.message}`);
    },
  });
};
