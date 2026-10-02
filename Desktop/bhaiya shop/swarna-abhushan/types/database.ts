export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          firm_name: string | null;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          status: 'active' | 'inactive' | null;
          frames_name: string | null;
          photo_url: string | null;
          role: 'user' | 'admin' | 'tech';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          firm_name?: string | null;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          status?: 'active' | 'inactive' | null;
          frames_name?: string | null;
          photo_url?: string | null;
          role?: 'user' | 'admin' | 'tech';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          firm_name?: string | null;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          status?: 'active' | 'inactive' | null;
          frames_name?: string | null;
          photo_url?: string | null;
          role?: 'user' | 'admin' | 'tech';
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          image_url: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          image_url?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          image_url?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          short_description: string;
          full_description: string;
          metal_type: string | null;
          purity: string | null;
          weight: string | null;
          image_url: string | null;
          is_featured: boolean;
          is_new_arrival: boolean;
          is_best_seller: boolean;
          is_active: boolean;
          display_order: number;
          price: number | null;
          original_price: number | null;
          making_charges: number | null;
          stock_quantity: number;
          sku: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id?: string | null;
          short_description: string;
          full_description: string;
          metal_type?: string | null;
          purity?: string | null;
          weight?: string | null;
          image_url?: string | null;
          is_featured?: boolean;
          is_new_arrival?: boolean;
          is_best_seller?: boolean;
          is_active?: boolean;
          display_order?: number;
          price?: number | null;
          original_price?: number | null;
          making_charges?: number | null;
          stock_quantity?: number;
          sku?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category_id?: string | null;
          short_description?: string;
          full_description?: string;
          metal_type?: string | null;
          purity?: string | null;
          weight?: string | null;
          image_url?: string | null;
          is_featured?: boolean;
          is_new_arrival?: boolean;
          is_best_seller?: boolean;
          is_active?: boolean;
          display_order?: number;
          price?: number | null;
          original_price?: number | null;
          making_charges?: number | null;
          stock_quantity?: number;
          sku?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gold_rates: {
        Row: {
          id: string;
          metal_name: string;
          purity: string;
          price: number;
          unit: string;
          effective_date: string;
          is_current: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          metal_name: string;
          purity: string;
          price: number;
          unit?: string;
          effective_date?: string;
          is_current?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          metal_name?: string;
          purity?: string;
          price?: number;
          unit?: string;
          effective_date?: string;
          is_current?: boolean;
          updated_at?: string;
        };
      };
      home_banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string;
          image_url: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string;
          image_url?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string;
          image_url?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: string | null;
          is_public: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value?: string | null;
          is_public?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: string | null;
          is_public?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      testimonials: {
        Row: {
          id: string;
          customer_name: string;
          rating: number;
          review_text: string;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          rating: number;
          review_text: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          rating?: number;
          review_text?: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      favourites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          message: string;
          target_route: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          message: string;
          target_route?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          message?: string;
          target_route?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      live_rate_history: {
        Row: {
          id: string;
          metal: string;
          purity: string;
          price: number;
          price_per_gram: number;
          price_per_10_gram: number;
          source: string;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          metal: string;
          purity?: string;
          price: number;
          price_per_gram?: number;
          price_per_10_gram?: number;
          source?: string;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          metal?: string;
          purity?: string;
          price?: number;
          price_per_gram?: number;
          price_per_10_gram?: number;
          source?: string;
          recorded_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
