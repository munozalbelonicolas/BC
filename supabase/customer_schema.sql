-- ===================================================================
-- BC ESPECIAL IMPORT - CUSTOMER ACCOUNT PORTAL SCHEMA & POLICIES
-- ===================================================================

-- 1. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alias TEXT NOT NULL, -- 'Casa', 'Trabajo', 'Showroom'
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CUSTOMER FAVORITES (WISHLIST)
CREATE TABLE IF NOT EXISTS public.customer_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 3. CUSTOMER RETURN REQUESTS
CREATE TABLE IF NOT EXISTS public.customer_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    reason TEXT NOT NULL, -- 'defective', 'incorrect_item', 'not_as_expected', 'wrong_size', 'other'
    comments TEXT,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'in_review', 'approved', 'rejected', 'item_received', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CUSTOMER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.customer_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'order' CHECK (type IN ('order', 'promotion', 'system', 'return')),
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ROW LEVEL SECURITY (RLS) FOR CUSTOMER DATA (STRICT USER OWNERSHIP)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- Addresses: Users can only see and manage their own addresses
CREATE POLICY "Users manage own addresses" ON public.customer_addresses
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Favorites: Users can only manage their own favorites
CREATE POLICY "Users manage own favorites" ON public.customer_favorites
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Returns: Users can only see and create their own returns
CREATE POLICY "Users manage own returns" ON public.customer_returns
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notifications: Users can only see and mark their own notifications
CREATE POLICY "Users read own notifications" ON public.customer_notifications
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
