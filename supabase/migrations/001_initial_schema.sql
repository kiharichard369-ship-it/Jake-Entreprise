-- ============================================================
-- Jake's Enterprise — Business Management Platform
-- Supabase Migration: 001_initial_schema.sql
-- Mirie Technologies · May 2026
-- ============================================================

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== TABLES ====================

-- SHOPS (must come before profiles due to FK)
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  business_id text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz DEFAULT now()
);

-- PROFILES (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin','water_admin','water_cashier','driver','rb_manager','rb_cashier')),
  business_id text,
  shop_id uuid REFERENCES shops(id),
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- WATER RETAIL STOCK
CREATE TABLE IF NOT EXISTS water_stock_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  shop_id uuid REFERENCES shops(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS water_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES water_stock_categories(id),
  shop_id uuid REFERENCES shops(id),
  size_label text NOT NULL,
  size_ml int,
  price numeric(10,2) NOT NULL DEFAULT 0,
  current_stock int DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  updated_at timestamptz DEFAULT now()
);

-- R&B STOCK
CREATE TABLE IF NOT EXISTS rb_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('raw','cooked')),
  sub_category text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  current_stock numeric(10,3) DEFAULT 0,
  unit text DEFAULT 'piece' CHECK (unit IN ('piece','kg','pack')),
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  updated_at timestamptz DEFAULT now()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  location text,
  customer_type text CHECK (customer_type IN ('walk_in','delivery')),
  business_id text,
  shop_id uuid REFERENCES shops(id),
  credit_balance numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- DISCOUNTS
CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  shop_id uuid REFERENCES shops(id),
  name text NOT NULL,
  discount_type text CHECK (discount_type IN ('percent','flat')),
  value numeric(10,2) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz DEFAULT now()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  shop_id uuid REFERENCES shops(id),
  cashier_id uuid REFERENCES profiles(id),
  customer_id uuid REFERENCES customers(id),
  payment_method text CHECK (payment_method IN ('mpesa','cash')),
  subtotal numeric(10,2),
  discount_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  mpesa_ref text,
  mpesa_phone text,
  status text DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  receipt_ref text UNIQUE DEFAULT 'RCP-' || upper(substr(gen_random_uuid()::text, 1, 8)),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  category text,
  qty numeric(10,3) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) NOT NULL
);

-- CUSTOMER CREDITS
CREATE TABLE IF NOT EXISTS customer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  transaction_id uuid REFERENCES transactions(id),
  type text CHECK (type IN ('overpayment','applied','manual_adjustment')),
  amount numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  notes text,
  staff_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- WATER DELIVERY
CREATE TABLE IF NOT EXISTS delivery_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id),
  shop_id uuid REFERENCES shops(id),
  trip_date date DEFAULT current_date,
  dispatch_time timestamptz,
  delivery_time timestamptz,
  return_time timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','dispatched','delivered','returned')),
  gps_tracker_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES delivery_trips(id),
  customer_id uuid REFERENCES customers(id),
  product_id uuid REFERENCES water_products(id),
  product_name text,
  quantity numeric(10,3),
  litres_delivered numeric(10,2),
  amount_due numeric(10,2),
  payment_status text DEFAULT 'paid' CHECK (payment_status IN ('paid','unpaid'))
);

-- DEBT MODULE
CREATE TABLE IF NOT EXISTS delivery_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  driver_id uuid REFERENCES profiles(id),
  trip_id uuid REFERENCES delivery_trips(id),
  product_description text NOT NULL,
  amount_owed numeric(10,2) NOT NULL,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('paid','unpaid')),
  paid_at timestamptz,
  paid_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- DRIVER DAILY LOGS
CREATE TABLE IF NOT EXISTS driver_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id),
  shop_id uuid REFERENCES shops(id),
  log_date date DEFAULT current_date,
  opening_lorry_load numeric(10,2),
  closing_lorry_load numeric(10,2),
  opening_mileage numeric(10,2),
  closing_mileage numeric(10,2),
  opened_at timestamptz,
  closed_at timestamptz,
  UNIQUE (driver_id, log_date)
);

