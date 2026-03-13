export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_internal_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          action_config: Json
          action_type: string
          agent_id: string
          created_at: string
          id: string
          sequence_order: number
          stop_on_failure: boolean
        }
        Insert: {
          action_config?: Json
          action_type: string
          agent_id: string
          created_at?: string
          id?: string
          sequence_order?: number
          stop_on_failure?: boolean
        }
        Update: {
          action_config?: Json
          action_type?: string
          agent_id?: string
          created_at?: string
          id?: string
          sequence_order?: number
          stop_on_failure?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_audit_logs: {
        Row: {
          action_id: string | null
          action_type: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          run_id: string
          status: string
        }
        Insert: {
          action_id?: string | null
          action_type: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          run_id: string
          status: string
        }
        Update: {
          action_id?: string | null
          action_type?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          run_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_audit_logs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "agent_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_audit_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_client_assignments: {
        Row: {
          agent_id: string
          contractor_client_id: string
          created_at: string | null
          id: string
          priority: string | null
        }
        Insert: {
          agent_id: string
          contractor_client_id: string
          created_at?: string | null
          id?: string
          priority?: string | null
        }
        Update: {
          agent_id?: string
          contractor_client_id?: string
          created_at?: string | null
          id?: string
          priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_client_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "inside_sales_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_client_assignments_contractor_client_id_fkey"
            columns: ["contractor_client_id"]
            isOneToOne: false
            referencedRelation: "contractor_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_id: string
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          result_summary: Json | null
          started_at: string | null
          status: string
          trigger_source: string
          trigger_source_id: string
          triggered_by: string | null
        }
        Insert: {
          agent_id: string
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          result_summary?: Json | null
          started_at?: string | null
          status?: string
          trigger_source: string
          trigger_source_id: string
          triggered_by?: string | null
        }
        Update: {
          agent_id?: string
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          result_summary?: Json | null
          started_at?: string | null
          status?: string
          trigger_source?: string
          trigger_source_id?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: number | null
          requires_approval: boolean
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          requires_approval?: boolean
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          requires_approval?: boolean
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_agent_activity: {
        Row: {
          agent_type: string
          approval_status: string | null
          approved_by: string | null
          automation_level: string | null
          autonomous_decision: boolean | null
          created_at: string | null
          embedding_ids: string[] | null
          id: string
          input: Json
          output: Json | null
          plan_used: string | null
          premium_boost_applied: boolean | null
          project_id: string | null
          retrieval_queries: Json | null
          retrieval_scores: Json | null
          status: string
          subscription_level: string | null
          updated_at: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          agent_type: string
          approval_status?: string | null
          approved_by?: string | null
          automation_level?: string | null
          autonomous_decision?: boolean | null
          created_at?: string | null
          embedding_ids?: string[] | null
          id?: string
          input: Json
          output?: Json | null
          plan_used?: string | null
          premium_boost_applied?: boolean | null
          project_id?: string | null
          retrieval_queries?: Json | null
          retrieval_scores?: Json | null
          status?: string
          subscription_level?: string | null
          updated_at?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          agent_type?: string
          approval_status?: string | null
          approved_by?: string | null
          automation_level?: string | null
          autonomous_decision?: boolean | null
          created_at?: string | null
          embedding_ids?: string[] | null
          id?: string
          input?: Json
          output?: Json | null
          plan_used?: string | null
          premium_boost_applied?: boolean | null
          project_id?: string | null
          retrieval_queries?: Json | null
          retrieval_scores?: Json | null
          status?: string
          subscription_level?: string | null
          updated_at?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      ai_blog_posts: {
        Row: {
          content: string
          created_at: string | null
          generated_by: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          project_type: string | null
          published_at: string | null
          reviewed_by: string | null
          slug: string
          status: string | null
          target_location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          generated_by?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          project_type?: string | null
          published_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: string | null
          target_location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          generated_by?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          project_type?: string | null
          published_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: string | null
          target_location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_content_ideas: {
        Row: {
          ai_outline: string | null
          ai_reasoning: string | null
          approved_at: string | null
          approved_by: string | null
          competition_level: string | null
          content_type: string
          created_at: string | null
          description: string | null
          estimated_word_count: number | null
          id: string
          priority: string | null
          project_type: string | null
          report_id: string | null
          search_volume_estimate: number | null
          seo_potential_score: number | null
          status: string | null
          target_keywords: string[] | null
          target_location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_outline?: string | null
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          competition_level?: string | null
          content_type: string
          created_at?: string | null
          description?: string | null
          estimated_word_count?: number | null
          id?: string
          priority?: string | null
          project_type?: string | null
          report_id?: string | null
          search_volume_estimate?: number | null
          seo_potential_score?: number | null
          status?: string | null
          target_keywords?: string[] | null
          target_location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_outline?: string | null
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          competition_level?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          estimated_word_count?: number | null
          id?: string
          priority?: string | null
          project_type?: string | null
          report_id?: string | null
          search_volume_estimate?: number | null
          seo_potential_score?: number | null
          status?: string | null
          target_keywords?: string[] | null
          target_location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_ideas_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_content_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_reports: {
        Row: {
          blog_ideas: number | null
          completed_at: string | null
          cost_guide_ideas: number | null
          created_at: string | null
          error_message: string | null
          id: string
          ideas_generated: number | null
          keyword_suggestions: number | null
          report_type: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          blog_ideas?: number | null
          completed_at?: string | null
          cost_guide_ideas?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ideas_generated?: number | null
          keyword_suggestions?: number | null
          report_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          blog_ideas?: number | null
          completed_at?: string | null
          cost_guide_ideas?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ideas_generated?: number | null
          keyword_suggestions?: number | null
          report_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ai_copilot_messages: {
        Row: {
          content: string
          context_used: Json | null
          created_at: string | null
          id: string
          role: string
          session_id: string | null
        }
        Insert: {
          content: string
          context_used?: Json | null
          created_at?: string | null
          id?: string
          role: string
          session_id?: string | null
        }
        Update: {
          content?: string
          context_used?: Json | null
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_copilot_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_copilot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_copilot_sessions: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_error_actions: {
        Row: {
          action_description: string | null
          action_type: string
          error_group_id: string | null
          id: string
          notes: string | null
          result: string | null
          taken_at: string | null
          taken_by: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          error_group_id?: string | null
          id?: string
          notes?: string | null
          result?: string | null
          taken_at?: string | null
          taken_by?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          error_group_id?: string | null
          id?: string
          notes?: string | null
          result?: string | null
          taken_at?: string | null
          taken_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_error_actions_error_group_id_fkey"
            columns: ["error_group_id"]
            isOneToOne: false
            referencedRelation: "ai_error_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_error_groups: {
        Row: {
          affected_functions: string[] | null
          affected_tables: string[] | null
          ai_analysis: string | null
          created_at: string | null
          error_message: string
          error_signature: string
          error_type: string
          first_seen: string
          fix_confidence: number | null
          id: string
          last_seen: string
          occurrence_count: number | null
          report_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          sample_log_entries: Json | null
          severity: string | null
          stack_trace: string | null
          status: string | null
          suggested_fix: string | null
          updated_at: string | null
        }
        Insert: {
          affected_functions?: string[] | null
          affected_tables?: string[] | null
          ai_analysis?: string | null
          created_at?: string | null
          error_message: string
          error_signature: string
          error_type: string
          first_seen: string
          fix_confidence?: number | null
          id?: string
          last_seen: string
          occurrence_count?: number | null
          report_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sample_log_entries?: Json | null
          severity?: string | null
          stack_trace?: string | null
          status?: string | null
          suggested_fix?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_functions?: string[] | null
          affected_tables?: string[] | null
          ai_analysis?: string | null
          created_at?: string | null
          error_message?: string
          error_signature?: string
          error_type?: string
          first_seen?: string
          fix_confidence?: number | null
          id?: string
          last_seen?: string
          occurrence_count?: number | null
          report_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sample_log_entries?: Json | null
          severity?: string | null
          stack_trace?: string | null
          status?: string | null
          suggested_fix?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_error_groups_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_error_log_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_error_log_reports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          critical_errors: number | null
          error_message: string | null
          grouped_errors_count: number | null
          id: string
          started_at: string | null
          status: string | null
          time_range_hours: number | null
          total_errors_found: number | null
          warnings: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          critical_errors?: number | null
          error_message?: string | null
          grouped_errors_count?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          time_range_hours?: number | null
          total_errors_found?: number | null
          warnings?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          critical_errors?: number | null
          error_message?: string | null
          grouped_errors_count?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          time_range_hours?: number | null
          total_errors_found?: number | null
          warnings?: number | null
        }
        Relationships: []
      }
      ai_keyword_research: {
        Row: {
          competition: string | null
          content_gap_opportunity: string | null
          created_at: string | null
          id: string
          keyword: string
          priority_score: number | null
          related_keywords: string[] | null
          report_id: string | null
          search_intent: string | null
          search_volume_estimate: number | null
          suggested_content_types: string[] | null
        }
        Insert: {
          competition?: string | null
          content_gap_opportunity?: string | null
          created_at?: string | null
          id?: string
          keyword: string
          priority_score?: number | null
          related_keywords?: string[] | null
          report_id?: string | null
          search_intent?: string | null
          search_volume_estimate?: number | null
          suggested_content_types?: string[] | null
        }
        Update: {
          competition?: string | null
          content_gap_opportunity?: string | null
          created_at?: string | null
          id?: string
          keyword?: string
          priority_score?: number | null
          related_keywords?: string[] | null
          report_id?: string | null
          search_intent?: string | null
          search_volume_estimate?: number | null
          suggested_content_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_keyword_research_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_content_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_audits: {
        Row: {
          accessibility_score: number | null
          ai_summary: string | null
          best_practices_score: number | null
          cls_value: number | null
          created_at: string | null
          fcp_value: number | null
          fid_value: number | null
          id: string
          lcp_value: number | null
          page_name: string
          page_url: string
          performance_score: number | null
          priority: string | null
          report_id: string
          seo_score: number | null
          ttfb_value: number | null
          tti_value: number | null
        }
        Insert: {
          accessibility_score?: number | null
          ai_summary?: string | null
          best_practices_score?: number | null
          cls_value?: number | null
          created_at?: string | null
          fcp_value?: number | null
          fid_value?: number | null
          id?: string
          lcp_value?: number | null
          page_name: string
          page_url: string
          performance_score?: number | null
          priority?: string | null
          report_id: string
          seo_score?: number | null
          ttfb_value?: number | null
          tti_value?: number | null
        }
        Update: {
          accessibility_score?: number | null
          ai_summary?: string | null
          best_practices_score?: number | null
          cls_value?: number | null
          created_at?: string | null
          fcp_value?: number | null
          fid_value?: number | null
          id?: string
          lcp_value?: number | null
          page_name?: string
          page_url?: string
          performance_score?: number | null
          priority?: string | null
          report_id?: string
          seo_score?: number | null
          ttfb_value?: number | null
          tti_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_audits_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_performance_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_recommendations: {
        Row: {
          audit_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string
          estimated_improvement: string | null
          id: string
          impact: string
          implementation_notes: string | null
          recommendation_type: string
          status: string | null
          title: string
        }
        Insert: {
          audit_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description: string
          estimated_improvement?: string | null
          id?: string
          impact: string
          implementation_notes?: string | null
          recommendation_type: string
          status?: string | null
          title: string
        }
        Update: {
          audit_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string
          estimated_improvement?: string | null
          id?: string
          impact?: string
          implementation_notes?: string | null
          recommendation_type?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_recommendations_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "ai_performance_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_reports: {
        Row: {
          average_accessibility_score: number | null
          average_best_practices_score: number | null
          average_performance_score: number | null
          average_seo_score: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          issues_found: number | null
          pages_audited: number | null
          status: string | null
        }
        Insert: {
          average_accessibility_score?: number | null
          average_best_practices_score?: number | null
          average_performance_score?: number | null
          average_seo_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          issues_found?: number | null
          pages_audited?: number | null
          status?: string | null
        }
        Update: {
          average_accessibility_score?: number | null
          average_best_practices_score?: number | null
          average_performance_score?: number | null
          average_seo_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          issues_found?: number | null
          pages_audited?: number | null
          status?: string | null
        }
        Relationships: []
      }
      ai_redirect_recommendations: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          broken_url: string
          confidence_score: number | null
          created_at: string | null
          error_type: string
          found_on_page: string
          id: string
          link_text: string | null
          priority: string | null
          reasoning: string | null
          report_id: string
          status: string | null
          suggested_redirect_url: string | null
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          broken_url: string
          confidence_score?: number | null
          created_at?: string | null
          error_type: string
          found_on_page: string
          id?: string
          link_text?: string | null
          priority?: string | null
          reasoning?: string | null
          report_id: string
          status?: string | null
          suggested_redirect_url?: string | null
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          broken_url?: string
          confidence_score?: number | null
          created_at?: string | null
          error_type?: string
          found_on_page?: string
          id?: string
          link_text?: string | null
          priority?: string | null
          reasoning?: string | null
          report_id?: string
          status?: string | null
          suggested_redirect_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_redirect_recommendations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_redirect_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_redirect_reports: {
        Row: {
          broken_links_found: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          pages_crawled: number | null
          redirects_suggested: number | null
          status: string | null
        }
        Insert: {
          broken_links_found?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          pages_crawled?: number | null
          redirects_suggested?: number | null
          status?: string | null
        }
        Update: {
          broken_links_found?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          pages_crawled?: number | null
          redirects_suggested?: number | null
          status?: string | null
        }
        Relationships: []
      }
      ai_seo_recommendations: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          current_value: string | null
          id: string
          page_path: string
          page_type: string
          priority: string
          reasoning: string | null
          recommendation_type: string
          report_id: string
          status: string
          suggested_value: string | null
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_value?: string | null
          id?: string
          page_path: string
          page_type: string
          priority?: string
          reasoning?: string | null
          recommendation_type: string
          report_id: string
          status?: string
          suggested_value?: string | null
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_value?: string | null
          id?: string
          page_path?: string
          page_type?: string
          priority?: string
          reasoning?: string | null
          recommendation_type?: string
          report_id?: string
          status?: string
          suggested_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_seo_recommendations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_seo_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_seo_reports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          pages_analyzed: number | null
          recommendations_count: number | null
          report_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          pages_analyzed?: number | null
          recommendations_count?: number | null
          report_type?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          pages_analyzed?: number | null
          recommendations_count?: number | null
          report_type?: string
          status?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          contractor_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          organization_name: string
        }
        Insert: {
          api_key: string
          contractor_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          organization_name: string
        }
        Update: {
          api_key?: string
          contractor_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          organization_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      architect_bid_requests: {
        Row: {
          admin_notes: string | null
          architect_id: string | null
          architect_name: string
          created_at: string
          id: string
          project_description: string | null
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          architect_id?: string | null
          architect_name: string
          created_at?: string
          id?: string
          project_description?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          architect_id?: string | null
          architect_name?: string
          created_at?: string
          id?: string
          project_description?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      architect_projects: {
        Row: {
          architect_id: string
          client_name: string
          created_at: string
          deadline: string | null
          description: string | null
          estimated_value: number | null
          id: string
          lead_id: string | null
          location: string
          project_name: string
          project_type: string
          square_footage: number | null
          status: string
          updated_at: string
        }
        Insert: {
          architect_id: string
          client_name: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          lead_id?: string | null
          location: string
          project_name: string
          project_type: string
          square_footage?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          architect_id?: string
          client_name?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          lead_id?: string | null
          location?: string
          project_name?: string
          project_type?: string
          square_footage?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      architect_proposals: {
        Row: {
          admin_notes: string | null
          architect_id: string
          attachment_urls: Json | null
          created_at: string
          design_phase: string
          estimated_timeline: string | null
          id: string
          line_items: Json | null
          notes: string | null
          project_id: string | null
          proposal_amount: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          architect_id: string
          attachment_urls?: Json | null
          created_at?: string
          design_phase: string
          estimated_timeline?: string | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          project_id?: string | null
          proposal_amount: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          architect_id?: string
          attachment_urls?: Json | null
          created_at?: string
          design_phase?: string
          estimated_timeline?: string | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          project_id?: string | null
          proposal_amount?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "architect_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "architect_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_events: {
        Row: {
          action_result: Json | null
          action_taken: string
          created_at: string | null
          event_type: string
          id: string
          source_id: string
          source_table: string
          triggered_by: string | null
        }
        Insert: {
          action_result?: Json | null
          action_taken: string
          created_at?: string | null
          event_type: string
          id?: string
          source_id: string
          source_table: string
          triggered_by?: string | null
        }
        Update: {
          action_result?: Json | null
          action_taken?: string
          created_at?: string | null
          event_type?: string
          id?: string
          source_id?: string
          source_table?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      bid_comparison_reports: {
        Row: {
          bid_opportunity_id: string
          created_at: string
          created_by: string
          estimator_recommendation: string | null
          homeowner_notes: string | null
          homeowner_selection: string | null
          homeowner_viewed_at: string | null
          id: string
          preferred_bid_id: string | null
          project_id: string | null
          report_data: Json
          status: string
          updated_at: string
        }
        Insert: {
          bid_opportunity_id: string
          created_at?: string
          created_by: string
          estimator_recommendation?: string | null
          homeowner_notes?: string | null
          homeowner_selection?: string | null
          homeowner_viewed_at?: string | null
          id?: string
          preferred_bid_id?: string | null
          project_id?: string | null
          report_data: Json
          status?: string
          updated_at?: string
        }
        Update: {
          bid_opportunity_id?: string
          created_at?: string
          created_by?: string
          estimator_recommendation?: string | null
          homeowner_notes?: string | null
          homeowner_selection?: string | null
          homeowner_viewed_at?: string | null
          id?: string
          preferred_bid_id?: string | null
          project_id?: string | null
          report_data?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_comparison_reports_bid_opportunity_id_fkey"
            columns: ["bid_opportunity_id"]
            isOneToOne: false
            referencedRelation: "bid_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_comparison_reports_homeowner_selection_fkey"
            columns: ["homeowner_selection"]
            isOneToOne: false
            referencedRelation: "bid_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_comparison_reports_preferred_bid_id_fkey"
            columns: ["preferred_bid_id"]
            isOneToOne: false
            referencedRelation: "bid_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_comparison_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_comparison_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_line_items: {
        Row: {
          bid_submission_id: string
          cost_code_id: string | null
          created_at: string | null
          description: string
          id: string
          is_alternate: boolean | null
          quantity: number
          sort_order: number | null
          total: number | null
          unit: string
          unit_price: number
        }
        Insert: {
          bid_submission_id: string
          cost_code_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_alternate?: boolean | null
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit?: string
          unit_price?: number
        }
        Update: {
          bid_submission_id?: string
          cost_code_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_alternate?: boolean | null
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bid_line_items_bid_submission_id_fkey"
            columns: ["bid_submission_id"]
            isOneToOne: false
            referencedRelation: "bid_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_line_items_cost_code_id_fkey"
            columns: ["cost_code_id"]
            isOneToOne: false
            referencedRelation: "cost_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "bid_opportunity_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_opportunities: {
        Row: {
          attachments: Json | null
          bid_deadline: string
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          estimated_budget: number | null
          id: string
          location: string
          open_to_architects: boolean
          open_to_contractors: boolean
          open_to_interior_designers: boolean
          project_id: string | null
          project_type: string
          requirements: Json | null
          square_footage: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          bid_deadline: string
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          estimated_budget?: number | null
          id?: string
          location: string
          open_to_architects?: boolean
          open_to_contractors?: boolean
          open_to_interior_designers?: boolean
          project_id?: string | null
          project_type: string
          requirements?: Json | null
          square_footage?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          bid_deadline?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          estimated_budget?: number | null
          id?: string
          location?: string
          open_to_architects?: boolean
          open_to_contractors?: boolean
          open_to_interior_designers?: boolean
          project_id?: string | null
          project_type?: string
          requirements?: Json | null
          square_footage?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_opportunities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_opportunity_messages: {
        Row: {
          bid_opportunity_id: string
          created_at: string
          id: string
          message: string
          read_by: Json | null
          sender_id: string
        }
        Insert: {
          bid_opportunity_id: string
          created_at?: string
          id?: string
          message: string
          read_by?: Json | null
          sender_id: string
        }
        Update: {
          bid_opportunity_id?: string
          created_at?: string
          id?: string
          message?: string
          read_by?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_opportunity_messages_bid_opportunity_id_fkey"
            columns: ["bid_opportunity_id"]
            isOneToOne: false
            referencedRelation: "bid_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packet_activity_log: {
        Row: {
          action_details: Json | null
          action_type: string
          actor_id: string
          actor_role: string
          bid_packet_id: string
          bid_submission_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          actor_id: string
          actor_role: string
          bid_packet_id: string
          bid_submission_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          actor_id?: string
          actor_role?: string
          bid_packet_id?: string
          bid_submission_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_packet_activity_log_bid_packet_id_fkey"
            columns: ["bid_packet_id"]
            isOneToOne: false
            referencedRelation: "bid_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_packet_activity_log_bid_submission_id_fkey"
            columns: ["bid_submission_id"]
            isOneToOne: false
            referencedRelation: "bid_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packet_clarifications: {
        Row: {
          bid_packet_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_by_admin: boolean
          read_by_contractor: boolean
          read_by_estimator: boolean
          sender_id: string
          sender_role: string
        }
        Insert: {
          bid_packet_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_by_admin?: boolean
          read_by_contractor?: boolean
          read_by_estimator?: boolean
          sender_id: string
          sender_role?: string
        }
        Update: {
          bid_packet_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_by_admin?: boolean
          read_by_contractor?: boolean
          read_by_estimator?: boolean
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_packet_clarifications_bid_packet_id_fkey"
            columns: ["bid_packet_id"]
            isOneToOne: false
            referencedRelation: "bid_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packet_contractor_invites: {
        Row: {
          bid_packet_id: string
          contractor_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          bid_packet_id: string
          contractor_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          bid_packet_id?: string
          contractor_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_packet_contractor_invites_bid_packet_id_fkey"
            columns: ["bid_packet_id"]
            isOneToOne: false
            referencedRelation: "bid_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packet_line_items: {
        Row: {
          cost_code_id: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          quantity: number
          sort_order: number
          trade_section_id: string
          unit: string
        }
        Insert: {
          cost_code_id?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          quantity?: number
          sort_order?: number
          trade_section_id: string
          unit?: string
        }
        Update: {
          cost_code_id?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          quantity?: number
          sort_order?: number
          trade_section_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_packet_line_items_cost_code_id_fkey"
            columns: ["cost_code_id"]
            isOneToOne: false
            referencedRelation: "cost_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_packet_line_items_trade_section_id_fkey"
            columns: ["trade_section_id"]
            isOneToOne: false
            referencedRelation: "bid_packet_trade_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packet_trade_sections: {
        Row: {
          allowance_amount: number | null
          bid_packet_id: string
          created_at: string
          exclusions: string | null
          id: string
          inclusions: string | null
          scope_notes: string | null
          sort_order: number
          trade: string
        }
        Insert: {
          allowance_amount?: number | null
          bid_packet_id: string
          created_at?: string
          exclusions?: string | null
          id?: string
          inclusions?: string | null
          scope_notes?: string | null
          sort_order?: number
          trade: string
        }
        Update: {
          allowance_amount?: number | null
          bid_packet_id?: string
          created_at?: string
          exclusions?: string | null
          id?: string
          inclusions?: string | null
          scope_notes?: string | null
          sort_order?: number
          trade?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_packet_trade_sections_bid_packet_id_fkey"
            columns: ["bid_packet_id"]
            isOneToOne: false
            referencedRelation: "bid_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packets: {
        Row: {
          allowances: Json | null
          assumptions: string | null
          bid_deadline: string | null
          bid_due_date: string | null
          bid_instructions: string | null
          created_at: string
          design_package_id: string | null
          design_selections_notes: string | null
          estimated_budget_max: number | null
          estimated_budget_min: number | null
          exclusions: string | null
          generated_at: string | null
          generated_by: string | null
          generated_from_design_package: boolean
          id: string
          inclusions: string | null
          last_synced_from_smart_estimate_at: string | null
          lead_id: string
          permit_technical_notes: string | null
          project_id: string | null
          project_overview: string | null
          published_at: string | null
          scope_summary: string | null
          site_logistics: string | null
          source_mapping_snapshot: Json | null
          source_smart_estimate_id: string | null
          source_type: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allowances?: Json | null
          assumptions?: string | null
          bid_deadline?: string | null
          bid_due_date?: string | null
          bid_instructions?: string | null
          created_at?: string
          design_package_id?: string | null
          design_selections_notes?: string | null
          estimated_budget_max?: number | null
          estimated_budget_min?: number | null
          exclusions?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generated_from_design_package?: boolean
          id?: string
          inclusions?: string | null
          last_synced_from_smart_estimate_at?: string | null
          lead_id: string
          permit_technical_notes?: string | null
          project_id?: string | null
          project_overview?: string | null
          published_at?: string | null
          scope_summary?: string | null
          site_logistics?: string | null
          source_mapping_snapshot?: Json | null
          source_smart_estimate_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allowances?: Json | null
          assumptions?: string | null
          bid_deadline?: string | null
          bid_due_date?: string | null
          bid_instructions?: string | null
          created_at?: string
          design_package_id?: string | null
          design_selections_notes?: string | null
          estimated_budget_max?: number | null
          estimated_budget_min?: number | null
          exclusions?: string | null
          generated_at?: string | null
          generated_by?: string | null
          generated_from_design_package?: boolean
          id?: string
          inclusions?: string | null
          last_synced_from_smart_estimate_at?: string | null
          lead_id?: string
          permit_technical_notes?: string | null
          project_id?: string | null
          project_overview?: string | null
          published_at?: string | null
          scope_summary?: string | null
          site_logistics?: string | null
          source_mapping_snapshot?: Json | null
          source_smart_estimate_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_packets_design_package_id_fkey"
            columns: ["design_package_id"]
            isOneToOne: false
            referencedRelation: "design_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_packets_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_packets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_packets_source_smart_estimate_id_fkey"
            columns: ["source_smart_estimate_id"]
            isOneToOne: false
            referencedRelation: "smart_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_packets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "estimate_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_submission_history: {
        Row: {
          attachments: Json | null
          bid_amount: number | null
          bid_submission_id: string
          created_by: string | null
          estimated_timeline: string | null
          id: string
          proposal_text: string | null
          revision_notes: string | null
          snapshot_at: string
          source_event: string | null
          status: string
        }
        Insert: {
          attachments?: Json | null
          bid_amount?: number | null
          bid_submission_id: string
          created_by?: string | null
          estimated_timeline?: string | null
          id?: string
          proposal_text?: string | null
          revision_notes?: string | null
          snapshot_at?: string
          source_event?: string | null
          status: string
        }
        Update: {
          attachments?: Json | null
          bid_amount?: number | null
          bid_submission_id?: string
          created_by?: string | null
          estimated_timeline?: string | null
          id?: string
          proposal_text?: string | null
          revision_notes?: string | null
          snapshot_at?: string
          source_event?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_submission_history_bid_submission_id_fkey"
            columns: ["bid_submission_id"]
            isOneToOne: false
            referencedRelation: "bid_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_submissions: {
        Row: {
          admin_notes: string | null
          anticipated_start_date: string | null
          attachments: Json | null
          bid_amount: number
          bid_opportunity_id: string
          bidder_id: string
          bidder_type: string
          certifications: Json | null
          created_at: string
          crew_size: number | null
          estimated_timeline: string | null
          estimator_notes: string | null
          estimator_recommendation: string | null
          has_project_manager: boolean | null
          id: string
          insurance_verified: boolean | null
          license_verified: boolean | null
          overall_rating: number | null
          platform_ratings: Json | null
          portfolio_projects_count: number | null
          project_duration_weeks: number | null
          proposal_text: string | null
          references_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision_count: number
          revision_request_notes: string | null
          revision_requested_at: string | null
          status: string
          submitted_at: string
          updated_at: string
          warranty_terms: string | null
          warranty_years: number | null
          workers_comp_verified: boolean | null
          years_in_business: number | null
        }
        Insert: {
          admin_notes?: string | null
          anticipated_start_date?: string | null
          attachments?: Json | null
          bid_amount: number
          bid_opportunity_id: string
          bidder_id: string
          bidder_type: string
          certifications?: Json | null
          created_at?: string
          crew_size?: number | null
          estimated_timeline?: string | null
          estimator_notes?: string | null
          estimator_recommendation?: string | null
          has_project_manager?: boolean | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          overall_rating?: number | null
          platform_ratings?: Json | null
          portfolio_projects_count?: number | null
          project_duration_weeks?: number | null
          proposal_text?: string | null
          references_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_count?: number
          revision_request_notes?: string | null
          revision_requested_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          warranty_terms?: string | null
          warranty_years?: number | null
          workers_comp_verified?: boolean | null
          years_in_business?: number | null
        }
        Update: {
          admin_notes?: string | null
          anticipated_start_date?: string | null
          attachments?: Json | null
          bid_amount?: number
          bid_opportunity_id?: string
          bidder_id?: string
          bidder_type?: string
          certifications?: Json | null
          created_at?: string
          crew_size?: number | null
          estimated_timeline?: string | null
          estimator_notes?: string | null
          estimator_recommendation?: string | null
          has_project_manager?: boolean | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          overall_rating?: number | null
          platform_ratings?: Json | null
          portfolio_projects_count?: number | null
          project_duration_weeks?: number | null
          proposal_text?: string | null
          references_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_count?: number
          revision_request_notes?: string | null
          revision_requested_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          warranty_terms?: string | null
          warranty_years?: number | null
          workers_comp_verified?: boolean | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_submissions_bid_opportunity_id_fkey"
            columns: ["bid_opportunity_id"]
            isOneToOne: false
            referencedRelation: "bid_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      blockers: {
        Row: {
          blocker_type: string
          created_at: string | null
          created_by: string
          id: string
          lead_id: string
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          blocker_type: string
          created_at?: string | null
          created_by: string
          id?: string
          lead_id: string
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          blocker_type?: string
          created_at?: string | null
          created_by?: string
          id?: string
          lead_id?: string
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_files: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_latest: boolean
          parent_blueprint_id: string | null
          project_id: string
          updated_at: string
          uploaded_by: string
          version: number
          version_notes: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_latest?: boolean
          parent_blueprint_id?: string | null
          project_id: string
          updated_at?: string
          uploaded_by: string
          version?: number
          version_notes?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_latest?: boolean
          parent_blueprint_id?: string | null
          project_id?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_files_parent_blueprint_id_fkey"
            columns: ["parent_blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprint_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blueprint_files_parent_blueprint_id_fkey"
            columns: ["parent_blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprint_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blueprint_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "architect_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      build_gates: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          gate_name: string
          gate_type: string
          id: string
          notes: string | null
          owner: string
          project_id: string
          sort_order: number | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          gate_name: string
          gate_type: string
          id?: string
          notes?: string | null
          owner: string
          project_id: string
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          gate_name?: string
          gate_type?: string
          id?: string
          notes?: string | null
          owner?: string
          project_id?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_gates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          agent_id: string | null
          call_status: string | null
          call_summary: string | null
          contractor_client_id: string | null
          created_at: string | null
          disposition: string
          disposition_reason: string | null
          duration_seconds: number | null
          ended_at: string | null
          from_number: string
          id: string
          lead_id: string | null
          notes: string | null
          recording_url: string | null
          started_at: string | null
          to_number: string | null
          transcript_text: string | null
          twilio_call_sid: string | null
        }
        Insert: {
          agent_id?: string | null
          call_status?: string | null
          call_summary?: string | null
          contractor_client_id?: string | null
          created_at?: string | null
          disposition: string
          disposition_reason?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          from_number: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          recording_url?: string | null
          started_at?: string | null
          to_number?: string | null
          transcript_text?: string | null
          twilio_call_sid?: string | null
        }
        Update: {
          agent_id?: string | null
          call_status?: string | null
          call_summary?: string | null
          contractor_client_id?: string | null
          created_at?: string | null
          disposition?: string
          disposition_reason?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          from_number?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          recording_url?: string | null
          started_at?: string | null
          to_number?: string | null
          transcript_text?: string | null
          twilio_call_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_contractor_client_id_fkey"
            columns: ["contractor_client_id"]
            isOneToOne: false
            referencedRelation: "contractor_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          category: string
          created_at: string
          created_by: string
          default_price: number
          description: string | null
          id: string
          is_active: boolean
          item_name: string
          item_number: string | null
          notes: string | null
          preferred_vendor_id: string | null
          reorder_point: number | null
          stock_quantity: number | null
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          item_number?: string | null
          notes?: string | null
          preferred_vendor_id?: string | null
          reorder_point?: number | null
          stock_quantity?: number | null
          unit_of_measure?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          item_number?: string | null
          notes?: string | null
          preferred_vendor_id?: string | null
          reorder_point?: number | null
          stock_quantity?: number | null
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      change_order_ai_logs: {
        Row: {
          change_order_id: string | null
          created_at: string | null
          id: string
          message_contractor: string | null
          message_homeowner: string | null
          price_change: number | null
          project_id: string | null
          reason: string | null
          status: string | null
          timeline_change_days: number | null
          updated_at: string | null
        }
        Insert: {
          change_order_id?: string | null
          created_at?: string | null
          id?: string
          message_contractor?: string | null
          message_homeowner?: string | null
          price_change?: number | null
          project_id?: string | null
          reason?: string | null
          status?: string | null
          timeline_change_days?: number | null
          updated_at?: string | null
        }
        Update: {
          change_order_id?: string | null
          created_at?: string | null
          id?: string
          message_contractor?: string | null
          message_homeowner?: string | null
          price_change?: number | null
          project_id?: string | null
          reason?: string | null
          status?: string | null
          timeline_change_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_order_ai_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_order_ai_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          billed: boolean | null
          billed_at: string | null
          billed_invoice_id: string | null
          change_amount: number
          change_order_number: string
          client_name: string
          collected: boolean | null
          collected_at: string | null
          created_at: string
          description: string
          id: string
          internal_notes: string | null
          line_items: Json | null
          new_total_amount: number
          original_amount: number
          project_id: string | null
          project_name: string
          reason: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          billed?: boolean | null
          billed_at?: string | null
          billed_invoice_id?: string | null
          change_amount?: number
          change_order_number: string
          client_name: string
          collected?: boolean | null
          collected_at?: string | null
          created_at?: string
          description: string
          id?: string
          internal_notes?: string | null
          line_items?: Json | null
          new_total_amount?: number
          original_amount?: number
          project_id?: string | null
          project_name: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          billed?: boolean | null
          billed_at?: string | null
          billed_invoice_id?: string | null
          change_amount?: number
          change_order_number?: string
          client_name?: string
          collected?: boolean | null
          collected_at?: string | null
          created_at?: string
          description?: string
          id?: string
          internal_notes?: string | null
          line_items?: Json | null
          new_total_amount?: number
          original_amount?: number
          project_id?: string | null
          project_name?: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_billed_invoice_id_fkey"
            columns: ["billed_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          message_id: string
          read_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          message_id: string
          read_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          message_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string | null
          id: string
          lead_id: string | null
          parent_message_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          parent_message_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          parent_message_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_applications: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          insurance_verified: boolean | null
          license_number: string | null
          license_verified: boolean | null
          notes: string | null
          phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string[] | null
          specialties: string[] | null
          status: string
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          insurance_verified?: boolean | null
          license_number?: string | null
          license_verified?: boolean | null
          notes?: string | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          specialties?: string[] | null
          status?: string
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          insurance_verified?: boolean | null
          license_number?: string | null
          license_verified?: boolean | null
          notes?: string | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          specialties?: string[] | null
          status?: string
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      contractor_availability_cache: {
        Row: {
          availability_score: number | null
          calendar_data: Json | null
          contractor_id: string
          crew_count: number | null
          current_load: number | null
          id: string
          next_open_window: string | null
          recommended_project_types: string[] | null
          updated_at: string | null
        }
        Insert: {
          availability_score?: number | null
          calendar_data?: Json | null
          contractor_id: string
          crew_count?: number | null
          current_load?: number | null
          id?: string
          next_open_window?: string | null
          recommended_project_types?: string[] | null
          updated_at?: string | null
        }
        Update: {
          availability_score?: number | null
          calendar_data?: Json | null
          contractor_id?: string
          crew_count?: number | null
          current_load?: number | null
          id?: string
          next_open_window?: string | null
          recommended_project_types?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contractor_bids: {
        Row: {
          bid_amount: number
          contractor_id: string
          created_at: string
          id: string
          notes: string | null
          project_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          bid_amount: number
          contractor_id: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          contractor_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_clients: {
        Row: {
          business_hours_json: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_phone: string | null
          qualification_rules_json: Json | null
          service_area: string[] | null
          twilio_forward_number: string | null
          updated_at: string | null
        }
        Insert: {
          business_hours_json?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_phone?: string | null
          qualification_rules_json?: Json | null
          service_area?: string[] | null
          twilio_forward_number?: string | null
          updated_at?: string | null
        }
        Update: {
          business_hours_json?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_phone?: string | null
          qualification_rules_json?: Json | null
          service_area?: string[] | null
          twilio_forward_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contractor_density_map: {
        Row: {
          contractor_count: number | null
          county: string | null
          coverage_level: string | null
          created_at: string | null
          id: string
          last_updated: string | null
          rating_average: number | null
          recruiting_priority: string | null
          responsiveness_score: number | null
          state: string
          trade: string | null
          zip_code: string | null
        }
        Insert: {
          contractor_count?: number | null
          county?: string | null
          coverage_level?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          rating_average?: number | null
          recruiting_priority?: string | null
          responsiveness_score?: number | null
          state: string
          trade?: string | null
          zip_code?: string | null
        }
        Update: {
          contractor_count?: number | null
          county?: string | null
          coverage_level?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          rating_average?: number | null
          recruiting_priority?: string | null
          responsiveness_score?: number | null
          state?: string
          trade?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      contractor_email_templates: {
        Row: {
          company_name: string
          contractor_id: string
          created_at: string
          custom_footer: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          template_name: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          company_name?: string
          contractor_id: string
          created_at?: string
          custom_footer?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          template_name?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          company_name?: string
          contractor_id?: string
          created_at?: string
          custom_footer?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          template_name?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      contractor_leads: {
        Row: {
          average_rating: number | null
          calls_made: number | null
          company_size: string | null
          contact_name: string | null
          contractor_name: string
          created_at: string | null
          email: string | null
          emails_sent: number | null
          first_contact_date: string | null
          id: string
          insurance_verified: boolean | null
          last_outreach_date: string | null
          license_number: string | null
          onboarded_date: string | null
          outreach_status: string | null
          phone: string | null
          quality_score: number | null
          referral_id: string | null
          referral_source: string | null
          rejection_reason: string | null
          review_count: number | null
          scheduled_call_date: string | null
          scrape_data: Json | null
          scraped_source: string | null
          seo_ranking_page: number | null
          service_areas: string[] | null
          sms_sent: number | null
          specialties: string[] | null
          updated_at: string | null
          website: string | null
          website_quality_score: number | null
          years_in_business: number | null
        }
        Insert: {
          average_rating?: number | null
          calls_made?: number | null
          company_size?: string | null
          contact_name?: string | null
          contractor_name: string
          created_at?: string | null
          email?: string | null
          emails_sent?: number | null
          first_contact_date?: string | null
          id?: string
          insurance_verified?: boolean | null
          last_outreach_date?: string | null
          license_number?: string | null
          onboarded_date?: string | null
          outreach_status?: string | null
          phone?: string | null
          quality_score?: number | null
          referral_id?: string | null
          referral_source?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          scheduled_call_date?: string | null
          scrape_data?: Json | null
          scraped_source?: string | null
          seo_ranking_page?: number | null
          service_areas?: string[] | null
          sms_sent?: number | null
          specialties?: string[] | null
          updated_at?: string | null
          website?: string | null
          website_quality_score?: number | null
          years_in_business?: number | null
        }
        Update: {
          average_rating?: number | null
          calls_made?: number | null
          company_size?: string | null
          contact_name?: string | null
          contractor_name?: string
          created_at?: string | null
          email?: string | null
          emails_sent?: number | null
          first_contact_date?: string | null
          id?: string
          insurance_verified?: boolean | null
          last_outreach_date?: string | null
          license_number?: string | null
          onboarded_date?: string | null
          outreach_status?: string | null
          phone?: string | null
          quality_score?: number | null
          referral_id?: string | null
          referral_source?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          scheduled_call_date?: string | null
          scrape_data?: Json | null
          scraped_source?: string | null
          seo_ranking_page?: number | null
          service_areas?: string[] | null
          sms_sent?: number | null
          specialties?: string[] | null
          updated_at?: string | null
          website?: string | null
          website_quality_score?: number | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      contractor_messages: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          project_id: string | null
          sender_name: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          project_id?: string | null
          sender_name: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          project_id?: string | null
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_onboarding: {
        Row: {
          availability_calendar_setup: boolean | null
          company_address: string | null
          completion_rate: number | null
          contractor_id: string
          created_at: string | null
          crew_size: number | null
          id: string
          insurance_document_url: string | null
          insurance_expiry: string | null
          insurance_verified: boolean | null
          license_document_url: string | null
          license_expiry: string | null
          license_verified: boolean | null
          onboarding_completion_score: number | null
          onboarding_status: string
          portfolio_uploaded: boolean | null
          portfolio_urls: string[] | null
          pricing_fairness_index: number | null
          pricing_template_created: boolean | null
          profile_quality_score: number | null
          quality_score: number | null
          response_rate: number | null
          review_score: number | null
          service_areas_mapped: boolean | null
          trade_specialties_selected: boolean | null
          trades: string[] | null
          updated_at: string | null
          w9_url: string | null
          years_in_business: number | null
        }
        Insert: {
          availability_calendar_setup?: boolean | null
          company_address?: string | null
          completion_rate?: number | null
          contractor_id: string
          created_at?: string | null
          crew_size?: number | null
          id?: string
          insurance_document_url?: string | null
          insurance_expiry?: string | null
          insurance_verified?: boolean | null
          license_document_url?: string | null
          license_expiry?: string | null
          license_verified?: boolean | null
          onboarding_completion_score?: number | null
          onboarding_status?: string
          portfolio_uploaded?: boolean | null
          portfolio_urls?: string[] | null
          pricing_fairness_index?: number | null
          pricing_template_created?: boolean | null
          profile_quality_score?: number | null
          quality_score?: number | null
          response_rate?: number | null
          review_score?: number | null
          service_areas_mapped?: boolean | null
          trade_specialties_selected?: boolean | null
          trades?: string[] | null
          updated_at?: string | null
          w9_url?: string | null
          years_in_business?: number | null
        }
        Update: {
          availability_calendar_setup?: boolean | null
          company_address?: string | null
          completion_rate?: number | null
          contractor_id?: string
          created_at?: string | null
          crew_size?: number | null
          id?: string
          insurance_document_url?: string | null
          insurance_expiry?: string | null
          insurance_verified?: boolean | null
          license_document_url?: string | null
          license_expiry?: string | null
          license_verified?: boolean | null
          onboarding_completion_score?: number | null
          onboarding_status?: string
          portfolio_uploaded?: boolean | null
          portfolio_urls?: string[] | null
          pricing_fairness_index?: number | null
          pricing_template_created?: boolean | null
          profile_quality_score?: number | null
          quality_score?: number | null
          response_rate?: number | null
          review_score?: number | null
          service_areas_mapped?: boolean | null
          trade_specialties_selected?: boolean | null
          trades?: string[] | null
          updated_at?: string | null
          w9_url?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      contractor_opportunity_matches: {
        Row: {
          bid_opportunity_id: string
          budget_score: number | null
          calculated_at: string | null
          capacity_score: number | null
          contractor_id: string
          id: string
          location_score: number | null
          match_score: number
          trade_score: number | null
          type_score: number | null
        }
        Insert: {
          bid_opportunity_id: string
          budget_score?: number | null
          calculated_at?: string | null
          capacity_score?: number | null
          contractor_id: string
          id?: string
          location_score?: number | null
          match_score?: number
          trade_score?: number | null
          type_score?: number | null
        }
        Update: {
          bid_opportunity_id?: string
          budget_score?: number | null
          calculated_at?: string | null
          capacity_score?: number | null
          contractor_id?: string
          id?: string
          location_score?: number | null
          match_score?: number
          trade_score?: number | null
          type_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_opportunity_matches_bid_opportunity_id_fkey"
            columns: ["bid_opportunity_id"]
            isOneToOne: false
            referencedRelation: "bid_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_opportunity_matches_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_payments: {
        Row: {
          contractor_id: string | null
          created_at: string
          id: string
          milestone_id: string | null
          notes: string | null
          payment_amount: number
          payment_date: string | null
          payment_status: string
          project_id: string
          updated_at: string
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string
          id?: string
          milestone_id?: string | null
          notes?: string | null
          payment_amount?: number
          payment_date?: string | null
          payment_status?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          contractor_id?: string | null
          created_at?: string
          id?: string
          milestone_id?: string | null
          notes?: string | null
          payment_amount?: number
          payment_date?: string | null
          payment_status?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_payments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "payment_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_portfolio_images: {
        Row: {
          caption: string | null
          contractor_id: string
          created_at: string
          id: string
          image_url: string
          project_type: string | null
        }
        Insert: {
          caption?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          image_url: string
          project_type?: string | null
        }
        Update: {
          caption?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          image_url?: string
          project_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_portfolio_images_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_pricing_items: {
        Row: {
          category: string
          contractor_id: string
          created_at: string
          id: string
          item_name: string
          labor_cost: number
          material_cost: number
          notes: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          contractor_id: string
          created_at?: string
          id?: string
          item_name: string
          labor_cost?: number
          material_cost?: number
          notes?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          contractor_id?: string
          created_at?: string
          id?: string
          item_name?: string
          labor_cost?: number
          material_cost?: number
          notes?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      contractor_project_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          project_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          project_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          project_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_projects: {
        Row: {
          client_name: string
          contractor_id: string
          created_at: string
          deadline: string | null
          description: string | null
          estimated_value: number | null
          id: string
          lead_id: string | null
          location: string
          project_name: string
          project_type: string
          square_footage: number | null
          status: string
          timeline_needs_refresh: boolean | null
          updated_at: string
        }
        Insert: {
          client_name: string
          contractor_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          lead_id?: string | null
          location: string
          project_name: string
          project_type: string
          square_footage?: number | null
          status?: string
          timeline_needs_refresh?: boolean | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          contractor_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          lead_id?: string | null
          location?: string
          project_name?: string
          project_type?: string
          square_footage?: number | null
          status?: string
          timeline_needs_refresh?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      project_details: {
        Row: {
          id: string
          project_id: string
          description: string | null
          measurements: Json | null
          materials: Json | null
          inspiration_links: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          description?: string | null
          measurements?: Json | null
          materials?: Json | null
          inspiration_links?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          description?: string | null
          measurements?: Json | null
          materials?: Json | null
          inspiration_links?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_details_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_referrals: {
        Row: {
          created_at: string | null
          credit_applied: boolean | null
          credit_applied_at: string | null
          id: string
          invited_at: string | null
          onboarded_at: string | null
          referral_credit: number | null
          referred_contractor_email: string
          referred_contractor_id: string | null
          referred_contractor_name: string | null
          referred_contractor_phone: string | null
          referrer_contractor_id: string
          signed_up_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_applied?: boolean | null
          credit_applied_at?: string | null
          id?: string
          invited_at?: string | null
          onboarded_at?: string | null
          referral_credit?: number | null
          referred_contractor_email: string
          referred_contractor_id?: string | null
          referred_contractor_name?: string | null
          referred_contractor_phone?: string | null
          referrer_contractor_id: string
          signed_up_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_applied?: boolean | null
          credit_applied_at?: string | null
          id?: string
          invited_at?: string | null
          onboarded_at?: string | null
          referral_credit?: number | null
          referred_contractor_email?: string
          referred_contractor_id?: string | null
          referred_contractor_name?: string | null
          referred_contractor_phone?: string | null
          referrer_contractor_id?: string
          signed_up_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contractor_schedule: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          location: string | null
          title: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      contractor_skill_graphs: {
        Row: {
          contractor_id: string
          created_at: string | null
          graph_data: Json
          id: string
          ideal_zip_codes: string[] | null
          optimal_budgets: Json | null
          recommendations: string[] | null
          skills: string[]
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          graph_data: Json
          id?: string
          ideal_zip_codes?: string[] | null
          optimal_budgets?: Json | null
          recommendations?: string[] | null
          skills?: string[]
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          graph_data?: Json
          id?: string
          ideal_zip_codes?: string[] | null
          optimal_budgets?: Json | null
          recommendations?: string[] | null
          skills?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      contractor_team_invitations: {
        Row: {
          contractor_id: string
          created_at: string
          created_by: string
          current_uses: number | null
          expires_at: string
          id: string
          invitation_token: string
          invited_email: string | null
          max_uses: number | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          created_by: string
          current_uses?: number | null
          expires_at?: string
          id?: string
          invitation_token: string
          invited_email?: string | null
          max_uses?: number | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          created_by?: string
          current_uses?: number | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_email?: string | null
          max_uses?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contractor_team_members: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          invitation_id: string | null
          is_active: boolean
          joined_at: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          is_active?: boolean
          joined_at?: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          is_active?: boolean
          joined_at?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_team_members_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "contractor_team_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_users: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          invitation_accepted_at: string | null
          invited_by: string | null
          is_active: boolean | null
          role: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          role: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          role?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_users_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          notified_at: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          notified_at?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          notified_at?: string | null
          source?: string | null
        }
        Relationships: []
      }
      contractors: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          avg_projects_per_year: number | null
          bid_turnaround: string | null
          business_email: string | null
          business_phone: string | null
          business_type: string | null
          concurrent_projects: number | null
          contact_name: string | null
          contact_role: string | null
          contract_sample_url: string | null
          created_at: string
          crew_size: number | null
          designer_count: number | null
          email: string | null
          estimate_sample_url: string | null
          estimator_count: number | null
          facebook_url: string | null
          google_business_url: string | null
          google_rating: number | null
          google_review_count: number | null
          has_dedicated_estimator: boolean | null
          has_in_house_designer: boolean | null
          has_office: boolean | null
          houzz_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_bonded: boolean | null
          largest_project_duration: string | null
          largest_project_value: number | null
          lead_foreman_count: number | null
          legal_name: string | null
          license_expiration: string | null
          license_number: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          office_address: string | null
          office_staff_count: number | null
          operating_days: string | null
          operating_hours_end: string | null
          operating_hours_start: string | null
          owner_name: string | null
          phone: string | null
          profile_completion_pct: number | null
          project_manager_count: number | null
          project_types: string[] | null
          service_areas: string[] | null
          service_counties: string[] | null
          service_zip_codes: string[] | null
          subcontracted_trades: string[] | null
          tos_accepted_at: string | null
          tos_version: string | null
          trade_focus: string | null
          typical_budget_range: string | null
          typical_project_duration: string | null
          updated_at: string
          uses_subcontractors: boolean | null
          website: string | null
          work_type: string | null
          workers_comp_verified: boolean | null
          youtube_url: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avg_projects_per_year?: number | null
          bid_turnaround?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_type?: string | null
          concurrent_projects?: number | null
          contact_name?: string | null
          contact_role?: string | null
          contract_sample_url?: string | null
          created_at?: string
          crew_size?: number | null
          designer_count?: number | null
          email?: string | null
          estimate_sample_url?: string | null
          estimator_count?: number | null
          facebook_url?: string | null
          google_business_url?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          has_dedicated_estimator?: boolean | null
          has_in_house_designer?: boolean | null
          has_office?: boolean | null
          houzz_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_bonded?: boolean | null
          largest_project_duration?: string | null
          largest_project_value?: number | null
          lead_foreman_count?: number | null
          legal_name?: string | null
          license_expiration?: string | null
          license_number?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          office_address?: string | null
          office_staff_count?: number | null
          operating_days?: string | null
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          owner_name?: string | null
          phone?: string | null
          profile_completion_pct?: number | null
          project_manager_count?: number | null
          project_types?: string[] | null
          service_areas?: string[] | null
          service_counties?: string[] | null
          service_zip_codes?: string[] | null
          subcontracted_trades?: string[] | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          trade_focus?: string | null
          typical_budget_range?: string | null
          typical_project_duration?: string | null
          updated_at?: string
          uses_subcontractors?: boolean | null
          website?: string | null
          work_type?: string | null
          workers_comp_verified?: boolean | null
          youtube_url?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avg_projects_per_year?: number | null
          bid_turnaround?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_type?: string | null
          concurrent_projects?: number | null
          contact_name?: string | null
          contact_role?: string | null
          contract_sample_url?: string | null
          created_at?: string
          crew_size?: number | null
          designer_count?: number | null
          email?: string | null
          estimate_sample_url?: string | null
          estimator_count?: number | null
          facebook_url?: string | null
          google_business_url?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          has_dedicated_estimator?: boolean | null
          has_in_house_designer?: boolean | null
          has_office?: boolean | null
          houzz_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_bonded?: boolean | null
          largest_project_duration?: string | null
          largest_project_value?: number | null
          lead_foreman_count?: number | null
          legal_name?: string | null
          license_expiration?: string | null
          license_number?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          office_address?: string | null
          office_staff_count?: number | null
          operating_days?: string | null
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          owner_name?: string | null
          phone?: string | null
          profile_completion_pct?: number | null
          project_manager_count?: number | null
          project_types?: string[] | null
          service_areas?: string[] | null
          service_counties?: string[] | null
          service_zip_codes?: string[] | null
          subcontracted_trades?: string[] | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          trade_focus?: string | null
          typical_budget_range?: string | null
          typical_project_duration?: string | null
          updated_at?: string
          uses_subcontractors?: boolean | null
          website?: string | null
          work_type?: string | null
          workers_comp_verified?: boolean | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          contract_number: string
          contract_value: number
          created_at: string | null
          created_by: string | null
          document_url: string | null
          financing_type: string | null
          id: string
          lender_name: string | null
          notes: string | null
          payment_schedule_template: string | null
          project_id: string | null
          signature_status: string | null
          signed_at: string | null
          signed_by: string | null
          updated_at: string | null
        }
        Insert: {
          contract_number: string
          contract_value: number
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          financing_type?: string | null
          id?: string
          lender_name?: string | null
          notes?: string | null
          payment_schedule_template?: string | null
          project_id?: string | null
          signature_status?: string | null
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_number?: string
          contract_value?: number
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          financing_type?: string | null
          id?: string
          lender_name?: string | null
          notes?: string | null
          payment_schedule_template?: string | null
          project_id?: string | null
          signature_status?: string | null
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          conversion_value: number | null
          created_at: string | null
          event_category: string | null
          event_type: string
          fb_pixel_fired: boolean | null
          google_ads_fired: boolean | null
          id: string
          lead_id: string | null
          lead_source: string | null
          metadata: Json | null
          page_path: string | null
          page_title: string | null
          referrer: string | null
          session_id: string | null
          tiktok_pixel_fired: boolean | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          conversion_value?: number | null
          created_at?: string | null
          event_category?: string | null
          event_type: string
          fb_pixel_fired?: boolean | null
          google_ads_fired?: boolean | null
          id?: string
          lead_id?: string | null
          lead_source?: string | null
          metadata?: Json | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          tiktok_pixel_fired?: boolean | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          conversion_value?: number | null
          created_at?: string | null
          event_category?: string | null
          event_type?: string
          fb_pixel_fired?: boolean | null
          google_ads_fired?: boolean | null
          id?: string
          lead_id?: string | null
          lead_source?: string | null
          metadata?: Json | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          tiktok_pixel_fired?: boolean | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      coordinator_reports: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          report: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          report: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          report?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coordinator_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordinator_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_calculator_submissions: {
        Row: {
          calculation_data: Json | null
          converted_to_lead: boolean | null
          created_at: string | null
          email: string | null
          estimated_cost: number | null
          id: string
          location: string | null
          name: string | null
          notes: string | null
          phone: string | null
          project_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          rooms: Json | null
          square_footage: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          calculation_data?: Json | null
          converted_to_lead?: boolean | null
          created_at?: string | null
          email?: string | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: Json | null
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          calculation_data?: Json | null
          converted_to_lead?: boolean | null
          created_at?: string | null
          email?: string | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: Json | null
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cost_codes: {
        Row: {
          code: string
          contractor_id: string
          created_at: string
          description: string
          id: string
          labor_rate: number
          material_rate: number
          total_unit_price: number
          unit: string
          updated_at: string
        }
        Insert: {
          code: string
          contractor_id: string
          created_at?: string
          description: string
          id?: string
          labor_rate?: number
          material_rate?: number
          total_unit_price?: number
          unit: string
          updated_at?: string
        }
        Update: {
          code?: string
          contractor_id?: string
          created_at?: string
          description?: string
          id?: string
          labor_rate?: number
          material_rate?: number
          total_unit_price?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_codes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          created_at: string
          created_by: string
          delivery_item: string | null
          delivery_quantity: string | null
          delivery_received_by: string | null
          delivery_supplier: string | null
          delivery_time: string | null
          equipment_hourly_rate: number | null
          equipment_hours: number | null
          equipment_name: string | null
          equipment_operator: string | null
          hours_worked: number | null
          id: string
          log_date: string
          log_type: string
          material_name: string | null
          material_quantity: number | null
          material_supplier: string | null
          material_unit: string | null
          material_unit_cost: number | null
          notes: string | null
          project_id: string | null
          safety_action_taken: string | null
          safety_description: string | null
          safety_type: string | null
          temperature: number | null
          updated_at: string
          visitor_arrival_time: string | null
          visitor_company: string | null
          visitor_departure_time: string | null
          visitor_name: string | null
          visitor_purpose: string | null
          weather_condition: string | null
          weather_delay_hours: number | null
          weather_notes: string | null
          work_cost: number | null
          work_description: string | null
          workers_count: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_item?: string | null
          delivery_quantity?: string | null
          delivery_received_by?: string | null
          delivery_supplier?: string | null
          delivery_time?: string | null
          equipment_hourly_rate?: number | null
          equipment_hours?: number | null
          equipment_name?: string | null
          equipment_operator?: string | null
          hours_worked?: number | null
          id?: string
          log_date?: string
          log_type: string
          material_name?: string | null
          material_quantity?: number | null
          material_supplier?: string | null
          material_unit?: string | null
          material_unit_cost?: number | null
          notes?: string | null
          project_id?: string | null
          safety_action_taken?: string | null
          safety_description?: string | null
          safety_type?: string | null
          temperature?: number | null
          updated_at?: string
          visitor_arrival_time?: string | null
          visitor_company?: string | null
          visitor_departure_time?: string | null
          visitor_name?: string | null
          visitor_purpose?: string | null
          weather_condition?: string | null
          weather_delay_hours?: number | null
          weather_notes?: string | null
          work_cost?: number | null
          work_description?: string | null
          workers_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_item?: string | null
          delivery_quantity?: string | null
          delivery_received_by?: string | null
          delivery_supplier?: string | null
          delivery_time?: string | null
          equipment_hourly_rate?: number | null
          equipment_hours?: number | null
          equipment_name?: string | null
          equipment_operator?: string | null
          hours_worked?: number | null
          id?: string
          log_date?: string
          log_type?: string
          material_name?: string | null
          material_quantity?: number | null
          material_supplier?: string | null
          material_unit?: string | null
          material_unit_cost?: number | null
          notes?: string | null
          project_id?: string | null
          safety_action_taken?: string | null
          safety_description?: string | null
          safety_type?: string | null
          temperature?: number | null
          updated_at?: string
          visitor_arrival_time?: string | null
          visitor_company?: string | null
          visitor_departure_time?: string | null
          visitor_name?: string | null
          visitor_purpose?: string | null
          weather_condition?: string | null
          weather_delay_hours?: number | null
          weather_notes?: string | null
          work_cost?: number | null
          work_description?: string | null
          workers_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_package_activity_log: {
        Row: {
          action_details: string | null
          action_type: string
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          design_package_id: string
          id: string
        }
        Insert: {
          action_details?: string | null
          action_type: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          design_package_id: string
          id?: string
        }
        Update: {
          action_details?: string | null
          action_type?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          design_package_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_package_activity_log_design_package_id_fkey"
            columns: ["design_package_id"]
            isOneToOne: false
            referencedRelation: "design_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      design_package_files: {
        Row: {
          contractor_visible: boolean
          created_at: string | null
          design_package_id: string
          file_category: string | null
          file_url: string
          homeowner_visible: boolean
          id: string
          internal_only: boolean
          section_key: string | null
          visible_to_roles: string[] | null
        }
        Insert: {
          contractor_visible?: boolean
          created_at?: string | null
          design_package_id: string
          file_category?: string | null
          file_url: string
          homeowner_visible?: boolean
          id?: string
          internal_only?: boolean
          section_key?: string | null
          visible_to_roles?: string[] | null
        }
        Update: {
          contractor_visible?: boolean
          created_at?: string | null
          design_package_id?: string
          file_category?: string | null
          file_url?: string
          homeowner_visible?: boolean
          id?: string
          internal_only?: boolean
          section_key?: string | null
          visible_to_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "design_package_files_design_package_id_fkey"
            columns: ["design_package_id"]
            isOneToOne: false
            referencedRelation: "design_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      design_package_sections: {
        Row: {
          completion_percent: number | null
          contractor_visible: boolean
          design_package_id: string
          homeowner_visible: boolean
          id: string
          internal_only: boolean
          is_complete: boolean | null
          last_edited_by: string | null
          section_data: Json | null
          section_key: string
          updated_at: string | null
        }
        Insert: {
          completion_percent?: number | null
          contractor_visible?: boolean
          design_package_id: string
          homeowner_visible?: boolean
          id?: string
          internal_only?: boolean
          is_complete?: boolean | null
          last_edited_by?: string | null
          section_data?: Json | null
          section_key: string
          updated_at?: string | null
        }
        Update: {
          completion_percent?: number | null
          contractor_visible?: boolean
          design_package_id?: string
          homeowner_visible?: boolean
          id?: string
          internal_only?: boolean
          is_complete?: boolean | null
          last_edited_by?: string | null
          section_data?: Json | null
          section_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_package_sections_design_package_id_fkey"
            columns: ["design_package_id"]
            isOneToOne: false
            referencedRelation: "design_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      design_packages: {
        Row: {
          admin_override_reason: string | null
          admin_override_rfp: boolean | null
          assigned_design_professional_id: string | null
          assigned_estimator_id: string | null
          created_at: string | null
          id: string
          internal_review_status: string | null
          last_synced_from_smart_estimate_at: string | null
          package_completion_percent: number | null
          package_status: string
          permit_required: boolean | null
          project_id: string | null
          ready_for_rfp: boolean | null
          renderings_required: boolean | null
          revision_notes: string | null
          source_mapping_snapshot: Json | null
          source_smart_estimate_id: string | null
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          admin_override_reason?: string | null
          admin_override_rfp?: boolean | null
          assigned_design_professional_id?: string | null
          assigned_estimator_id?: string | null
          created_at?: string | null
          id?: string
          internal_review_status?: string | null
          last_synced_from_smart_estimate_at?: string | null
          package_completion_percent?: number | null
          package_status?: string
          permit_required?: boolean | null
          project_id?: string | null
          ready_for_rfp?: boolean | null
          renderings_required?: boolean | null
          revision_notes?: string | null
          source_mapping_snapshot?: Json | null
          source_smart_estimate_id?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_override_reason?: string | null
          admin_override_rfp?: boolean | null
          assigned_design_professional_id?: string | null
          assigned_estimator_id?: string | null
          created_at?: string | null
          id?: string
          internal_review_status?: string | null
          last_synced_from_smart_estimate_at?: string | null
          package_completion_percent?: number | null
          package_status?: string
          permit_required?: boolean | null
          project_id?: string | null
          ready_for_rfp?: boolean | null
          renderings_required?: boolean | null
          revision_notes?: string | null
          source_mapping_snapshot?: Json | null
          source_smart_estimate_id?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_packages_source_smart_estimate_id_fkey"
            columns: ["source_smart_estimate_id"]
            isOneToOne: false
            referencedRelation: "smart_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      design_professional_matches: {
        Row: {
          created_at: string | null
          design_professional_user_id: string
          id: string
          match_reason: Json | null
          match_score: number | null
          project_id: string | null
          responded_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          design_professional_user_id: string
          id?: string
          match_reason?: Json | null
          match_score?: number | null
          project_id?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          design_professional_user_id?: string
          id?: string
          match_reason?: Json | null
          match_score?: number | null
          project_id?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      design_professional_portfolio_items: {
        Row: {
          after_images: string[] | null
          before_images: string[] | null
          budget_range: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          location: string | null
          project_type: string | null
          proposal_documents: string[] | null
          renderings: string[] | null
          scope_of_work: string | null
          sort_order: number | null
          style_tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          after_images?: string[] | null
          before_images?: string[] | null
          budget_range?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          project_type?: string | null
          proposal_documents?: string[] | null
          renderings?: string[] | null
          scope_of_work?: string | null
          sort_order?: number | null
          style_tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          after_images?: string[] | null
          before_images?: string[] | null
          budget_range?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          project_type?: string | null
          proposal_documents?: string[] | null
          renderings?: string[] | null
          scope_of_work?: string | null
          sort_order?: number | null
          style_tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      design_professional_portfolio_media: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_url: string
          id: string
          media_type: string | null
          mime_type: string | null
          portfolio_item_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          media_type?: string | null
          mime_type?: string | null
          portfolio_item_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          media_type?: string | null
          mime_type?: string | null
          portfolio_item_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_professional_portfolio_media_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "design_professional_portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      design_professional_profiles: {
        Row: {
          accepting_new_projects: boolean | null
          aia_member: boolean | null
          application_status: string | null
          approved_at: string | null
          approved_by: string | null
          architect_certificate_upload: string | null
          architect_license_document_url: string | null
          architect_license_number: string | null
          average_staging_cost_range: string | null
          awards_or_publications: string | null
          brand_name: string | null
          brand_positioning: string | null
          budget_ranges: string[] | null
          business_address: string | null
          business_registered: boolean | null
          business_registration_document: string | null
          cad_software: string[] | null
          can_coordinate_engineering: boolean | null
          can_stamp_plans: boolean | null
          certification_notes: string | null
          company_logo_url: string | null
          company_name: string | null
          consultation_availability: string | null
          contract_template_url: string | null
          counties_served: string[] | null
          created_at: string | null
          credentials: Json | null
          design_philosophy: string | null
          design_software: string[] | null
          do_you_source_materials: boolean | null
          engineering_in_house: boolean | null
          engineering_insurance_status: string | null
          engineering_license_states: string[] | null
          engineering_notes: string | null
          engineering_services_supported: string[] | null
          engineering_specializations: string[] | null
          engineering_turnaround_days: number | null
          featured: boolean | null
          firm_insurance_type: string | null
          firm_liability_coverage: string | null
          full_bio: string | null
          has_showroom: boolean | null
          headline: string | null
          id: string
          ideal_client_type: string | null
          initial_consultation_fee_note: string | null
          instagram_or_portfolio_link: string | null
          insurance_certificate_upload: string | null
          insurance_status: string | null
          inventory_available: boolean | null
          is_licensed_architecture_firm: boolean | null
          leed_accredited: boolean | null
          licensed_states: string[] | null
          material_sourcing_notes: string | null
          minimum_project_size: number | null
          ncarb: boolean | null
          nkba_member: boolean | null
          notable_projects_summary: string | null
          num_admin_staff: number | null
          num_architects: number | null
          num_civil_engineers: number | null
          num_drafters: number | null
          num_interior_designers: number | null
          num_kitchen_bath_designers: number | null
          num_mep_engineers: number | null
          num_project_managers: number | null
          num_renderers: number | null
          num_structural_engineers: number | null
          offers_surveying: boolean | null
          other_software: string | null
          pe_license_number: string | null
          preferred_communication: string[] | null
          preferred_lead_types: string[] | null
          pricing_model: string[] | null
          pricing_notes: string | null
          primary_service_area: string | null
          primary_service_city: string | null
          primary_service_state: string | null
          primary_service_zip: string | null
          profile_completion_percent: number | null
          profile_photo_url: string | null
          project_management_software: string[] | null
          project_types: string[] | null
          recent_estimate_url: string | null
          region_notes: string | null
          rendering_software: string[] | null
          service_area_type: string | null
          service_mode: string | null
          service_radius_miles: number | null
          services_offered: string[] | null
          showroom_address: string | null
          showroom_description: string | null
          specialties: string[] | null
          staging_services_offered: string[] | null
          staging_turnaround_time_days: number | null
          starting_consultation_fee: number | null
          surveying_equipment: string[] | null
          surveying_services: string[] | null
          team_size: number | null
          team_structure_notes: string | null
          travel_radius_miles: number | null
          unique_value_proposition: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          willing_to_travel_for_premium_projects: boolean | null
          works_with_mep_engineer: boolean | null
          works_with_structural_engineer: boolean | null
          years_in_business: number | null
          zip_codes_served: string[] | null
        }
        Insert: {
          accepting_new_projects?: boolean | null
          aia_member?: boolean | null
          application_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          architect_certificate_upload?: string | null
          architect_license_document_url?: string | null
          architect_license_number?: string | null
          average_staging_cost_range?: string | null
          awards_or_publications?: string | null
          brand_name?: string | null
          brand_positioning?: string | null
          budget_ranges?: string[] | null
          business_address?: string | null
          business_registered?: boolean | null
          business_registration_document?: string | null
          cad_software?: string[] | null
          can_coordinate_engineering?: boolean | null
          can_stamp_plans?: boolean | null
          certification_notes?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          consultation_availability?: string | null
          contract_template_url?: string | null
          counties_served?: string[] | null
          created_at?: string | null
          credentials?: Json | null
          design_philosophy?: string | null
          design_software?: string[] | null
          do_you_source_materials?: boolean | null
          engineering_in_house?: boolean | null
          engineering_insurance_status?: string | null
          engineering_license_states?: string[] | null
          engineering_notes?: string | null
          engineering_services_supported?: string[] | null
          engineering_specializations?: string[] | null
          engineering_turnaround_days?: number | null
          featured?: boolean | null
          firm_insurance_type?: string | null
          firm_liability_coverage?: string | null
          full_bio?: string | null
          has_showroom?: boolean | null
          headline?: string | null
          id?: string
          ideal_client_type?: string | null
          initial_consultation_fee_note?: string | null
          instagram_or_portfolio_link?: string | null
          insurance_certificate_upload?: string | null
          insurance_status?: string | null
          inventory_available?: boolean | null
          is_licensed_architecture_firm?: boolean | null
          leed_accredited?: boolean | null
          licensed_states?: string[] | null
          material_sourcing_notes?: string | null
          minimum_project_size?: number | null
          ncarb?: boolean | null
          nkba_member?: boolean | null
          notable_projects_summary?: string | null
          num_admin_staff?: number | null
          num_architects?: number | null
          num_civil_engineers?: number | null
          num_drafters?: number | null
          num_interior_designers?: number | null
          num_kitchen_bath_designers?: number | null
          num_mep_engineers?: number | null
          num_project_managers?: number | null
          num_renderers?: number | null
          num_structural_engineers?: number | null
          offers_surveying?: boolean | null
          other_software?: string | null
          pe_license_number?: string | null
          preferred_communication?: string[] | null
          preferred_lead_types?: string[] | null
          pricing_model?: string[] | null
          pricing_notes?: string | null
          primary_service_area?: string | null
          primary_service_city?: string | null
          primary_service_state?: string | null
          primary_service_zip?: string | null
          profile_completion_percent?: number | null
          profile_photo_url?: string | null
          project_management_software?: string[] | null
          project_types?: string[] | null
          recent_estimate_url?: string | null
          region_notes?: string | null
          rendering_software?: string[] | null
          service_area_type?: string | null
          service_mode?: string | null
          service_radius_miles?: number | null
          services_offered?: string[] | null
          showroom_address?: string | null
          showroom_description?: string | null
          specialties?: string[] | null
          staging_services_offered?: string[] | null
          staging_turnaround_time_days?: number | null
          starting_consultation_fee?: number | null
          surveying_equipment?: string[] | null
          surveying_services?: string[] | null
          team_size?: number | null
          team_structure_notes?: string | null
          travel_radius_miles?: number | null
          unique_value_proposition?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          willing_to_travel_for_premium_projects?: boolean | null
          works_with_mep_engineer?: boolean | null
          works_with_structural_engineer?: boolean | null
          years_in_business?: number | null
          zip_codes_served?: string[] | null
        }
        Update: {
          accepting_new_projects?: boolean | null
          aia_member?: boolean | null
          application_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          architect_certificate_upload?: string | null
          architect_license_document_url?: string | null
          architect_license_number?: string | null
          average_staging_cost_range?: string | null
          awards_or_publications?: string | null
          brand_name?: string | null
          brand_positioning?: string | null
          budget_ranges?: string[] | null
          business_address?: string | null
          business_registered?: boolean | null
          business_registration_document?: string | null
          cad_software?: string[] | null
          can_coordinate_engineering?: boolean | null
          can_stamp_plans?: boolean | null
          certification_notes?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          consultation_availability?: string | null
          contract_template_url?: string | null
          counties_served?: string[] | null
          created_at?: string | null
          credentials?: Json | null
          design_philosophy?: string | null
          design_software?: string[] | null
          do_you_source_materials?: boolean | null
          engineering_in_house?: boolean | null
          engineering_insurance_status?: string | null
          engineering_license_states?: string[] | null
          engineering_notes?: string | null
          engineering_services_supported?: string[] | null
          engineering_specializations?: string[] | null
          engineering_turnaround_days?: number | null
          featured?: boolean | null
          firm_insurance_type?: string | null
          firm_liability_coverage?: string | null
          full_bio?: string | null
          has_showroom?: boolean | null
          headline?: string | null
          id?: string
          ideal_client_type?: string | null
          initial_consultation_fee_note?: string | null
          instagram_or_portfolio_link?: string | null
          insurance_certificate_upload?: string | null
          insurance_status?: string | null
          inventory_available?: boolean | null
          is_licensed_architecture_firm?: boolean | null
          leed_accredited?: boolean | null
          licensed_states?: string[] | null
          material_sourcing_notes?: string | null
          minimum_project_size?: number | null
          ncarb?: boolean | null
          nkba_member?: boolean | null
          notable_projects_summary?: string | null
          num_admin_staff?: number | null
          num_architects?: number | null
          num_civil_engineers?: number | null
          num_drafters?: number | null
          num_interior_designers?: number | null
          num_kitchen_bath_designers?: number | null
          num_mep_engineers?: number | null
          num_project_managers?: number | null
          num_renderers?: number | null
          num_structural_engineers?: number | null
          offers_surveying?: boolean | null
          other_software?: string | null
          pe_license_number?: string | null
          preferred_communication?: string[] | null
          preferred_lead_types?: string[] | null
          pricing_model?: string[] | null
          pricing_notes?: string | null
          primary_service_area?: string | null
          primary_service_city?: string | null
          primary_service_state?: string | null
          primary_service_zip?: string | null
          profile_completion_percent?: number | null
          profile_photo_url?: string | null
          project_management_software?: string[] | null
          project_types?: string[] | null
          recent_estimate_url?: string | null
          region_notes?: string | null
          rendering_software?: string[] | null
          service_area_type?: string | null
          service_mode?: string | null
          service_radius_miles?: number | null
          services_offered?: string[] | null
          showroom_address?: string | null
          showroom_description?: string | null
          specialties?: string[] | null
          staging_services_offered?: string[] | null
          staging_turnaround_time_days?: number | null
          starting_consultation_fee?: number | null
          surveying_equipment?: string[] | null
          surveying_services?: string[] | null
          team_size?: number | null
          team_structure_notes?: string | null
          travel_radius_miles?: number | null
          unique_value_proposition?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          willing_to_travel_for_premium_projects?: boolean | null
          works_with_mep_engineer?: boolean | null
          works_with_structural_engineer?: boolean | null
          years_in_business?: number | null
          zip_codes_served?: string[] | null
        }
        Relationships: []
      }
      embedding_jobs: {
        Row: {
          chunks_created: number | null
          completed_at: string | null
          created_at: string | null
          document_id: string | null
          document_type: string
          error_message: string | null
          id: string
          project_id: string | null
          status: string | null
        }
        Insert: {
          chunks_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string | null
          document_type: string
          error_message?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
        }
        Update: {
          chunks_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string | null
          document_type?: string
          error_message?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embedding_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_requests: {
        Row: {
          address: string
          assigned_at: string | null
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          project_type: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone: string
          project_type: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          project_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      estimate_workspaces: {
        Row: {
          bid_packet_status: string
          created_at: string
          estimator_id: string | null
          field_mode_status: string
          follow_up_tasks: Json | null
          general_conditions: Json | null
          id: string
          lead_id: string
          site_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bid_packet_status?: string
          created_at?: string
          estimator_id?: string | null
          field_mode_status?: string
          follow_up_tasks?: Json | null
          general_conditions?: Json | null
          id?: string
          lead_id: string
          site_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bid_packet_status?: string
          created_at?: string
          estimator_id?: string | null
          field_mode_status?: string
          follow_up_tasks?: Json | null
          general_conditions?: Json | null
          id?: string
          lead_id?: string
          site_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_workspaces_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          amount: number
          client_name: string
          contingency: number | null
          created_at: string
          estimate_number: string
          id: string
          labor_cost: number | null
          line_items: Json | null
          materials_cost: number | null
          notes: string | null
          permits_fees: number | null
          project_id: string | null
          project_name: string
          status: string
          terms: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          amount: number
          client_name: string
          contingency?: number | null
          created_at?: string
          estimate_number: string
          id?: string
          labor_cost?: number | null
          line_items?: Json | null
          materials_cost?: number | null
          notes?: string | null
          permits_fees?: number | null
          project_id?: string | null
          project_name: string
          status?: string
          terms?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          amount?: number
          client_name?: string
          contingency?: number | null
          created_at?: string
          estimate_number?: string
          id?: string
          labor_cost?: number | null
          line_items?: Json | null
          materials_cost?: number | null
          notes?: string | null
          permits_fees?: number | null
          project_id?: string | null
          project_name?: string
          status?: string
          terms?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      estimating_files: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          room_id: string | null
          uploaded_by: string | null
          workspace_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string
          id?: string
          room_id?: string | null
          uploaded_by?: string | null
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          room_id?: string | null
          uploaded_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimating_files_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "field_mode_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimating_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "estimate_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      estimating_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimating_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "estimate_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      estimator_applicants: {
        Row: {
          certifications: string[] | null
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string[] | null
          specializations: string[] | null
          status: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          certifications?: string[] | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      estimator_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          lead_id: string
          required_for_gate: boolean | null
          task_name: string
          task_type: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          required_for_gate?: boolean | null
          task_name: string
          task_type: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          required_for_gate?: boolean | null
          task_name?: string
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimator_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      estimators: {
        Row: {
          created_at: string
          current_assignments: number
          id: string
          is_active: boolean
          max_assignments: number
          service_zip_codes: string[]
          specializations: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_assignments?: number
          id?: string
          is_active?: boolean
          max_assignments?: number
          service_zip_codes?: string[]
          specializations?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_assignments?: number
          id?: string
          is_active?: boolean
          max_assignments?: number
          service_zip_codes?: string[]
          specializations?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string | null
          contractor_id: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          contractor_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          contractor_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          category_name: string
          contractor_id: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: string
          is_billable: boolean | null
          is_reimbursable: boolean | null
          notes: string | null
          payment_method: string | null
          project_id: string | null
          receipt_file_name: string | null
          receipt_file_path: string | null
          receipt_thumbnail_url: string | null
          reimbursed_at: string | null
          reimbursement_reference: string | null
          rejection_reason: string | null
          status: string
          tags: string[] | null
          tax_deductible: boolean | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          category_name?: string
          contractor_id: string
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          id?: string
          is_billable?: boolean | null
          is_reimbursable?: boolean | null
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          receipt_file_name?: string | null
          receipt_file_path?: string | null
          receipt_thumbnail_url?: string | null
          reimbursed_at?: string | null
          reimbursement_reference?: string | null
          rejection_reason?: string | null
          status?: string
          tags?: string[] | null
          tax_deductible?: boolean | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          category_name?: string
          contractor_id?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: string
          is_billable?: boolean | null
          is_reimbursable?: boolean | null
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          receipt_file_name?: string | null
          receipt_file_path?: string | null
          receipt_thumbnail_url?: string | null
          reimbursed_at?: string | null
          reimbursement_reference?: string | null
          rejection_reason?: string | null
          status?: string
          tags?: string[] | null
          tax_deductible?: boolean | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      field_mode_rooms: {
        Row: {
          cabinetry_notes: string | null
          created_at: string
          demolition_notes: string | null
          dimensions: Json | null
          electrical_notes: string | null
          finish_notes: string | null
          flooring_notes: string | null
          framing_notes: string | null
          hidden_conditions: string | null
          hvac_notes: string | null
          id: string
          plumbing_notes: string | null
          room_name: string
          sort_order: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cabinetry_notes?: string | null
          created_at?: string
          demolition_notes?: string | null
          dimensions?: Json | null
          electrical_notes?: string | null
          finish_notes?: string | null
          flooring_notes?: string | null
          framing_notes?: string | null
          hidden_conditions?: string | null
          hvac_notes?: string | null
          id?: string
          plumbing_notes?: string | null
          room_name?: string
          sort_order?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cabinetry_notes?: string | null
          created_at?: string
          demolition_notes?: string | null
          dimensions?: Json | null
          electrical_notes?: string | null
          finish_notes?: string | null
          flooring_notes?: string | null
          framing_notes?: string | null
          hidden_conditions?: string | null
          hvac_notes?: string | null
          id?: string
          plumbing_notes?: string | null
          room_name?: string
          sort_order?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_mode_rooms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "estimate_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_recommendations: {
        Row: {
          converted: boolean | null
          created_at: string | null
          homeowner_id: string | null
          id: string
          project_id: string | null
          recommended_options: Json | null
          viewed: boolean | null
        }
        Insert: {
          converted?: boolean | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          project_id?: string | null
          recommended_options?: Json | null
          viewed?: boolean | null
        }
        Update: {
          converted?: boolean | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          project_id?: string | null
          recommended_options?: Json | null
          viewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_cases: {
        Row: {
          approved_amount: number | null
          assigned_to: string | null
          created_at: string | null
          homeowner_email: string | null
          homeowner_name: string | null
          homeowner_phone: string | null
          id: string
          interest_rate: number | null
          lender: string
          loan_amount: number | null
          next_action: string | null
          notes: string | null
          project_id: string | null
          status: string | null
          term_months: number | null
          updated_at: string | null
        }
        Insert: {
          approved_amount?: number | null
          assigned_to?: string | null
          created_at?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          id?: string
          interest_rate?: number | null
          lender: string
          loan_amount?: number | null
          next_action?: string | null
          notes?: string | null
          project_id?: string | null
          status?: string | null
          term_months?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_amount?: number | null
          assigned_to?: string | null
          created_at?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          id?: string
          interest_rate?: number | null
          lender?: string
          loan_amount?: number | null
          next_action?: string | null
          notes?: string | null
          project_id?: string | null
          status?: string | null
          term_months?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financing_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_inquiries: {
        Row: {
          annual_income: number | null
          created_at: string | null
          credit_score_range: string | null
          desired_loan_amount: number | null
          email: string
          employment_status: string | null
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string
          project_cost: number | null
          property_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          annual_income?: number | null
          created_at?: string | null
          credit_score_range?: string | null
          desired_loan_amount?: number | null
          email: string
          employment_status?: string | null
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          project_cost?: number | null
          property_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_income?: number | null
          created_at?: string | null
          credit_score_range?: string | null
          desired_loan_amount?: number | null
          email?: string
          employment_status?: string | null
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          project_cost?: number | null
          property_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      foreman_tasks: {
        Row: {
          actual_hours: number | null
          assigned_team: string | null
          assigned_to: string[] | null
          blocked_reason: string | null
          completed_at: string | null
          contractor_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          location: string | null
          priority: string
          project_id: string | null
          status: string
          task_title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_team?: string | null
          assigned_to?: string[] | null
          blocked_reason?: string | null
          completed_at?: string | null
          contractor_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          task_title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_team?: string | null
          assigned_to?: string[] | null
          blocked_reason?: string | null
          completed_at?: string | null
          contractor_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          task_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foreman_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foreman_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      form_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          form_name: string
          id: string
          status: string | null
          submission_data: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          form_name: string
          id?: string
          status?: string | null
          submission_data?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          form_name?: string
          id?: string
          status?: string | null
          submission_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      gc_applicants: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string | null
          crew_size: number | null
          email: string
          id: string
          insurance_info: string | null
          license_number: string | null
          notes: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string[] | null
          specializations: string[] | null
          status: string | null
          updated_at: string | null
          website: string | null
          years_in_business: number | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string | null
          crew_size?: number | null
          email: string
          id?: string
          insurance_info?: string | null
          license_number?: string | null
          notes?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
          years_in_business?: number | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string | null
          crew_size?: number | null
          email?: string
          id?: string
          insurance_info?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_webhooks: {
        Row: {
          calendar_id: string
          channel_id: string
          created_at: string | null
          expiration: string
          id: string
          resource_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendar_id: string
          channel_id: string
          created_at?: string | null
          expiration: string
          id?: string
          resource_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendar_id?: string
          channel_id?: string
          created_at?: string | null
          expiration?: string
          id?: string
          resource_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_places_import_logs: {
        Row: {
          business_type: string
          created_at: string | null
          duplicates_skipped: number | null
          id: string
          imported_by: string | null
          new_imported: number | null
          results_found: number | null
          search_query: string
        }
        Insert: {
          business_type: string
          created_at?: string | null
          duplicates_skipped?: number | null
          id?: string
          imported_by?: string | null
          new_imported?: number | null
          results_found?: number | null
          search_query: string
        }
        Update: {
          business_type?: string
          created_at?: string | null
          duplicates_skipped?: number | null
          id?: string
          imported_by?: string | null
          new_imported?: number | null
          results_found?: number | null
          search_query?: string
        }
        Relationships: []
      }
      home_ai_insights: {
        Row: {
          confidence_level: string | null
          created_at: string
          home_profile_id: string
          id: string
          insight_type: string
          recommendation: string | null
          related_system_id: string | null
          risk_level: string | null
          source_summary: Json | null
          status: string | null
          summary: string
          supporting_factors: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          home_profile_id: string
          id?: string
          insight_type: string
          recommendation?: string | null
          related_system_id?: string | null
          risk_level?: string | null
          source_summary?: Json | null
          status?: string | null
          summary: string
          supporting_factors?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          home_profile_id?: string
          id?: string
          insight_type?: string
          recommendation?: string | null
          related_system_id?: string | null
          risk_level?: string | null
          source_summary?: Json | null
          status?: string | null
          summary?: string
          supporting_factors?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_ai_insights_home_profile_id_fkey"
            columns: ["home_profile_id"]
            isOneToOne: false
            referencedRelation: "home_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_ai_insights_related_system_id_fkey"
            columns: ["related_system_id"]
            isOneToOne: false
            referencedRelation: "home_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      home_documents: {
        Row: {
          created_at: string
          document_type: string
          extracted_text: string | null
          extraction_status: string | null
          file_name: string
          file_path: string | null
          file_size_bytes: number | null
          file_url: string
          home_profile_id: string
          id: string
          mime_type: string | null
          related_system_id: string | null
          updated_at: string
          upload_source: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          extracted_text?: string | null
          extraction_status?: string | null
          file_name: string
          file_path?: string | null
          file_size_bytes?: number | null
          file_url: string
          home_profile_id: string
          id?: string
          mime_type?: string | null
          related_system_id?: string | null
          updated_at?: string
          upload_source?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          extracted_text?: string | null
          extraction_status?: string | null
          file_name?: string
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string
          home_profile_id?: string
          id?: string
          mime_type?: string | null
          related_system_id?: string | null
          updated_at?: string
          upload_source?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_documents_home_profile_id_fkey"
            columns: ["home_profile_id"]
            isOneToOne: false
            referencedRelation: "home_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_documents_related_system_id_fkey"
            columns: ["related_system_id"]
            isOneToOne: false
            referencedRelation: "home_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      home_maintenance_events: {
        Row: {
          cost: number | null
          created_at: string
          created_by: string | null
          event_date: string | null
          event_type: string
          home_profile_id: string
          id: string
          notes: string | null
          related_system_id: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_type: string
          home_profile_id: string
          id?: string
          notes?: string | null
          related_system_id?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_type?: string
          home_profile_id?: string
          id?: string
          notes?: string | null
          related_system_id?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_maintenance_events_home_profile_id_fkey"
            columns: ["home_profile_id"]
            isOneToOne: false
            referencedRelation: "home_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_maintenance_events_related_system_id_fkey"
            columns: ["related_system_id"]
            isOneToOne: false
            referencedRelation: "home_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      home_photos: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          file_name: string | null
          file_path: string | null
          file_url: string
          home_profile_id: string
          id: string
          is_cover: boolean | null
          related_system_id: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          category: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_url: string
          home_profile_id: string
          id?: string
          is_cover?: boolean | null
          related_system_id?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_url?: string
          home_profile_id?: string
          id?: string
          is_cover?: boolean | null
          related_system_id?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_photos_home_profile_id_fkey"
            columns: ["home_profile_id"]
            isOneToOne: false
            referencedRelation: "home_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_photos_related_system_id_fkey"
            columns: ["related_system_id"]
            isOneToOne: false
            referencedRelation: "home_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      home_profile_field_sources: {
        Row: {
          confidence_level: string
          created_at: string
          field_name: string
          field_value: string | null
          home_profile_id: string
          id: string
          source_name: string
          source_reference: string | null
        }
        Insert: {
          confidence_level: string
          created_at?: string
          field_name: string
          field_value?: string | null
          home_profile_id: string
          id?: string
          source_name: string
          source_reference?: string | null
        }
        Update: {
          confidence_level?: string
          created_at?: string
          field_name?: string
          field_value?: string | null
          home_profile_id?: string
          id?: string
          source_name?: string
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_profile_field_sources_home_profile_id_fkey"
            columns: ["home_profile_id"]
            isOneToOne: false
            referencedRelation: "home_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_profiles: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          ai_last_run_at: string | null
          bathrooms: number | null
          bedrooms: number | null
          block_lot: string | null
          city: string | null
          county: string | null
          created_at: string
          enrichment_last_run_at: string | null
          enrichment_status: string | null
          flood_zone_flag: boolean | null
          floors: number | null
          heat_fuel_type: string | null
          historic_home_flag: boolean | null
          hoa_flag: boolean | null
          home_type: string | null
          homeowner_user_id: string
          id: string
          lot_size_sqft: number | null
          occupancy_status: string | null
          parcel_id: string | null
          project_id: string | null
          property_address: string
          purchase_year: number | null
          sewer_type: string | null
          square_footage: number | null
          state: string | null
          updated_at: string
          water_type: string | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          ai_last_run_at?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          block_lot?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          enrichment_last_run_at?: string | null
          enrichment_status?: string | null
          flood_zone_flag?: boolean | null
          floors?: number | null
          heat_fuel_type?: string | null
          historic_home_flag?: boolean | null
          hoa_flag?: boolean | null
          home_type?: string | null
          homeowner_user_id: string
          id?: string
          lot_size_sqft?: number | null
          occupancy_status?: string | null
          parcel_id?: string | null
          project_id?: string | null
          property_address: string
          purchase_year?: number | null
          sewer_type?: string | null
          square_footage?: number | null
          state?: string | null
          updated_at?: string
          water_type?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          ai_last_run_at?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          block_lot?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          enrichment_last_run_at?: string | null
          enrichment_status?: string | null
          flood_zone_flag?: boolean | null
          floors?: number | null
          heat_fuel_type?: string | null
          historic_home_flag?: boolean | null
          hoa_flag?: boolean | null
          home_type?: string | null
          homeowner_user_id?: string
          id?: string
          lot_size_sqft?: number | null
          occupancy_status?: string | null
          parcel_id?: string | null
          project_id?: string | null
          property_address?: string
          purchase_year?: number | null
          sewer_type?: string | null
          square_footage?: number | null
          state?: string | null
          updated_at?: string
          water_type?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      home_systems: {
        Row: {
          ai_confidence: string | null
          ai_estimated_replacement_window: string | null
          ai_reasoning_summary: string | null
          ai_recommendation: string | null
          ai_risk_level: string | null
          ai_typical_lifespan: string | null
          approximate_age: number | null
          brand: string | null
          condition_rating: string | null
          created_at: string
          home_profile_id: string
          homeowner_notes: string | null
          id: string
          install_year: number | null
          issue_summary: string | null
          known_issues: boolean | null
          last_service_date: string | null
          manufacturer: string | null
          model_number: string | null
          repair_history: string | null
          serial_number: string | null
          source_condition: string | null
          source_install_year: string | null
          source_system_data: string | null
          system_label: string | null
          system_type: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: string | null
          ai_estimated_replacement_window?: string | null
          ai_reasoning_summary?: string | null
          ai_recommendation?: string | null
          ai_risk_level?: string | null
          ai_typical_lifespan?: string | null
          approximate_age?: number | null
          brand?: string | null
          condition_rating?: string | null
          created_at?: string
          home_profile_id: string
          homeowner_notes?: string | null
          id?: string
          install_year?: number | null
          issue_summary?: string | null
          known_issues?: boolean | null
          last_service_date?: string | null
          manufacturer?: string | null
          model_number?: string | null
          repair_history?: string | null
          serial_number?: string | null
          source_condition?: string | null
          source_install_year?: string | null
          source_system_data?: string | null
          system_label?: string | null
          system_type: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: string | null
          ai_estimated_replacement_window?: string | null
          ai_reasoning_summary?: string | null
          ai_recommendation?: string | null
          ai_risk_level?: string | null
          ai_typical_lifespan?: string | null
          approximate_age?: number | null
          brand?: string | null
          condition_rating?: string | null
          created_at?: string
          home_profile_id?: string
          homeowner_notes?: string | null
          id?: string
          install_year?: number | null
          issue_summary?: string | null
          known_issues?: boolean | null
          last_service_date?: string | null
          manufacturer?: string | null
          model_number?: string | null
          repair_history?: string | null
          serial_number?: string | null
          source_condition?: string | null
          source_install_year?: string | null
          source_system_data?: string | null
          system_label?: string | null
          system_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_systems_home_profile_id_fkey"
            columns: ["home_profile_id"]
            isOneToOne: false
            referencedRelation: "home_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_applicants: {
        Row: {
          address: string | null
          budget_range: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string
          project_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          budget_range?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          project_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          budget_range?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          project_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      homeowner_leads: {
        Row: {
          assigned_estimator_id: string | null
          campaign_id: string | null
          completed_steps: Json | null
          converted_at: string | null
          county: string | null
          created_at: string | null
          description: string | null
          drop_off_step: string | null
          email: string | null
          estimated_budget: string | null
          id: string
          landing_page: string | null
          lead_source: string | null
          name: string | null
          page_path: Json | null
          phone: string | null
          project_type: string
          status: string | null
          timeline: string | null
          town: string | null
          updated_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          zip_code: string | null
        }
        Insert: {
          assigned_estimator_id?: string | null
          campaign_id?: string | null
          completed_steps?: Json | null
          converted_at?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          drop_off_step?: string | null
          email?: string | null
          estimated_budget?: string | null
          id?: string
          landing_page?: string | null
          lead_source?: string | null
          name?: string | null
          page_path?: Json | null
          phone?: string | null
          project_type: string
          status?: string | null
          timeline?: string | null
          town?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          zip_code?: string | null
        }
        Update: {
          assigned_estimator_id?: string | null
          campaign_id?: string | null
          completed_steps?: Json | null
          converted_at?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          drop_off_step?: string | null
          email?: string | null
          estimated_budget?: string | null
          id?: string
          landing_page?: string | null
          lead_source?: string | null
          name?: string | null
          page_path?: Json | null
          phone?: string | null
          project_type?: string
          status?: string | null
          timeline?: string | null
          town?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      homeowner_meetings: {
        Row: {
          action_items: string[] | null
          attendees: string[] | null
          completed: boolean | null
          created_at: string | null
          id: string
          meeting_date: string
          meeting_type: string
          notes: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          action_items?: string[] | null
          attendees?: string[] | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          meeting_date: string
          meeting_type: string
          notes?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          action_items?: string[] | null
          attendees?: string[] | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          meeting_date?: string
          meeting_type?: string
          notes?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          project_id: string | null
          read_at: string | null
          sender_name: string | null
          sender_type: string
          sender_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          project_id?: string | null
          read_at?: string | null
          sender_name?: string | null
          sender_type: string
          sender_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          project_id?: string | null
          read_at?: string | null
          sender_name?: string | null
          sender_type?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          note_type: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_portal_access: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          homeowner_email: string
          homeowner_name: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          project_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string
          homeowner_email: string
          homeowner_name?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          project_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          homeowner_email?: string
          homeowner_name?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_portal_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_portal_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_projects: {
        Row: {
          created_at: string
          homeowner_id: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          homeowner_id: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          homeowner_id?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      image_assets: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          prompt: string | null
          published_at: string | null
          slot_id: string
          source: string
          status: string
          storage_path: string
          style_tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt?: string | null
          published_at?: string | null
          slot_id: string
          source: string
          status?: string
          storage_path: string
          style_tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt?: string | null
          published_at?: string | null
          slot_id?: string
          source?: string
          status?: string
          storage_path?: string
          style_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "image_assets_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "image_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      image_slots: {
        Row: {
          active_image_id: string | null
          aspect_ratio: string
          created_at: string | null
          id: string
          label: string
          page_path: string
          slot_key: string
          updated_at: string | null
        }
        Insert: {
          active_image_id?: string | null
          aspect_ratio?: string
          created_at?: string | null
          id?: string
          label: string
          page_path: string
          slot_key: string
          updated_at?: string | null
        }
        Update: {
          active_image_id?: string | null
          aspect_ratio?: string
          created_at?: string | null
          id?: string
          label?: string
          page_path?: string
          slot_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_image"
            columns: ["active_image_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_businesses: {
        Row: {
          address: string | null
          business_name: string
          business_status: string | null
          business_type: string
          category: string | null
          city: string | null
          claim_status: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          google_place_id: string | null
          google_rating: number | null
          id: string
          is_active: boolean | null
          map_link: string | null
          phone: string | null
          photo_attributions: Json | null
          photo_url: string | null
          primary_type: string | null
          raw_place_data: Json | null
          review_count: number | null
          search_query: string | null
          service_area_tags: string[] | null
          slug: string
          source: string | null
          state: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_status?: string | null
          business_type: string
          category?: string | null
          city?: string | null
          claim_status?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          id?: string
          is_active?: boolean | null
          map_link?: string | null
          phone?: string | null
          photo_attributions?: Json | null
          photo_url?: string | null
          primary_type?: string | null
          raw_place_data?: Json | null
          review_count?: number | null
          search_query?: string | null
          service_area_tags?: string[] | null
          slug: string
          source?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_status?: string | null
          business_type?: string
          category?: string | null
          city?: string | null
          claim_status?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          id?: string
          is_active?: boolean | null
          map_link?: string | null
          phone?: string | null
          photo_attributions?: Json | null
          photo_url?: string | null
          primary_type?: string | null
          raw_place_data?: Json | null
          review_count?: number | null
          search_query?: string | null
          service_area_tags?: string[] | null
          slug?: string
          source?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      inside_sales_agents: {
        Row: {
          agent_role: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          agent_role?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          agent_role?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      inside_sales_appointments: {
        Row: {
          agent_id: string | null
          appointment_type: string
          contractor_client_id: string | null
          created_at: string | null
          id: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          appointment_type: string
          contractor_client_id?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          appointment_type?: string
          contractor_client_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inside_sales_appointments_contractor_client_id_fkey"
            columns: ["contractor_client_id"]
            isOneToOne: false
            referencedRelation: "contractor_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inside_sales_appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_delay_patterns: {
        Row: {
          average_wait_days: number | null
          county: string | null
          created_at: string | null
          id: string
          inspection_type: string
          inspector_backlog_level: string | null
          last_updated: string | null
          municipality: string | null
          peak_delay_months: string[] | null
          predicted_delay_days: number | null
          seasonal_variation: Json | null
          state: string
        }
        Insert: {
          average_wait_days?: number | null
          county?: string | null
          created_at?: string | null
          id?: string
          inspection_type: string
          inspector_backlog_level?: string | null
          last_updated?: string | null
          municipality?: string | null
          peak_delay_months?: string[] | null
          predicted_delay_days?: number | null
          seasonal_variation?: Json | null
          state: string
        }
        Update: {
          average_wait_days?: number | null
          county?: string | null
          created_at?: string | null
          id?: string
          inspection_type?: string
          inspector_backlog_level?: string | null
          last_updated?: string | null
          municipality?: string | null
          peak_delay_months?: string[] | null
          predicted_delay_days?: number | null
          seasonal_variation?: Json | null
          state?: string
        }
        Relationships: []
      }
      inspection_scheduler: {
        Row: {
          ai_recommendation: string | null
          created_at: string | null
          id: string
          inspection_type: string
          predicted_outcome: string | null
          project_id: string | null
          risk_level: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_recommendation?: string | null
          created_at?: string | null
          id?: string
          inspection_type: string
          predicted_outcome?: string | null
          project_id?: string | null
          risk_level?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_recommendation?: string | null
          created_at?: string | null
          id?: string
          inspection_type?: string
          predicted_outcome?: string | null
          project_id?: string | null
          risk_level?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_scheduler_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_scheduler_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      interior_designer_applications: {
        Row: {
          admin_notes: string | null
          certifications: string[] | null
          created_at: string
          design_software: string[] | null
          email: string
          id: string
          linkedin_url: string | null
          name: string
          phone: string
          portfolio_url: string | null
          professional_references: Json | null
          project_types: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string[]
          specializations: string[]
          status: string
          updated_at: string
          website_url: string | null
          why_join: string
          years_experience: number
        }
        Insert: {
          admin_notes?: string | null
          certifications?: string[] | null
          created_at?: string
          design_software?: string[] | null
          email: string
          id?: string
          linkedin_url?: string | null
          name: string
          phone: string
          portfolio_url?: string | null
          professional_references?: Json | null
          project_types: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas: string[]
          specializations: string[]
          status?: string
          updated_at?: string
          website_url?: string | null
          why_join: string
          years_experience: number
        }
        Update: {
          admin_notes?: string | null
          certifications?: string[] | null
          created_at?: string
          design_software?: string[] | null
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          phone?: string
          portfolio_url?: string | null
          professional_references?: Json | null
          project_types?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[]
          specializations?: string[]
          status?: string
          updated_at?: string
          website_url?: string | null
          why_join?: string
          years_experience?: number
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          contractor_id: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invitation_type: string
          phone: string | null
          subcontractor_id: string | null
          team_member_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          contractor_id: string
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          invitation_type: string
          phone?: string | null
          subcontractor_id?: string | null
          team_member_id?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          contractor_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invitation_type?: string
          phone?: string | null
          subcontractor_id?: string | null
          team_member_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          recorded_by: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          due_date: string
          homeowner_address: string | null
          homeowner_email: string
          homeowner_id: string | null
          homeowner_name: string
          id: string
          invoice_date: string
          invoice_number: string
          last_reminder_sent: string | null
          line_items: Json | null
          notes: string | null
          paid_at: string | null
          payment_instructions: string | null
          project_id: string | null
          quickbooks_id: string | null
          reminder_count: number | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          terms: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          due_date: string
          homeowner_address?: string | null
          homeowner_email: string
          homeowner_id?: string | null
          homeowner_name: string
          id?: string
          invoice_date?: string
          invoice_number: string
          last_reminder_sent?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          project_id?: string | null
          quickbooks_id?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          due_date?: string
          homeowner_address?: string | null
          homeowner_email?: string
          homeowner_id?: string | null
          homeowner_name?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          last_reminder_sent?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          project_id?: string | null
          quickbooks_id?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          availability: string | null
          city: string | null
          created_at: string
          description: string
          email: string
          external_candidate_id: string | null
          id: string
          linkedin_url: string | null
          name: string
          phone: string
          portfolio_url: string | null
          resume_url: string
          role: string
          source: string | null
          source_api_key_id: string | null
          state: string | null
          status: string
          trade_specialty: string | null
          updated_at: string
          years_experience: string | null
        }
        Insert: {
          availability?: string | null
          city?: string | null
          created_at?: string
          description: string
          email: string
          external_candidate_id?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          phone: string
          portfolio_url?: string | null
          resume_url: string
          role: string
          source?: string | null
          source_api_key_id?: string | null
          state?: string | null
          status?: string
          trade_specialty?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Update: {
          availability?: string | null
          city?: string | null
          created_at?: string
          description?: string
          email?: string
          external_candidate_id?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          phone?: string
          portfolio_url?: string | null
          resume_url?: string
          role?: string
          source?: string | null
          source_api_key_id?: string | null
          state?: string | null
          status?: string
          trade_specialty?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_source_api_key_id_fkey"
            columns: ["source_api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graphs: {
        Row: {
          created_at: string | null
          edges: Json
          id: string
          nodes: Json
          project_id: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          edges: Json
          id?: string
          nodes: Json
          project_id?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          edges?: Json
          id?: string
          nodes?: Json
          project_id?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_graphs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_graphs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_goals: {
        Row: {
          created_at: string
          goals: Json
          id: string
          month: number | null
          period: string
          quarter: number | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          goals: Json
          id?: string
          month?: number | null
          period: string
          quarter?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          goals?: Json
          id?: string
          month?: number | null
          period?: string
          quarter?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          is_internal: boolean | null
          lead_id: string
          note_text: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          lead_id: string
          note_text: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          lead_id?: string
          note_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          contractor_id: string | null
          conversion_probability: number | null
          created_at: string | null
          fit_reason: string | null
          id: string
          lead_score: number | null
          project_id: string | null
          recommended_pitch: string | null
        }
        Insert: {
          contractor_id?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          fit_reason?: string | null
          id?: string
          lead_score?: number | null
          project_id?: string | null
          recommended_pitch?: string | null
        }
        Update: {
          contractor_id?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          fit_reason?: string | null
          id?: string
          lead_score?: number | null
          project_id?: string | null
          recommended_pitch?: string | null
        }
        Relationships: []
      }
      lead_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          lead_id: string
          notes: string | null
          reason: string | null
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          reason?: string | null
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stage_timeouts: {
        Row: {
          created_at: string
          id: string
          notification_enabled: boolean
          stage_status: string
          timeout_hours: number
          updated_at: string
          warning_hours: number
        }
        Insert: {
          created_at?: string
          id?: string
          notification_enabled?: boolean
          stage_status: string
          timeout_hours: number
          updated_at?: string
          warning_hours: number
        }
        Update: {
          created_at?: string
          id?: string
          notification_enabled?: boolean
          stage_status?: string
          timeout_hours?: number
          updated_at?: string
          warning_hours?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          ad_group: string | null
          blocker_type: string | null
          campaign_name: string | null
          channel: string | null
          client_notes: string | null
          created_at: string
          email: string
          estimated_budget: string | null
          estimator_id: string | null
          estimator_readonly: boolean | null
          external_reference_id: string | null
          fbclid: string | null
          gclid: string | null
          id: string
          internal_notes: string | null
          last_activity_at: string | null
          last_activity_by: string | null
          last_activity_type: string | null
          location: string
          name: string
          next_action: string | null
          next_action_date: string | null
          phone: string
          project_type: string
          referral_type: string | null
          sale_outcome: string | null
          sale_outcome_reason: string | null
          sold_at: string | null
          source: string | null
          source_api_key_id: string | null
          stage: string | null
          status: string
          status_change_notes: string | null
          status_change_reason: string | null
          sub_source: string | null
          updated_at: string
          user_id: string | null
          walkthrough_completed_at: string | null
          walkthrough_scheduled_at: string | null
        }
        Insert: {
          ad_group?: string | null
          blocker_type?: string | null
          campaign_name?: string | null
          channel?: string | null
          client_notes?: string | null
          created_at?: string
          email: string
          estimated_budget?: string | null
          estimator_id?: string | null
          estimator_readonly?: boolean | null
          external_reference_id?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_at?: string | null
          last_activity_by?: string | null
          last_activity_type?: string | null
          location: string
          name: string
          next_action?: string | null
          next_action_date?: string | null
          phone: string
          project_type: string
          referral_type?: string | null
          sale_outcome?: string | null
          sale_outcome_reason?: string | null
          sold_at?: string | null
          source?: string | null
          source_api_key_id?: string | null
          stage?: string | null
          status?: string
          status_change_notes?: string | null
          status_change_reason?: string | null
          sub_source?: string | null
          updated_at?: string
          user_id?: string | null
          walkthrough_completed_at?: string | null
          walkthrough_scheduled_at?: string | null
        }
        Update: {
          ad_group?: string | null
          blocker_type?: string | null
          campaign_name?: string | null
          channel?: string | null
          client_notes?: string | null
          created_at?: string
          email?: string
          estimated_budget?: string | null
          estimator_id?: string | null
          estimator_readonly?: boolean | null
          external_reference_id?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_at?: string | null
          last_activity_by?: string | null
          last_activity_type?: string | null
          location?: string
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          phone?: string
          project_type?: string
          referral_type?: string | null
          sale_outcome?: string | null
          sale_outcome_reason?: string | null
          sold_at?: string | null
          source?: string | null
          source_api_key_id?: string | null
          stage?: string | null
          status?: string
          status_change_notes?: string | null
          status_change_reason?: string | null
          sub_source?: string | null
          updated_at?: string
          user_id?: string | null
          walkthrough_completed_at?: string | null
          walkthrough_scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_source_api_key_id_fkey"
            columns: ["source_api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      location_personalizations: {
        Row: {
          county: string | null
          created_at: string | null
          id: string
          last_updated: string | null
          local_insights: string | null
          location: string
          popular_projects: Json | null
          pricing_adjustments: Json | null
          seasonal_notes: string | null
        }
        Insert: {
          county?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          local_insights?: string | null
          location: string
          popular_projects?: Json | null
          pricing_adjustments?: Json | null
          seasonal_notes?: string | null
        }
        Update: {
          county?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          local_insights?: string | null
          location?: string
          popular_projects?: Json | null
          pricing_adjustments?: Json | null
          seasonal_notes?: string | null
        }
        Relationships: []
      }
      market_opportunity_scores: {
        Row: {
          contractor_competition_level: string | null
          county: string | null
          created_at: string | null
          expansion_priority: number | null
          housing_stock_age: number | null
          id: string
          last_calculated: string | null
          market_analysis: Json | null
          median_home_value: number | null
          metro_area: string | null
          opportunity_score: number | null
          renovation_demand_score: number | null
          renovation_volume_trend: string | null
          state: string
        }
        Insert: {
          contractor_competition_level?: string | null
          county?: string | null
          created_at?: string | null
          expansion_priority?: number | null
          housing_stock_age?: number | null
          id?: string
          last_calculated?: string | null
          market_analysis?: Json | null
          median_home_value?: number | null
          metro_area?: string | null
          opportunity_score?: number | null
          renovation_demand_score?: number | null
          renovation_volume_trend?: string | null
          state: string
        }
        Update: {
          contractor_competition_level?: string | null
          county?: string | null
          created_at?: string | null
          expansion_priority?: number | null
          housing_stock_age?: number | null
          id?: string
          last_calculated?: string | null
          market_analysis?: Json | null
          median_home_value?: number | null
          metro_area?: string | null
          opportunity_score?: number | null
          renovation_demand_score?: number | null
          renovation_volume_trend?: string | null
          state?: string
        }
        Relationships: []
      }
      marketplace_routing_logs: {
        Row: {
          auto_routing_enabled: boolean | null
          created_at: string | null
          human_override: boolean | null
          id: string
          orchestrator_decision: Json | null
          override_by: string | null
          project_id: string | null
          ranked_contractors: Json
          routing_reason: string | null
          selected_contractors: string[]
        }
        Insert: {
          auto_routing_enabled?: boolean | null
          created_at?: string | null
          human_override?: boolean | null
          id?: string
          orchestrator_decision?: Json | null
          override_by?: string | null
          project_id?: string | null
          ranked_contractors: Json
          routing_reason?: string | null
          selected_contractors: string[]
        }
        Update: {
          auto_routing_enabled?: boolean | null
          created_at?: string | null
          human_override?: boolean | null
          id?: string
          orchestrator_decision?: Json | null
          override_by?: string | null
          project_id?: string | null
          ranked_contractors?: Json
          routing_reason?: string | null
          selected_contractors?: string[]
        }
        Relationships: []
      }
      match_scores: {
        Row: {
          contractor_id: string | null
          created_at: string | null
          fit_reason: string | null
          id: string
          match_score: number | null
          project_id: string | null
          recommended: boolean | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string | null
          fit_reason?: string | null
          id?: string
          match_score?: number | null
          project_id?: string | null
          recommended?: boolean | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          fit_reason?: string | null
          id?: string
          match_score?: number | null
          project_id?: string | null
          recommended?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_eta_logs: {
        Row: {
          created_at: string | null
          delay_days: number | null
          id: string
          material_name: string
          original_eta: string | null
          project_id: string | null
          recommended_actions: Json | null
          status: string | null
          updated_at: string | null
          updated_eta: string | null
        }
        Insert: {
          created_at?: string | null
          delay_days?: number | null
          id?: string
          material_name: string
          original_eta?: string | null
          project_id?: string | null
          recommended_actions?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_eta?: string | null
        }
        Update: {
          created_at?: string | null
          delay_days?: number | null
          id?: string
          material_name?: string
          original_eta?: string | null
          project_id?: string | null
          recommended_actions?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_eta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_eta_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_eta_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_lead_times: {
        Row: {
          average_days: number
          created_at: string
          id: string
          last_updated: string
          material_name: string
          risk_factor: number | null
          vendor: string | null
        }
        Insert: {
          average_days: number
          created_at?: string
          id?: string
          last_updated?: string
          material_name: string
          risk_factor?: number | null
          vendor?: string | null
        }
        Update: {
          average_days?: number
          created_at?: string
          id?: string
          last_updated?: string
          material_name?: string
          risk_factor?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      material_selections: {
        Row: {
          approval_link: string | null
          approval_request_sent_at: string | null
          approval_request_sent_by: string | null
          category: string
          client_approved_at: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          deadline: string | null
          homeowner_id: string | null
          id: string
          item_description: string
          notes: string | null
          project_id: string | null
          project_name: string
          reminder_count: number | null
          reminder_sent_at: string | null
          reviewed_by: string | null
          selected_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_link?: string | null
          approval_request_sent_at?: string | null
          approval_request_sent_by?: string | null
          category: string
          client_approved_at?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          deadline?: string | null
          homeowner_id?: string | null
          id?: string
          item_description: string
          notes?: string | null
          project_id?: string | null
          project_name: string
          reminder_count?: number | null
          reminder_sent_at?: string | null
          reviewed_by?: string | null
          selected_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_link?: string | null
          approval_request_sent_at?: string | null
          approval_request_sent_by?: string | null
          category?: string
          client_approved_at?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          deadline?: string | null
          homeowner_id?: string | null
          id?: string
          item_description?: string
          notes?: string | null
          project_id?: string | null
          project_name?: string
          reminder_count?: number | null
          reminder_sent_at?: string | null
          reviewed_by?: string | null
          selected_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      municipality_fee_schedules: {
        Row: {
          base_fee: number
          created_at: string
          effective_date: string | null
          expires_date: string | null
          flat_fee_applies: boolean | null
          id: string
          maximum_fee: number | null
          minimum_fee: number | null
          municipality: string
          notes: string | null
          per_sqft_fee: number | null
          per_valuation_fee: number | null
          permit_type: string
          state: string
          updated_at: string
        }
        Insert: {
          base_fee?: number
          created_at?: string
          effective_date?: string | null
          expires_date?: string | null
          flat_fee_applies?: boolean | null
          id?: string
          maximum_fee?: number | null
          minimum_fee?: number | null
          municipality: string
          notes?: string | null
          per_sqft_fee?: number | null
          per_valuation_fee?: number | null
          permit_type: string
          state: string
          updated_at?: string
        }
        Update: {
          base_fee?: number
          created_at?: string
          effective_date?: string | null
          expires_date?: string | null
          flat_fee_applies?: boolean | null
          id?: string
          maximum_fee?: number | null
          minimum_fee?: number | null
          municipality?: string
          notes?: string | null
          per_sqft_fee?: number | null
          per_valuation_fee?: number | null
          permit_type?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      municipality_permit_timelines: {
        Row: {
          average_days: number
          created_at: string | null
          id: string
          last_updated: string | null
          max_days: number | null
          min_days: number | null
          municipality: string
          notes: string | null
          stage: string
          state: string
        }
        Insert: {
          average_days: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          max_days?: number | null
          min_days?: number | null
          municipality: string
          notes?: string | null
          stage: string
          state?: string
        }
        Update: {
          average_days?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          max_days?: number | null
          min_days?: number | null
          municipality?: string
          notes?: string | null
          stage?: string
          state?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          last_sync_error: string | null
          metadata: Json | null
          smartreno_synced: boolean | null
          smartreno_synced_at: string | null
          source: string | null
          status: string
          subscribed_at: string
          sync_retry_count: number | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          last_sync_error?: string | null
          metadata?: Json | null
          smartreno_synced?: boolean | null
          smartreno_synced_at?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
          sync_retry_count?: number | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          last_sync_error?: string | null
          metadata?: Json | null
          smartreno_synced?: boolean | null
          smartreno_synced_at?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
          sync_retry_count?: number | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operations_run_logs: {
        Row: {
          approval_status: string | null
          approved_by: string | null
          auto_actions: Json | null
          created_at: string | null
          id: string
          project_id: string | null
          requires_approval: boolean | null
          risks_detected: Json | null
          run_type: string
          tasks_completed: number | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_by?: string | null
          auto_actions?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          requires_approval?: boolean | null
          risks_detected?: Json | null
          run_type: string
          tasks_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_by?: string | null
          auto_actions?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          requires_approval?: boolean | null
          risks_detected?: Json | null
          run_type?: string
          tasks_completed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_run_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_run_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applicants: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string | null
          description: string | null
          email: string
          id: string
          notes: string | null
          partnership_type: string | null
          phone: string
          proposed_collaboration: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          notes?: string | null
          partnership_type?: string | null
          phone: string
          proposed_collaboration?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          notes?: string | null
          partnership_type?: string | null
          phone?: string
          proposed_collaboration?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partner_referrals: {
        Row: {
          contractor_id: string | null
          converted_at: string | null
          created_at: string | null
          homeowner_project_id: string | null
          id: string
          paid_at: string | null
          partner_id: string | null
          partner_name: string
          partner_type: string | null
          qualified_at: string | null
          referral_bonus: number | null
          referral_type: string | null
          referral_value: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contractor_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          homeowner_project_id?: string | null
          id?: string
          paid_at?: string | null
          partner_id?: string | null
          partner_name: string
          partner_type?: string | null
          qualified_at?: string | null
          referral_bonus?: number | null
          referral_type?: string | null
          referral_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          homeowner_project_id?: string | null
          id?: string
          paid_at?: string | null
          partner_id?: string | null
          partner_name?: string
          partner_type?: string | null
          qualified_at?: string | null
          referral_bonus?: number | null
          referral_type?: string | null
          referral_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_homeowner_project_id_fkey"
            columns: ["homeowner_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_milestone_logs: {
        Row: {
          auto_message: string | null
          created_at: string | null
          id: string
          milestone_name: string
          payment_amount: number | null
          project_id: string | null
          scheduled_date: string | null
          status: string | null
          trigger_reason: string | null
          updated_at: string | null
        }
        Insert: {
          auto_message?: string | null
          created_at?: string | null
          id?: string
          milestone_name: string
          payment_amount?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          trigger_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_message?: string | null
          created_at?: string | null
          id?: string
          milestone_name?: string
          payment_amount?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          trigger_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestone_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_milestone_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_milestones: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          milestone_name: string
          paid_date: string | null
          payee: string | null
          payer: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_name: string
          paid_date?: string | null
          payee?: string | null
          payer?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_name?: string
          paid_date?: string | null
          payee?: string | null
          payer?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_schedules: {
        Row: {
          amount: number | null
          contract_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          invoice_id: string | null
          milestone_name: string
          milestone_order: number
          paid_at: string | null
          percentage: number
          status: string | null
          trigger_milestone: string | null
          trigger_type: string | null
        }
        Insert: {
          amount?: number | null
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          milestone_name: string
          milestone_order: number
          paid_at?: string | null
          percentage: number
          status?: string | null
          trigger_milestone?: string | null
          trigger_type?: string | null
        }
        Update: {
          amount?: number | null
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          milestone_name?: string
          milestone_order?: number
          paid_at?: string | null
          percentage?: number
          status?: string | null
          trigger_milestone?: string | null
          trigger_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          payment_method: string | null
          payment_type: string
          project_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          payment_type?: string
          project_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          payment_type?: string
          project_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_budget_categories: {
        Row: {
          awarded_amount: number | null
          budget_amount: number
          category: string
          created_at: string
          flagged: boolean | null
          id: string
          notes: string | null
          project_id: string
          updated_at: string
          variance: number | null
        }
        Insert: {
          awarded_amount?: number | null
          budget_amount?: number
          category: string
          created_at?: string
          flagged?: boolean | null
          id?: string
          notes?: string | null
          project_id: string
          updated_at?: string
          variance?: number | null
        }
        Update: {
          awarded_amount?: number | null
          budget_amount?: number
          category?: string
          created_at?: string
          flagged?: boolean | null
          id?: string
          notes?: string | null
          project_id?: string
          updated_at?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_budget_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_start_date_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pm_approved: boolean | null
          pm_approved_at: string | null
          pm_approved_by: string | null
          project_id: string
          proposed_at: string
          proposed_by: string
          proposed_start_date: string
          rejection_reason: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pm_approved?: boolean | null
          pm_approved_at?: string | null
          pm_approved_by?: string | null
          project_id: string
          proposed_at?: string
          proposed_by: string
          proposed_start_date: string
          rejection_reason?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pm_approved?: boolean | null
          pm_approved_at?: string | null
          pm_approved_by?: string | null
          project_id?: string
          proposed_at?: string
          proposed_by?: string
          proposed_start_date?: string
          rejection_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pc_start_date_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_form_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          municipality: string | null
          notes: string | null
          optional_form_codes: string[] | null
          required_form_codes: string[]
          scope_tags: string[]
          state: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          municipality?: string | null
          notes?: string | null
          optional_form_codes?: string[] | null
          required_form_codes: string[]
          scope_tags: string[]
          state: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          municipality?: string | null
          notes?: string | null
          optional_form_codes?: string[] | null
          required_form_codes?: string[]
          scope_tags?: string[]
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      permit_milestones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          milestone_date: string
          milestone_type: string
          permit_id: string
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_date: string
          milestone_type: string
          permit_id: string
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_date?: string
          milestone_type?: string
          permit_id?: string
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_milestones_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_required_forms: {
        Row: {
          authority: string
          auto_filled: boolean
          created_at: string
          document_file_path: string | null
          form_code: string
          form_name: string
          id: string
          is_required: boolean
          metadata: Json | null
          permit_id: string
          status: string
          updated_at: string
        }
        Insert: {
          authority: string
          auto_filled?: boolean
          created_at?: string
          document_file_path?: string | null
          form_code: string
          form_name: string
          id?: string
          is_required?: boolean
          metadata?: Json | null
          permit_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          authority?: string
          auto_filled?: boolean
          created_at?: string
          document_file_path?: string | null
          form_code?: string
          form_name?: string
          id?: string
          is_required?: boolean
          metadata?: Json | null
          permit_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_required_forms_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          actual_fee: number | null
          applied_at: string | null
          approved_at: string | null
          calculated_fee: number | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          estimated_approval_date: string | null
          fee_breakdown: Json | null
          fee_paid: boolean | null
          fee_paid_at: string | null
          id: string
          invoice_id: string | null
          jurisdiction_municipality: string
          jurisdiction_state: string
          last_notification_sent_at: string | null
          notes: string | null
          notification_count: number | null
          payment_method: string | null
          payment_reference: string | null
          permit_number: string | null
          project_id: string
          requires_permit: boolean
          status: string
          ucc_approved_at: string | null
          ucc_submitted_at: string | null
          updated_at: string
          zoning_approved_at: string | null
          zoning_submitted_at: string | null
        }
        Insert: {
          actual_fee?: number | null
          applied_at?: string | null
          approved_at?: string | null
          calculated_fee?: number | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_approval_date?: string | null
          fee_breakdown?: Json | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          id?: string
          invoice_id?: string | null
          jurisdiction_municipality: string
          jurisdiction_state: string
          last_notification_sent_at?: string | null
          notes?: string | null
          notification_count?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          permit_number?: string | null
          project_id: string
          requires_permit?: boolean
          status?: string
          ucc_approved_at?: string | null
          ucc_submitted_at?: string | null
          updated_at?: string
          zoning_approved_at?: string | null
          zoning_submitted_at?: string | null
        }
        Update: {
          actual_fee?: number | null
          applied_at?: string | null
          approved_at?: string | null
          calculated_fee?: number | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_approval_date?: string | null
          fee_breakdown?: Json | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          id?: string
          invoice_id?: string | null
          jurisdiction_municipality?: string
          jurisdiction_state?: string
          last_notification_sent_at?: string | null
          notes?: string | null
          notification_count?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          permit_number?: string | null
          project_id?: string
          requires_permit?: boolean
          status?: string
          ucc_approved_at?: string | null
          ucc_submitted_at?: string | null
          updated_at?: string
          zoning_approved_at?: string | null
          zoning_submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permits_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_cost_codes: {
        Row: {
          category: string
          cost_code: string
          created_at: string
          description: string
          estimated_duration_days: number | null
          id: string
          is_active: boolean
          labor_cost_high: number
          labor_cost_low: number
          material_cost_high: number
          material_cost_low: number
          schedule_phase: string | null
          subcategory: string | null
          trade: string
          trade_dependency: string | null
          unit_type: string
          updated_at: string
        }
        Insert: {
          category: string
          cost_code: string
          created_at?: string
          description: string
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean
          labor_cost_high?: number
          labor_cost_low?: number
          material_cost_high?: number
          material_cost_low?: number
          schedule_phase?: string | null
          subcategory?: string | null
          trade: string
          trade_dependency?: string | null
          unit_type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_code?: string
          created_at?: string
          description?: string
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean
          labor_cost_high?: number
          labor_cost_low?: number
          material_cost_high?: number
          material_cost_low?: number
          schedule_phase?: string | null
          subcategory?: string | null
          trade?: string
          trade_dependency?: string | null
          unit_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      po_receipts: {
        Row: {
          created_at: string
          discrepancies: string | null
          id: string
          is_complete: boolean
          items_received: Json
          notes: string | null
          po_id: string
          receipt_date: string
          received_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discrepancies?: string | null
          id?: string
          is_complete?: boolean
          items_received?: Json
          notes?: string | null
          po_id: string
          receipt_date?: string
          received_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discrepancies?: string | null
          id?: string
          is_complete?: boolean
          items_received?: Json
          notes?: string | null
          po_id?: string
          receipt_date?: string
          received_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_receipts_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_routing_logs: {
        Row: {
          boost_applied: boolean | null
          contractor_id: string | null
          created_at: string | null
          id: string
          priority_score: number | null
          project_id: string | null
          reasoning: string | null
        }
        Insert: {
          boost_applied?: boolean | null
          contractor_id?: string | null
          created_at?: string | null
          id?: string
          priority_score?: number | null
          project_id?: string | null
          reasoning?: string | null
        }
        Update: {
          boost_applied?: boolean | null
          contractor_id?: string | null
          created_at?: string | null
          id?: string
          priority_score?: number | null
          project_id?: string | null
          reasoning?: string | null
        }
        Relationships: []
      }
      pricing_adjustments: {
        Row: {
          ai_notes: string | null
          created_at: string | null
          estimate_id: string | null
          expected_gross_profit: number | null
          id: string
          pricing_adjustment: string | null
          project_type: string | null
          risk_level: string | null
          suggested_fee: number | null
          zip_code: string | null
        }
        Insert: {
          ai_notes?: string | null
          created_at?: string | null
          estimate_id?: string | null
          expected_gross_profit?: number | null
          id?: string
          pricing_adjustment?: string | null
          project_type?: string | null
          risk_level?: string | null
          suggested_fee?: number | null
          zip_code?: string | null
        }
        Update: {
          ai_notes?: string | null
          created_at?: string | null
          estimate_id?: string | null
          expected_gross_profit?: number | null
          id?: string
          pricing_adjustment?: string | null
          project_type?: string | null
          risk_level?: string | null
          suggested_fee?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      pricing_guide: {
        Row: {
          category: string
          created_at: string
          id: string
          item_name: string
          labor_cost: number
          material_cost: number
          notes: string | null
          region: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          item_name: string
          labor_cost?: number
          material_cost?: number
          notes?: string | null
          region?: string
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          item_name?: string
          labor_cost?: number
          material_cost?: number
          notes?: string | null
          region?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_templates: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          id: string
          project_type: string
          template_name: string
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          id?: string
          project_type: string
          template_name: string
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          id?: string
          project_type?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_claim_requests: {
        Row: {
          business_id: string
          company_name: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          relationship: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          website: string | null
        }
        Insert: {
          business_id: string
          company_name: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          relationship: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          website?: string | null
        }
        Update: {
          business_id?: string
          company_name?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          relationship?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_claim_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "imported_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          has_renovated_before: boolean | null
          homeowner_status: string | null
          id: string
          phone: string | null
          pinterest_board_url: string | null
          preferred_communication: string | null
          profile_completed: boolean
          project_timeline: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_renovated_before?: boolean | null
          homeowner_status?: string | null
          id: string
          phone?: string | null
          pinterest_board_url?: string | null
          preferred_communication?: string | null
          profile_completed?: boolean
          project_timeline?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_renovated_before?: boolean | null
          homeowner_status?: string | null
          id?: string
          phone?: string | null
          pinterest_board_url?: string | null
          preferred_communication?: string | null
          profile_completed?: boolean
          project_timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          performed_by: string | null
          project_id: string
          role: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          project_id: string
          role?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          project_id?: string
          role?: string | null
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          assigned_type: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          project_id: string | null
          role_on_project: string | null
          start_date: string | null
          status: string
          subcontractor_id: string | null
          team_member_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_type: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          role_on_project?: string | null
          start_date?: string | null
          status?: string
          subcontractor_id?: string | null
          team_member_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          role_on_project?: string | null
          start_date?: string | null
          status?: string
          subcontractor_id?: string | null
          team_member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      project_change_orders: {
        Row: {
          client_approved_at: string | null
          client_rejected_at: string | null
          client_viewed_at: string | null
          co_number: string | null
          created_at: string
          created_by: string
          days_delta: number | null
          description: string
          id: string
          notes_internal: string | null
          price_delta: number | null
          project_id: string
          reason: string | null
          status: string | null
          title: string
        }
        Insert: {
          client_approved_at?: string | null
          client_rejected_at?: string | null
          client_viewed_at?: string | null
          co_number?: string | null
          created_at?: string
          created_by: string
          days_delta?: number | null
          description: string
          id?: string
          notes_internal?: string | null
          price_delta?: number | null
          project_id: string
          reason?: string | null
          status?: string | null
          title: string
        }
        Update: {
          client_approved_at?: string | null
          client_rejected_at?: string | null
          client_viewed_at?: string | null
          co_number?: string | null
          created_at?: string
          created_by?: string
          days_delta?: number | null
          description?: string
          id?: string
          notes_internal?: string | null
          price_delta?: number | null
          project_id?: string
          reason?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_closeout_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          item_name: string
          item_type: string
          notes: string | null
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          item_name: string
          item_type: string
          notes?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          item_name?: string
          item_type?: string
          notes?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_closeout_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_daily_logs: {
        Row: {
          blockers: string | null
          created_at: string
          created_by: string
          crew_summary: string | null
          id: string
          inspections: string | null
          is_client_visible: boolean | null
          log_date: string
          materials_delivered: string | null
          next_steps: string | null
          project_id: string
          uploads: Json | null
          weather: string | null
          work_completed: string | null
        }
        Insert: {
          blockers?: string | null
          created_at?: string
          created_by: string
          crew_summary?: string | null
          id?: string
          inspections?: string | null
          is_client_visible?: boolean | null
          log_date: string
          materials_delivered?: string | null
          next_steps?: string | null
          project_id: string
          uploads?: Json | null
          weather?: string | null
          work_completed?: string | null
        }
        Update: {
          blockers?: string | null
          created_at?: string
          created_by?: string
          crew_summary?: string | null
          id?: string
          inspections?: string | null
          is_client_visible?: boolean | null
          log_date?: string
          materials_delivered?: string | null
          next_steps?: string | null
          project_id?: string
          uploads?: Json | null
          weather?: string | null
          work_completed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          contractor_id: string
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          project_id: string
          title: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          project_id: string
          title: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_financials: {
        Row: {
          approved_project_value: number | null
          contractor_bid_value: number | null
          created_at: string
          estimated_project_value: number | null
          id: string
          project_id: string
          remaining_balance: number | null
          smartreno_platform_fee: number | null
          total_change_orders: number | null
          total_paid: number | null
          updated_at: string
        }
        Insert: {
          approved_project_value?: number | null
          contractor_bid_value?: number | null
          created_at?: string
          estimated_project_value?: number | null
          id?: string
          project_id: string
          remaining_balance?: number | null
          smartreno_platform_fee?: number | null
          total_change_orders?: number | null
          total_paid?: number | null
          updated_at?: string
        }
        Update: {
          approved_project_value?: number | null
          contractor_bid_value?: number | null
          created_at?: string
          estimated_project_value?: number | null
          id?: string
          project_id?: string
          remaining_balance?: number | null
          smartreno_platform_fee?: number | null
          total_change_orders?: number | null
          total_paid?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      project_inspections: {
        Row: {
          created_at: string
          created_by: string
          id: string
          inspection_type: string
          inspector_name: string | null
          jurisdiction: string | null
          notes: string | null
          project_id: string
          required_follow_up: string | null
          result: string | null
          result_date: string | null
          scheduled_date: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          inspection_type: string
          inspector_name?: string | null
          jurisdiction?: string | null
          notes?: string | null
          project_id: string
          required_follow_up?: string | null
          result?: string | null
          result_date?: string | null
          scheduled_date?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          inspection_type?: string
          inspector_name?: string | null
          jurisdiction?: string | null
          notes?: string | null
          project_id?: string
          required_follow_up?: string | null
          result?: string | null
          result_date?: string | null
          scheduled_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_issues: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          owner_id: string | null
          project_id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          target_resolution_date: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          owner_id?: string | null
          project_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          target_resolution_date?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          owner_id?: string | null
          project_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          target_resolution_date?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          actual_delivery: string | null
          category: string
          created_at: string | null
          description: string | null
          expected_delivery: string | null
          id: string
          item_name: string
          notes: string | null
          order_date: string | null
          project_id: string
          quantity: number | null
          status: string
          unit: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          actual_delivery?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          expected_delivery?: string | null
          id?: string
          item_name: string
          notes?: string | null
          order_date?: string | null
          project_id: string
          quantity?: number | null
          status?: string
          unit?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          actual_delivery?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          expected_delivery?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          order_date?: string | null
          project_id?: string
          quantity?: number | null
          status?: string
          unit?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_meetings: {
        Row: {
          attendees: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          meeting_title: string
          meeting_type: string
          notes: string | null
          project_id: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          updated_at: string | null
        }
        Insert: {
          attendees?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_title: string
          meeting_type: string
          notes?: string | null
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          updated_at?: string | null
        }
        Update: {
          attendees?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_title?: string
          meeting_type?: string
          notes?: string | null
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          read_by: Json | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id: string
          read_by?: Json | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          read_by?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          milestone_date: string
          milestone_name: string
          milestone_type: string
          project_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          milestone_date: string
          milestone_name: string
          milestone_type?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          milestone_date?: string
          milestone_name?: string
          milestone_type?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notifications: {
        Row: {
          acknowledged_at: string | null
          contractor_id: string
          created_at: string
          due_date: string | null
          id: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          project_id: string
          recipient_email: string | null
          recipient_name: string | null
          related_milestone_id: string | null
          related_task_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          contractor_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          project_id: string
          recipient_email?: string | null
          recipient_name?: string | null
          related_milestone_id?: string | null
          related_task_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          contractor_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          project_id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          related_milestone_id?: string | null
          related_task_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_permits: {
        Row: {
          application_date: string | null
          approval_date: string | null
          created_at: string | null
          description: string | null
          expiration_date: string | null
          fees: number | null
          id: string
          inspector_contact: string | null
          inspector_name: string | null
          municipality: string
          notes: string | null
          permit_number: string | null
          permit_type: string
          project_id: string
          status: string
          submission_date: string | null
          updated_at: string | null
        }
        Insert: {
          application_date?: string | null
          approval_date?: string | null
          created_at?: string | null
          description?: string | null
          expiration_date?: string | null
          fees?: number | null
          id?: string
          inspector_contact?: string | null
          inspector_name?: string | null
          municipality: string
          notes?: string | null
          permit_number?: string | null
          permit_type: string
          project_id: string
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Update: {
          application_date?: string | null
          approval_date?: string | null
          created_at?: string | null
          description?: string | null
          expiration_date?: string | null
          fees?: number | null
          id?: string
          inspector_contact?: string | null
          inspector_name?: string | null
          municipality?: string
          notes?: string | null
          permit_number?: string | null
          permit_type?: string
          project_id?: string
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedule: {
        Row: {
          cost_code: string | null
          created_at: string
          dependency: string | null
          duration_days: number
          end_date: string | null
          id: string
          notes: string | null
          phase: string
          project_id: string
          start_date: string | null
          status: string
          trade: string
          updated_at: string
        }
        Insert: {
          cost_code?: string | null
          created_at?: string
          dependency?: string | null
          duration_days?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          phase: string
          project_id: string
          start_date?: string | null
          status?: string
          trade: string
          updated_at?: string
        }
        Update: {
          cost_code?: string | null
          created_at?: string
          dependency?: string | null
          duration_days?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          phase?: string
          project_id?: string
          start_date?: string | null
          status?: string
          trade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_schedule_dependency_fkey"
            columns: ["dependency"]
            isOneToOne: false
            referencedRelation: "project_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedule_locks: {
        Row: {
          created_at: string | null
          estimated_duration_weeks: number
          id: string
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          prerequisites: Json | null
          project_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_duration_weeks: number
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          prerequisites?: Json | null
          project_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_duration_weeks?: number
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          prerequisites?: Json | null
          project_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_schedule_locks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_schedule_locks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedules: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          project_id: string | null
          project_name: string
          shared_with_homeowners: string[] | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          project_name: string
          shared_with_homeowners?: string[] | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          project_name?: string
          shared_with_homeowners?: string[] | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          color: string
          completed: boolean
          created_at: string
          end_date: string
          id: string
          order_index: number
          progress: number
          project_id: string
          start_date: string
          status: string
          task_name: string
          updated_at: string
        }
        Insert: {
          color?: string
          completed?: boolean
          created_at?: string
          end_date: string
          id?: string
          order_index?: number
          progress?: number
          project_id: string
          start_date: string
          status?: string
          task_name: string
          updated_at?: string
        }
        Update: {
          color?: string
          completed?: boolean
          created_at?: string
          end_date?: string
          id?: string
          order_index?: number
          progress?: number
          project_id?: string
          start_date?: string
          status?: string
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget_finalized_at: string | null
          budget_range: string | null
          build_ready_at: string | null
          change_order_count: number | null
          city: string | null
          contract_signed_at: string | null
          coordinator_id: string | null
          coordinator_status: string | null
          created_at: string
          deposit_received_at: string | null
          description: string | null
          design_needed: string | null
          estimated_budget: number | null
          final_invoice_sent: boolean | null
          final_invoice_sent_at: string | null
          final_payment_collected: boolean | null
          final_payment_collected_at: string | null
          final_plans_complete_at: string | null
          final_scope_approved_at: string | null
          finance_readonly: boolean | null
          financing_needed: string | null
          homeowner_id: string | null
          id: string
          inspection_status: string | null
          last_pm_activity_at: string | null
          last_update_at: string | null
          lead_id: string | null
          material_help: string | null
          materials_ordered_at: string | null
          materials_status: string | null
          name: string
          next_action: string | null
          pc_assigned_at: string | null
          pc_readonly: boolean | null
          percent_complete: number | null
          permit_expectation: string | null
          permit_prepared_at: string | null
          permit_status: string | null
          photos: Json | null
          pm_approved_start_at: string | null
          pm_status: string | null
          project_manager_id: string | null
          project_size: string | null
          project_type: string
          property_data: Json | null
          risk_level: string | null
          square_footage: number | null
          start_date: string | null
          status: string
          subs_awarded_at: string | null
          subs_status: string | null
          target_completion_date: string | null
          target_start_date: string | null
          timeline_weeks: number | null
          updated_at: string
          user_id: string
          warranty_issued: boolean | null
          warranty_issued_at: string | null
          zip_code: string | null
          zoning_prepared_at: string | null
          scheduled_visit_at: string | null
          visit_confirmed: boolean | null
        }
        Insert: {
          address?: string | null
          budget_finalized_at?: string | null
          budget_range?: string | null
          build_ready_at?: string | null
          change_order_count?: number | null
          city?: string | null
          contract_signed_at?: string | null
          coordinator_id?: string | null
          coordinator_status?: string | null
          created_at?: string
          deposit_received_at?: string | null
          description?: string | null
          design_needed?: string | null
          estimated_budget?: number | null
          final_invoice_sent?: boolean | null
          final_invoice_sent_at?: string | null
          final_payment_collected?: boolean | null
          final_payment_collected_at?: string | null
          final_plans_complete_at?: string | null
          final_scope_approved_at?: string | null
          finance_readonly?: boolean | null
          financing_needed?: string | null
          homeowner_id?: string | null
          id?: string
          inspection_status?: string | null
          last_pm_activity_at?: string | null
          last_update_at?: string | null
          lead_id?: string | null
          material_help?: string | null
          materials_ordered_at?: string | null
          materials_status?: string | null
          name: string
          next_action?: string | null
          pc_assigned_at?: string | null
          pc_readonly?: boolean | null
          percent_complete?: number | null
          permit_expectation?: string | null
          permit_prepared_at?: string | null
          permit_status?: string | null
          photos?: Json | null
          pm_approved_start_at?: string | null
          pm_status?: string | null
          project_manager_id?: string | null
          project_size?: string | null
          project_type: string
          property_data?: Json | null
          risk_level?: string | null
          square_footage?: number | null
          start_date?: string | null
          status?: string
          subs_awarded_at?: string | null
          subs_status?: string | null
          target_completion_date?: string | null
          target_start_date?: string | null
          timeline_weeks?: number | null
          updated_at?: string
          user_id: string
          warranty_issued?: boolean | null
          warranty_issued_at?: string | null
          zip_code?: string | null
          zoning_prepared_at?: string | null
          scheduled_visit_at?: string | null
          visit_confirmed?: boolean | null
        }
        Update: {
          address?: string | null
          budget_finalized_at?: string | null
          budget_range?: string | null
          build_ready_at?: string | null
          change_order_count?: number | null
          city?: string | null
          contract_signed_at?: string | null
          coordinator_id?: string | null
          coordinator_status?: string | null
          created_at?: string
          deposit_received_at?: string | null
          description?: string | null
          design_needed?: string | null
          estimated_budget?: number | null
          final_invoice_sent?: boolean | null
          final_invoice_sent_at?: string | null
          final_payment_collected?: boolean | null
          final_payment_collected_at?: string | null
          final_plans_complete_at?: string | null
          final_scope_approved_at?: string | null
          finance_readonly?: boolean | null
          financing_needed?: string | null
          homeowner_id?: string | null
          id?: string
          inspection_status?: string | null
          last_pm_activity_at?: string | null
          last_update_at?: string | null
          lead_id?: string | null
          material_help?: string | null
          materials_ordered_at?: string | null
          materials_status?: string | null
          name?: string
          next_action?: string | null
          pc_assigned_at?: string | null
          pc_readonly?: boolean | null
          percent_complete?: number | null
          permit_expectation?: string | null
          permit_prepared_at?: string | null
          permit_status?: string | null
          photos?: Json | null
          pm_approved_start_at?: string | null
          pm_status?: string | null
          project_manager_id?: string | null
          project_size?: string | null
          project_type?: string
          property_data?: Json | null
          risk_level?: string | null
          square_footage?: number | null
          start_date?: string | null
          status?: string
          subs_awarded_at?: string | null
          subs_status?: string | null
          target_completion_date?: string | null
          target_start_date?: string | null
          timeline_weeks?: number | null
          updated_at?: string
          user_id?: string
          warranty_issued?: boolean | null
          warranty_issued_at?: string | null
          zip_code?: string | null
          zoning_prepared_at?: string | null
          scheduled_visit_at?: string | null
          visit_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      property_enrichment_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          home_profile_id: string
          id: string
          mapped_fields: Json | null
          provider_name: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          home_profile_id: string
          id?: string
          mapped_fields?: Json | null
          provider_name: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          home_profile_id?: string
          id?: string
          mapped_fields?: Json | null
          provider_name?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_enrichment_runs_home_profile_id_fkey"
            columns: ["home_profile_id"]
            isOneToOne: false
            referencedRelation: "home_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_profiles: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          id: string
          last_sale_price: number | null
          lead_id: string | null
          lot_size: string | null
          project_id: string | null
          property_type: string | null
          square_feet: number | null
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          last_sale_price?: number | null
          lead_id?: string | null
          lot_size?: string | null
          project_id?: string | null
          property_type?: string | null
          square_feet?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          last_sale_price?: number | null
          lead_id?: string | null
          lot_size?: string | null
          project_id?: string | null
          property_type?: string | null
          square_feet?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Relationships: []
      }
      property_reports: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          converted_to_project_id: string | null
          created_at: string | null
          estimated_cost_high: number | null
          estimated_cost_low: number | null
          id: string
          lot_size: number | null
          property_data: Json | null
          selected_scopes: string[] | null
          square_feet: number | null
          state: string | null
          user_id: string | null
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          id?: string
          lot_size?: number | null
          property_data?: Json | null
          selected_scopes?: string[] | null
          square_feet?: number | null
          state?: string | null
          user_id?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          id?: string
          lot_size?: number | null
          property_data?: Json | null
          selected_scopes?: string[] | null
          square_feet?: number | null
          state?: string | null
          user_id?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      proplus_insights: {
        Row: {
          average_bid_position: number | null
          contractor_id: string
          created_at: string | null
          id: string
          improvement_areas: Json | null
          market_trends: Json | null
          recommended_project_types: Json | null
          summary: string | null
          updated_at: string | null
          win_rate: number | null
        }
        Insert: {
          average_bid_position?: number | null
          contractor_id: string
          created_at?: string | null
          id?: string
          improvement_areas?: Json | null
          market_trends?: Json | null
          recommended_project_types?: Json | null
          summary?: string | null
          updated_at?: string | null
          win_rate?: number | null
        }
        Update: {
          average_bid_position?: number | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          improvement_areas?: Json | null
          market_trends?: Json | null
          recommended_project_types?: Json | null
          summary?: string | null
          updated_at?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
      proposal_versions: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          line_items: Json | null
          notes: string | null
          proposal_id: string
          revision_reason: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          line_items?: Json | null
          notes?: string | null
          proposal_id: string
          revision_reason?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          line_items?: Json | null
          notes?: string | null
          proposal_id?: string
          revision_reason?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          amount: number | null
          created_at: string | null
          current_version: number | null
          decision_at: string | null
          estimator_id: string
          id: string
          lead_id: string
          sent_at: string | null
          status: string | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          current_version?: number | null
          decision_at?: string | null
          estimator_id: string
          id?: string
          lead_id: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          current_version?: number | null
          decision_at?: string | null
          estimator_id?: string
          id?: string
          lead_id?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          expected_delivery: string
          id: string
          line_items: Json
          notes: string | null
          order_date: string
          po_number: string
          project_id: string | null
          shipping_address: string
          shipping_cost: number
          status: string
          subtotal: number
          tax: number
          terms: string | null
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          actual_delivery?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          expected_delivery: string
          id?: string
          line_items?: Json
          notes?: string | null
          order_date?: string
          po_number: string
          project_id?: string | null
          shipping_address: string
          shipping_cost?: number
          status?: string
          subtotal?: number
          tax?: number
          terms?: string | null
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          actual_delivery?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          expected_delivery?: string
          id?: string
          line_items?: Json
          notes?: string | null
          order_date?: string
          po_number?: string
          project_id?: string | null
          shipping_address?: string
          shipping_cost?: number
          status?: string
          subtotal?: number
          tax?: number
          terms?: string | null
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_sync_history: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          realm_id: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          realm_id: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      regional_cost_index: {
        Row: {
          city: string | null
          county: string | null
          created_at: string | null
          disposal_fee_multiplier: number | null
          id: string
          labor_multiplier: number | null
          last_updated: string | null
          material_multiplier: number | null
          permit_fee_multiplier: number | null
          seasonal_factors: Json | null
          state: string
        }
        Insert: {
          city?: string | null
          county?: string | null
          created_at?: string | null
          disposal_fee_multiplier?: number | null
          id?: string
          labor_multiplier?: number | null
          last_updated?: string | null
          material_multiplier?: number | null
          permit_fee_multiplier?: number | null
          seasonal_factors?: Json | null
          state: string
        }
        Update: {
          city?: string | null
          county?: string | null
          created_at?: string | null
          disposal_fee_multiplier?: number | null
          id?: string
          labor_multiplier?: number | null
          last_updated?: string | null
          material_multiplier?: number | null
          permit_fee_multiplier?: number | null
          seasonal_factors?: Json | null
          state?: string
        }
        Relationships: []
      }
      regional_financing_options: {
        Row: {
          county: string | null
          created_at: string | null
          eligibility_requirements: string[] | null
          energy_rebates: string[] | null
          financing_type: string
          id: string
          interest_rate_range: string | null
          is_active: boolean | null
          last_updated: string | null
          max_amount: number | null
          min_amount: number | null
          program_details: Json | null
          provider_name: string | null
          state: string
          state_incentives: string[] | null
        }
        Insert: {
          county?: string | null
          created_at?: string | null
          eligibility_requirements?: string[] | null
          energy_rebates?: string[] | null
          financing_type: string
          id?: string
          interest_rate_range?: string | null
          is_active?: boolean | null
          last_updated?: string | null
          max_amount?: number | null
          min_amount?: number | null
          program_details?: Json | null
          provider_name?: string | null
          state: string
          state_incentives?: string[] | null
        }
        Update: {
          county?: string | null
          created_at?: string | null
          eligibility_requirements?: string[] | null
          energy_rebates?: string[] | null
          financing_type?: string
          id?: string
          interest_rate_range?: string | null
          is_active?: boolean | null
          last_updated?: string | null
          max_amount?: number | null
          min_amount?: number | null
          program_details?: Json | null
          provider_name?: string | null
          state?: string
          state_incentives?: string[] | null
        }
        Relationships: []
      }
      regional_labor_rates: {
        Row: {
          county: string | null
          created_at: string | null
          demand_level: string | null
          hourly_rate: number | null
          id: string
          last_updated: string | null
          prevailing_wage: number | null
          seasonality: Json | null
          state: string
          trade: string
          union_rate: number | null
        }
        Insert: {
          county?: string | null
          created_at?: string | null
          demand_level?: string | null
          hourly_rate?: number | null
          id?: string
          last_updated?: string | null
          prevailing_wage?: number | null
          seasonality?: Json | null
          state: string
          trade: string
          union_rate?: number | null
        }
        Update: {
          county?: string | null
          created_at?: string | null
          demand_level?: string | null
          hourly_rate?: number | null
          id?: string
          last_updated?: string | null
          prevailing_wage?: number | null
          seasonality?: Json | null
          state?: string
          trade?: string
          union_rate?: number | null
        }
        Relationships: []
      }
      regional_permit_rules: {
        Row: {
          climate_zone: string | null
          county: string | null
          created_at: string | null
          fee_structure: Json | null
          fire_code_version: string | null
          id: string
          last_updated: string | null
          municipality: string | null
          processing_time_days: number | null
          project_type: string
          required_permits: string[] | null
          seismic_zone: string | null
          snow_load_requirements: string | null
          special_requirements: string[] | null
          state: string
          submission_format: string | null
          wind_zone: string | null
        }
        Insert: {
          climate_zone?: string | null
          county?: string | null
          created_at?: string | null
          fee_structure?: Json | null
          fire_code_version?: string | null
          id?: string
          last_updated?: string | null
          municipality?: string | null
          processing_time_days?: number | null
          project_type: string
          required_permits?: string[] | null
          seismic_zone?: string | null
          snow_load_requirements?: string | null
          special_requirements?: string[] | null
          state: string
          submission_format?: string | null
          wind_zone?: string | null
        }
        Update: {
          climate_zone?: string | null
          county?: string | null
          created_at?: string | null
          fee_structure?: Json | null
          fire_code_version?: string | null
          id?: string
          last_updated?: string | null
          municipality?: string | null
          processing_time_days?: number | null
          project_type?: string
          required_permits?: string[] | null
          seismic_zone?: string | null
          snow_load_requirements?: string | null
          special_requirements?: string[] | null
          state?: string
          submission_format?: string | null
          wind_zone?: string | null
        }
        Relationships: []
      }
      retargeting_audiences: {
        Row: {
          audience_name: string
          audience_type: string
          created_at: string | null
          criteria: Json
          description: string | null
          estimated_size: number | null
          fb_audience_id: string | null
          google_audience_id: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          tiktok_audience_id: string | null
          updated_at: string | null
        }
        Insert: {
          audience_name: string
          audience_type: string
          created_at?: string | null
          criteria: Json
          description?: string | null
          estimated_size?: number | null
          fb_audience_id?: string | null
          google_audience_id?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          tiktok_audience_id?: string | null
          updated_at?: string | null
        }
        Update: {
          audience_name?: string
          audience_type?: string
          created_at?: string | null
          criteria?: Json
          description?: string | null
          estimated_size?: number | null
          fb_audience_id?: string | null
          google_audience_id?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          tiktok_audience_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rfp_auto_sends: {
        Row: {
          contractor_id: string
          created_at: string | null
          follow_up_count: number | null
          follow_up_scheduled: boolean | null
          id: string
          next_follow_up: string | null
          personalized_message: string | null
          project_id: string
          response_received: boolean | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          follow_up_count?: number | null
          follow_up_scheduled?: boolean | null
          id?: string
          next_follow_up?: string | null
          personalized_message?: string | null
          project_id: string
          response_received?: boolean | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          follow_up_count?: number | null
          follow_up_scheduled?: boolean | null
          id?: string
          next_follow_up?: string | null
          personalized_message?: string | null
          project_id?: string
          response_received?: boolean | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rfp_scope_items: {
        Row: {
          bid_opportunity_id: string
          created_at: string | null
          description: string
          estimated_unit_price: number
          id: string
          quantity: number
          sort_order: number
          unit: string
        }
        Insert: {
          bid_opportunity_id: string
          created_at?: string | null
          description: string
          estimated_unit_price?: number
          id?: string
          quantity?: number
          sort_order?: number
          unit?: string
        }
        Update: {
          bid_opportunity_id?: string
          created_at?: string | null
          description?: string
          estimated_unit_price?: number
          id?: string
          quantity?: number
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfp_scope_items_bid_opportunity_id_fkey"
            columns: ["bid_opportunity_id"]
            isOneToOne: false
            referencedRelation: "bid_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_scores: {
        Row: {
          alert_level: string
          created_at: string
          id: string
          project_id: string | null
          recommended_actions: Json
          risk_factors: Json
          risk_score: number
          updated_at: string
        }
        Insert: {
          alert_level: string
          created_at?: string
          id?: string
          project_id?: string | null
          recommended_actions?: Json
          risk_factors?: Json
          risk_score: number
          updated_at?: string
        }
        Update: {
          alert_level?: string
          created_at?: string
          id?: string
          project_id?: string | null
          recommended_actions?: Json
          risk_factors?: Json
          risk_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          resource_id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          resource_id: string
          task_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          resource_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "schedule_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "schedule_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          id: string
          lag_days: number | null
          predecessor_task_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          id?: string
          lag_days?: number | null
          predecessor_task_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          id?: string
          lag_days?: number | null
          predecessor_task_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_dependencies_predecessor_task_id_fkey"
            columns: ["predecessor_task_id"]
            isOneToOne: false
            referencedRelation: "schedule_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "schedule_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_phases: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          schedule_id: string
          sort_order: number | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          schedule_id: string
          sort_order?: number | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          schedule_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_phases_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "project_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_resources: {
        Row: {
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          phone?: string | null
          role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      schedule_tasks: {
        Row: {
          color: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          name: string
          phase_id: string | null
          schedule_id: string
          sort_order: number | null
          start_date: string
          status: string
          updated_at: string
          workdays: number
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          phase_id?: string | null
          schedule_id: string
          sort_order?: number | null
          start_date: string
          status?: string
          updated_at?: string
          workdays?: number
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          phase_id?: string | null
          schedule_id?: string
          sort_order?: number | null
          start_date?: string
          status?: string
          updated_at?: string
          workdays?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "schedule_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_tasks_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "project_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_template_phases: {
        Row: {
          color: string
          created_at: string | null
          duration_days: number | null
          id: string
          name: string
          sort_order: number
          template_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          duration_days?: number | null
          id?: string
          name: string
          sort_order?: number
          template_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          duration_days?: number | null
          id?: string
          name?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_template_phases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_template_tasks: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          duration_days: number
          id: string
          name: string
          sort_order: number
          template_phase_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          duration_days: number
          id?: string
          name: string
          sort_order?: number
          template_phase_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          name?: string
          sort_order?: number
          template_phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_template_tasks_template_phase_id_fkey"
            columns: ["template_phase_id"]
            isOneToOne: false
            referencedRelation: "schedule_template_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration_days: number | null
          id: string
          name: string
          project_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          name: string
          project_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          name?: string
          project_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scope_items: {
        Row: {
          cost_code: string
          created_at: string
          created_by: string | null
          description: string
          estimated_duration_days: number | null
          id: string
          is_ai_generated: boolean | null
          labor_cost_high: number | null
          labor_cost_low: number | null
          material_cost_high: number | null
          material_cost_low: number | null
          notes: string | null
          platform_cost_code_id: string | null
          project_id: string
          quantity: number
          schedule_phase: string | null
          total_estimated_cost: number | null
          trade: string
          unit: string
          updated_at: string
        }
        Insert: {
          cost_code: string
          created_at?: string
          created_by?: string | null
          description: string
          estimated_duration_days?: number | null
          id?: string
          is_ai_generated?: boolean | null
          labor_cost_high?: number | null
          labor_cost_low?: number | null
          material_cost_high?: number | null
          material_cost_low?: number | null
          notes?: string | null
          platform_cost_code_id?: string | null
          project_id: string
          quantity?: number
          schedule_phase?: string | null
          total_estimated_cost?: number | null
          trade: string
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_code?: string
          created_at?: string
          created_by?: string | null
          description?: string
          estimated_duration_days?: number | null
          id?: string
          is_ai_generated?: boolean | null
          labor_cost_high?: number | null
          labor_cost_low?: number | null
          material_cost_high?: number | null
          material_cost_low?: number | null
          notes?: string | null
          platform_cost_code_id?: string | null
          project_id?: string
          quantity?: number
          schedule_phase?: string | null
          total_estimated_cost?: number | null
          trade?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_items_platform_cost_code_id_fkey"
            columns: ["platform_cost_code_id"]
            isOneToOne: false
            referencedRelation: "platform_cost_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          call_type: string
          contractor_client_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          script_json: Json
          script_name: string
          updated_at: string | null
        }
        Insert: {
          call_type: string
          contractor_client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          script_json?: Json
          script_name: string
          updated_at?: string | null
        }
        Update: {
          call_type?: string
          contractor_client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          script_json?: Json
          script_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scripts_contractor_client_id_fkey"
            columns: ["contractor_client_id"]
            isOneToOne: false
            referencedRelation: "contractor_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_content_updates: {
        Row: {
          after_ranking: number | null
          after_traffic: number | null
          ai_confidence_score: number | null
          applied_at: string | null
          before_ranking: number | null
          before_traffic: number | null
          changes_made: Json | null
          created_at: string | null
          id: string
          last_refresh: string | null
          page_path: string
          page_type: string | null
          rollback_reason: string | null
          rolled_back_at: string | null
          seo_impact_score: number | null
          status: string | null
          target_location: string | null
          target_project: string | null
          update_summary: string | null
          update_type: string | null
        }
        Insert: {
          after_ranking?: number | null
          after_traffic?: number | null
          ai_confidence_score?: number | null
          applied_at?: string | null
          before_ranking?: number | null
          before_traffic?: number | null
          changes_made?: Json | null
          created_at?: string | null
          id?: string
          last_refresh?: string | null
          page_path: string
          page_type?: string | null
          rollback_reason?: string | null
          rolled_back_at?: string | null
          seo_impact_score?: number | null
          status?: string | null
          target_location?: string | null
          target_project?: string | null
          update_summary?: string | null
          update_type?: string | null
        }
        Update: {
          after_ranking?: number | null
          after_traffic?: number | null
          ai_confidence_score?: number | null
          applied_at?: string | null
          before_ranking?: number | null
          before_traffic?: number | null
          changes_made?: Json | null
          created_at?: string | null
          id?: string
          last_refresh?: string | null
          page_path?: string
          page_type?: string | null
          rollback_reason?: string | null
          rolled_back_at?: string | null
          seo_impact_score?: number | null
          status?: string | null
          target_location?: string | null
          target_project?: string | null
          update_summary?: string | null
          update_type?: string | null
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          ai_generated: boolean | null
          content: Json | null
          county: string | null
          created_at: string | null
          hero_description: string | null
          hero_title: string | null
          id: string
          internal_links: Json | null
          last_ai_refresh: string | null
          last_updated: string | null
          meta_description: string | null
          monthly_conversions: number | null
          monthly_views: number | null
          needs_refresh: boolean | null
          page_type: string
          project_type: string | null
          published: boolean | null
          published_at: string | null
          slug: string
          state: string | null
          target_keywords: string[] | null
          title: string
          town: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content?: Json | null
          county?: string | null
          created_at?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          internal_links?: Json | null
          last_ai_refresh?: string | null
          last_updated?: string | null
          meta_description?: string | null
          monthly_conversions?: number | null
          monthly_views?: number | null
          needs_refresh?: boolean | null
          page_type: string
          project_type?: string | null
          published?: boolean | null
          published_at?: string | null
          slug: string
          state?: string | null
          target_keywords?: string[] | null
          title: string
          town?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: Json | null
          county?: string | null
          created_at?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          internal_links?: Json | null
          last_ai_refresh?: string | null
          last_updated?: string | null
          meta_description?: string | null
          monthly_conversions?: number | null
          monthly_views?: number | null
          needs_refresh?: boolean | null
          page_type?: string
          project_type?: string | null
          published?: boolean | null
          published_at?: string | null
          slug?: string
          state?: string | null
          target_keywords?: string[] | null
          title?: string
          town?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          access_notes: string | null
          add_ons: Json | null
          city: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          payment_status: string | null
          preferred_date: string | null
          preferred_time_slot: string | null
          service_address: string
          service_options: Json | null
          service_type: string
          smartreno_homeowner_id: string | null
          smartreno_job_id: string | null
          smartreno_payment_url: string | null
          source: string | null
          state: string | null
          status: string | null
          total_price: number
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          access_notes?: string | null
          add_ons?: Json | null
          city?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          payment_status?: string | null
          preferred_date?: string | null
          preferred_time_slot?: string | null
          service_address: string
          service_options?: Json | null
          service_type: string
          smartreno_homeowner_id?: string | null
          smartreno_job_id?: string | null
          smartreno_payment_url?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          total_price: number
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          access_notes?: string | null
          add_ons?: Json | null
          city?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          payment_status?: string | null
          preferred_date?: string | null
          preferred_time_slot?: string | null
          service_address?: string
          service_options?: Json | null
          service_type?: string
          smartreno_homeowner_id?: string | null
          smartreno_job_id?: string | null
          smartreno_payment_url?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          total_price?: number
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      service_waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          notify_on_launch: boolean | null
          phone: string | null
          service_interest: string | null
          source: string | null
          zip_code: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          notify_on_launch?: boolean | null
          phone?: string | null
          service_interest?: string | null
          source?: string | null
          zip_code?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          notify_on_launch?: boolean | null
          phone?: string | null
          service_interest?: string | null
          source?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      site_visit_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          homeowner_id: string
          id: string
          notes: string | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          homeowner_id: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          homeowner_id?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visit_appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_estimate_activity_log: {
        Row: {
          action_details: Json | null
          action_type: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          smart_estimate_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          smart_estimate_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          smart_estimate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_estimate_activity_log_smart_estimate_id_fkey"
            columns: ["smart_estimate_id"]
            isOneToOne: false
            referencedRelation: "smart_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_estimate_files: {
        Row: {
          created_at: string
          file_category: string | null
          file_name: string | null
          file_url: string
          id: string
          smart_estimate_id: string
          uploaded_by: string | null
          visible_to_roles: string[] | null
        }
        Insert: {
          created_at?: string
          file_category?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          smart_estimate_id: string
          uploaded_by?: string | null
          visible_to_roles?: string[] | null
        }
        Update: {
          created_at?: string
          file_category?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          smart_estimate_id?: string
          uploaded_by?: string | null
          visible_to_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_estimate_files_smart_estimate_id_fkey"
            columns: ["smart_estimate_id"]
            isOneToOne: false
            referencedRelation: "smart_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_estimate_rooms: {
        Row: {
          ceiling_height: number | null
          created_at: string
          dimensions: Json | null
          floor_level: string | null
          id: string
          notes: string | null
          photos: Json | null
          room_name: string
          room_type: string | null
          smart_estimate_id: string
          sort_order: number | null
          square_footage: number | null
          updated_at: string
        }
        Insert: {
          ceiling_height?: number | null
          created_at?: string
          dimensions?: Json | null
          floor_level?: string | null
          id?: string
          notes?: string | null
          photos?: Json | null
          room_name: string
          room_type?: string | null
          smart_estimate_id: string
          sort_order?: number | null
          square_footage?: number | null
          updated_at?: string
        }
        Update: {
          ceiling_height?: number | null
          created_at?: string
          dimensions?: Json | null
          floor_level?: string | null
          id?: string
          notes?: string | null
          photos?: Json | null
          room_name?: string
          room_type?: string | null
          smart_estimate_id?: string
          sort_order?: number | null
          square_footage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_estimate_rooms_smart_estimate_id_fkey"
            columns: ["smart_estimate_id"]
            isOneToOne: false
            referencedRelation: "smart_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_estimate_sections: {
        Row: {
          ai_generated: boolean | null
          completion_percent: number | null
          created_at: string
          id: string
          is_complete: boolean | null
          last_edited_by: string | null
          section_data: Json | null
          section_key: string
          smart_estimate_id: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          completion_percent?: number | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          last_edited_by?: string | null
          section_data?: Json | null
          section_key: string
          smart_estimate_id: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          completion_percent?: number | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          last_edited_by?: string | null
          section_data?: Json | null
          section_key?: string
          smart_estimate_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_estimate_sections_smart_estimate_id_fkey"
            columns: ["smart_estimate_id"]
            isOneToOne: false
            referencedRelation: "smart_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_estimate_trade_items: {
        Row: {
          allowance_value: number | null
          created_at: string
          id: string
          labor_complexity: string | null
          line_item_name: string
          material_complexity: string | null
          notes: string | null
          pricing_confidence: string | null
          quantity: number | null
          room_id: string | null
          scope_description: string | null
          smart_estimate_id: string
          sort_order: number | null
          trade_category: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          allowance_value?: number | null
          created_at?: string
          id?: string
          labor_complexity?: string | null
          line_item_name: string
          material_complexity?: string | null
          notes?: string | null
          pricing_confidence?: string | null
          quantity?: number | null
          room_id?: string | null
          scope_description?: string | null
          smart_estimate_id: string
          sort_order?: number | null
          trade_category: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          allowance_value?: number | null
          created_at?: string
          id?: string
          labor_complexity?: string | null
          line_item_name?: string
          material_complexity?: string | null
          notes?: string | null
          pricing_confidence?: string | null
          quantity?: number | null
          room_id?: string | null
          scope_description?: string | null
          smart_estimate_id?: string
          sort_order?: number | null
          trade_category?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_estimate_trade_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "smart_estimate_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_estimate_trade_items_smart_estimate_id_fkey"
            columns: ["smart_estimate_id"]
            isOneToOne: false
            referencedRelation: "smart_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_estimates: {
        Row: {
          ai_budget_guidance: string | null
          ai_missing_info_summary: string | null
          ai_scope_summary: string | null
          assigned_estimator_id: string | null
          created_at: string
          estimate_completion_percent: number | null
          estimate_confidence_score: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          internal_notes: string | null
          lead_id: string | null
          project_id: string | null
          review_notes: string | null
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          ai_budget_guidance?: string | null
          ai_missing_info_summary?: string | null
          ai_scope_summary?: string | null
          assigned_estimator_id?: string | null
          created_at?: string
          estimate_completion_percent?: number | null
          estimate_confidence_score?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          internal_notes?: string | null
          lead_id?: string | null
          project_id?: string | null
          review_notes?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          ai_budget_guidance?: string | null
          ai_missing_info_summary?: string | null
          ai_scope_summary?: string | null
          assigned_estimator_id?: string | null
          created_at?: string
          estimate_completion_percent?: number | null
          estimate_confidence_score?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          internal_notes?: string | null
          lead_id?: string | null
          project_id?: string | null
          review_notes?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_estimates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "estimate_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      smartplan_items: {
        Row: {
          assigned_to_user_id: string | null
          content: string
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          order_index: number
          section: string
          smartplan_id: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          content: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          order_index?: number
          section: string
          smartplan_id: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          content?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          order_index?: number
          section?: string
          smartplan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smartplan_items_smartplan_id_fkey"
            columns: ["smartplan_id"]
            isOneToOne: false
            referencedRelation: "smartplans"
            referencedColumns: ["id"]
          },
        ]
      }
      smartplans: {
        Row: {
          created_at: string
          id: string
          is_shared_with_contractor: boolean
          notes: string | null
          notify_coordinator: boolean
          notify_estimator: boolean
          notify_project_manager: boolean
          owner_id: string
          project_id: string | null
          template_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared_with_contractor?: boolean
          notes?: string | null
          notify_coordinator?: boolean
          notify_estimator?: boolean
          notify_project_manager?: boolean
          owner_id: string
          project_id?: string | null
          template_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared_with_contractor?: boolean
          notes?: string | null
          notify_coordinator?: boolean
          notify_estimator?: boolean
          notify_project_manager?: boolean
          owner_id?: string
          project_id?: string | null
          template_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smartplans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smartplans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_bid_invitations: {
        Row: {
          created_at: string | null
          id: string
          invitation_token: string | null
          invited_at: string | null
          package_id: string
          status: string | null
          subcontractor_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          package_id: string
          status?: string | null
          subcontractor_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          package_id?: string
          status?: string | null
          subcontractor_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_bid_invitations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sub_bid_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_bid_packages: {
        Row: {
          awarded_amount: number | null
          awarded_at: string | null
          awarded_sub_id: string | null
          bid_count: number | null
          blueprints: Json | null
          budget_amount: number | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invited_subcontractors: Json | null
          notes_for_subs: string | null
          project_address: string | null
          project_id: string
          scope_description: string | null
          scope_documents: Json | null
          scope_photos: Json | null
          sent_at: string | null
          sent_by: string | null
          status: string
          trade: string
          updated_at: string
        }
        Insert: {
          awarded_amount?: number | null
          awarded_at?: string | null
          awarded_sub_id?: string | null
          bid_count?: number | null
          blueprints?: Json | null
          budget_amount?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invited_subcontractors?: Json | null
          notes_for_subs?: string | null
          project_address?: string | null
          project_id: string
          scope_description?: string | null
          scope_documents?: Json | null
          scope_photos?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          trade: string
          updated_at?: string
        }
        Update: {
          awarded_amount?: number | null
          awarded_at?: string | null
          awarded_sub_id?: string | null
          bid_count?: number | null
          blueprints?: Json | null
          budget_amount?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invited_subcontractors?: Json | null
          notes_for_subs?: string | null
          project_address?: string | null
          project_id?: string
          scope_description?: string | null
          scope_documents?: Json | null
          scope_photos?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          trade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_bid_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_bid_responses: {
        Row: {
          attachments: Json | null
          award_notification_sent_at: string | null
          awarded_at: string | null
          bid_amount: number
          created_at: string
          date_confirmed_at: string | null
          date_confirmed_by: string | null
          id: string
          is_awarded: boolean | null
          notes: string | null
          package_id: string
          received_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          status: string
          subcontractor_id: string | null
          subcontractor_name: string
          timeline_weeks: number | null
        }
        Insert: {
          attachments?: Json | null
          award_notification_sent_at?: string | null
          awarded_at?: string | null
          bid_amount: number
          created_at?: string
          date_confirmed_at?: string | null
          date_confirmed_by?: string | null
          id?: string
          is_awarded?: boolean | null
          notes?: string | null
          package_id: string
          received_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          status?: string
          subcontractor_id?: string | null
          subcontractor_name: string
          timeline_weeks?: number | null
        }
        Update: {
          attachments?: Json | null
          award_notification_sent_at?: string | null
          awarded_at?: string | null
          bid_amount?: number
          created_at?: string
          date_confirmed_at?: string | null
          date_confirmed_by?: string | null
          id?: string
          is_awarded?: boolean | null
          notes?: string | null
          package_id?: string
          received_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          status?: string
          subcontractor_id?: string | null
          subcontractor_name?: string
          timeline_weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_bid_responses_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sub_bid_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_bid_responses_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_applicants: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string | null
          crew_size: number | null
          email: string
          id: string
          insurance_verified: boolean | null
          license_number: string | null
          notes: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string[] | null
          status: string | null
          trade: string
          updated_at: string | null
          years_in_business: number | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string | null
          crew_size?: number | null
          email: string
          id?: string
          insurance_verified?: boolean | null
          license_number?: string | null
          notes?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          status?: string | null
          trade: string
          updated_at?: string | null
          years_in_business?: number | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string | null
          crew_size?: number | null
          email?: string
          id?: string
          insurance_verified?: boolean | null
          license_number?: string | null
          notes?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          status?: string | null
          trade?: string
          updated_at?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      subcontractor_bids: {
        Row: {
          bid_amount: number
          company_name: string
          contact_name: string
          created_at: string | null
          duration: string | null
          email: string | null
          exclusions_url: string | null
          id: string
          meeting_date: string | null
          notes: string | null
          phone: string | null
          project_id: string
          proposal_url: string | null
          start_date: string | null
          status: string
          subcontractor_id: string | null
          trade: string
          updated_at: string | null
        }
        Insert: {
          bid_amount?: number
          company_name: string
          contact_name: string
          created_at?: string | null
          duration?: string | null
          email?: string | null
          exclusions_url?: string | null
          id?: string
          meeting_date?: string | null
          notes?: string | null
          phone?: string | null
          project_id: string
          proposal_url?: string | null
          start_date?: string | null
          status?: string
          subcontractor_id?: string | null
          trade: string
          updated_at?: string | null
        }
        Update: {
          bid_amount?: number
          company_name?: string
          contact_name?: string
          created_at?: string | null
          duration?: string | null
          email?: string | null
          exclusions_url?: string | null
          id?: string
          meeting_date?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string
          proposal_url?: string | null
          start_date?: string | null
          status?: string
          subcontractor_id?: string | null
          trade?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_bids_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_messages: {
        Row: {
          attachments: Json | null
          bid_package_id: string | null
          created_at: string | null
          id: string
          message: string
          project_id: string | null
          read_by: Json | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          bid_package_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          project_id?: string | null
          read_by?: Json | null
          sender_id: string
          sender_type: string
        }
        Update: {
          attachments?: Json | null
          bid_package_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          project_id?: string | null
          read_by?: Json | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_messages_bid_package_id_fkey"
            columns: ["bid_package_id"]
            isOneToOne: false
            referencedRelation: "sub_bid_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          related_id: string | null
          subcontractor_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          related_id?: string | null
          subcontractor_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          related_id?: string | null
          subcontractor_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          company_name: string
          contact_name: string
          contractor_id: string
          created_at: string
          email: string
          id: string
          insurance_expiry: string | null
          insurance_verified: boolean | null
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          license_number: string | null
          phone: string
          projects_completed: number | null
          rating: number | null
          status: string
          trade: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_name: string
          contact_name: string
          contractor_id: string
          created_at?: string
          email: string
          id?: string
          insurance_expiry?: string | null
          insurance_verified?: boolean | null
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          license_number?: string | null
          phone: string
          projects_completed?: number | null
          rating?: number | null
          status?: string
          trade: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          contractor_id?: string
          created_at?: string
          email?: string
          id?: string
          insurance_expiry?: string | null
          insurance_verified?: boolean | null
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          license_number?: string | null
          phone?: string
          projects_completed?: number | null
          rating?: number | null
          status?: string
          trade?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          plan: string
          renewal_date: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          plan: string
          renewal_date?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          plan?: string
          renewal_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      task_queue: {
        Row: {
          ai_generated: boolean | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          human_modified: boolean | null
          id: string
          priority_levels: Json | null
          project_id: string | null
          status: string | null
          task_list: Json
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          human_modified?: boolean | null
          id?: string
          priority_levels?: Json | null
          project_id?: string | null
          status?: string | null
          task_list: Json
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          human_modified?: boolean | null
          id?: string
          priority_levels?: Json | null
          project_id?: string | null
          status?: string | null
          task_list?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          location: string | null
          metadata: Json | null
          photo_url: string | null
          task_id: string
          update_type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          location?: string | null
          metadata?: Json | null
          photo_url?: string | null
          task_id: string
          update_type: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          photo_url?: string | null
          task_id?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "foreman_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_name: string | null
          contractor_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by_name: string | null
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_name?: string | null
          contractor_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by_name?: string | null
          role: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_name?: string | null
          contractor_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by_name?: string | null
          role?: string
          status?: string
        }
        Relationships: []
      }
      team_member_status: {
        Row: {
          created_at: string
          current_activity: string | null
          id: string
          status: Database["public"]["Enums"]["team_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_activity?: string | null
          id?: string
          status?: Database["public"]["Enums"]["team_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_activity?: string | null
          id?: string
          status?: Database["public"]["Enums"]["team_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          certifications: string[] | null
          contractor_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          last_name: string
          phone: string | null
          role: string
          skills: string[] | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          certifications?: string[] | null
          contractor_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_name: string
          phone?: string | null
          role: string
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          certifications?: string[] | null
          contractor_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_name?: string
          phone?: string | null
          role?: string
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      template_items: {
        Row: {
          created_at: string
          custom_item_id: string | null
          id: string
          item_type: string
          pricing_guide_id: string | null
          quantity: number
          template_id: string
        }
        Insert: {
          created_at?: string
          custom_item_id?: string | null
          id?: string
          item_type: string
          pricing_guide_id?: string | null
          quantity?: number
          template_id: string
        }
        Update: {
          created_at?: string
          custom_item_id?: string | null
          id?: string
          item_type?: string
          pricing_guide_id?: string | null
          quantity?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_items_custom_item_id_fkey"
            columns: ["custom_item_id"]
            isOneToOne: false
            referencedRelation: "contractor_pricing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_pricing_guide_id_fkey"
            columns: ["pricing_guide_id"]
            isOneToOne: false
            referencedRelation: "pricing_guide"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pricing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_tasks: {
        Row: {
          assigned_trade: string | null
          created_at: string | null
          duration_days: number
          id: string
          phase_name: string
          project_id: string
          sort_order: number
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_trade?: string | null
          created_at?: string | null
          duration_days?: number
          id?: string
          phase_name: string
          project_id: string
          sort_order?: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_trade?: string | null
          created_at?: string | null
          duration_days?: number
          id?: string
          phase_name?: string
          project_id?: string
          sort_order?: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_events: {
        Row: {
          accepted: boolean | null
          ai_reason: string | null
          created_at: string | null
          estimated_increase: number
          id: string
          project_id: string | null
          updated_at: string | null
          upsell_title: string
        }
        Insert: {
          accepted?: boolean | null
          ai_reason?: string | null
          created_at?: string | null
          estimated_increase: number
          id?: string
          project_id?: string | null
          updated_at?: string | null
          upsell_title: string
        }
        Update: {
          accepted?: boolean | null
          ai_reason?: string | null
          created_at?: string | null
          estimated_increase?: number
          id?: string
          project_id?: string | null
          updated_at?: string | null
          upsell_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          permission: string
          resource_id: string | null
          resource_type: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
          resource_id?: string | null
          resource_type?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
          resource_id?: string | null
          resource_type?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vector_docs: {
        Row: {
          chunk: string
          created_at: string | null
          document_type: string
          embedding: string | null
          id: string
          metadata: Json | null
          portal: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          chunk: string
          created_at?: string | null
          document_type: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          portal?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk?: string
          created_at?: string | null
          document_type?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          portal?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vector_docs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vector_docs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_contractor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_applicants: {
        Row: {
          catalog_url: string | null
          company_name: string
          contact_name: string
          created_at: string | null
          email: string
          id: string
          notes: string | null
          phone: string
          products_services: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string[] | null
          status: string | null
          updated_at: string | null
          vendor_type: string | null
          website: string | null
        }
        Insert: {
          catalog_url?: string | null
          company_name: string
          contact_name: string
          created_at?: string | null
          email: string
          id?: string
          notes?: string | null
          phone: string
          products_services?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          status?: string | null
          updated_at?: string | null
          vendor_type?: string | null
          website?: string | null
        }
        Update: {
          catalog_url?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string | null
          email?: string
          id?: string
          notes?: string | null
          phone?: string
          products_services?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          status?: string | null
          updated_at?: string | null
          vendor_type?: string | null
          website?: string | null
        }
        Relationships: []
      }
      vendor_applications: {
        Row: {
          admin_notes: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          insurance_url: string | null
          license_url: string | null
          message: string | null
          phone: string
          portfolio_urls: string[] | null
          product_categories: string
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          insurance_url?: string | null
          license_url?: string | null
          message?: string | null
          phone: string
          portfolio_urls?: string[] | null
          product_categories: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          insurance_url?: string | null
          license_url?: string | null
          message?: string | null
          phone?: string
          portfolio_urls?: string[] | null
          product_categories?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendor_quote_requests: {
        Row: {
          created_at: string
          delivery_timeline: string | null
          id: string
          materials: Json
          project_id: string
          requested_by: string | null
          status: string
          updated_at: string
          vendor_response: Json | null
          vendor_type: string
        }
        Insert: {
          created_at?: string
          delivery_timeline?: string | null
          id?: string
          materials?: Json
          project_id: string
          requested_by?: string | null
          status?: string
          updated_at?: string
          vendor_response?: Json | null
          vendor_type: string
        }
        Update: {
          created_at?: string
          delivery_timeline?: string | null
          id?: string
          materials?: Json
          project_id?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
          vendor_response?: Json | null
          vendor_type?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          categories: Json | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          payment_terms: string | null
          phone: string
          rating: number | null
          status: string
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          categories?: Json | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone: string
          rating?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          categories?: Json | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string
          rating?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      walkthrough_photos: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          walkthrough_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          walkthrough_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          walkthrough_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walkthrough_photos_walkthrough_id_fkey"
            columns: ["walkthrough_id"]
            isOneToOne: false
            referencedRelation: "walkthroughs"
            referencedColumns: ["id"]
          },
        ]
      }
      walkthroughs: {
        Row: {
          address: string
          client_name: string
          created_at: string
          date: string
          google_calendar_event_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          photos_uploaded: boolean
          project_id: string | null
          project_name: string
          status: string
          time: string
          updated_at: string
          user_id: string
          walkthrough_number: string
        }
        Insert: {
          address: string
          client_name: string
          created_at?: string
          date: string
          google_calendar_event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          photos_uploaded?: boolean
          project_id?: string | null
          project_name: string
          status?: string
          time: string
          updated_at?: string
          user_id: string
          walkthrough_number: string
        }
        Update: {
          address?: string
          client_name?: string
          created_at?: string
          date?: string
          google_calendar_event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          photos_uploaded?: boolean
          project_id?: string | null
          project_name?: string
          status?: string
          time?: string
          updated_at?: string
          user_id?: string
          walkthrough_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "walkthroughs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkthroughs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claim_attachments: {
        Row: {
          claim_id: string
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          label: string | null
        }
        Insert: {
          claim_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          label?: string | null
        }
        Update: {
          claim_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claim_attachments_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "warranty_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claim_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          claim_id: string
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          message: string | null
          to_status: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          claim_id: string
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          message?: string | null
          to_status?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          claim_id?: string
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          message?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claim_events_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "warranty_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claim_financials: {
        Row: {
          approved_repair_cost: number | null
          claim_id: string
          contractor_share: number | null
          created_at: string
          estimated_repair_cost: number | null
          id: string
          notes: string | null
          smartreno_share: number | null
          updated_at: string
          vendor_share: number | null
        }
        Insert: {
          approved_repair_cost?: number | null
          claim_id: string
          contractor_share?: number | null
          created_at?: string
          estimated_repair_cost?: number | null
          id?: string
          notes?: string | null
          smartreno_share?: number | null
          updated_at?: string
          vendor_share?: number | null
        }
        Update: {
          approved_repair_cost?: number | null
          claim_id?: string
          contractor_share?: number | null
          created_at?: string
          estimated_repair_cost?: number | null
          id?: string
          notes?: string | null
          smartreno_share?: number | null
          updated_at?: string
          vendor_share?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claim_financials_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "warranty_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claim_messages: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claim_messages_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "warranty_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claims: {
        Row: {
          assigned_csm_id: string | null
          assigned_estimator_id: string | null
          assigned_pm_id: string | null
          claim_number: string
          claim_status: string
          contractor_id: string | null
          created_at: string
          date_reported: string
          homeowner_id: string | null
          id: string
          next_action: string | null
          next_action_due_at: string | null
          priority: string
          project_id: string | null
          reported_area: string | null
          reported_issue_desc: string | null
          reported_issue_title: string
          resolution_summary: string | null
          resolution_type: string | null
          resolved_at: string | null
          severity: string | null
          updated_at: string
          warranty_plan_id: string | null
          within_coverage: boolean | null
        }
        Insert: {
          assigned_csm_id?: string | null
          assigned_estimator_id?: string | null
          assigned_pm_id?: string | null
          claim_number: string
          claim_status?: string
          contractor_id?: string | null
          created_at?: string
          date_reported?: string
          homeowner_id?: string | null
          id?: string
          next_action?: string | null
          next_action_due_at?: string | null
          priority?: string
          project_id?: string | null
          reported_area?: string | null
          reported_issue_desc?: string | null
          reported_issue_title: string
          resolution_summary?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          severity?: string | null
          updated_at?: string
          warranty_plan_id?: string | null
          within_coverage?: boolean | null
        }
        Update: {
          assigned_csm_id?: string | null
          assigned_estimator_id?: string | null
          assigned_pm_id?: string | null
          claim_number?: string
          claim_status?: string
          contractor_id?: string | null
          created_at?: string
          date_reported?: string
          homeowner_id?: string | null
          id?: string
          next_action?: string | null
          next_action_due_at?: string | null
          priority?: string
          project_id?: string | null
          reported_area?: string | null
          reported_issue_desc?: string | null
          reported_issue_title?: string
          resolution_summary?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          severity?: string | null
          updated_at?: string
          warranty_plan_id?: string | null
          within_coverage?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_plan_id_fkey"
            columns: ["warranty_plan_id"]
            isOneToOne: false
            referencedRelation: "warranty_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "warranty_claim_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_plans: {
        Row: {
          contractor_id: string | null
          coverage_end: string
          coverage_start: string
          coverage_summary: string | null
          created_at: string
          homeowner_id: string | null
          id: string
          plan_type: string
          project_id: string | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          contractor_id?: string | null
          coverage_end: string
          coverage_start: string
          coverage_summary?: string | null
          created_at?: string
          homeowner_id?: string | null
          id?: string
          plan_type?: string
          project_id?: string | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          contractor_id?: string | null
          coverage_end?: string
          coverage_start?: string
          coverage_summary?: string | null
          created_at?: string
          homeowner_id?: string | null
          id?: string
          plan_type?: string
          project_id?: string | null
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      website_chat_conversations: {
        Row: {
          converted_to_lead: boolean | null
          created_at: string | null
          id: string
          ip_address: string | null
          last_message_at: string | null
          messages: Json | null
          session_id: string
          user_location: string | null
        }
        Insert: {
          converted_to_lead?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_message_at?: string | null
          messages?: Json | null
          session_id: string
          user_location?: string | null
        }
        Update: {
          converted_to_lead?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_message_at?: string | null
          messages?: Json | null
          session_id?: string
          user_location?: string | null
        }
        Relationships: []
      }
      website_cost_estimates: {
        Row: {
          converted_to_lead: boolean | null
          created_at: string | null
          estimated_range: Json
          id: string
          ip_address: string | null
          project_type: string
          room_count: number | null
          square_footage: number | null
          user_agent: string | null
          zip_code: string | null
        }
        Insert: {
          converted_to_lead?: boolean | null
          created_at?: string | null
          estimated_range: Json
          id?: string
          ip_address?: string | null
          project_type: string
          room_count?: number | null
          square_footage?: number | null
          user_agent?: string | null
          zip_code?: string | null
        }
        Update: {
          converted_to_lead?: boolean | null
          created_at?: string | null
          estimated_range?: Json
          id?: string
          ip_address?: string | null
          project_type?: string
          room_count?: number | null
          square_footage?: number | null
          user_agent?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      website_optimization_logs: {
        Row: {
          analysis_data: Json
          created_at: string | null
          id: string
          metrics: Json | null
          page_url: string
          recommendations: Json | null
        }
        Insert: {
          analysis_data: Json
          created_at?: string | null
          id?: string
          metrics?: Json | null
          page_url: string
          recommendations?: Json | null
        }
        Update: {
          analysis_data?: Json
          created_at?: string | null
          id?: string
          metrics?: Json | null
          page_url?: string
          recommendations?: Json | null
        }
        Relationships: []
      }
      winback_campaign_sends: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          opened_at: string | null
          responded_at: string | null
          response_type: string | null
          sent_at: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          opened_at?: string | null
          responded_at?: string | null
          response_type?: string | null
          sent_at?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          opened_at?: string | null
          responded_at?: string | null
          response_type?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "winback_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "winback_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winback_campaign_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          discount_percentage: number | null
          email_subject: string
          email_template: string
          id: string
          is_active: boolean
          name: string
          offer_details: string | null
          target_status: string
          trigger_after_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          email_subject: string
          email_template: string
          id?: string
          is_active?: boolean
          name: string
          offer_details?: string | null
          target_status: string
          trigger_after_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          email_subject?: string
          email_template?: string
          id?: string
          is_active?: boolean
          name?: string
          offer_details?: string | null
          target_status?: string
          trigger_after_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      workflow_events: {
        Row: {
          automated: boolean | null
          created_at: string
          event_data: Json | null
          event_type: string
          from_status: string | null
          id: string
          project_id: string
          to_status: string | null
          triggered_by: string | null
        }
        Insert: {
          automated?: boolean | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          from_status?: string | null
          id?: string
          project_id: string
          to_status?: string | null
          triggered_by?: string | null
        }
        Update: {
          automated?: boolean | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          from_status?: string | null
          id?: string
          project_id?: string
          to_status?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      workload_balancer_logs: {
        Row: {
          applied: boolean | null
          balancing_notes: string | null
          contractor_pool: Json
          created_at: string | null
          id: string
          recommended_distribution: Json
        }
        Insert: {
          applied?: boolean | null
          balancing_notes?: string | null
          contractor_pool: Json
          created_at?: string | null
          id?: string
          recommended_distribution: Json
        }
        Update: {
          applied?: boolean | null
          balancing_notes?: string | null
          contractor_pool?: Json
          created_at?: string | null
          id?: string
          recommended_distribution?: Json
        }
        Relationships: []
      }
    }
    Views: {
      blueprint_families: {
        Row: {
          created_at: string | null
          description: string | null
          family_id: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string | null
          is_latest: boolean | null
          project_id: string | null
          total_versions: number | null
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
          version_notes: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          family_id?: never
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string | null
          is_latest?: boolean | null
          project_id?: string | null
          total_versions?: never
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          version_notes?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          family_id?: never
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string | null
          is_latest?: boolean | null
          project_id?: string | null
          total_versions?: never
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "architect_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history_with_users: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          changed_by_name: string | null
          created_at: string | null
          from_status: string | null
          id: string | null
          lead_id: string | null
          lead_name: string | null
          notes: string | null
          reason: string | null
          to_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      v_contractor_projects: {
        Row: {
          address: string | null
          budget_estimate: number | null
          contractor_id: string | null
          contractor_role: string | null
          created_at: string | null
          id: string | null
          last_contact_at: string | null
          name: string | null
          next_action_id: number | null
          next_step_due_at: string | null
          next_step_status: string | null
          next_step_title: string | null
          updated_at: string | null
          workflow_status: string | null
        }
        Insert: {
          address?: string | null
          budget_estimate?: number | null
          contractor_id?: string | null
          contractor_role?: never
          created_at?: string | null
          id?: string | null
          last_contact_at?: never
          name?: string | null
          next_action_id?: never
          next_step_due_at?: never
          next_step_status?: never
          next_step_title?: never
          updated_at?: string | null
          workflow_status?: never
        }
        Update: {
          address?: string | null
          budget_estimate?: number | null
          contractor_id?: string | null
          contractor_role?: never
          created_at?: string | null
          id?: string | null
          last_contact_at?: never
          name?: string | null
          next_action_id?: never
          next_step_due_at?: never
          next_step_status?: never
          next_step_title?: never
          updated_at?: string | null
          workflow_status?: never
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_permit_approval_date: {
        Args: { p_permit_id: string }
        Returns: string
      }
      calculate_permit_fee: {
        Args: {
          p_municipality: string
          p_permit_type: string
          p_project_value?: number
          p_square_footage?: number
          p_state: string
        }
        Returns: number
      }
      decrement_estimator_assignments: {
        Args: { estimator_user_id: string }
        Returns: undefined
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      generate_claim_number: { Args: never; Returns: string }
      generate_contract_number: { Args: never; Returns: string }
      get_eligible_winback_leads: {
        Args: { campaign_id_param: string }
        Returns: {
          email: string
          lead_id: string
          lead_name: string
          lost_date: string
          lost_reason: string
          phone: string
          project_type: string
        }[]
      }
      has_permission: {
        Args: {
          _permission: string
          _resource_id?: string
          _resource_type?: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_estimator_assignments: {
        Args: { estimator_user_id: string }
        Returns: undefined
      }
      invoke_agent_orchestrator: {
        Args: {
          p_trigger_data: Json
          p_trigger_event: string
          p_trigger_source: string
          p_trigger_source_id: string
          p_triggered_by?: string
        }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_contractor_admin: {
        Args: { _contractor_id: string; _user_id: string }
        Returns: boolean
      }
      is_contractor_member: {
        Args: { _contractor_id: string; _user_id: string }
        Returns: boolean
      }
      is_contractor_or_coordinator: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "homeowner"
        | "contractor"
        | "architect"
        | "interior_designer"
        | "vendor"
        | "estimator"
        | "project_coordinator"
        | "client_success_manager"
        | "call_center_rep"
        | "project_manager"
        | "foreman"
        | "inside_sales"
        | "purchaser_manager"
        | "office_manager"
        | "warehouse"
        | "outside_sales"
        | "business_operations"
        | "vp_of_sales"
        | "general_manager"
        | "field_worker"
        | "estimator_team"
        | "office_admin"
        | "finance"
        | "design_professional"
      notification_status: "pending" | "sent" | "acknowledged" | "dismissed"
      notification_type:
        | "task_starting"
        | "task_due"
        | "milestone_approaching"
        | "homeowner_action_needed"
        | "contractor_action_needed"
        | "material_delivery"
        | "inspection_scheduled"
      team_status:
        | "available"
        | "in_walkthrough"
        | "on_call"
        | "away"
        | "offline"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "homeowner",
        "contractor",
        "architect",
        "interior_designer",
        "vendor",
        "estimator",
        "project_coordinator",
        "client_success_manager",
        "call_center_rep",
        "project_manager",
        "foreman",
        "inside_sales",
        "purchaser_manager",
        "office_manager",
        "warehouse",
        "outside_sales",
        "business_operations",
        "vp_of_sales",
        "general_manager",
        "field_worker",
        "estimator_team",
        "office_admin",
        "finance",
        "design_professional",
      ],
      notification_status: ["pending", "sent", "acknowledged", "dismissed"],
      notification_type: [
        "task_starting",
        "task_due",
        "milestone_approaching",
        "homeowner_action_needed",
        "contractor_action_needed",
        "material_delivery",
        "inspection_scheduled",
      ],
      team_status: [
        "available",
        "in_walkthrough",
        "on_call",
        "away",
        "offline",
      ],
    },
  },
} as const
