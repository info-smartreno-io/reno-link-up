-- Add QuickBooks ID tracking to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS quickbooks_id TEXT;