CREATE TABLE IF NOT EXISTS driver_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id),
  shop_id uuid REFERENCES shops(id),
  category text CHECK (category IN ('fuel','repair','other')),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  receipt_url text,
  status text DEFAULT 'logged' CHECK (status IN ('logged','reviewed','rejected')),
  rejection_reason text,
  logged_at timestamptz DEFAULT now()
);

-- REVENUE MODULE
CREATE TABLE IF NOT EXISTS daily_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  shop_id uuid REFERENCES shops(id),
  revenue_date date DEFAULT current_date,
  mpesa_revenue numeric(10,2) DEFAULT 0,
  cash_revenue numeric(10,2) DEFAULT 0,
  total_revenue numeric(10,2) GENERATED ALWAYS AS (mpesa_revenue + cash_revenue) STORED,
  starting_stock jsonb,
  finishing_stock jsonb,
  recorded_by uuid REFERENCES profiles(id),
  UNIQUE (business_id, shop_id, revenue_date)
);

-- GPS LOCATIONS
CREATE TABLE IF NOT EXISTS gps_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES delivery_trips(id),
  driver_id uuid REFERENCES profiles(id),
  latitude numeric(10,7),
  longitude numeric(10,7),
  recorded_at timestamptz DEFAULT now(),
  source text DEFAULT 'gps_sync' CHECK (source IN ('gps_sync','manual'))
);

-- STOCK REQUESTS
CREATE TABLE IF NOT EXISTS stock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id),
  cashier_id uuid REFERENCES profiles(id),
  product_id uuid REFERENCES water_products(id),
  quantity int NOT NULL,
  request_type text CHECK (request_type IN ('addition','reduction')),
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- REFUND REQUESTS
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id),
  cashier_id uuid REFERENCES profiles(id),
  reason text NOT NULL,
  notes text,
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  title text,
  body text,
  link text,
  is_read bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  business_id text,
  shop_id uuid,
  created_at timestamptz DEFAULT now()
);

-- PAYMENT CONFIG (super admin only)
CREATE TABLE IF NOT EXISTS payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text UNIQUE NOT NULL,
  shortcode text,
  passkey text,
  consumer_key text,
  consumer_secret text,
  environment text DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  mpesa_enabled bool DEFAULT true,
  cash_enabled bool DEFAULT true,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_shop ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_trips_driver ON delivery_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_trips_date ON delivery_trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_delivery_debts_status ON delivery_debts(payment_status);
