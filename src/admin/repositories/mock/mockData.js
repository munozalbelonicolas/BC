/**
 * @file mockData.js
 * Comprehensive mock data store for local development, tests, and offline fallback.
 */

import { PRODUCTS, CATEGORIES } from '../../../data/products.js';
import { ProductStatus, OrderStatus, PaymentStatus, StockStatus, AdminRole } from '../../types/entities.js';

export const INITIAL_BRANDS = [
  { id: 'samsung', name: 'Samsung', slug: 'samsung', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=120&q=80', description: 'Líder mundial en tecnología, smart TVs y refrigeración', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'apple', name: 'Apple', slug: 'apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=120&q=80', description: 'Smartphones y computación de gama ultra premium', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'philips', name: 'Philips', slug: 'philips', logo: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=120&q=80', description: 'Innovación en electrodomésticos para el hogar y cocina', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'dji', name: 'DJI', slug: 'dji', logo: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=120&q=80', description: 'Drones y tecnología de imagen y filmación profesional', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'lg', name: 'LG', slug: 'lg', logo: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=120&q=80', description: 'Línea blanca y pantallas de última generación', status: 'active', createdAt: '2026-01-15T10:00:00Z' }
];

export const INITIAL_CATEGORIES = CATEGORIES.map((c, idx) => ({
  id: c.id,
  name: c.name,
  slug: c.id,
  parentId: null,
  description: `Categoría principal de ${c.name}`,
  image: c.image,
  status: 'active',
  createdAt: '2026-01-10T10:00:00Z',
  subcategories: [
    { id: `${c.id}-premium`, name: `${c.name} Premium`, slug: `${c.id}-premium`, parentId: c.id, status: 'active' },
    { id: `${c.id}-accesorios`, name: `Accesorios de ${c.name}`, slug: `${c.id}-accesorios`, parentId: c.id, status: 'active' }
  ]
}));

