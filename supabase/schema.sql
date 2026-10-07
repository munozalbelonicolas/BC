-- ===================================================================
-- BC ESPECIAL IMPORT - SUPABASE DATABASE SCHEMA & SEED DATA
-- ===================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    specs_summary TEXT,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    rating INTEGER DEFAULT 5,
    reviews_count INTEGER DEFAULT 0,
    image TEXT NOT NULL,
    badge TEXT,
    stock INTEGER DEFAULT 10,
    specs JSONB DEFAULT '{}'::jsonb,
    featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    count TEXT
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    avatar TEXT NOT NULL,
    quote TEXT NOT NULL,
    rating INTEGER DEFAULT 5
);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read
CREATE POLICY "Public read products" ON public.products
    FOR SELECT USING (true);

-- Categories: Everyone can read
CREATE POLICY "Public read categories" ON public.categories
    FOR SELECT USING (true);

-- Testimonials: Everyone can read
CREATE POLICY "Public read testimonials" ON public.testimonials
    FOR SELECT USING (true);

-- Orders: Anyone can insert (during checkout)
CREATE POLICY "Public insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Orders: Users can read their own orders or read by order ID
CREATE POLICY "Users read their orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() IS NULL
    );

-- Newsletter: Anyone can subscribe
CREATE POLICY "Public insert newsletter" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- ===================================================================
-- SEED DATA (INITIAL PRODUCTS CATALOG & TESTIMONIALS)
-- ===================================================================

INSERT INTO public.categories (id, name, image, count) VALUES
('electrodomesticos', 'Electrodomésticos', '/images/cat_electrodomesticos.jpg', '45 productos'),
('tecnologia', 'Tecnología', '/images/cat_tecnologia.jpg', '68 productos'),
('hogar', 'Hogar', '/images/cat_hogar.jpg', '32 productos'),
('aire-libre', 'Aire libre', '/images/cat_aire_libre.jpg', '24 productos')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    count = EXCLUDED.count;