CREATE INDEX IF NOT EXISTS idx_delivery_debts_customer ON delivery_debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue(revenue_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_locations_trip ON gps_locations(trip_id, recorded_at DESC);

-- ==================== HELPER FUNCTIONS ====================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_shop()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_business()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT business_id FROM profiles WHERE id = auth.uid();
$$;

-- Atomic bid/sale function for record-sale edge function
CREATE OR REPLACE FUNCTION record_sale_atomic(
  p_business_id text,
  p_shop_id uuid,
  p_cashier_id uuid,
  p_customer_id uuid,
  p_payment_method text,
  p_items jsonb,
  p_discount_amount numeric,
  p_total numeric,
  p_mpesa_ref text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transaction_id uuid;
  v_item jsonb;
BEGIN
  -- Create transaction
  INSERT INTO transactions (business_id, shop_id, cashier_id, customer_id, payment_method, discount_amount, total, mpesa_ref)
  VALUES (p_business_id, p_shop_id, p_cashier_id, p_customer_id, p_payment_method, p_discount_amount, p_total, p_mpesa_ref)
  RETURNING id INTO v_transaction_id;

  -- Create items and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO transaction_items (transaction_id, product_id, product_name, category, qty, unit_price, line_total)
    VALUES (
      v_transaction_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      v_item->>'category',
      (v_item->>'qty')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'line_total')::numeric
    );
  END LOOP;

  RETURN v_transaction_id;
END;
$$;

-- ==================== RLS POLICIES ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Super admin full access to profiles" ON profiles FOR ALL TO authenticated USING (get_my_role() = 'super_admin');
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin/manager view own shop profiles" ON profiles FOR SELECT TO authenticated
  USING (get_my_role() IN ('water_admin','rb_manager') AND shop_id = get_my_shop());

-- Water products
CREATE POLICY "Super admin and water admin manage water products" ON water_products FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin','water_admin'));
CREATE POLICY "Cashiers and drivers read water products" ON water_products FOR SELECT TO authenticated
  USING (get_my_role() IN ('water_cashier','driver'));

-- R&B products
CREATE POLICY "Super admin and rb_manager manage rb_products" ON rb_products FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin','rb_manager'));
CREATE POLICY "RB cashiers read rb_products" ON rb_products FOR SELECT TO authenticated
  USING (get_my_role() = 'rb_cashier');

-- Transactions
CREATE POLICY "Super admin full access to transactions" ON transactions FOR ALL TO authenticated
  USING (get_my_role() = 'super_admin');
CREATE POLICY "Admins/managers select own shop transactions" ON transactions FOR SELECT TO authenticated
  USING (get_my_role() IN ('water_admin','rb_manager') AND shop_id = get_my_shop());
CREATE POLICY "Cashiers insert and select own transactions" ON transactions FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('water_cashier','rb_cashier') AND cashier_id = auth.uid());
CREATE POLICY "Cashiers select own transactions" ON transactions FOR SELECT TO authenticated
  USING (get_my_role() IN ('water_cashier','rb_cashier') AND cashier_id = auth.uid());

-- Delivery debts
CREATE POLICY "Super admin and water admin full debt access" ON delivery_debts FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin','water_admin'));
CREATE POLICY "Driver manage own debt records" ON delivery_debts FOR ALL TO authenticated
  USING (get_my_role() = 'driver' AND driver_id = auth.uid());

-- Daily revenue
CREATE POLICY "Super admin full revenue access" ON daily_revenue FOR ALL TO authenticated
  USING (get_my_role() = 'super_admin');
CREATE POLICY "Admin/manager view own business revenue" ON daily_revenue FOR SELECT TO authenticated
  USING (get_my_role() IN ('water_admin','rb_manager') AND business_id = get_my_business());
CREATE POLICY "Staff insert daily revenue" ON daily_revenue FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('water_cashier','rb_cashier','driver','water_admin','rb_manager'));

-- Driver logs
CREATE POLICY "Super admin and water admin view driver logs" ON driver_daily_logs FOR SELECT TO authenticated
  USING (get_my_role() IN ('super_admin','water_admin'));
CREATE POLICY "Driver manage own logs" ON driver_daily_logs FOR ALL TO authenticated
  USING (get_my_role() = 'driver' AND driver_id = auth.uid());

-- Driver expenses
CREATE POLICY "Super admin and admin view all expenses" ON driver_expenses FOR SELECT TO authenticated
  USING (get_my_role() IN ('super_admin','water_admin'));
CREATE POLICY "Driver manage own expenses" ON driver_expenses FOR ALL TO authenticated
  USING (get_my_role() = 'driver' AND driver_id = auth.uid());

-- Delivery trips
CREATE POLICY "Super admin and admin view delivery trips" ON delivery_trips FOR SELECT TO authenticated
  USING (get_my_role() IN ('super_admin','water_admin'));
CREATE POLICY "Driver manage own trips" ON delivery_trips FOR ALL TO authenticated
  USING (get_my_role() = 'driver' AND driver_id = auth.uid());

