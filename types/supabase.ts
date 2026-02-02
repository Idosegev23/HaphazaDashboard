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
      application_feedback: {
        Row: {
          application_id: string
          created_at: string | null
          decision: string
          id: string
          note: string | null
          reason_code: Database["public"]["Enums"]["rejection_reason"] | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          decision: string
          id?: string
          note?: string | null
          reason_code?: Database["public"]["Enums"]["rejection_reason"] | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          decision?: string
          id?: string
          note?: string | null
          reason_code?: Database["public"]["Enums"]["rejection_reason"] | null
        }
        Relationships: [
          {
            foreignKeyName: "application_feedback_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          availability: string | null
          campaign_id: string
          created_at: string | null
          creator_id: string
          deliverable_notes: string | null
          id: string
          message: string | null
          portfolio_links: string | null
          proposed_price: number | null
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          campaign_id: string
          created_at?: string | null
          creator_id: string
          deliverable_notes?: string | null
          id?: string
          message?: string | null
          portfolio_links?: string | null
          proposed_price?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          campaign_id?: string
          created_at?: string | null
          creator_id?: string
          deliverable_notes?: string | null
          id?: string
          message?: string | null
          portfolio_links?: string | null
          proposed_price?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["user_id"]
          },
        ]
      }
      approvals: {
        Row: {
          created_at: string | null
          decision: string
          id: string
          note: string | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          decision: string
          id?: string
          note?: string | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          decision?: string
          id?: string
          note?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_assets: {
        Row: {
          created_at: string | null
          id: string
          task_id: string
          usage_type: Database["public"]["Enums"]["asset_usage_type"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_id: string
          usage_type?: Database["public"]["Enums"]["asset_usage_type"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          task_id?: string
          usage_type?: Database["public"]["Enums"]["asset_usage_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_assets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      brand_billing_profiles: {
        Row: {
          brand_id: string
          created_at: string | null
          status: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_billing_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_users: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_users_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          default_language: Database["public"]["Enums"]["language_code"] | null
          id: string
          industry: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          default_language?: Database["public"]["Enums"]["language_code"] | null
          id?: string
          industry?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          default_language?: Database["public"]["Enums"]["language_code"] | null
          id?: string
          industry?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      brief_sections: {
        Row: {
          campaign_id: string
          content: Json | null
          created_at: string | null
          id: string
          order_index: number | null
          section_key: string
        }
        Insert: {
          campaign_id: string
          content?: Json | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          section_key: string
        }
        Update: {
          campaign_id?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          section_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_sections_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_products: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          quantity: number | null
          sku: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          quantity?: number | null
          sku?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          quantity?: number | null
          sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand_id: string
          budget_max: number | null
          budget_min: number | null
          concept: string | null
          created_at: string | null
          currency: string | null
          deadline: string | null
          id: string
          objective: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          budget_max?: number | null
          budget_min?: number | null
          concept?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          id?: string
          objective?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          budget_max?: number | null
          budget_min?: number | null
          concept?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          id?: string
          objective?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_metrics: {
        Row: {
          approval_rate: number | null
          approved_tasks: number | null
          average_rating: number | null
          creator_id: string
          id: string
          last_updated: string | null
          late_deliveries: number | null
          on_time_deliveries: number | null
          on_time_rate: number | null
          rejected_tasks: number | null
          total_tasks: number | null
        }
        Insert: {
          approval_rate?: number | null
          approved_tasks?: number | null
          average_rating?: number | null
          creator_id: string
          id?: string
          last_updated?: string | null
          late_deliveries?: number | null
          on_time_deliveries?: number | null
          on_time_rate?: number | null
          rejected_tasks?: number | null
          total_tasks?: number | null
        }
        Update: {
          approval_rate?: number | null
          approved_tasks?: number | null
          average_rating?: number | null
          creator_id?: string
          id?: string
          last_updated?: string | null
          late_deliveries?: number | null
          on_time_deliveries?: number | null
          on_time_rate?: number | null
          rejected_tasks?: number | null
          total_tasks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_metrics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["user_id"]
          },
        ]
      }
      creators: {
        Row: {
          age_range: string | null
          country: string | null
          created_at: string | null
          gender: string | null
          is_inventory: boolean | null
          niches: string[] | null
          occupations: string[] | null
          platforms: Json | null
          portfolio_links: string[] | null
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_range?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          is_inventory?: boolean | null
          niches?: string[] | null
          occupations?: string[] | null
          platforms?: Json | null
          portfolio_links?: string[] | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_range?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          is_inventory?: boolean | null
          niches?: string[] | null
          occupations?: string[] | null
          platforms?: Json | null
          portfolio_links?: string[] | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deliverable_templates: {
        Row: {
          campaign_id: string
          created_at: string | null
          default_deadline_days: number | null
          id: string
          name: string
          requirements: Json | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          default_deadline_days?: number | null
          id?: string
          name: string
          requirements?: Json | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          default_deadline_days?: number | null
          id?: string
          name?: string
          requirements?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_templates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string | null
          id: string
          raised_by: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          raised_by: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          raised_by?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "users_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      i18n_strings: {
        Row: {
          created_at: string | null
          en: string | null
          he: string | null
          id: string
          key: string
          namespace: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          en?: string | null
          he?: string | null
          id?: string
          key: string
          namespace: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          en?: string | null
          he?: string | null
          id?: string
          key?: string
          namespace?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_url: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          communication: number | null
          created_at: string | null
          favorite: boolean | null
          id: string
          note: string | null
          on_time: number | null
          quality: number | null
          revision: number | null
          task_id: string
        }
        Insert: {
          communication?: number | null
          created_at?: string | null
          favorite?: boolean | null
          id?: string
          note?: string | null
          on_time?: number | null
          quality?: number | null
          revision?: number | null
          task_id: string
        }
        Update: {
          communication?: number | null
          created_at?: string | null
          favorite?: boolean | null
          id?: string
          note?: string | null
          on_time?: number | null
          quality?: number | null
          revision?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_requests: {
        Row: {
          created_at: string | null
          id: string
          note: string
          resolved_at: string | null
          status: string | null
          tags: string[] | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          resolved_at?: string | null
          status?: string | null
          tags?: string[] | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          resolved_at?: string | null
          status?: string | null
          tags?: string[] | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      selections: {
        Row: {
          campaign_id: string
          creator_id: string
          id: string
          selected_at: string | null
        }
        Insert: {
          campaign_id: string
          creator_id: string
          id?: string
          selected_at?: string | null
        }
        Update: {
          campaign_id?: string
          creator_id?: string
          id?: string
          selected_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "selections_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selections_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipment_addresses: {
        Row: {
          apartment: string | null
          city: string
          country: string
          created_at: string | null
          creator_id: string
          full_name: string
          house_number: string
          id: string
          is_default: boolean | null
          notes: string | null
          phone: string
          postal_code: string | null
          street: string
        }
        Insert: {
          apartment?: string | null
          city: string
          country: string
          created_at?: string | null
          creator_id: string
          full_name: string
          house_number: string
          id?: string
          is_default?: boolean | null
          notes?: string | null
          phone: string
          postal_code?: string | null
          street: string
        }
        Update: {
          apartment?: string | null
          city?: string
          country?: string
          created_at?: string | null
          creator_id?: string
          full_name?: string
          house_number?: string
          id?: string
          is_default?: boolean | null
          notes?: string | null
          phone?: string
          postal_code?: string | null
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_addresses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipment_requests: {
        Row: {
          address_id: string | null
          campaign_id: string
          created_at: string | null
          creator_id: string
          id: string
          status: Database["public"]["Enums"]["shipment_status"] | null
          updated_at: string | null
        }
        Insert: {
          address_id?: string | null
          campaign_id: string
          created_at?: string | null
          creator_id: string
          id?: string
          status?: Database["public"]["Enums"]["shipment_status"] | null
          updated_at?: string | null
        }
        Update: {
          address_id?: string | null
          campaign_id?: string
          created_at?: string | null
          creator_id?: string
          id?: string
          status?: Database["public"]["Enums"]["shipment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_shipment_requests_address"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "shipment_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          delivered_at: string | null
          id: string
          issue_note: string | null
          issue_reason: string | null
          shipment_request_id: string
          shipped_at: string | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          tracking_number: string | null
        }
        Insert: {
          carrier?: string | null
          delivered_at?: string | null
          id?: string
          issue_note?: string | null
          issue_reason?: string | null
          shipment_request_id: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          tracking_number?: string | null
        }
        Update: {
          carrier?: string | null
          delivered_at?: string | null
          id?: string
          issue_note?: string | null
          issue_reason?: string | null
          shipment_request_id?: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      task_eligibility_rules: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          rule_key: string
          rule_value: Json | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          rule_key: string
          rule_value?: Json | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          rule_key?: string
          rule_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_eligibility_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          campaign_id: string
          created_at: string | null
          creator_id: string
          due_at: string | null
          id: string
          payment_amount: number | null
          requires_product: boolean | null
          shipment_request_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          creator_id: string
          due_at?: string | null
          id?: string
          payment_amount?: number | null
          requires_product?: boolean | null
          shipment_request_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          creator_id?: string
          due_at?: string | null
          id?: string
          payment_amount?: number | null
          requires_product?: boolean | null
          shipment_request_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_shipment_request"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "deliverable_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          key: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          key: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          key?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      uploads: {
        Row: {
          created_at: string | null
          id: string
          meta: Json | null
          status: string | null
          storage_path: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          status?: string | null
          storage_path: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          status?: string | null
          storage_path?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profiles: {
        Row: {
          created_at: string | null
          display_name: string
          email: string
          is_blocked: boolean | null
          language: Database["public"]["Enums"]["language_code"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          email: string
          is_blocked?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email?: string
          is_blocked?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_application_and_create_tasks: {
        Args: { p_application_id: string; p_note?: string }
        Returns: Json
      }
      approve_task_and_create_payment: {
        Args: {
          p_amount: number
          p_currency?: string
          p_note?: string
          p_task_id: string
        }
        Returns: Json
      }
      calculate_creator_metrics: {
        Args: { p_creator_id: string }
        Returns: undefined
      }
      create_manual_shipment: {
        Args: {
          p_shipment_request_id: string
          p_status?: Database["public"]["Enums"]["shipment_status"]
          p_tracking_number: string
        }
        Returns: Json
      }
      create_shipment_request: {
        Args: { p_campaign_id: string; p_creator_id: string }
        Returns: Json
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_brand_member: { Args: { brand_uuid: string }; Returns: boolean }
      is_creator: { Args: Record<PropertyKey, never>; Returns: boolean }
      log_audit: {
        Args: {
          p_action: string
          p_entity: string
          p_entity_id: string
          p_metadata?: Json
        }
        Returns: string
      }
      mark_payment_paid: {
        Args: { p_invoice_url?: string; p_payment_id: string }
        Returns: Json
      }
      reject_application_with_feedback: {
        Args: {
          p_application_id: string
          p_note: string
          p_reason_code: string
        }
        Returns: Json
      }
      request_revision: {
        Args: { p_note: string; p_tags: string[]; p_task_id: string }
        Returns: Json
      }
      submit_shipment_address: {
        Args: { p_address_id: string; p_shipment_request_id: string }
        Returns: Json
      }
      try_move_task_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["task_status"]
          p_task_id: string
        }
        Returns: Json
      }
      validate_task_status_transition: {
        Args: {
          p_new_status: Database["public"]["Enums"]["task_status"]
          p_task_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      application_status: "submitted" | "approved" | "rejected"
      asset_usage_type: "organic" | "ads"
      campaign_status: "draft" | "open" | "closed" | "archived"
      dispute_status: "open" | "in_review" | "resolved" | "rejected"
      language_code: "he" | "en"
      payment_status: "pending" | "approved_for_payment" | "paid" | "failed"
      rejection_reason:
        | "not_relevant"
        | "low_quality_profile"
        | "insufficient_followers"
        | "wrong_niche"
        | "timing_issue"
        | "budget_mismatch"
        | "other"
      shipment_status:
        | "not_requested"
        | "waiting_address"
        | "address_received"
        | "shipped"
        | "delivered"
        | "issue"
      task_status:
        | "selected"
        | "in_production"
        | "uploaded"
        | "needs_edits"
        | "approved"
        | "paid"
        | "disputed"
      user_role:
        | "admin"
        | "finance"
        | "support"
        | "content_ops"
        | "brand_manager"
        | "brand_user"
        | "creator"
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
      application_status: ["submitted", "approved", "rejected"],
      asset_usage_type: ["organic", "ads"],
      campaign_status: ["draft", "open", "closed", "archived"],
      dispute_status: ["open", "in_review", "resolved", "rejected"],
      language_code: ["he", "en"],
      payment_status: ["pending", "approved_for_payment", "paid", "failed"],
      rejection_reason: [
        "not_relevant",
        "low_quality_profile",
        "insufficient_followers",
        "wrong_niche",
        "timing_issue",
        "budget_mismatch",
        "other",
      ],
      shipment_status: [
        "not_requested",
        "waiting_address",
        "address_received",
        "shipped",
        "delivered",
        "issue",
      ],
      task_status: [
        "selected",
        "in_production",
        "uploaded",
        "needs_edits",
        "approved",
        "paid",
        "disputed",
      ],
      user_role: [
        "admin",
        "finance",
        "support",
        "content_ops",
        "brand_manager",
        "brand_user",
        "creator",
      ],
    },
  },
} as const
