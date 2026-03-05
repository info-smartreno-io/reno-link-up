/**
 * Partner & Supplier Types
 */

export interface Partner {
  id: string;
  name: string;
  category: 'supplier' | 'manufacturer' | 'showroom' | 'distributor';
  logo_url?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  service_areas: string[];
  product_categories: string[];
  is_active: boolean;
  referral_commission_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerReferral {
  id: string;
  partner_id: string;
  contractor_id: string;
  homeowner_project_id?: string;
  referral_type: 'contractor' | 'homeowner' | 'project';
  status: 'pending' | 'qualified' | 'converted' | 'paid' | 'cancelled';
  referral_value?: number;
  commission_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkContractorImport {
  id: string;
  source: 'clay' | 'manual' | 'csv' | 'scraper';
  total_records: number;
  processed_records: number;
  successful_imports: number;
  failed_imports: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  import_data: any;
  error_log?: string[];
  created_by: string;
  created_at: string;
  completed_at?: string;
}
