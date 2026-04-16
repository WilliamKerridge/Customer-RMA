export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          phone: string | null
          role: 'customer' | 'staff_uk' | 'staff_us' | 'admin'
          office: 'UK' | 'US' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          company?: string | null
          phone?: string | null
          role?: 'customer' | 'staff_uk' | 'staff_us' | 'admin'
          office?: 'UK' | 'US' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company?: string | null
          phone?: string | null
          role?: 'customer' | 'staff_uk' | 'staff_us' | 'admin'
          office?: 'UK' | 'US' | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_accounts: {
        Row: {
          id: string
          user_id: string | null
          company_name: string | null
          billing_address: Json | null
          shipping_address: Json | null
          credit_terms: boolean
          po_required: boolean
          account_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_name?: string | null
          billing_address?: Json | null
          shipping_address?: Json | null
          credit_terms?: boolean
          po_required?: boolean
          account_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string | null
          company_name?: string | null
          billing_address?: Json | null
          shipping_address?: Json | null
          credit_terms?: boolean
          po_required?: boolean
          account_active?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          part_number: string
          variant: string | null
          display_name: string
          category: string
          active: boolean
          test_fee: number
          standard_repair_fee: number
          major_repair_fee: number
          service_fee: number
          notes: string | null
          tariff_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          part_number: string
          variant?: string | null
          display_name: string
          category: string
          active?: boolean
          test_fee?: number
          standard_repair_fee?: number
          major_repair_fee?: number
          service_fee?: number
          notes?: string | null
          tariff_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          part_number?: string
          variant?: string | null
          display_name?: string
          category?: string
          active?: boolean
          test_fee?: number
          standard_repair_fee?: number
          major_repair_fee?: number
          service_fee?: number
          notes?: string | null
          tariff_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          id: string
          case_number: string
          customer_id: string | null
          office: 'UK' | 'US'
          status: string
          fault_type: 'repair' | 'service' | 'service_plan' | 'loan_return' | 'code_update'
          fault_description: string | null
          fault_display_info: boolean
          fault_display_details: string | null
          tested_on_other_unit: boolean
          fault_follows: 'unit' | 'car' | null
          required_return_date: string | null
          shipping_address: Json | null
          rma_number: string | null
          sap_repair_order: string | null
          sap_sales_order: string | null
          sap_works_order: string | null
          sap_booked_in_date: string | null
          sap_estimated_completion: string | null
          sap_order_value: number | null
          sap_spent_hours: number | null
          sap_days_open: number | null
          last_import_at: string | null
          workshop_stage: string | null
          is_on_hold: boolean
          hold_reason: string | null
          hold_customer_label: string | null
          awaiting_customer_question: string | null
          payment_required: boolean
          payment_status: 'pending' | 'paid' | 'waived' | 'invoiced' | 'stub_notified'
          stripe_payment_intent_id: string | null
          po_number: string | null
          assigned_to: string | null
          parent_case_id: string | null
          is_internal_transfer: boolean
          internal_po: string | null
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          case_number: string
          customer_id?: string | null
          office: 'UK' | 'US'
          status?: string
          fault_type: 'repair' | 'service' | 'service_plan' | 'loan_return' | 'code_update'
          fault_description?: string | null
          fault_display_info?: boolean
          fault_display_details?: string | null
          tested_on_other_unit?: boolean
          fault_follows?: 'unit' | 'car' | null
          required_return_date?: string | null
          shipping_address?: Json | null
          rma_number?: string | null
          sap_repair_order?: string | null
          sap_sales_order?: string | null
          sap_works_order?: string | null
          sap_booked_in_date?: string | null
          sap_estimated_completion?: string | null
          sap_order_value?: number | null
          sap_spent_hours?: number | null
          sap_days_open?: number | null
          last_import_at?: string | null
          workshop_stage?: string | null
          is_on_hold?: boolean
          hold_reason?: string | null
          hold_customer_label?: string | null
          awaiting_customer_question?: string | null
          payment_required?: boolean
          payment_status?: 'pending' | 'paid' | 'waived' | 'invoiced' | 'stub_notified'
          stripe_payment_intent_id?: string | null
          po_number?: string | null
          assigned_to?: string | null
          parent_case_id?: string | null
          is_internal_transfer?: boolean
          internal_po?: string | null
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
        Update: {
          case_number?: string
          customer_id?: string | null
          office?: 'UK' | 'US'
          status?: string
          fault_type?: 'repair' | 'service' | 'service_plan' | 'loan_return' | 'code_update'
          fault_description?: string | null
          fault_display_info?: boolean
          fault_display_details?: string | null
          tested_on_other_unit?: boolean
          fault_follows?: 'unit' | 'car' | null
          required_return_date?: string | null
          shipping_address?: Json | null
          rma_number?: string | null
          sap_repair_order?: string | null
          sap_sales_order?: string | null
          sap_works_order?: string | null
          sap_booked_in_date?: string | null
          sap_estimated_completion?: string | null
          sap_order_value?: number | null
          sap_spent_hours?: number | null
          sap_days_open?: number | null
          last_import_at?: string | null
          workshop_stage?: string | null
          is_on_hold?: boolean
          hold_reason?: string | null
          hold_customer_label?: string | null
          awaiting_customer_question?: string | null
          payment_required?: boolean
          payment_status?: 'pending' | 'paid' | 'waived' | 'invoiced' | 'stub_notified'
          stripe_payment_intent_id?: string | null
          po_number?: string | null
          assigned_to?: string | null
          parent_case_id?: string | null
          is_internal_transfer?: boolean
          internal_po?: string | null
          updated_at?: string
          closed_at?: string | null
        }
        Relationships: []
      }
      case_products: {
        Row: {
          id: string
          case_id: string | null
          product_id: string | null
          serial_number: string | null
          quantity: number
          fault_notes: string | null
          test_fee_applied: number | null
          repair_fee_applied: number | null
          // migration 006
          status: string
          rejection_reason: string | null
          workshop_findings: string | null
          staff_notes: string | null
          sap_works_order: string | null
          sap_estimated_completion: string | null
          sap_order_value: number | null
          sap_spent_hours: number | null
          // migration 007
          workshop_stage: string | null
          is_on_hold: boolean
          hold_reason: string | null
          hold_customer_label: string | null
          // migration 008
          created_at: string
          // migration 009
          fee_basis: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          product_id?: string | null
          serial_number?: string | null
          quantity?: number
          fault_notes?: string | null
          test_fee_applied?: number | null
          repair_fee_applied?: number | null
          status?: string
          rejection_reason?: string | null
          workshop_findings?: string | null
          staff_notes?: string | null
          sap_works_order?: string | null
          sap_estimated_completion?: string | null
          sap_order_value?: number | null
          sap_spent_hours?: number | null
          workshop_stage?: string | null
          is_on_hold?: boolean
          hold_reason?: string | null
          hold_customer_label?: string | null
          created_at?: string
          fee_basis?: string
        }
        Update: {
          case_id?: string | null
          product_id?: string | null
          serial_number?: string | null
          quantity?: number
          fault_notes?: string | null
          test_fee_applied?: number | null
          repair_fee_applied?: number | null
          status?: string
          rejection_reason?: string | null
          workshop_findings?: string | null
          staff_notes?: string | null
          sap_works_order?: string | null
          sap_estimated_completion?: string | null
          sap_order_value?: number | null
          sap_spent_hours?: number | null
          workshop_stage?: string | null
          is_on_hold?: boolean
          hold_reason?: string | null
          hold_customer_label?: string | null
          fee_basis?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_products_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      case_updates: {
        Row: {
          id: string
          case_id: string | null
          author_id: string | null
          content: string
          is_internal: boolean
          status_change_to: string | null
          product_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          author_id?: string | null
          content: string
          is_internal?: boolean
          status_change_to?: string | null
          product_id?: string | null
          created_at?: string
        }
        Update: {
          case_id?: string | null
          author_id?: string | null
          content?: string
          is_internal?: boolean
          status_change_to?: string | null
          product_id?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          id: string
          filename: string
          uploaded_by: string | null
          uploaded_at: string
          total_rows: number
          matched_rows: number
          unmatched_rows: number | null
          updated_rows: number
          rows_data: unknown | null
          applied: boolean
        }
        Insert: {
          id?: string
          filename: string
          uploaded_by?: string | null
          uploaded_at?: string
          total_rows: number
          matched_rows: number
          unmatched_rows?: number | null
          updated_rows?: number
          rows_data?: unknown | null
          applied?: boolean
        }
        Update: {
          filename?: string
          uploaded_by?: string | null
          total_rows?: number
          matched_rows?: number
          unmatched_rows?: number
          updated_rows?: number
          rows_data?: unknown | null
          applied?: boolean
        }
        Relationships: []
      }
      case_attachments: {
        Row: {
          id: string
          case_id: string | null
          uploaded_by: string | null
          file_name: string
          storage_path: string
          file_size: number | null
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          uploaded_by?: string | null
          file_name: string
          storage_path: string
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          case_id?: string | null
          uploaded_by?: string | null
          file_name?: string
          storage_path?: string
          file_size?: number | null
          mime_type?: string | null
        }
        Relationships: []
      }
      case_response_tokens: {
        Row: {
          id: string
          case_id: string | null
          token: string
          created_at: string
          expires_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          case_id?: string | null
          token: string
          created_at?: string
          expires_at: string
          used_at?: string | null
        }
        Update: {
          case_id?: string | null
          token?: string
          expires_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          id: string
          case_id: string | null
          recipient_email: string
          template: string
          sent_at: string
          resend_message_id: string | null
        }
        Insert: {
          id?: string
          case_id?: string | null
          recipient_email: string
          template: string
          sent_at?: string
          resend_message_id?: string | null
        }
        Update: {
          case_id?: string | null
          recipient_email?: string
          template?: string
          resend_message_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_case_number: {
        Args: Record<string, never>
        Returns: string
      }
      generate_rma_number: {
        Args: Record<string, never>
        Returns: string
      }
      generate_int_number: {
        Args: Record<string, never>
        Returns: string
      }
      current_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      set_app_user_id: {
        Args: { user_id: string }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type UserRow = Tables<'users'>
export type CaseRow = Tables<'cases'>
export type ProductRow = Tables<'products'>
export type CaseProductRow = Tables<'case_products'>
export type CaseUpdateRow = Tables<'case_updates'>
export type CaseAttachmentRow = Tables<'case_attachments'>
export type CustomerAccountRow = Tables<'customer_accounts'>
export type CaseResponseTokenRow = Tables<'case_response_tokens'>
