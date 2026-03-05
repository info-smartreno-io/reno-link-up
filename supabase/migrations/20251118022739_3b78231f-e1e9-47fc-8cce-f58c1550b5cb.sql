-- Phase 13: Autonomous Contractor Marketplace Routing

-- 1. Contractor skill graphs table
CREATE TABLE IF NOT EXISTS public.contractor_skill_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  optimal_budgets JSONB,
  ideal_zip_codes TEXT[] DEFAULT '{}',
  graph_data JSONB NOT NULL,
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Marketplace routing logs
CREATE TABLE IF NOT EXISTS public.marketplace_routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  ranked_contractors JSONB NOT NULL,
  selected_contractors TEXT[] NOT NULL,
  orchestrator_decision JSONB,
  routing_reason TEXT,
  auto_routing_enabled BOOLEAN DEFAULT true,
  human_override BOOLEAN DEFAULT false,
  override_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Contractor availability cache
CREATE TABLE IF NOT EXISTS public.contractor_availability_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  availability_score NUMERIC(3,2),
  next_open_window DATE,
  recommended_project_types TEXT[] DEFAULT '{}',
  calendar_data JSONB,
  crew_count INTEGER DEFAULT 1,
  current_load INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contractor_id)
);

-- 4. Workload balancer logs
CREATE TABLE IF NOT EXISTS public.workload_balancer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_pool JSONB NOT NULL,
  recommended_distribution JSONB NOT NULL,
  balancing_notes TEXT,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Match scores expansion
CREATE TABLE IF NOT EXISTS public.match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  contractor_id UUID,
  base_score INTEGER,
  orchestrator_score INTEGER,
  regional_adjustment INTEGER DEFAULT 0,
  availability_score NUMERIC(3,2),
  performance_score INTEGER,
  final_score INTEGER,
  match_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RFP auto sends
CREATE TABLE IF NOT EXISTS public.rfp_auto_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  follow_up_scheduled BOOLEAN DEFAULT false,
  next_follow_up DATE,
  follow_up_count INTEGER DEFAULT 0,
  response_received BOOLEAN DEFAULT false,
  personalized_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contractor_skill_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_routing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_availability_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workload_balancer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_auto_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only for marketplace management)
CREATE POLICY "Admin full access contractor_skill_graphs" ON public.contractor_skill_graphs
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access marketplace_routing_logs" ON public.marketplace_routing_logs
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access contractor_availability_cache" ON public.contractor_availability_cache
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access workload_balancer_logs" ON public.workload_balancer_logs
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access match_scores" ON public.match_scores
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access rfp_auto_sends" ON public.rfp_auto_sends
  FOR ALL USING (public.is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_contractor_skill_graphs_contractor ON public.contractor_skill_graphs(contractor_id);
CREATE INDEX idx_marketplace_routing_logs_project ON public.marketplace_routing_logs(project_id);
CREATE INDEX idx_contractor_availability_cache_contractor ON public.contractor_availability_cache(contractor_id);
CREATE INDEX idx_match_scores_project_contractor ON public.match_scores(project_id, contractor_id);
CREATE INDEX idx_rfp_auto_sends_project_contractor ON public.rfp_auto_sends(project_id, contractor_id);
CREATE INDEX idx_rfp_auto_sends_status ON public.rfp_auto_sends(status);