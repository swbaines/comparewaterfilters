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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      billing_audit_log: {
        Row: {
          actor_ip: string | null
          actor_user_agent: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          provider_id: string
        }
        Insert: {
          actor_ip?: string | null
          actor_user_agent?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          provider_id: string
        }
        Update: {
          actor_ip?: string | null
          actor_user_agent?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          provider_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          id: string
          invoice_number: string
          is_test: boolean
          lead_count: number
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          provider_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number: string
          is_test?: boolean
          lead_count?: number
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          provider_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string
          is_test?: boolean
          lead_count?: number
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_price_changes: {
        Row: {
          changed_by: string | null
          created_at: string
          effective_date: string
          id: string
          new_price: number
          old_price: number
          system_type: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          effective_date: string
          id?: string
          new_price: number
          old_price: number
          system_type: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          new_price?: number
          old_price?: number
          system_type?: string
        }
        Relationships: []
      }
      lead_prices: {
        Row: {
          created_at: string
          id: string
          price_per_lead: number
          system_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_per_lead?: number
          system_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          price_per_lead?: number
          system_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_stripe_details: {
        Row: {
          created_at: string
          direct_debit_authorised_at: string | null
          direct_debit_authorised_ip: string | null
          direct_debit_authorised_user_agent: string | null
          id: string
          provider_id: string
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direct_debit_authorised_at?: string | null
          direct_debit_authorised_ip?: string | null
          direct_debit_authorised_user_agent?: string | null
          id?: string
          provider_id: string
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direct_debit_authorised_at?: string | null
          direct_debit_authorised_ip?: string | null
          direct_debit_authorised_user_agent?: string | null
          id?: string
          provider_id?: string
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_stripe_details_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_stripe_details_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          abn: string | null
          abn_review_flag: string | null
          abn_verification_response: Json | null
          abn_verified: boolean
          abn_verified_at: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          available_for_quote: boolean
          brands: string[]
          certification_files: Json | null
          certifications: string[]
          contact_email: string | null
          created_at: string
          description: string
          google_business_url: string | null
          has_public_liability: boolean | null
          highlights: string[]
          id: string
          installation_model:
            | Database["public"]["Enums"]["installation_model"]
            | null
          insurance_certificate_url: string | null
          insurance_expiry_date: string | null
          insurance_paused_at: string | null
          insurer_name: string | null
          logo: string | null
          name: string
          phone: string | null
          plumber_licence_number: string | null
          plumbing_licence_state: string | null
          price_range: Database["public"]["Enums"]["price_range"]
          public_liability_insurance_amount: number | null
          rating: number
          response_time: string
          review_count: number
          service_base_lat: number | null
          service_base_lng: number | null
          service_base_postcode: string | null
          service_base_state: string | null
          service_base_suburb: string | null
          service_radius_km: number
          slug: string
          states: string[]
          sub_contractor_confirmation_at: string | null
          submitted_by: string | null
          system_pricing: Json
          system_types: string[]
          terms_accepted_at: string | null
          trading_name: string | null
          updated_at: string
          warranty: string
          website: string | null
          years_in_business: number
        }
        Insert: {
          abn?: string | null
          abn_review_flag?: string | null
          abn_verification_response?: Json | null
          abn_verified?: boolean
          abn_verified_at?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          available_for_quote?: boolean
          brands?: string[]
          certification_files?: Json | null
          certifications?: string[]
          contact_email?: string | null
          created_at?: string
          description?: string
          google_business_url?: string | null
          has_public_liability?: boolean | null
          highlights?: string[]
          id?: string
          installation_model?:
            | Database["public"]["Enums"]["installation_model"]
            | null
          insurance_certificate_url?: string | null
          insurance_expiry_date?: string | null
          insurance_paused_at?: string | null
          insurer_name?: string | null
          logo?: string | null
          name: string
          phone?: string | null
          plumber_licence_number?: string | null
          plumbing_licence_state?: string | null
          price_range?: Database["public"]["Enums"]["price_range"]
          public_liability_insurance_amount?: number | null
          rating?: number
          response_time?: string
          review_count?: number
          service_base_lat?: number | null
          service_base_lng?: number | null
          service_base_postcode?: string | null
          service_base_state?: string | null
          service_base_suburb?: string | null
          service_radius_km?: number
          slug: string
          states?: string[]
          sub_contractor_confirmation_at?: string | null
          submitted_by?: string | null
          system_pricing?: Json
          system_types?: string[]
          terms_accepted_at?: string | null
          trading_name?: string | null
          updated_at?: string
          warranty?: string
          website?: string | null
          years_in_business?: number
        }
        Update: {
          abn?: string | null
          abn_review_flag?: string | null
          abn_verification_response?: Json | null
          abn_verified?: boolean
          abn_verified_at?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          available_for_quote?: boolean
          brands?: string[]
          certification_files?: Json | null
          certifications?: string[]
          contact_email?: string | null
          created_at?: string
          description?: string
          google_business_url?: string | null
          has_public_liability?: boolean | null
          highlights?: string[]
          id?: string
          installation_model?:
            | Database["public"]["Enums"]["installation_model"]
            | null
          insurance_certificate_url?: string | null
          insurance_expiry_date?: string | null
          insurance_paused_at?: string | null
          insurer_name?: string | null
          logo?: string | null
          name?: string
          phone?: string | null
          plumber_licence_number?: string | null
          plumbing_licence_state?: string | null
          price_range?: Database["public"]["Enums"]["price_range"]
          public_liability_insurance_amount?: number | null
          rating?: number
          response_time?: string
          review_count?: number
          service_base_lat?: number | null
          service_base_lng?: number | null
          service_base_postcode?: string | null
          service_base_state?: string | null
          service_base_suburb?: string | null
          service_radius_km?: number
          slug?: string
          states?: string[]
          sub_contractor_confirmation_at?: string | null
          submitted_by?: string | null
          system_pricing?: Json
          system_types?: string[]
          terms_accepted_at?: string | null
          trading_name?: string | null
          updated_at?: string
          warranty?: string
          website?: string | null
          years_in_business?: number
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          bathrooms: string | null
          budget: string | null
          concerns: string[] | null
          consent: boolean | null
          coverage: string | null
          created_at: string
          email: string
          first_name: string
          household_size: string | null
          id: string
          mobile: string | null
          notes: string | null
          ownership_status: string | null
          postcode: string | null
          priorities: string[] | null
          property_type: string | null
          state: string | null
          suburb: string | null
          water_source: string | null
        }
        Insert: {
          bathrooms?: string | null
          budget?: string | null
          concerns?: string[] | null
          consent?: boolean | null
          coverage?: string | null
          created_at?: string
          email: string
          first_name: string
          household_size?: string | null
          id?: string
          mobile?: string | null
          notes?: string | null
          ownership_status?: string | null
          postcode?: string | null
          priorities?: string[] | null
          property_type?: string | null
          state?: string | null
          suburb?: string | null
          water_source?: string | null
        }
        Update: {
          bathrooms?: string | null
          budget?: string | null
          concerns?: string[] | null
          consent?: boolean | null
          coverage?: string | null
          created_at?: string
          email?: string
          first_name?: string
          household_size?: string | null
          id?: string
          mobile?: string | null
          notes?: string | null
          ownership_status?: string | null
          postcode?: string | null
          priorities?: string[] | null
          property_type?: string | null
          state?: string | null
          suburb?: string | null
          water_source?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          budget: string | null
          concerns: string[] | null
          created_at: string
          customer_email: string
          customer_mobile: string | null
          customer_name: string
          customer_postcode: string | null
          customer_state: string | null
          customer_suburb: string | null
          first_response_at: string | null
          household_size: string | null
          id: string
          invoice_id: string | null
          is_test: boolean
          lead_price: number | null
          lead_status: string
          message: string | null
          ownership_status: string | null
          property_type: string | null
          provider_id: string | null
          provider_name: string
          recommended_systems: string[] | null
          status: string
          status_updated_at: string | null
          vendor_notes: string | null
          water_source: string | null
        }
        Insert: {
          budget?: string | null
          concerns?: string[] | null
          created_at?: string
          customer_email: string
          customer_mobile?: string | null
          customer_name: string
          customer_postcode?: string | null
          customer_state?: string | null
          customer_suburb?: string | null
          first_response_at?: string | null
          household_size?: string | null
          id?: string
          invoice_id?: string | null
          is_test?: boolean
          lead_price?: number | null
          lead_status?: string
          message?: string | null
          ownership_status?: string | null
          property_type?: string | null
          provider_id?: string | null
          provider_name: string
          recommended_systems?: string[] | null
          status?: string
          status_updated_at?: string | null
          vendor_notes?: string | null
          water_source?: string | null
        }
        Update: {
          budget?: string | null
          concerns?: string[] | null
          created_at?: string
          customer_email?: string
          customer_mobile?: string | null
          customer_name?: string
          customer_postcode?: string | null
          customer_state?: string | null
          customer_suburb?: string | null
          first_response_at?: string | null
          household_size?: string | null
          id?: string
          invoice_id?: string | null
          is_test?: boolean
          lead_price?: number | null
          lead_status?: string
          message?: string | null
          ownership_status?: string | null
          property_type?: string | null
          provider_id?: string | null
          provider_name?: string
          recommended_systems?: string[] | null
          status?: string
          status_updated_at?: string | null
          vendor_notes?: string | null
          water_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_type_ids: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_accounts: {
        Row: {
          created_at: string
          id: string
          last_dashboard_visit: string | null
          provider_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_dashboard_visit?: string | null
          provider_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_dashboard_visit?: string | null
          provider_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payment_details: {
        Row: {
          abn: string
          account_name: string
          account_number: string
          bank_name: string
          bsb: string
          business_address: string
          business_name: string
          business_postcode: string
          business_state: string
          business_suburb: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          provider_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abn?: string
          account_name?: string
          account_number?: string
          bank_name?: string
          bsb?: string
          business_address?: string
          business_name?: string
          business_postcode?: string
          business_state?: string
          business_suburb?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          provider_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abn?: string
          account_name?: string
          account_number?: string
          bank_name?: string
          bsb?: string
          business_address?: string
          business_name?: string
          business_postcode?: string
          business_state?: string
          business_suburb?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          provider_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payment_details_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payment_details_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      providers_public: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          available_for_quote: boolean | null
          brands: string[] | null
          certifications: string[] | null
          created_at: string | null
          description: string | null
          highlights: string[] | null
          id: string | null
          logo: string | null
          name: string | null
          phone: string | null
          price_range: Database["public"]["Enums"]["price_range"] | null
          rating: number | null
          response_time: string | null
          review_count: number | null
          service_base_lat: number | null
          service_base_lng: number | null
          service_base_postcode: string | null
          service_base_state: string | null
          service_base_suburb: string | null
          service_radius_km: number | null
          slug: string | null
          states: string[] | null
          system_types: string[] | null
          updated_at: string | null
          warranty: string | null
          website: string | null
          years_in_business: number | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          available_for_quote?: boolean | null
          brands?: string[] | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          highlights?: string[] | null
          id?: string | null
          logo?: string | null
          name?: string | null
          phone?: string | null
          price_range?: Database["public"]["Enums"]["price_range"] | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          service_base_lat?: number | null
          service_base_lng?: number | null
          service_base_postcode?: string | null
          service_base_state?: string | null
          service_base_suburb?: string | null
          service_radius_km?: number | null
          slug?: string | null
          states?: string[] | null
          system_types?: string[] | null
          updated_at?: string | null
          warranty?: string | null
          website?: string | null
          years_in_business?: number | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          available_for_quote?: boolean | null
          brands?: string[] | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          highlights?: string[] | null
          id?: string | null
          logo?: string | null
          name?: string | null
          phone?: string | null
          price_range?: Database["public"]["Enums"]["price_range"] | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          service_base_lat?: number | null
          service_base_lng?: number | null
          service_base_postcode?: string | null
          service_base_state?: string | null
          service_base_suburb?: string | null
          service_radius_km?: number | null
          slug?: string | null
          states?: string[] | null
          system_types?: string[] | null
          updated_at?: string | null
          warranty?: string | null
          website?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_matched_vendors: {
        Args: {
          _customer_lat: number
          _customer_lng: number
          _customer_state: string
          _limit?: number
          _recommended_systems: string[]
        }
        Returns: {
          avg_response_minutes: number
          brands: string[]
          cap_exceeded: boolean
          certifications: string[]
          description: string
          distance_km: number
          highlights: string[]
          logo: string
          matching_systems: string[]
          name: string
          phone: string
          provider_id: string
          rating: number
          response_time: string
          review_count: number
          service_base_state: string
          service_base_suburb: string
          service_radius_km: number
          slug: string
          state_share_pct: number
          system_types: string[]
          warranty: string
          website: string
          win_rate: number
          years_in_business: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected"
      installation_model: "in_house_licensed" | "sub_contracted"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      price_range: "budget" | "mid" | "premium"
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
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected"],
      installation_model: ["in_house_licensed", "sub_contracted"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      price_range: ["budget", "mid", "premium"],
    },
  },
} as const
