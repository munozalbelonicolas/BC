-- ===================================================================
-- BC ESPECIAL IMPORT - PRODUCTION INITIAL PROVISIONING
-- STRICTLY TAGGED: data_environment = 'production'
-- ZERO MOCK PRODUCTS, ZERO MOCK ORDERS, ZERO MOCK CUSTOMERS.
-- ===================================================================

-- 1. SYSTEM ADMIN ROLES (PRODUCTION)
INSERT INTO public.admin_roles (id, name, description, permissions, is_system) VALUES
('superadmin', 'Super Administrador', 'Control total de la plataforma y seguridad', ARRAY['dashboard.view', 'products.view', 'products.manage', 'orders.view', 'orders.manage', 'customers.view', 'customers.manage', 'promotions.manage', 'analytics.view', 'settings.manage', 'users.manage', 'audit.view']::TEXT[], true),
('admin', 'Administrador General', 'Gestión comercial de pedidos, clientes y catálogo', ARRAY['dashboard.view', 'products.view', 'products.manage', 'orders.view', 'orders.manage', 'customers.view', 'promotions.manage', 'analytics.view']::TEXT[], true),
('catalog_manager', 'Gestor de Catálogo & Stock', 'Control de productos, categorías y stock', ARRAY['products.view', 'products.manage']::TEXT[], true),
('support', 'Atención al Cliente', 'Consulta de pedidos y reclamos', ARRAY['orders.view', 'customers.view']::TEXT[], true)
ON CONFLICT (id) DO NOTHING;

-- 2. ESSENTIAL STORE SETTINGS (PRODUCTION)
INSERT INTO public.store_settings (id, key, value, data_environment) VALUES
('set_prod_general', 'general', '{"storeName": "BC Especial Import", "contactEmail": "info@bcespecialimport.com.ar", "currency": "ARS", "supportPhone": "+54 11 1234-5678"}'::jsonb, 'production'),
('set_prod_shipping', 'shipping', '{"freeShippingThreshold": 250000, "standardShippingFee": 6500, "expressShippingFee": 12500}'::jsonb, 'production')
ON CONFLICT (key, data_environment) DO NOTHING;