-- Payment config — super admin ONLY
CREATE POLICY "Super admin only payment config" ON payment_config FOR ALL TO authenticated
  USING (get_my_role() = 'super_admin');

-- Discounts
CREATE POLICY "Admins manage discounts" ON discounts FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin','water_admin','rb_manager'));
CREATE POLICY "Cashiers read discounts" ON discounts FOR SELECT TO authenticated
  USING (get_my_role() IN ('water_cashier','rb_cashier'));

-- Notifications
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());
CREATE POLICY "Super admin view all notifications" ON notifications FOR SELECT TO authenticated
  USING (get_my_role() = 'super_admin');

-- Audit log
CREATE POLICY "Super admin view all audit" ON audit_log FOR SELECT TO authenticated
  USING (get_my_role() = 'super_admin');
CREATE POLICY "Users view own audit entries" ON audit_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Customers
CREATE POLICY "All authenticated can manage customers" ON customers FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin','water_admin','water_cashier','driver','rb_manager','rb_cashier'));

-- ==================== SEED DATA ====================

-- Default shop
INSERT INTO shops (id, name, location, business_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Main Branch', 'Nakuru CBD', 'water_retail'),
  ('00000000-0000-0000-0000-000000000002', 'R&B Take-Away', 'Nakuru CBD', 'rb'),
  ('00000000-0000-0000-0000-000000000003', 'Delivery Hub', 'Nakuru CBD', 'water_delivery')
ON CONFLICT DO NOTHING;

-- Payment config stubs
INSERT INTO payment_config (business_id, environment) VALUES
  ('water_retail', 'sandbox'),
  ('rb', 'sandbox'),
  ('water_delivery', 'sandbox')
ON CONFLICT (business_id) DO NOTHING;

-- Water products seed (linked to main shop)
INSERT INTO water_products (shop_id, size_label, size_ml, price, current_stock, status) VALUES
-- Refill
('00000000-0000-0000-0000-000000000001', '500ml Refill', 500, 5, 200, 'active'),
('00000000-0000-0000-0000-000000000001', '1L Refill', 1000, 10, 150, 'active'),
('00000000-0000-0000-0000-000000000001', '1.5L Refill', 1500, 15, 120, 'active'),
('00000000-0000-0000-0000-000000000001', '2L Refill', 2000, 20, 80, 'active'),
('00000000-0000-0000-0000-000000000001', '3L Refill', 3000, 30, 60, 'active'),
('00000000-0000-0000-0000-000000000001', '5L Refill', 5000, 40, 100, 'active'),
('00000000-0000-0000-0000-000000000001', '10L Refill', 10000, 80, 40, 'active'),
('00000000-0000-0000-0000-000000000001', '20L Refill', 20000, 150, 30, 'active'),
-- New bottles
('00000000-0000-0000-0000-000000000001', '500ml New Bottle', 500, 30, 50, 'active'),
('00000000-0000-0000-0000-000000000001', '1L New Bottle', 1000, 50, 40, 'active'),
('00000000-0000-0000-0000-000000000001', '5L New Bottle', 5000, 150, 20, 'active'),
('00000000-0000-0000-0000-000000000001', '10L New Bottle', 10000, 280, 15, 'active'),
('00000000-0000-0000-0000-000000000001', '20L New Bottle', 20000, 450, 10, 'active'),
-- Caps & PET
('00000000-0000-0000-0000-000000000001', 'Caps', NULL, 20, 500, 'active'),
('00000000-0000-0000-0000-000000000001', 'PET 1L', 1000, 40, 30, 'active'),
('00000000-0000-0000-0000-000000000001', 'PET 1.5L', 1500, 30, 25, 'active'),
('00000000-0000-0000-0000-000000000001', 'PET 5L', 5000, 110, 20, 'active'),
('00000000-0000-0000-0000-000000000001', 'PET 10L', 10000, 200, 0, 'active'),
('00000000-0000-0000-0000-000000000001', 'PET 20L', 20000, 300, 8, 'active'),
-- Jerricans (price TBC)
('00000000-0000-0000-0000-000000000001', 'Jerrican 5L', 5000, 0, 15, 'active'),
('00000000-0000-0000-0000-000000000001', 'Jerrican 10L', 10000, 0, 10, 'active'),
('00000000-0000-0000-0000-000000000001', 'Jerrican 20L', 20000, 0, 8, 'active')
ON CONFLICT DO NOTHING;

-- R&B products seed
INSERT INTO rb_products (name, category, sub_category, price, current_stock, unit) VALUES
-- RAW Standard Chicken
('Full Chicken (Capon)', 'raw', 'Standard Chicken', 600, 12, 'piece'),
('Half Chicken', 'raw', 'Standard Chicken', 300, 15, 'piece'),
('Quarter Cut', 'raw', 'Standard Chicken', 150, 20, 'piece'),
-- RAW Marinated
('Full Chicken (Marinated)', 'raw', 'Marinated', 650, 8, 'piece'),
('Half Chicken (Marinated)', 'raw', 'Marinated', 350, 10, 'piece'),
('Quarter Cut (Marinated)', 'raw', 'Marinated', 200, 12, 'piece'),
-- RAW Kienyeji
('Kienyeji Full', 'raw', 'Kienyeji', 1000, 4, 'piece'),
('Kienyeji Half', 'raw', 'Kienyeji', 500, 5, 'piece'),
-- RAW Offcuts
('Gizzards 1kg', 'raw', 'Offcuts', 550, 8, 'kg'),
('Chicken Liver 1kg', 'raw', 'Offcuts', 400, 6, 'kg'),
('Chicken Wings 1kg', 'raw', 'Offcuts', 750, 10, 'kg'),
('Thighs on Bone 1kg', 'raw', 'Offcuts', 850, 7, 'kg'),
('Drumsticks 1kg', 'raw', 'Offcuts', 750, 8, 'kg'),
('Boneless Breast', 'raw', 'Offcuts', 750, 5, 'piece'),
('Breast on Bone 1kg', 'raw', 'Offcuts', 600, 6, 'kg'),
-- RAW Processed
('Smokies 5-pack', 'raw', 'Processed', 160, 25, 'pack'),
('Beef Sausages 6-pack', 'raw', 'Processed', 240, 20, 'pack'),
('Pet Food 1kg', 'raw', 'Processed', 170, 10, 'kg'),
-- COOKED Standard Chicken
('Full Chicken Cooked', 'cooked', 'Standard Chicken', 650, 8, 'piece'),
('Half Chicken Cooked', 'cooked', 'Standard Chicken', 350, 12, 'piece'),
('Quarter Cut Cooked', 'cooked', 'Standard Chicken', 180, 20, 'piece'),
-- COOKED Processed
('Cooked Smokies', 'cooked', 'Processed', 40, 30, 'piece'),
('Cooked Beef Sausages', 'cooked', 'Processed', 50, 25, 'piece'),
-- COOKED Fries
('Fries Small', 'cooked', 'Fries', 70, 50, 'piece'),
('Fries Medium', 'cooked', 'Fries', 100, 50, 'piece'),
('Fries Large', 'cooked', 'Fries', 150, 30, 'piece')
ON CONFLICT DO NOTHING;

-- Default discounts
INSERT INTO discounts (business_id, shop_id, name, discount_type, value) VALUES
('water_retail', '00000000-0000-0000-0000-000000000001', 'Bulk 10%', 'percent', 10),
('water_retail', '00000000-0000-0000-0000-000000000001', 'Loyal Customer', 'flat', 50),
('rb', '00000000-0000-0000-0000-000000000002', 'Bulk 10%', 'percent', 10),
('rb', '00000000-0000-0000-0000-000000000002', 'Staff Meal', 'flat', 100)
ON CONFLICT DO NOTHING;
