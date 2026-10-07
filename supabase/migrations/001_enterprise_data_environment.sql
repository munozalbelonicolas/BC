-- ===================================================================
-- BC ESPECIAL IMPORT - ENTERPRISE DATA ENVIRONMENT SEPARATION MIGRATION
-- Environments: 'development', 'demo', 'test', 'production'
-- Migration: 001_enterprise_data_environment.sql
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    brand_id TEXT,
    name TEXT NOT NULL,
    slug TEXT,
    sku TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    specs_summary TEXT,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    cost NUMERIC DEFAULT 0,
    margin NUMERIC DEFAULT 35,
    stock INTEGER DEFAULT 10,
    reserved_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 2,
    allow_backorder BOOLEAN DEFAULT false,
    rating INTEGER DEFAULT 5,
    reviews_count INTEGER DEFAULT 0,
    image TEXT NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    badge TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_products_data_env ON public.products(data_environment);
CREATE INDEX IF NOT EXISTS idx_products_env_cat ON public.products(data_environment, category);
CREATE INDEX IF NOT EXISTS idx_products_env_status ON public.products(data_environment, status);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    parent_id TEXT,
    description TEXT,
    image TEXT NOT NULL,
    count TEXT,
    status TEXT DEFAULT 'active',
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_categories_data_env ON public.categories(data_environment);

-- 3. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_brands_data_env ON public.brands(data_environment);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    document_id TEXT,
    birth_date DATE,
    avatar TEXT,
    orders_count INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_customers_data_env ON public.customers(data_environment);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(data_environment, email);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID,
    customer JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    shipping_cost NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'Confirmado - Preparando despacho' NOT NULL,
    tracking_code TEXT NOT NULL,
    carrier TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid';
CREATE INDEX IF NOT EXISTS idx_orders_data_env ON public.orders(data_environment);
CREATE INDEX IF NOT EXISTS idx_orders_env_status ON public.orders(data_environment, status);
CREATE INDEX IF NOT EXISTS idx_orders_env_created ON public.orders(data_environment, created_at);

-- 6. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'stripe', 'bank_transfer', 'cash')),
    provider_transaction_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('approved', 'pending', 'rejected', 'refunded')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_payments_data_env ON public.payment_transactions(data_environment);

-- 7. INVENTORY MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    variant_sku TEXT,
    type TEXT NOT NULL CHECK (type IN ('ingreso', 'egreso', 'ajuste', 'venta', 'devolucion')),
    quantity INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reason TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_id UUID,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_inventory_data_env ON public.inventory_movements(data_environment);

-- 8. PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS public.promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'buy_x_get_y', 'bulk', 'category', 'product')),
    discount_value NUMERIC NOT NULL,
    min_spend NUMERIC DEFAULT 0,
    min_quantity INTEGER DEFAULT 1,
    target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'category', 'product')),
    target_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_promotions_data_env ON public.promotions(data_environment);

-- 9. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL,
    min_spend NUMERIC DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_uses INTEGER DEFAULT 100,
    uses_count INTEGER DEFAULT 0,
    max_uses_per_customer INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(code, data_environment)
);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_coupons_data_env ON public.coupons(data_environment);

-- 10. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    alias TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    floor TEXT,
    apartment TEXT,
    zip_code TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    reference TEXT,
    is_default BOOLEAN DEFAULT false,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_addresses_data_env ON public.customer_addresses(data_environment);

-- 11. CUSTOMER FAVORITES
CREATE TABLE IF NOT EXISTS public.customer_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customer_favorites ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_favorites_data_env ON public.customer_favorites(data_environment);

-- 12. CUSTOMER RETURNS
CREATE TABLE IF NOT EXISTS public.customer_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    reason TEXT NOT NULL,
    comments TEXT,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'in_review', 'approved', 'rejected', 'item_received', 'refunded')),
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customer_returns ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
CREATE INDEX IF NOT EXISTS idx_returns_data_env ON public.customer_returns(data_environment);

-- 13. CUSTOMER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.customer_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'order' CHECK (type IN ('order', 'promotion', 'system', 'return')),
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customer_notifications ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
CREATE INDEX IF NOT EXISTS idx_notifications_data_env ON public.customer_notifications(data_environment);

-- 14. ADMIN USERS & ROLES
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    avatar TEXT,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_admin_users_data_env ON public.admin_users(data_environment);

-- 15. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(key, data_environment)
);

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_settings_data_env ON public.store_settings(data_environment);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_id UUID,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_audit_data_env ON public.audit_logs(data_environment);

-- 17. FAQS TABLE
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_faqs_data_env ON public.faqs(data_environment);

-- 18. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    avatar TEXT NOT NULL,
    quote TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (data_environment IN ('development', 'demo', 'test', 'production'));
CREATE INDEX IF NOT EXISTS idx_testimonials_data_env ON public.testimonials(data_environment);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) & ISOLATION POLICIES
-- ===================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Default permissive read policies for public catalog elements
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read brands" ON public.brands;
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