export const INITIAL_PRODUCTS = PRODUCTS.map((p, index) => {
  const cost = Math.round(p.price * 0.65);
  const margin = Math.round(((p.price - cost) / p.price) * 100);
  const sku = `BC-${p.brand.substring(0, 3).toUpperCase()}-${1000 + index}`;
  return {
    id: p.id,
    sku,
    name: p.name,
    slug: p.id,
    brand: p.brand,
    category: p.category,
    subcategory: `${p.category}-premium`,
    description: p.description,
    shortDescription: p.specsSummary,
    price: p.price,
    originalPrice: p.originalPrice || Math.round(p.price * 1.15),
    cost,
    margin,
    stock: p.stock ?? 12,
    reservedStock: index % 2 === 0 ? 2 : 0,
    minStock: 3,
    allowBackorder: false,
    status: ProductStatus.ACTIVE,
    image: p.image,
    images: [p.image, '/images/store_front.jpg'],
    variants: [
      { id: `${p.id}-v1`, name: 'Estándar', sku: `${sku}-STD`, price: p.price, cost, stock: p.stock ?? 12, image: p.image }
    ],
    tags: [p.brand.toLowerCase(), p.category, 'importado', 'garantia-oficial'],
    specs: p.specs || {},
    updatedAt: new Date(Date.now() - index * 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  };
});

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Carlos Menéndez',
    email: 'carlos.menendez@gmail.com',
    phone: '+54 11 4455-8899',
    documentId: '32.456.789',
    address: { street: 'Av. Libertador 2450', floor: '4B', city: 'CABA', province: 'Buenos Aires', zip: '1425' },
    ordersCount: 4,
    totalSpent: 3450000,
    averageTicket: 862500,
    status: 'active',
    lastOrderDate: '2026-10-05T14:22:00Z',
    notes: 'Cliente VIP del showroom. Priorizar envíos en horario tarde.',
    createdAt: '2026-02-10T11:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'Mariana Rossi',
    email: 'mariana.rossi@yahoo.com.ar',
    phone: '+54 11 5566-7788',
    documentId: '28.987.654',
    address: { street: 'Guatemala 5120', floor: '1A', city: 'CABA', province: 'Buenos Aires', zip: '1425' },
    ordersCount: 2,
    totalSpent: 1928000,
    averageTicket: 964000,
    status: 'active',
    lastOrderDate: '2026-10-06T09:15:00Z',
    notes: 'Solicitó factura A a nombre de Estudio Rossi.',
    createdAt: '2026-03-01T15:30:00Z'
  },
  {
    id: 'cust-3',
    name: 'Esteban Benítez',
    email: 'esteban.benitez@outlook.com',
    phone: '+54 351 612-3456',
    documentId: '35.123.456',
    address: { street: 'Bv. San Juan 840', floor: null, city: 'Córdoba Capital', province: 'Córdoba', zip: '5000' },
    ordersCount: 1,
    totalSpent: 799000,
    averageTicket: 799000,
    status: 'active',
    lastOrderDate: '2026-10-06T18:40:00Z',
    notes: 'Envío Andreani al interior.',
    createdAt: '2026-10-06T18:30:00Z'
  },
  {
    id: 'cust-4',
    name: 'Luciana Gómez',
    email: 'luciana.gomez@gmail.com',
    phone: '+54 341 598-1122',
    documentId: '39.876.543',
    address: { street: 'Oroño 1420', floor: '8D', city: 'Rosario', province: 'Santa Fe', zip: '2000' },
    ordersCount: 3,
    totalSpent: 2680000,
    averageTicket: 893333,
    status: 'active',
    lastOrderDate: '2026-10-02T16:10:00Z',
    notes: 'Recomendada por cliente frecuente.',
    createdAt: '2026-04-12T10:00:00Z'
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'BC-ORD-7001',
    orderNumber: '#7001',
    customer: {
      name: 'Mariana Rossi',
      email: 'mariana.rossi@yahoo.com.ar',
      phone: '+54 11 5566-7788',
      document: '28.987.654'
    },
    shippingAddress: {
      street: 'Guatemala 5120',
      floor: '1A',
      city: 'CABA',
      province: 'Buenos Aires',
      zip: '1425'
    },
    items: [
      {
        id: 'heladera-samsung-rt47',
        name: 'Heladera No Frost 470L Inverter RT47',
        sku: 'BC-SAM-1000',
        variant: 'Estándar Acero',
        quantity: 1,
        unitPrice: 1129000,
        subtotal: 1129000,
        image: '/images/heladera-samsung.jpg'
      },
      {
        id: 'smart-tv-samsung-55-cu7000',
        name: 'Smart TV 55" Crystal UHD 4K CU7000',
        sku: 'BC-SAM-1001',
        variant: '55 Pulgadas',
        quantity: 1,
        unitPrice: 799000,
        subtotal: 799000,
        image: '/images/smart-tv-samsung.jpg'
      }
    ],
    subtotal: 1928000,
    discount: 50000,
    couponCode: 'BCBIENVENIDA',
    shippingCost: 0,
    carrier: 'Andreani Express (CABA)',
    trackingCode: 'AND-99218274-AR',
    total: 1878000,
    status: OrderStatus.PREPARING,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: 'Mercado Pago (Transferencia Directa)',
    customerNotes: 'Timbre 1A, conserje recibe si no estoy.',
    internalNotes: 'Producto verificado por control de calidad antes de embalar.',
    timeline: [
      { status: OrderStatus.CONFIRMED, title: 'Pedido Creado y Confirmado', date: '2026-10-06T09:15:00Z', user: 'Sistema' },
      { status: 'PAGO_APROBADO', title: 'Pago Aprobado ($1.878.000)', date: '2026-10-06T09:16:30Z', user: 'Mercado Pago' },
      { status: OrderStatus.PREPARING, title: 'En Preparación de Depósito', date: '2026-10-06T11:00:00Z', user: 'Operador Depósito' }
    ],
    createdAt: '2026-10-06T09:15:00Z'
  },
  {
    id: 'BC-ORD-7002',
    orderNumber: '#7002',
    customer: {
      name: 'Carlos Menéndez',
      email: 'carlos.menendez@gmail.com',
      phone: '+54 11 4455-8899',
      document: '32.456.789'
    },
    shippingAddress: {
      street: 'Av. Libertador 2450',
      floor: '4B',
      city: 'CABA',
      province: 'Buenos Aires',
      zip: '1425'
    },
    items: [
      {
        id: 'iphone-15-pro-max',
        name: 'iPhone 15 Pro Max 256GB Titanio',
        sku: 'BC-APP-1003',
        variant: 'Titanio Natural',
        quantity: 1,
        unitPrice: 1690000,
        subtotal: 1690000,
        image: '/images/iphone-15-pro.jpg'
      }
    ],
    subtotal: 1690000,
    discount: 0,
    couponCode: null,
    shippingCost: 6500,
    carrier: 'Retiro en Showroom',
    trackingCode: 'SHOWROOM-RET-7002',
    total: 1696500,
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: 'Tarjeta de Crédito (Visa 3 Cuotas)',
    customerNotes: 'Paso hoy a la tarde a retirar.',
    internalNotes: 'Cliente reservó para retirar en persona.',
    timeline: [
      { status: OrderStatus.CONFIRMED, title: 'Pedido Creado', date: '2026-10-05T14:22:00Z', user: 'Sistema' },
      { status: 'PAGO_APROBADO', title: 'Pago Aprobado', date: '2026-10-05T14:24:00Z', user: 'Stripe' },
      { status: OrderStatus.PREPARING, title: 'Separado en mostrador', date: '2026-10-05T15:00:00Z', user: 'Ventas' },
      { status: OrderStatus.SHIPPED, title: 'Listo para retiro', date: '2026-10-05T16:30:00Z', user: 'Showroom' }
    ],
    createdAt: '2026-10-05T14:22:00Z'
  },
  {
    id: 'BC-ORD-7003',
    orderNumber: '#7003',
    customer: {
      name: 'Esteban Benítez',
      email: 'esteban.benitez@outlook.com',
      phone: '+54 351 612-3456',
      document: '35.123.456'
    },
    shippingAddress: {
      street: 'Bv. San Juan 840',
      floor: null,
      city: 'Córdoba Capital',
      province: 'Córdoba',
      zip: '5000'
    },
    items: [
      {
        id: 'smart-tv-samsung-55-cu7000',
        name: 'Smart TV 55" Crystal UHD 4K CU7000',
        sku: 'BC-SAM-1001',
        variant: '55 Pulgadas',
        quantity: 1,
        unitPrice: 799000,
        subtotal: 799000,
        image: '/images/smart-tv-samsung.jpg'
      }
    ],
    subtotal: 799000,
    discount: 0,
    couponCode: null,
    shippingCost: 11900,
    carrier: 'Andreani Nacional',
    trackingCode: 'AND-9941123-COR',
    total: 810900,
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: 'Transferencia Bancaria',
    customerNotes: 'Esperando confirmación de comprobante.',
    internalNotes: 'Pendiente de acreditación en CBU Galicia.',
    timeline: [
      { status: OrderStatus.PENDING, title: 'Esperando Transferencia Bancaria', date: '2026-10-06T18:40:00Z', user: 'Sistema' }
    ],
    createdAt: '2026-10-06T18:40:00Z'
  }
];

