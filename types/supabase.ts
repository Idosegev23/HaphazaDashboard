export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          email: string
          is_blocked: boolean | null
          language: Database["public"]["Enums"]["language_code"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          email: string
          is_blocked?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          is_blocked?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
          user_id?: string
        }
      }
      campaigns: {
        Row: {
          brand_id: string
          brief: string | null
          brief_url: string | null
          concept: string | null
          created_at: string | null
          currency: string | null
          deadline: string | null
          deliverables: Json | null
          description: string | null
          fixed_price: number | null
          id: string
          objective: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          brief?: string | null
          brief_url?: string | null
          concept?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          deliverables?: Json | null
          description?: string | null
          fixed_price?: number | null
          id?: string
          objective?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          brief?: string | null
          brief_url?: string | null
          concept?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          deliverables?: Json | null
          description?: string | null
          fixed_price?: number | null
          id?: string
          objective?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title?: string
          updated_at?: string | null
        }
      }
      tasks: {
        Row: {
          campaign_id: string
          created_at: string | null
          creator_id: string
          due_at: string | null
          id: string
          payment_amount: number | null
          product_requirements: string | null
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
          product_requirements?: string | null
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
          product_requirements?: string | null
          requires_product?: boolean | null
          shipment_request_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
      }
    }
    Enums: {
      language_code: "he" | "en"
      campaign_status: "draft" | "open" | "closed" | "archived"
      task_status: "selected" | "in_production" | "uploaded" | "needs_edits" | "approved" | "paid" | "disputed"
    }
  }
}
