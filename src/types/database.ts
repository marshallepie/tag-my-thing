export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'nok' | 'moderator' | 'admin' | 'influencer' | 'admin_influencer';
          subscription_plan: 'freemium' | 'pro' | 'enterprise';
          created_at: string;
          updated_at: string;
          location: string | null;
          language: string | null;
          referral_code: string | null;
          is_business_user: boolean;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'nok' | 'moderator' | 'admin' | 'influencer' | 'admin_influencer';
          subscription_plan?: 'freemium' | 'pro' | 'enterprise';
          location?: string | null;
          language?: string | null;
          referral_code?: string | null;
          is_business_user?: boolean;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'nok' | 'moderator' | 'admin' | 'influencer' | 'admin_influencer';
          subscription_plan?: 'freemium' | 'pro' | 'enterprise';
          location?: string | null;
          language?: string | null;
          referral_code?: string | null;
          is_business_user?: boolean;
        };
      };
      user_wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
        };
        Update: {
          balance?: number;
        };
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          tags: string[];
          media_url: string;
          media_type: 'photo' | 'video';
          privacy: 'private' | 'public';
          estimated_value: number | null;
          location: string | null;
          blockchain_hash: string | null;
          blockchain_network: string | null;
          blockchain_status: 'pending' | 'published' | 'failed' | null;
          ipfs_cid: string | null;
          arweave_tx_id: string | null;
          archive_status: 'pending' | 'archived' | 'instant_requested' | 'failed';
          archive_requested_at: string | null;
          archive_method: string | null;
          created_at: string;
          updated_at: string;
          media_items: Array<{
            url: string;
            type: 'photo' | 'video' | 'pdf';
            size?: number; // in bytes
            duration?: number; // in seconds, for video
            token_cost: number;
          }> | null;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          tags?: string[];
          media_url: string;
          media_type: 'photo' | 'video';
          privacy?: 'private' | 'public';
          estimated_value?: number | null;
          location?: string | null;
          blockchain_hash?: string | null;
          blockchain_network?: string | null;
          blockchain_status?: 'pending' | 'published' | 'failed' | null;
          ipfs_cid?: string | null;
          arweave_tx_id?: string | null;
          archive_status?: 'pending' | 'archived' | 'instant_requested' | 'failed';
          archive_requested_at?: string | null;
          archive_method?: string | null;
          media_items?: Array<{ url: string; type: 'photo' | 'video' | 'pdf'; size?: number; duration?: number; token_cost: number; }> | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          tags?: string[];
          privacy?: 'private' | 'public';
          estimated_value?: number | null;
          location?: string | null;
          blockchain_hash?: string | null;
          blockchain_network?: string | null;
          blockchain_status?: 'pending' | 'published' | 'failed' | null;
          ipfs_cid?: string | null;
          arweave_tx_id?: string | null;
          archive_status?: 'pending' | 'archived' | 'instant_requested' | 'failed';
          archive_requested_at?: string | null;
          archive_method?: string | null;
          media_items?: Array<{ url: string; type: 'photo' | 'video' | 'pdf'; size?: number; duration?: number; token_cost: number; }> | null;
        };
      };
      next_of_kin: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          relationship: string;
          photo_url: string | null;
          status: 'pending' | 'verified' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          relationship: string;
          photo_url?: string | null;
          status?: 'pending' | 'verified' | 'declined';
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string | null;
          relationship?: string;
          photo_url?: string | null;
          status?: 'pending' | 'verified' | 'declined';
        };
      };
      asset_nok_assignments: {
        Row: {
          id: string;
          asset_id: string;
          nok_id: string;
          created_at: string;
        };
        Insert: {
          asset_id: string;
          nok_id: string;
        };
        Update: Record<string, never>;
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: 'earned' | 'spent';
          source: 'signup' | 'referral' | 'daily_login' | 'admin_reward' | 'purchase' | 'tag_asset' | 'edit_asset' | 'upload_media' | 'assign_nok' | 'blockchain_publish';
          description: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          type: 'earned' | 'spent';
          source: 'signup' | 'referral' | 'daily_login' | 'admin_reward' | 'purchase' | 'tag_asset' | 'edit_asset' | 'upload_media' | 'assign_nok' | 'blockchain_publish';
          description?: string | null;
        };
        Update: Record<string, never>;
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          referral_code: string;
          referral_level: number;
          status: 'pending' | 'completed' | 'cancelled';
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          referrer_id: string;
          referred_id: string;
          referral_code: string;
          referral_level?: number;
          status?: 'pending' | 'completed' | 'cancelled';
          completed_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'completed' | 'cancelled';
          completed_at?: string | null;
        };
      };
      referral_rewards: {
        Row: {
          id: string;
          referral_id: string;
          referrer_id: string;
          referred_id: string;
          referral_level: number;
          token_amount: number;
          status: 'pending' | 'paid' | 'cancelled';
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          referral_id: string;
          referrer_id: string;
          referred_id: string;
          referral_level: number;
          token_amount: number;
          status?: 'pending' | 'paid' | 'cancelled';
          paid_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'paid' | 'cancelled';
          paid_at?: string | null;
        };
      };
      referral_settings: {
        Row: {
          id: string;
          referral_level: number;
          token_reward: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          referral_level: number;
          token_reward: number;
          active?: boolean;
        };
        Update: {
          token_reward?: number;
          active?: boolean;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          token_limit: number;
          price_gbp: number | null;
          price_xaf: number | null;
          billing_interval: 'monthly' | 'yearly';
          features: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          token_limit: number;
          price_gbp?: number | null;
          price_xaf?: number | null;
          billing_interval: 'monthly' | 'yearly';
          features?: string[];
          active?: boolean;
        };
        Update: {
          name?: string;
          token_limit?: number;
          price_gbp?: number | null;
          price_xaf?: number | null;
          billing_interval?: 'monthly' | 'yearly';
          features?: string[];
          active?: boolean;
        };
      };
      token_packages: {
        Row: {
          id: string;
          name: string;
          token_amount: number;
          bonus_tokens: number;
          price_gbp: number;
          price_xaf: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          token_amount: number;
          bonus_tokens?: number;
          price_gbp: number;
          price_xaf: number;
          active?: boolean;
        };
        Update: {
          name?: string;
          token_amount?: number;
          bonus_tokens?: number;
          price_gbp?: number;
          price_xaf?: number;
          active?: boolean;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          payment_method: 'stripe' | 'mtn_money' | 'orange_money';
          stripe_payment_intent_id: string | null;
          mobile_money_reference: string | null;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          type: 'subscription' | 'tokens';
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          currency: string;
          payment_method: 'stripe' | 'mtn_money' | 'orange_money';
          stripe_payment_intent_id?: string | null;
          mobile_money_reference?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          type: 'subscription' | 'tokens';
          metadata?: Record<string, any> | null;
        };
        Update: {
          stripe_payment_intent_id?: string | null;
          mobile_money_reference?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          metadata?: Record<string, any> | null;
        };
      };
      products: {
        Row: {
          id: string;
          product_name: string;
          serial_number: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          business_user_id: string;
        };
        Insert: {
          product_name: string;
          serial_number: string;
          description?: string | null;
          business_user_id: string;
        };
        Update: {
          product_name?: string;
          serial_number?: string;
          description?: string | null;
          business_user_id?: string;
        };
      };
      scan_events: {
        Row: {
          id: string;
          serial_number: string;
          scanned_at: string;
          ip_address: string | null;
          location: string | null;
          device_info: string | null;
          user_id: string | null;
        };
        Insert: {
          serial_number: string;
          ip_address?: string | null;
          location?: string | null;
          device_info?: string | null;
          user_id?: string | null;
        };
        Update: Record<string, never>; // Immutable
      };
    };
    Views: Record<string, never>;
    Functions: {
      register_product: {
        Args: {
          p_product_name: string;
          p_serial_number: string;
          p_description?: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          product_id?: string;
        };
      };
      verify_product_scan: {
        Args: {
          p_serial_number: string;
          p_ip_address: string;
          p_location?: string;
          p_device_info?: string;
        };
        Returns: {
          authentic: boolean;
          message: string;
          scan_count?: number;
          scan_history?: any[];
          flagged_for_review?: boolean;
        };
      };
      get_product_scan_history: {
        Args: {
          p_serial_number: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          scan_history?: any[];
        };
      };
      get_business_products: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          product_name: string;
          serial_number: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          business_user_id: string;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}