export const INITIAL_INVENTORY_MOVEMENTS = [
  {
    id: 'mov-1',
    productId: 'heladera-samsung-rt47',
    productName: 'Heladera No Frost 470L Inverter RT47',
    variantSku: 'BC-SAM-1000-STD',
    type: 'ingreso',
    quantity: 10,
    stockBefore: 0,
    stockAfter: 10,
    reason: 'Recepción de embarque contenedor #AF-9921 Aduana',
    userEmail: 'munozalbelonicolas@gmail.com',
    createdAt: '2026-09-28T10:00:00Z'
  },
  {
    id: 'mov-2',
    productId: 'heladera-samsung-rt47',
    productName: 'Heladera No Frost 470L Inverter RT47',
    variantSku: 'BC-SAM-1000-STD',
    type: 'egreso',
    quantity: -2,
    stockBefore: 10,
    stockAfter: 8,
    reason: 'Despacho pedidos online #7001 y #6998',
    userEmail: 'deposito@bcespecialimport.com',
    createdAt: '2026-10-01T15:20:00Z'
  },
  {
    id: 'mov-3',
    productId: 'smart-tv-samsung-55-cu7000',
    productName: 'Smart TV 55" Crystal UHD 4K CU7000',
    variantSku: 'BC-SAM-1001-STD',
    type: 'ingreso',
    quantity: 20,
    stockBefore: 0,
    stockAfter: 20,
    reason: 'Ingreso directo importación oficial',
    userEmail: 'munozalbelonicolas@gmail.com',
    createdAt: '2026-09-25T11:30:00Z'
  },
  {
    id: 'mov-4',
    productId: 'smart-tv-samsung-55-cu7000',
    productName: 'Smart TV 55" Crystal UHD 4K CU7000',
    variantSku: 'BC-SAM-1001-STD',
    type: 'ajuste',
    quantity: -5,
    stockBefore: 20,
    stockAfter: 15,
    reason: 'Auditoría física y separación muestra de showroom',
    userEmail: 'munozalbelonicolas@gmail.com',
    createdAt: '2026-10-03T16:45:00Z'
  }
];

