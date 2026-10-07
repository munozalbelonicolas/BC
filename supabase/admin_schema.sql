-- ===================================================================
-- BC ESPECIAL IMPORT - SUPABASE ADMIN & ENTERPRISE EXTENSIONS SCHEMA
-- ===================================================================

-- 1. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENHANCE CATEGORIES TABLE (Hierarchy support)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. ENHANCE PRODUCTS TABLE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 2;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'archived'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 4. INVENTORY MOVEMENTS (Strict Non-Silent Tracking)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PROMOTIONS TABLE
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL,
    min_spend NUMERIC DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_uses INTEGER DEFAULT 100,
    uses_count INTEGER DEFAULT 0,
    max_uses_per_customer INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ADMIN ROLES & RBAC PERMISSIONS
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role_id TEXT NOT NULL REFERENCES public.admin_roles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. PAYMENT TRANSACTIONS (Multi-gateway Abstraction)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ARS' NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'stripe', 'bank_transfer', 'cash_pickup')),
    provider_transaction_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'partially_refunded')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. SHIPPING METHODS
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    cost NUMERIC DEFAULT 0 NOT NULL,
    estimated_delivery_days TEXT NOT NULL,
    free_shipping_threshold NUMERIC,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. AUDIT LOGS (Immutable Activity Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================================
-- SEED DATA FOR ADMIN ROLES & SYSTEM DEFAULTS
-- ===================================================================

INSERT INTO public.admin_roles (id, name, description, permissions, is_system) VALUES
('super_admin', 'Super Admin', 'Acceso total y sin restricciones a toda la plataforma', ARRAY[
    'dashboard.read',
    'product.read', 'product.create', 'product.update', 'product.delete', 'product.import', 'product.export',
    'category.read', 'category.create', 'category.update', 'category.delete',
    'brand.read', 'brand.create', 'brand.update', 'brand.delete',
    'inventory.read', 'inventory.update', 'inventory.export',
    'order.read', 'order.update', 'order.export',
    'customer.read', 'customer.update', 'customer.export',
    'promotion.read', 'promotion.create', 'promotion.update', 'promotion.delete',
    'coupon.read', 'coupon.create', 'coupon.update', 'coupon.delete',
    'payment.read', 'payment.refund',
    'shipping.read', 'shipping.update',
    'user.read', 'user.create', 'user.update', 'user.delete',
    'settings.read', 'settings.update',
    'audit.read'
], true),
('admin', 'Administrador', 'Acceso operativo y de gestión general', ARRAY[
    'dashboard.read',
    'product.read', 'product.create', 'product.update', 'product.export',
    'category.read', 'category.create', 'category.update',
    'brand.read', 'brand.create', 'brand.update',
    'inventory.read', 'inventory.update', 'inventory.export',
    'order.read', 'order.update', 'order.export',
    'customer.read', 'customer.update', 'customer.export',
    'promotion.read', 'promotion.create', 'promotion.update',
    'coupon.read', 'coupon.create', 'coupon.update',
    'payment.read',
    'shipping.read',
    'audit.read'
], true),
('ventas', 'Ventas', 'Gestión comercial de pedidos, clientes y catálogo', ARRAY[
    'dashboard.read',
    'product.read',
    'order.read', 'order.update', 'order.export',
    'customer.read', 'customer.update',
    'coupon.read'
], true),
('deposito', 'Depósito y Logística', 'Control de stock físico, inventario y despachos', ARRAY[
    'dashboard.read',
    'product.read',
    'inventory.read', 'inventory.update', 'inventory.export',
    'order.read', 'order.update'
], true),
('marketing', 'Marketing', 'Estrategias de precios, promociones y analítica', ARRAY[
    'dashboard.read',
    'product.read', 'product.update',
    'promotion.read', 'promotion.create', 'promotion.update', 'promotion.delete',
    'coupon.read', 'coupon.create', 'coupon.update', 'coupon.delete',
    'customer.read'
], true)
ON CONFLICT (id) DO NOTHING;

-- Initial default admin user
INSERT INTO public.admin_users (name, email, role_id, status) VALUES
('Nicolás Muñoz', 'munozalbelonicolas@gmail.com', 'super_admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Initial Brands
INSERT INTO public.brands (id, name, slug, description, status) VALUES
('samsung', 'Samsung', 'samsung', 'Líder global en electrónica, smart TVs, refrigeración e innovación', 'active'),
('lg', 'LG', 'lg', 'Tecnología de avanzada en línea blanca y climatización', 'active'),
('whirlpool', 'Whirlpool', 'whirlpool', 'Especialistas en electrodomésticos confiables para el hogar', 'active'),
('apple', 'Apple', 'apple', 'Smartphones y computación premium de máxima calidad', 'active'),
('philips', 'Philips', 'philips', 'Electrodomésticos de cocina y cuidado personal', 'active'),
('dji', 'DJI', 'dji', 'Drones y tecnología de imagen profesional', 'active')
ON CONFLICT (id) DO NOTHING;

-- Initial Shipping Methods
INSERT INTO public.shipping_methods (id, name, provider, cost, estimated_delivery_days, free_shipping_threshold, is_active) VALUES
('local_pickup', 'Retiro en Showroom CABA', 'local_pickup', 0, 'Inmediato (Lunes a Sábados 10 a 19hs)', 0, true),
('andreani_express', 'Andreani Express (CABA / GBA)', 'andreani', 6500, '24 a 48 hs hábiles', 200000, true),
('andreani_standard', 'Andreani Estándar Nacional', 'andreani', 11900, '3 a 5 días hábiles', 350000, true),
('expreso_pesado', 'Transporte Expreso Carga Pesada (Línea Blanca)', 'custom', 18500, '4 a 7 días hábiles', 500000, true)
ON CONFLICT (id) DO NOTHING;
