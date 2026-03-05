-- Phase 11: SmartReno Embedding Engine & RAG Training Pipeline
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector_docs table for document embeddings
CREATE TABLE IF NOT EXISTS public.vector_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  portal TEXT,
  chunk TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create knowledge_graphs table
CREATE TABLE IF NOT EXISTS public.knowledge_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create embedding_jobs table to track embedding status
CREATE TABLE IF NOT EXISTS public.embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID,
  project_id UUID REFERENCES public.contractor_projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  chunks_created INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.vector_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vector_docs
CREATE POLICY "Admin and coordinators can view vector docs"
  ON public.vector_docs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

CREATE POLICY "Admin and coordinators can manage vector docs"
  ON public.vector_docs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

-- RLS Policies for knowledge_graphs
CREATE POLICY "Admin and coordinators can view knowledge graphs"
  ON public.knowledge_graphs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

CREATE POLICY "Admin and coordinators can manage knowledge graphs"
  ON public.knowledge_graphs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

-- RLS Policies for embedding_jobs
CREATE POLICY "Admin and coordinators can view embedding jobs"
  ON public.embedding_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

CREATE POLICY "Admin and coordinators can manage embedding jobs"
  ON public.embedding_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'project_coordinator'::app_role)
    )
  );

-- Create indexes for performance
CREATE INDEX idx_vector_docs_project ON public.vector_docs(project_id);
CREATE INDEX idx_vector_docs_type ON public.vector_docs(document_type);
CREATE INDEX idx_vector_docs_portal ON public.vector_docs(portal);
CREATE INDEX idx_vector_docs_embedding ON public.vector_docs USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_knowledge_graphs_project ON public.knowledge_graphs(project_id);

CREATE INDEX idx_embedding_jobs_project ON public.embedding_jobs(project_id);
CREATE INDEX idx_embedding_jobs_status ON public.embedding_jobs(status);

-- Add triggers for updated_at
CREATE TRIGGER update_vector_docs_updated_at
  BEFORE UPDATE ON public.vector_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_graphs_updated_at
  BEFORE UPDATE ON public.knowledge_graphs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to ai_agent_activity for RAG tracking
ALTER TABLE public.ai_agent_activity
ADD COLUMN IF NOT EXISTS retrieval_queries JSONB,
ADD COLUMN IF NOT EXISTS retrieval_scores JSONB,
ADD COLUMN IF NOT EXISTS embedding_ids TEXT[];