INSERT INTO public.products (id, brand, name, category, specs_summary, description, price, original_price, rating, reviews_count, image, badge, stock, specs, featured, is_new) VALUES
(
    'heladera-samsung-rt47',
    'SAMSUNG',
    'Heladera No Frost 470L Inverter RT47',
    'electrodomesticos',
    '470 litros | Inverter | Dispenser de agua',
    'Heladera Samsung No Frost con compresor Digital Inverter de alta eficiencia energética A+++. Cuenta con tecnología All-Around Cooling para enfriamiento uniforme en todos los compartimientos, dispenser externo de agua purificada y display digital inteligente.',
    1129000,
    1299000,
    5,
    124,
    '/images/heladera-samsung.jpg',
    '15% OFF',
    8,
    '{"Capacidad Total": "470 Litros", "Tipo de Descongelamiento": "No Frost", "Tecnología": "Digital Inverter", "Eficiencia Energética": "A+++", "Dispenser": "Agua exterior integrado", "Color": "Acero Inoxidable Premium", "Garantía": "10 años en compresor, 12 meses oficial"}'::jsonb,
    true,
    false
),
(
    'smart-tv-samsung-55-cu7000',
    'SAMSUNG',
    'Smart TV 55" Crystal UHD 4K CU7000',
    'tecnologia',
    '55" | 4K UHD | Smart TV | Tizen',
    'Smart TV Samsung de 55 pulgadas Crystal UHD con procesador Crystal 4K que optimiza cada imagen a resolución cinematográfica. Sistema operativo Tizen con acceso inmediato a Netflix, Disney+, Prime Video, YouTube y Gaming Hub.',
    799000,
    920000,
    5,
    98,
    '/images/smart-tv-samsung.jpg',
    'OFERTA',
    15,
    '{"Pulgadas": "55 pulgadas", "Resolución": "3840 x 2160 (4K UHD)", "Procesador": "Crystal Processor 4K", "Sistema Operativo": "Tizen™ Smart TV", "Conectividad": "3x HDMI, 1x USB, Wi-Fi 5, Bluetooth 5.2", "Audio": "20W RMS con Sonido 3D Object Tracking", "Garantía": "12 meses oficial Samsung Argentina"}'::jsonb,
    true,
    false
),
(
    'lavarropas-samsung-9kg-ww90',
    'SAMSUNG',
    'Lavarropas Carga Frontal 9kg WW90T4040EE',
    'electrodomesticos',
    '9 kg | 1400 rpm | Inverter | EcoBubble',
    'Lavarropas automático Samsung carga frontal con capacidad para 9 kg y centrifugado a 1400 RPM. Equipado con motor Digital Inverter ultra silencioso con 20 años de garantía y tecnología EcoBubble para lavado profundo en agua fría cuidando las telas.',
    689000,
    799000,
    5,
    76,
    '/images/lavarropas-samsung.jpg',
    'MÁS VENDIDO',
    11,
    '{"Capacidad de Carga": "9 Kilogramos", "Velocidad de Centrifugado": "1400 RPM", "Tipo de Motor": "Digital Inverter", "Tecnología de Lavado": "EcoBubble™ & Vapor Higiene", "Cantidad de Programas": "14 programas automáticos", "Eficiencia Energética": "A+++", "Garantía": "20 años en motor, 12 meses general"}'::jsonb,
    true,
    false
),
(
    'apple-iphone-15-128gb',
    'APPLE',
    'iPhone 15 128GB 5G',
    'tecnologia',
    '6,1" | 128 GB | 5G | Chip A16',
    'Apple iPhone 15 con Dynamic Island, cámara principal de 48 MP con superalta resolución y teleobjetivo x2, diseño de vidrio duradero con infusión de color y aluminio de grado aeroespacial. Conector USB-C universal.',
    1399000,
    1550000,
    5,
    152,
    '/images/iphone-15.jpg',
    'IMPORTADO',
    6,
    '{"Pantalla": "Super Retina XDR OLED de 6,1 pulgadas", "Almacenamiento": "128 GB", "Procesador": "Chip A16 Bionic con GPU de 5 núcleos", "Cámara Principal": "Sistema de dos cámaras (48 MP principal + 12 MP ultra gran angular)", "Batería": "Hasta 20 horas de reproducción de video", "Conector": "USB-C compatible con USB 2", "Garantía": "1 año oficial Apple internacional"}'::jsonb,
    true,
    false
),
(
    'freidora-aire-digital-5l',
    'NUTRICOOK',
    'Freidora de Aire Digital Smart 5.5L Touch',
    'electrodomesticos',
    '5.5 Litros | 1800W | 10 Programas | Pantalla LED',
    'Freidora de aire digital con ventana visor panorámica iluminada para controlar la cocción sin abrir. Reduce hasta un 85% de grasas con tecnología 360° Thermo-Airflow.',
    189000,
    220000,
    5,
    89,
    '/images/airfryer.jpg',
    'NUEVO',
    22,
    '{"Capacidad": "5.5 Litros", "Potencia": "1800 Watts", "Panel de Control": "Digital táctil LED con timer", "Temperatura": "80°C a 200°C ajustable", "Cesta": "Antiadherente apta para lavavajillas", "Garantía": "12 meses oficial"}'::jsonb,
    false,
    true
),
(
    'drone-skyhawk-pro-4k',
    'SKYHAWK',
    'Drone SkyHawk Pro 4K Gimbal Dual GPS',
    'tecnologia',
    '4K UHD | Gimbal 3 ejes | 30min vuelo | Retorno GPS',
    'Drone profesional plegable con cámara 4K montada en gimbal estabilizado mecánicamente de 3 ejes. Incluye doble módulo GPS satelital, sensor de flujo óptico y retorno automático ante baja batería.',
    459000,
    530000,
    5,
    43,
    '/images/drone-4k.jpg',
    'NUEVO',
    9,
    '{"Cámara": "4K Ultra HD con sensor Sony CMOS", "Gimbal": "Mecánico de 3 ejes autoestabilizado", "Autonomía": "30 minutos por batería", "Alcance": "Hasta 5 km de transmisión digital", "Funciones": "Follow Me, Waypoints, Órbita 360°, Retorno seguro", "Garantía": "12 meses oficial"}'::jsonb,
    false,
    true
),
(
    'soundbar-samsung-dolby',
    'SAMSUNG',
    'Barra de Sonido Samsung Dolby Audio HW-B550',
    'tecnologia',
    '410W | 2.1 Ch | Subwoofer Inalámbrico | Bluetooth',
    'Barra de sonido de 2.1 canales con subwoofer inalámbrico incluido. Modo Bass Boost para graves profundos, sonido envolvente Dolby Audio / DTS Virtual:X y optimización inteligente según el contenido que estés viendo.',
    329000,
    380000,
    5,
    61,
    '/images/soundbar.jpg',
    'OFERTA',
    14,
    '{"Potencia Total": "410 Watts RMS", "Canales": "2.1 Canales", "Subwoofer": "Inalámbrico de 6.5 pulgadas", "Tecnologías": "Dolby Audio, DTS Virtual:X, Voice Enhance", "Conectividad": "HDMI ARC, Óptico Digital, Bluetooth, USB", "Garantía": "12 meses oficial Samsung"}'::jsonb,
    false,
    true
),
(
    'microondas-digital-bgh',
    'BGH',
    'Horno Microondas Digital Quick Chef 20L Inox',
    'electrodomesticos',
    '20 Litros | 800W | Grill | Descongelado Automático',
    'Microondas digital compacto con frente en acero inoxidable cepillado, panel digital intuitivo, función de descongelado por peso y tiempo, y traba de seguridad para niños.',
    219000,
    249000,
    4,
    38,
    '/images/microondas.jpg',
    'DESTACADO',
    18,
    '{"Capacidad": "20 Litros", "Potencia": "800W microondas + 1000W Grill", "Material": "Frente en acero inoxidable con puerta espejada", "Niveles de Potencia": "10 niveles", "Garantía": "12 meses oficial"}'::jsonb,
    false,
    true
)
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    description = EXCLUDED.description;

INSERT INTO public.testimonials (id, name, location, avatar, quote, rating) VALUES
('carla-m', 'Carla M.', 'Palermo, CABA', '/images/avatar_carla.jpg', 'Excelente experiencia. El producto llegó en tiempo y forma, bien embalado y con garantía oficial. Sin dudas, volvería a comprar.', 5),
('martin-r', 'Martín R.', 'Córdoba Capital', '/images/avatar_martin.jpg', 'Muy buena atención y asesoramiento. Compré un televisor y todo fue perfecto. Recomendados.', 5)
ON CONFLICT (id) DO NOTHING;