export const INITIAL_COUPONS = [
  {
    id: 'coup-1',
    code: 'BCBIENVENIDA',
    type: 'fixed',
    value: 50000,
    minSpend: 500000,
    startDate: '2026-01-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    maxUses: 200,
    usesCount: 42,
    maxUsesPerCustomer: 1,
    status: 'active'
  },
  {
    id: 'coup-2',
    code: 'HOTWEEK15',
    type: 'percentage',
    value: 15,
    minSpend: 300000,
    startDate: '2026-10-01T00:00:00Z',
    expiresAt: '2026-10-15T23:59:59Z',
    maxUses: 100,
    usesCount: 18,
    maxUsesPerCustomer: 1,
    status: 'active'
  },
  {
    id: 'coup-3',
    code: 'SHOWROOM10',
    type: 'percentage',
    value: 10,
    minSpend: 100000,
    startDate: '2026-09-01T00:00:00Z',
    expiresAt: '2026-11-30T23:59:59Z',
    maxUses: 50,
    usesCount: 9,
    maxUsesPerCustomer: 2,
    status: 'active'
  }
];

export const INITIAL_PROMOTIONS = [
  {
    id: 'promo-1',
    name: 'Mega Lanzamiento Smart TV 4K',
    description: 'Descuento especial por tiempo limitado en televisores 55 pulgadas y superiores',
    type: 'percentage',
    discountValue: 15,
    minSpend: 500000,
    minQuantity: 1,
    targetType: 'category',
    targetIds: ['tecnologia'],
    startDate: '2026-10-01T00:00:00Z',
    endDate: '2026-10-31T23:59:59Z',
    isActive: true
  },
  {
    id: 'promo-2',
    name: 'Combo Cocina Premium',
    description: '$100.000 de descuento llevando 2 o más unidades de línea blanca',
    type: 'fixed',
    discountValue: 100000,
    minSpend: 1500000,
    minQuantity: 2,
    targetType: 'category',
    targetIds: ['electrodomesticos'],
    startDate: '2026-10-05T00:00:00Z',
    endDate: '2026-11-15T23:59:59Z',
    isActive: true
  }
];

