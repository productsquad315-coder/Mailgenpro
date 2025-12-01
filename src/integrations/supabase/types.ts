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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      campaign_shares: {
        Row: {
          allow_export: boolean
          campaign_id: string
          created_at: string | null
          created_by: string | null
          id: string
          share_token: string
        }
        Insert: {
          allow_export?: boolean
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          share_token: string
        }
        Update: {
          allow_export?: boolean
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_shares_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          analyzed_data: Json | null
          created_at: string
          cta_link: string | null
          drip_duration: string | null
          id: string
          include_cta: boolean | null
          name: string
          sequence_type: string | null
          status: string
          updated_at: string
          url: string
          user_id: string | null
          words_per_email: number | null
        }
        Insert: {
          analyzed_data?: Json | null
          created_at?: string
          cta_link?: string | null
          drip_duration?: string | null
          id?: string
          include_cta?: boolean | null
          name: string
          sequence_type?: string | null
          status?: string
          updated_at?: string
          url: string
          user_id?: string | null
          words_per_email?: number | null
        }
        Update: {
          analyzed_data?: Json | null
          created_at?: string
          cta_link?: string | null
          drip_duration?: string | null
          id?: string
          include_cta?: boolean | null
          name?: string
          sequence_type?: string | null
          status?: string
          updated_at?: string
          url?: string
          user_id?: string | null
          words_per_email?: number | null
        }
        Relationships: []
      }
      contact_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          total_contacts: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          total_contacts?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          total_contacts?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          custom_fields: Json | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          list_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          custom_fields?: Json | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          list_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          custom_fields?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          list_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_purchases: {
        Row: {
          amount_usd: number
          created_at: string | null
          credits_purchased: number
          id: string
          payment_id: string | null
          payment_provider: string | null
          payment_status: string | null
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string | null
          credits_purchased: number
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string | null
          credits_purchased?: number
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_credits: {
        Row: {
          created_at: string | null
          credits_free: number | null
          credits_paid: number | null
          credits_total: number | null
          credits_used_this_month: number | null
          id: string
          last_reset_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_free?: number | null
          credits_paid?: number | null
          credits_total?: number | null
          credits_used_this_month?: number | null
          id?: string
          last_reset_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_free?: number | null
          credits_paid?: number | null
          credits_total?: number | null
          credits_used_this_month?: number | null
          id?: string
          last_reset_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_queue: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string | null
          emails_failed: number | null
          emails_sent: number | null
          id: string
          started_at: string | null
          status: string | null
          total_emails: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string | null
          emails_failed?: number | null
          emails_sent?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          total_emails: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string | null
          emails_failed?: number | null
          emails_sent?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          total_emails?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_send_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          bounced_at: string | null
          campaign_id: string | null
          clicked_at: string | null
          contact_id: string | null
          delivered_at: string | null
          email_sequence_id: string | null
          error_message: string | null
          esp_message_id: string | null
          esp_provider: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          queued_at: string | null
          recipient_email: string
          sent_at: string | null
          status: string | null
          subject: string
          user_id: string
        }
        Insert: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          contact_id?: string | null
          delivered_at?: string | null
          email_sequence_id?: string | null
          error_message?: string | null
          esp_message_id?: string | null
          esp_provider?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          queued_at?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          subject: string
          user_id: string
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          contact_id?: string | null
          delivered_at?: string | null
          email_sequence_id?: string | null
          error_message?: string | null
          esp_message_id?: string | null
          esp_provider?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          queued_at?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_email_sequence_id_fkey"
            columns: ["email_sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          email_type: string
          html_content: string
          id: string
          sequence_number: number
          subject: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          email_type: string
          html_content: string
          id?: string
          sequence_number: number
          subject: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          email_type?: string
          html_content?: string
          id?: string
          sequence_number?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_role: string | null
          avatar_url: string | null
          brand_guidelines: Json | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          ui_theme: string | null
          updated_at: string
          user_platform: string | null
        }
        Insert: {
          app_role?: string | null
          avatar_url?: string | null
          brand_guidelines?: Json | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          ui_theme?: string | null
          updated_at?: string
          user_platform?: string | null
        }
        Update: {
          app_role?: string | null
          avatar_url?: string | null
          brand_guidelines?: Json | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          ui_theme?: string | null
          updated_at?: string
          user_platform?: string | null
        }
        Relationships: []
      }
      unsubscribes: {
        Row: {
          campaign_id: string | null
          email: string
          id: string
          reason: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          email: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          email?: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          created_at: string
          current_period_end: string | null
          generations_limit: number
          generations_used: number
          id: string
          lemonsqueezy_customer_id: string | null
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          plan: string
          subscription_id: string | null
          subscription_status: string | null
          topup_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          generations_limit?: number
          generations_used?: number
          id?: string
          lemonsqueezy_customer_id?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          subscription_id?: string | null
          subscription_status?: string | null
          topup_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          generations_limit?: number
          generations_used?: number
          id?: string
          lemonsqueezy_customer_id?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          subscription_id?: string | null
          subscription_status?: string | null
          topup_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_topup_credits: {
        Args: { p_credits: number; p_user_id: string }
        Returns: undefined
      }
      deduct_email_credit: { Args: { p_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_generations: {
        Args: { user_id: string }
        Returns: undefined
      }
      refresh_monthly_email_credits: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
