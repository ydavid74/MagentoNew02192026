export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string | null;
          entity: string | null;
          entity_id: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string | null;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string | null;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          billing_addr: Json | null;
          created_at: string | null;
          email: string | null;
          id: string;
          name: string | null;
          phone: string | null;
          shipping_addr: Json | null;
        };
        Insert: {
          billing_addr?: Json | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string | null;
          phone?: string | null;
          shipping_addr?: Json | null;
        };
        Update: {
          billing_addr?: Json | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string | null;
          phone?: string | null;
          shipping_addr?: Json | null;
        };
        Relationships: [];
      };
      diamond_movements: {
        Row: {
          amount: number | null;
          created_at: string | null;
          created_by: string | null;
          direction: string | null;
          id: string;
          parcel_id: string | null;
          reason: string | null;
          related_order: string | null;
          subparcel_id: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          direction?: string | null;
          id?: string;
          parcel_id?: string | null;
          reason?: string | null;
          related_order?: string | null;
          subparcel_id?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          direction?: string | null;
          id?: string;
          parcel_id?: string | null;
          reason?: string | null;
          related_order?: string | null;
          subparcel_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "diamond_movements_parcel_id_fkey";
            columns: ["parcel_id"];
            isOneToOne: false;
            referencedRelation: "diamond_parcels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diamond_movements_related_order_fkey";
            columns: ["related_order"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diamond_movements_subparcel_id_fkey";
            columns: ["subparcel_id"];
            isOneToOne: false;
            referencedRelation: "diamond_subparcels";
            referencedColumns: ["id"];
          }
        ];
      };
      diamond_parcels: {
        Row: {
          carat_total: number | null;
          clarity: string | null;
          color: string | null;
          created_at: string | null;
          id: string;
          min_level: number | null;
          name: string | null;
          parcel_code: string | null;
          shape: string | null;
        };
        Insert: {
          carat_total?: number | null;
          clarity?: string | null;
          color?: string | null;
          created_at?: string | null;
          id?: string;
          min_level?: number | null;
          name?: string | null;
          parcel_code?: string | null;
          shape?: string | null;
        };
        Update: {
          carat_total?: number | null;
          clarity?: string | null;
          color?: string | null;
          created_at?: string | null;
          id?: string;
          min_level?: number | null;
          name?: string | null;
          parcel_code?: string | null;
          shape?: string | null;
        };
        Relationships: [];
      };
      diamond_subparcels: {
        Row: {
          carat: number | null;
          created_at: string | null;
          id: string;
          parcel_id: string | null;
          sub_code: string | null;
        };
        Insert: {
          carat?: number | null;
          created_at?: string | null;
          id?: string;
          parcel_id?: string | null;
          sub_code?: string | null;
        };
        Update: {
          carat?: number | null;
          created_at?: string | null;
          id?: string;
          parcel_id?: string | null;
          sub_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "diamond_subparcels_parcel_id_fkey";
            columns: ["parcel_id"];
            isOneToOne: false;
            referencedRelation: "diamond_parcels";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          content_type: string | null;
          created_at: string | null;
          file_url: string | null;
          filename: string | null;
          id: string;
          order_id: string | null;
          size: number | null;
          type: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          content_type?: string | null;
          created_at?: string | null;
          file_url?: string | null;
          filename?: string | null;
          id?: string;
          order_id?: string | null;
          size?: number | null;
          type?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          content_type?: string | null;
          created_at?: string | null;
          file_url?: string | null;
          filename?: string | null;
          id?: string;
          order_id?: string | null;
          size?: number | null;
          type?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      order_invoice: {
        Row: {
          id: string;
          order_id: string;
          invoice_number: string;
          html_content: string;
          total_amount: number | null;
          status: string | null;
          generated_at: string | null;
          generated_by: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          invoice_number: string;
          html_content: string;
          total_amount?: number | null;
          status?: string | null;
          generated_at?: string | null;
          generated_by?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          invoice_number?: string;
          html_content?: string;
          total_amount?: number | null;
          status?: string | null;
          generated_at?: string | null;
          generated_by?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_invoice_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_invoice_generated_by_fkey";
            columns: ["generated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      employee_notes: {
        Row: {
          content: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          order_id: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          order_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          order_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employee_notes_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      import_logs: {
        Row: {
          counts: Json | null;
          created_by: string | null;
          ended_at: string | null;
          errors: Json | null;
          id: string;
          import_type: string | null;
          started_at: string | null;
          status: string | null;
        };
        Insert: {
          counts?: Json | null;
          created_by?: string | null;
          ended_at?: string | null;
          errors?: Json | null;
          id?: string;
          import_type?: string | null;
          started_at?: string | null;
          status?: string | null;
        };
        Update: {
          counts?: Json | null;
          created_by?: string | null;
          ended_at?: string | null;
          errors?: Json | null;
          id?: string;
          import_type?: string | null;
          started_at?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      order_customer_notes: {
        Row: {
          content: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_important: boolean | null;
          order_id: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_important?: boolean | null;
          order_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_important?: boolean | null;
          order_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_comments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      order_costs: {
        Row: {
          casting: number | null;
          diamond: number | null;
          labor: number | null;
          order_id: string;
          updated_at: string | null;
        };
        Insert: {
          casting?: number | null;
          diamond?: number | null;
          labor?: number | null;
          order_id: string;
          updated_at?: string | null;
        };
        Update: {
          casting?: number | null;
          diamond?: number | null;
          labor?: number | null;
          order_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_costs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          created_at: string | null;
          details: string | null;
          id: string;
          metal_type: string | null;
          order_id: string | null;
          price: number | null;
          qty: number | null;
          size: string | null;
          sku: string | null;
        };
        Insert: {
          created_at?: string | null;
          details?: string | null;
          id?: string;
          metal_type?: string | null;
          order_id?: string | null;
          price?: number | null;
          qty?: number | null;
          size?: string | null;
          sku?: string | null;
        };
        Update: {
          created_at?: string | null;
          details?: string | null;
          id?: string;
          metal_type?: string | null;
          order_id?: string | null;
          price?: number | null;
          qty?: number | null;
          size?: string | null;
          sku?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      order_status_history: {
        Row: {
          comment: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          order_id: string | null;
          status: string | null;
        };
        Insert: {
          comment?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          order_id?: string | null;
          status?: string | null;
        };
        Update: {
          comment?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          order_id?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          created_at: string | null;
          current_status: string | null;
          customer_id: string | null;
          delivery_method: string | null;
          id: string;
          order_date: string | null;
          purchase_from: string | null;
          shopify_order_number: string | null;
          total_amount: number | null;
        };
        Insert: {
          created_at?: string | null;
          current_status?: string | null;
          customer_id?: string | null;
          delivery_method?: string | null;
          id?: string;
          order_date?: string | null;
          purchase_from?: string | null;
          shopify_order_number?: string | null;
          total_amount?: number | null;
        };
        Update: {
          created_at?: string | null;
          current_status?: string | null;
          customer_id?: string | null;
          delivery_method?: string | null;
          id?: string;
          order_date?: string | null;
          purchase_from?: string | null;
          shopify_order_number?: string | null;
          total_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      shipping_entries: {
        Row: {
          created_at: string | null;
          file_url: string | null;
          id: string;
          item_id: string | null;
          order_id: string | null;
          type: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_url?: string | null;
          id?: string;
          item_id?: string | null;
          order_id?: string | null;
          type?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_url?: string | null;
          id?: string;
          item_id?: string | null;
          order_id?: string | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shipping_entries_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shipping_entries_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      order_customer_notes: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          note: string | null;
          is_automated: boolean | null;
          triggered_by_rule_id: string | null;
          created_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          note?: string | null;
          is_automated?: boolean | null;
          triggered_by_rule_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          note?: string | null;
          is_automated?: boolean | null;
          triggered_by_rule_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_customer_notes_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_customer_notes_triggered_by_rule_id_fkey";
            columns: ["triggered_by_rule_id"];
            isOneToOne: false;
            referencedRelation: "statuses_model";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_customer_notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      statuses_model: {
        Row: {
          id: string;
          status: string;
          new_status: string;
          wait_time_business_days: number | null;
          description: string | null;
          private_email: string | null;
          email_subject: string | null;
          email_custom_message: string | null;
          additional_recipients: string[] | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          status: string;
          new_status: string;
          wait_time_business_days?: number | null;
          description?: string | null;
          private_email?: string | null;
          email_subject?: string | null;
          email_custom_message?: string | null;
          additional_recipients?: string[] | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          status?: string;
          new_status?: string;
          wait_time_business_days?: number | null;
          description?: string | null;
          private_email?: string | null;
          email_subject?: string | null;
          email_custom_message?: string | null;
          additional_recipients?: string[] | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          order_id: string | null;
          status_rule_id: string | null;
          email_type: string;
          recipient_email: string;
          subject: string;
          message: string;
          sent_at: string | null;
          status: string;
          error_message: string | null;
          shopify_email_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          status_rule_id?: string | null;
          email_type: string;
          recipient_email: string;
          subject: string;
          message: string;
          sent_at?: string | null;
          status: string;
          error_message?: string | null;
          shopify_email_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          status_rule_id?: string | null;
          email_type?: string;
          recipient_email?: string;
          subject?: string;
          message?: string;
          sent_at?: string | null;
          status?: string;
          error_message?: string | null;
          shopify_email_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_logs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_logs_status_rule_id_fkey";
            columns: ["status_rule_id"];
            isOneToOne: false;
            referencedRelation: "statuses_model";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