export const INITIAL_ADMIN_USERS = [
  {
    id: 'b42c925d-41d7-4264-a122-13670261f37a',
    name: 'Nicolás Muñoz',
    email: 'munozalbelonicolas@gmail.com',
    role: AdminRole.SUPER_ADMIN,
    status: 'active',
    lastLogin: '2026-10-07T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    name: 'Laura Fernández',
    email: 'laura.ventas@bcespecialimport.com',
    role: AdminRole.SALES,
    status: 'active',
    lastLogin: '2026-10-07T08:30:00Z',
    createdAt: '2026-02-15T10:00:00Z'
  },
  {
    id: 'user-3',
    name: 'Gastón Depósito',
    email: 'deposito@bcespecialimport.com',
    role: AdminRole.WAREHOUSE,
    status: 'active',
    lastLogin: '2026-10-06T17:10:00Z',
    createdAt: '2026-03-01T09:00:00Z'
  },
  {
    id: 'user-4',
    name: 'Martín Marketing',
    email: 'marketing@bcespecialimport.com',
    role: AdminRole.MARKETING,
    status: 'active',
    lastLogin: '2026-10-05T12:00:00Z',
    createdAt: '2026-03-10T11:00:00Z'
  }
];

export const INITIAL_PAYMENT_TRANSACTIONS = [
  {
    id: 'PAY-TX-901',
    orderId: 'BC-ORD-7001',
    customerName: 'Mariana Rossi',
    amount: 1878000,
    currency: 'ARS',
    provider: 'mercadopago',
    providerTransactionId: 'MP-883920198',
    status: 'approved',
    date: '2026-10-06T09:16:30Z'
  },
  {
    id: 'PAY-TX-902',
    orderId: 'BC-ORD-7002',
    customerName: 'Carlos Menéndez',
    amount: 1696500,
    currency: 'ARS',
    provider: 'stripe',
    providerTransactionId: 'ch_3M4K1x92j',
    status: 'approved',
    date: '2026-10-05T14:24:00Z'
  },
  {
    id: 'PAY-TX-903',
    orderId: 'BC-ORD-7003',
    customerName: 'Esteban Benítez',
    amount: 810900,
    currency: 'ARS',
    provider: 'bank_transfer',
    providerTransactionId: 'TRANSF-CBU-PEND',
    status: 'pending',
    date: '2026-10-06T18:40:00Z'
  }
];

export const INITIAL_STORE_SETTINGS = {
  general: {
    storeName: 'BC Especial Import',
    tagline: 'Importados de confianza, al mejor precio',
    logo: '/images/logo-transparent.png',
    email: 'contacto@bcespecialimport.com',
    phone: '+54 11 5500-1122',
    cuit: '30-71649201-9',
    instagram: '@bcespecialimport'
  },
  address: {
    street: 'Av. Corrientes 1450',
    floor: 'Showroom Central',
    city: 'CABA',
    province: 'Buenos Aires',
    zip: '1042',
    country: 'Argentina'
  },
  ecommerce: {
    currencySymbol: '$',
    currencyCode: 'ARS',
    taxRate: 21,
    minStockAlert: 3,
    autoReserveStock: true,
    allowGuestCheckout: true,
    orderExpiryHours: 48
  },
  payments: {
    mercadopagoEnabled: true,
    mercadopagoPublicKey: 'APP_USR-xxxx-xxxx-xxxx',
    stripeEnabled: true,
    bankTransferEnabled: true,
    bankTransferDiscount: 10,
    bankCbu: '0070012300000012345678',
    bankAlias: 'BC.IMPORT.GALICIA'
  },
  shipping: {
    andreaniEnabled: true,
    correoArgentinoEnabled: true,
    freeShippingThreshold: 250000,
    expressDeliveryFee: 6500,
    enableLocalPickup: true
  }
};
