import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole =
  | 'super_admin'
  | 'water_admin'
  | 'water_cashier'
  | 'driver'
  | 'rb_manager'
  | 'rb_cashier';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  business_id: string | null;
  shop_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  last_login: string | null;
}
