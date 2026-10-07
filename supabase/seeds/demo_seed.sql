-- ===================================================================
-- BC ESPECIAL IMPORT - DEMO DATASET SEED
-- STRICTLY TAGGED: data_environment = 'demo'
-- NEVER RUN THIS IN PRODUCTION!
-- ===================================================================

-- 1. BRANDS (DEMO)
INSERT INTO public.brands (id, name, slug, logo, description, status, data_environment) VALUES
('samsung', 'Samsung', 'samsung', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=120&q=80', 'Líder mundial en tecnología, smart TVs y refrigeración', 'active', 'demo'),
('apple', 'Apple', 'apple', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=120&q=80', 'Smartphones y computación de gama ultra premium', 'active', 'demo'),
('philips', 'Philips', 'philips', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=120&q=80', 'Innovación en electrodomésticos para el hogar y cocina', 'active', 'demo'),
('dji', 'DJI', 'dji', 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=120&q=80', 'Drones y tecnología de imagen y filmación profesional', 'active', 'demo'),
('lg', 'LG', 'lg', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=120&q=80', 'Línea blanca y pantallas de última generación', 'active', 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 2. CATEGORIES (DEMO)
INSERT INTO public.categories (id, name, slug, image, count, status, data_environment) VALUES
('electrodomesticos', 'Electrodomésticos', 'electrodomesticos', '/images/cat_electrodomesticos.jpg', '120+ productos', 'active', 'demo'),
('tecnologia', 'Tecnología', 'tecnologia', '/images/cat_tecnologia.jpg', '85+ productos', 'active', 'demo'),
('hogar', 'Hogar & Confort', 'hogar', '/images/cat_hogar.jpg', '64+ productos', 'active', 'demo'),
('aire-libre', 'Aire Libre & Camping', 'aire-libre', '/images/cat_aire_libre.jpg', '42+ productos', 'active', 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 3. PRODUCTS (DEMO)
INSERT INTO public.products (
    id, brand, brand_id, name, slug, sku, category, subcategory, specs_summary, description,
    price, original_price, cost, margin, stock, reserved_stock, min_stock, rating, reviews_count,
    image, images, badge, specs, featured, is_new, status, data_environment
) VALUES
('heladera-samsung-rt47', 'SAMSUNG', 'samsung', 'Heladera No Frost 470L Inverter RT47', 'heladera-samsung-rt47', 'BC-SAM-1000', 'electrodomesticos', 'electrodomesticos-premium', '470 litros | Inverter | Dispenser de agua', 'Heladera Samsung No Frost con compresor Digital Inverter de alta eficiencia energética A+++.', 1129000, 1299000, 733850, 35, 8, 2, 3, 5, 124, '/images/heladera-samsung.jpg', ARRAY['/images/heladera-samsung.jpg'], '15% OFF', '{"Capacidad Total": "470 Litros", "Eficiencia": "A+++"}'::jsonb, true, false, 'active', 'demo'),
('smart-tv-samsung-55-cu7000', 'SAMSUNG', 'samsung', 'Smart TV 55" Crystal UHD 4K CU7000', 'smart-tv-samsung-55-cu7000', 'BC-SAM-1001', 'tecnologia', 'tecnologia-premium', '55" | 4K UHD | Smart TV | Tizen', 'Smart TV Samsung de 55 pulgadas Crystal UHD con procesador Crystal 4K.', 799000, 920000, 519350, 35, 15, 0, 3, 5, 98, '/images/smart-tv-samsung.jpg', ARRAY['/images/smart-tv-samsung.jpg'], 'OFERTA', '{"Pulgadas": "55 pulgadas", "Resolución": "4K UHD"}'::jsonb, true, false, 'active', 'demo'),
('lavarropas-samsung-9kg-ww90', 'SAMSUNG', 'samsung', 'Lavarropas Carga Frontal 9kg WW90T4040EE', 'lavarropas-samsung-9kg-ww90', 'BC-SAM-1002', 'electrodomesticos', 'electrodomesticos-premium', '9 kg | 1400 rpm | Inverter | EcoBubble', 'Lavarropas automático con motor Digital Inverter silencioso y duradero.', 889000, 999000, 577850, 35, 6, 1, 2, 5, 76, '/images/lavarropas-samsung.jpg', ARRAY['/images/lavarropas-samsung.jpg'], 'ENVÍO GRATIS', '{"Capacidad": "9 Kilogramos", "Centrifugado": "1400 RPM"}'::jsonb, true, false, 'active', 'demo'),
('airfryer-philips-xl-hd9270', 'PHILIPS', 'philips', 'Freidora de Aire Digital XL 6.2L HD9270', 'airfryer-philips-xl-hd9270', 'BC-PHI-1003', 'electrodomesticos', 'electrodomesticos-premium', '6.2 Litros | 2000W | Pantalla Táctil', 'Freidora sin aceite Philips Airfryer XL con tecnología Rapid Air.', 249000, 299000, 161850, 35, 22, 2, 4, 5, 210, '/images/airfryer.jpg', ARRAY['/images/airfryer.jpg'], 'MÁS VENDIDO', '{"Capacidad": "6.2 Litros", "Potencia": "2000 W"}'::jsonb, true, false, 'active', 'demo'),
('apple-iphone-15-128gb', 'APPLE', 'apple', 'iPhone 15 128GB Black - Pantalla Super Retina', 'apple-iphone-15-128gb', 'BC-APP-1004', 'tecnologia', 'tecnologia-premium', '128 GB | Chip A16 Bionic | Dynamic Island', 'El último smartphone de Apple con Dynamic Island y cámara de 48 MP.', 1399000, 1550000, 909350, 35, 12, 1, 3, 5, 342, '/images/iphone-15.jpg', ARRAY['/images/iphone-15.jpg'], 'NUEVO', '{"Almacenamiento": "128 GB", "Chip": "A16 Bionic"}'::jsonb, true, true, 'active', 'demo'),
('dji-mini-4-pro-fly-more', 'DJI', 'dji', 'Drone DJI Mini 4 Pro Fly More Combo Plus', 'dji-mini-4-pro-fly-more', 'BC-DJI-1005', 'tecnologia', 'tecnologia-premium', '4K HDR 60fps | 249g | 34 min batería', 'Drone ultraliviano con detección de obstáculos omnidireccional y video 4K HDR.', 1680000, 1890000, 1092000, 35, 4, 0, 2, 5, 45, '/images/drone-4k.jpg', ARRAY['/images/drone-4k.jpg'], 'PREMIUM', '{"Peso": "< 249 gramos", "Resolución Video": "4K/60fps HDR"}'::jsonb, true, true, 'active', 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 4. CUSTOMERS (DEMO)
INSERT INTO public.customers (id, name, last_name, email, phone, document_id, orders_count, total_spent, status, data_environment) VALUES
('cust-demo-1', 'María', 'Gómez', 'maria.gomez@gmail.com', '+54 11 4455-1234', '35.123.456', 3, 2450000, 'active', 'demo'),
('cust-demo-2', 'Carlos', 'Rodríguez', 'carlos.rodriguez@hotmail.com', '+54 11 3322-9876', '28.987.654', 1, 799000, 'active', 'demo'),
('cust-demo-3', 'Luciana', 'Pérez', 'luciana.perez@yahoo.com.ar', '+54 11 6677-4433', '38.654.321', 2, 1648000, 'active', 'demo'),
('cust-demo-4', 'Martín', 'Sosa', 'martin.sosa@outlook.com', '+54 11 8899-2211', '40.321.987', 4, 3890000, 'active', 'demo'),
('cust-demo-5', 'Nicolás', 'Muñoz', 'munozalbelonicolas@gmail.com', '+54 11 4455-8899', '32.456.789', 3, 3120000, 'active', 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 5. ORDERS (DEMO)
INSERT INTO public.orders (
    id, customer, items, subtotal, discount, shipping_cost, total, status,
    tracking_code, carrier, payment_method, payment_status, data_environment, created_at
) VALUES
('BC-1001', '{"name": "María Gómez", "email": "maria.gomez@gmail.com", "phone": "+54 11 4455-1234", "address": "Av. Santa Fe 2340 5B, CABA"}'::jsonb, '[{"id": "heladera-samsung-rt47", "name": "Heladera No Frost 470L Inverter RT47", "quantity": 1, "unitPrice": 1129000, "subtotal": 1129000}]'::jsonb, 1129000, 0, 0, 1129000, 'Entregado', 'AND-89472610-AR', 'Andreani Express', 'Tarjeta de Crédito', 'paid', 'demo', timezone('utc'::text, now() - INTERVAL '3 days')),
('BC-1002', '{"name": "Carlos Rodríguez", "email": "carlos.rodriguez@hotmail.com", "phone": "+54 11 3322-9876", "address": "Belgrano 1420, San Isidro"}'::jsonb, '[{"id": "smart-tv-samsung-55-cu7000", "name": "Smart TV 55 Crystal UHD 4K CU7000", "quantity": 1, "unitPrice": 799000, "subtotal": 799000}]'::jsonb, 799000, 0, 0, 799000, 'En camino', 'AND-91238472-AR', 'Andreani Express', 'Mercado Pago', 'paid', 'demo', timezone('utc'::text, now() - INTERVAL '2 days')),
('BC-1003', '{"name": "Luciana Pérez", "email": "luciana.perez@yahoo.com.ar", "phone": "+54 11 6677-4433", "address": "Calle 48 Nº 890, La Plata"}'::jsonb, '[{"id": "airfryer-philips-xl-hd9270", "name": "Freidora de Aire Digital XL 6.2L", "quantity": 1, "unitPrice": 249000, "subtotal": 249000}]'::jsonb, 249000, 0, 6500, 255500, 'Preparando despacho', 'COR-48291048-AR', 'Correo Argentino', 'Transferencia Bancaria', 'paid', 'demo', timezone('utc'::text, now() - INTERVAL '1 day')),
('BC-1004', '{"name": "Martín Sosa", "email": "martin.sosa@outlook.com", "phone": "+54 11 8899-2211", "address": "Córdoba 840, Rosario"}'::jsonb, '[{"id": "apple-iphone-15-128gb", "name": "iPhone 15 128GB Black", "quantity": 1, "unitPrice": 1399000, "subtotal": 1399000}]'::jsonb, 1399000, 0, 0, 1399000, 'Confirmado', 'AND-98210384-AR', 'Andreani Express', 'Tarjeta de Crédito', 'paid', 'demo', timezone('utc'::text, now() - INTERVAL '5 hours'))
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 6. PAYMENT TRANSACTIONS (DEMO)
INSERT INTO public.payment_transactions (
    id, order_id, customer_name, amount, provider, provider_transaction_id, status, data_environment
) VALUES
('tx_demo_01', 'BC-1001', 'María Gómez', 1129000, 'mercadopago', 'MP-9481928471', 'approved', 'demo'),
('tx_demo_02', 'BC-1002', 'Carlos Rodríguez', 799000, 'mercadopago', 'MP-9481928472', 'approved', 'demo'),
('tx_demo_03', 'BC-1003', 'Luciana Pérez', 255500, 'bank_transfer', 'TRANSF-CBU-849102', 'approved', 'demo'),
('tx_demo_04', 'BC-1004', 'Martín Sosa', 1399000, 'stripe', 'pi_3MtwBwLkdIwHu7ix28A004', 'approved', 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 7. COUPONS (DEMO)
INSERT INTO public.coupons (id, code, type, value, min_spend, start_date, expires_at, max_uses, uses_count, status, data_environment) VALUES
('coup_demo_1', 'BIENVENIDO10', 'percentage', 10, 150000, timezone('utc'::text, now() - INTERVAL '30 days'), timezone('utc'::text, now() + INTERVAL '60 days'), 500, 48, 'active', 'demo'),
('coup_demo_2', 'CYBERMONDAY', 'percentage', 15, 300000, timezone('utc'::text, now() - INTERVAL '10 days'), timezone('utc'::text, now() + INTERVAL '20 days'), 200, 112, 'active', 'demo'),
('coup_demo_3', 'ENVIOGRATIS', 'fixed', 6500, 100000, timezone('utc'::text, now() - INTERVAL '15 days'), timezone('utc'::text, now() + INTERVAL '45 days'), 1000, 235, 'active', 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 8. FAQS (DEMO)
INSERT INTO public.faqs (id, question, answer, order_index, data_environment) VALUES
('faq-1', '¿Los productos son 100% originales?', 'Sí, todos nuestros productos son 100% originales e importados de origen directo de marca, con garantía oficial y estampillado aduanero de AFIP.', 1, 'demo'),
('faq-2', '¿Hacen envíos a todo el país?', 'Sí, despachamos diariamente por Andreani Express y Correo Argentino a todas las provincias argentinas con seguro y número de seguimiento en tiempo real.', 2, 'demo'),
('faq-3', '¿Qué medios de pago aceptan?', 'Aceptamos transferencias bancarias con descuento especial, tarjetas de débito y crédito a través de Mercado Pago en cuotas sin interés.', 3, 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';

-- 9. TESTIMONIALS (DEMO)
INSERT INTO public.testimonials (id, name, location, avatar, quote, rating, data_environment) VALUES
('test-1', 'Martín S.', 'Córdoba Capital', '/images/avatar_martin.jpg', 'Compré una heladera Samsung Inverter y llegó en 48 horas a Córdoba impecable. Atención de primer nivel.', 5, 'demo'),
('test-2', 'Carla M.', 'CABA, Palermo', '/images/avatar_carla.jpg', 'El Smart TV llegó perfecto y con factura oficial. La mejor experiencia de compra online que tuve este año.', 5, 'demo')
ON CONFLICT (id) DO UPDATE SET data_environment = 'demo';
