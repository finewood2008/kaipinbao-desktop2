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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
          stage: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
          stage?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          stage?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_products: {
        Row: {
          created_at: string
          id: string
          platform: string
          price: string | null
          product_description: string | null
          product_title: string | null
          project_id: string
          rating: number | null
          review_count: number | null
          scraped_data: Json | null
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          price?: string | null
          product_description?: string | null
          product_title?: string | null
          project_id: string
          rating?: number | null
          review_count?: number | null
          scraped_data?: Json | null
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          price?: string | null
          product_description?: string | null
          product_title?: string | null
          project_id?: string
          rating?: number | null
          review_count?: number | null
          scraped_data?: Json | null
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_reviews: {
        Row: {
          competitor_product_id: string
          created_at: string
          id: string
          is_positive: boolean | null
          key_points: string[] | null
          rating: number | null
          review_text: string
          sentiment: string | null
        }
        Insert: {
          competitor_product_id: string
          created_at?: string
          id?: string
          is_positive?: boolean | null
          key_points?: string[] | null
          rating?: number | null
          review_text: string
          sentiment?: string | null
        }
        Update: {
          competitor_product_id?: string
          created_at?: string
          id?: string
          is_positive?: boolean | null
          key_points?: string[] | null
          rating?: number | null
          review_text?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_reviews_competitor_product_id_fkey"
            columns: ["competitor_product_id"]
            isOneToOne: false
            referencedRelation: "competitor_products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          landing_page_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          landing_page_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          landing_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_submissions_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          image_type: string
          image_url: string
          is_selected: boolean
          parent_image_id: string | null
          phase: number
          project_id: string
          prompt: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          image_type?: string
          image_url: string
          is_selected?: boolean
          parent_image_id?: string | null
          phase?: number
          project_id: string
          prompt: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          image_type?: string
          image_url?: string
          is_selected?: boolean
          parent_image_id?: string | null
          phase?: number
          project_id?: string
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_parent_image_id_fkey"
            columns: ["parent_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_videos: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          parent_image_id: string | null
          project_id: string
          prompt: string
          scene_description: string | null
          status: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          parent_image_id?: string | null
          project_id: string
          prompt: string
          scene_description?: string | null
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          parent_image_id?: string | null
          project_id?: string
          prompt?: string
          scene_description?: string | null
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_videos_parent_image_id_fkey"
            columns: ["parent_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          created_at: string
          hero_image_url: string | null
          id: string
          is_published: boolean
          pain_points: Json | null
          project_id: string
          selling_points: Json | null
          slug: string
          title: string
          trust_badges: Json | null
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          pain_points?: Json | null
          project_id: string
          selling_points?: Json | null
          slug: string
          title: string
          trust_badges?: Json | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          pain_points?: Json | null
          project_id?: string
          selling_points?: Json | null
          slug?: string
          title?: string
          trust_badges?: Json | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          competitor_research_completed: boolean | null
          created_at: string
          current_stage: number
          description: string | null
          id: string
          landing_page_data: Json | null
          name: string
          prd_data: Json | null
          prd_progress: Json | null
          status: string
          updated_at: string
          user_id: string
          visual_data: Json | null
        }
        Insert: {
          competitor_research_completed?: boolean | null
          created_at?: string
          current_stage?: number
          description?: string | null
          id?: string
          landing_page_data?: Json | null
          name: string
          prd_data?: Json | null
          prd_progress?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          visual_data?: Json | null
        }
        Update: {
          competitor_research_completed?: boolean | null
          created_at?: string
          current_stage?: number
          description?: string | null
          id?: string
          landing_page_data?: Json | null
          name?: string
          prd_data?: Json | null
          prd_progress?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          visual_data?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
