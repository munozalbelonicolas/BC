/**
 * @file mockCustomerData.js
 * In-memory customer repository mock data for development and tests.
 */

export const INITIAL_CUSTOMER_PROFILE = {
  id: 'b42c925d-41d7-4264-a122-13670261f37a',
  name: 'Nicolás',
  lastName: 'Muñoz',
  email: 'munozalbelonicolas@gmail.com',
  phone: '+54 11 4455-8899',
  documentId: '32.456.789',
  birthDate: '1992-06-15',
  createdAt: '2026-01-10T14:30:00Z',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
};

export const INITIAL_CUSTOMER_ADDRESSES = [
  {
    id: 'addr-1',
    userId: 'b42c925d-41d7-4264-a122-13670261f37a',
    alias: 'Casa',
    recipientName: 'Nicolás Muñoz',
    phone: '+54 11 4455-8899',
    street: 'Av. Corrientes',
    number: '1450',
    floor: '4',
    apartment: 'B',
    zipCode: '1042',
    city: 'CABA',
    province: 'Buenos Aires',
    reference: 'Timbre 4B, conserje recibe en portería',
    isDefault: true
  },
  {
    id: 'addr-2',
    userId: 'b42c925d-41d7-4264-a122-13670261f37a',
    alias: 'Oficina / Estudio',
    recipientName: 'Nicolás Muñoz (Recepción)',
    phone: '+54 11 5566-7788',
    street: 'Guatemala',
    number: '5120',
    floor: '1',
    apartment: 'A',
    zipCode: '1425',
    city: 'CABA',
    province: 'Buenos Aires',
    reference: 'Horario comercial 10 a 18 hs',
    isDefault: false
  }
];

export const INITIAL_CUSTOMER_ORDERS = [
  {
    id: 'BC-78942',
    orderNumber: '#78942',
    userId: 'b42c925d-41d7-4264-a122-13670261f37a',
    date: '2026-10-06T10:15:00Z',
    status: 'Despachado en camino',
    statusStep: 3, // 1: Creado, 2: Preparando, 3: Despachado, 4: Entregado
    total: 1399000,
    subtotal: 1399000,
    shippingCost: 0,
    discount: 0,
    carrier: 'Andreani Express',
    trackingCode: 'AND-92847102-AR',
    estimatedDelivery: '8 de Octubre, 2026',
    paymentMethod: 'Mercado Pago (Transferencia)',
    shippingAddress: {
      street: 'Av. Corrientes 1450, Piso 4 B',
      city: 'CABA, Buenos Aires',
      recipient: 'Nicolás Muñoz'
    },
    items: [
      {
        id: 'apple-iphone-15-128gb',
        name: 'iPhone 15 128GB 5G',
        variant: 'Titanio Negro',
        quantity: 1,
        unitPrice: 1399000,
        subtotal: 1399000,
        image: '/images/iphone-15.jpg'
      }
    ],
    timeline: [
      { step: 'Pedido confirmado', date: '6 Oct 2026, 10:15 hs', completed: true },
      { step: 'Pago aprobado', date: '6 Oct 2026, 10:16 hs', completed: true },
      { step: 'Preparado en depósito', date: '6 Oct 2026, 14:00 hs', completed: true },
      { step: 'Despachado en camino (Andreani)', date: '7 Oct 2026, 09:30 hs', completed: true },
      { step: 'Entregado al domicilio', date: 'Estimado: 8 Oct 2026', completed: false }
    ],
    canCancel: false
  },
  {
    id: 'BC-65410',
    orderNumber: '#65410',
    userId: 'b42c925d-41d7-4264-a122-13670261f37a',
    date: '2026-09-24T16:20:00Z',
    status: 'Entregado',
    statusStep: 4,
    total: 799000,
    subtotal: 799000,
    shippingCost: 0,
    discount: 0,
    carrier: 'Andreani Express',
    trackingCode: 'AND-88910234-AR',
    estimatedDelivery: 'Entregado el 26 de Septiembre, 2026',
    paymentMethod: 'Tarjeta de Crédito Visa (3 Cuotas)',
    shippingAddress: {
      street: 'Av. Corrientes 1450, Piso 4 B',
      city: 'CABA, Buenos Aires',
      recipient: 'Nicolás Muñoz'
    },
    items: [
      {
        id: 'smart-tv-samsung-55-cu7000',
        name: 'Smart TV 55" Crystal UHD 4K CU7000',
        variant: '55 Pulgadas',
        quantity: 1,
        unitPrice: 799000,
        subtotal: 799000,
        image: '/images/smart-tv-samsung.jpg'
      }
    ],
    timeline: [
      { step: 'Pedido confirmado', date: '24 Sep 2026, 16:20 hs', completed: true },
      { step: 'Pago aprobado', date: '24 Sep 2026, 16:22 hs', completed: true },
      { step: 'Despachado', date: '25 Sep 2026, 10:00 hs', completed: true },
      { step: 'Entregado', date: '26 Sep 2026, 14:45 hs', completed: true }
    ],
    canCancel: false
  }
];

export const INITIAL_CUSTOMER_COUPONS = [
  {
    id: 'coup-user-1',
    code: 'BC10',
    benefit: '10% OFF en toda la tienda',
    type: 'percentage',
    value: 10,
    minSpend: 200000,
    expiresAt: '2026-11-30T23:59:59Z',
    status: 'available',
    condition: 'Aplica a todas las categorías en compras mayores a $200.000'
  },
  {
    id: 'coup-user-2',
    code: 'BIENVENIDA',
    benefit: '15% OFF en tu próxima compra',
    type: 'percentage',
    value: 15,
    minSpend: 350000,
    expiresAt: '2026-10-31T23:59:59Z',
    status: 'available',
    condition: 'Exclusivo para clientes registrados'
  }
];

export const INITIAL_CUSTOMER_RETURNS = [
  {
    id: 'ret-101',
    orderId: 'BC-65410',
    productId: 'cable-hdmi-premium',
    productName: 'Cable HDMI 2.1 Ultra High Speed 8K',
    quantity: 1,
    reason: 'Producto con falla o defecto de fábrica',
    comments: 'El conector tenía falso contacto al enchufar en el puerto HDMI.',
    status: 'Aprobada - Esperando recepción',
    createdAt: '2026-09-28T11:00:00Z'
  }
];

export const INITIAL_CUSTOMER_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Tu pedido #BC-78942 está en camino 🚚',
    message: 'Andreani ya retiró tu iPhone 15 de nuestro depósito. Código de seguimiento: AND-92847102-AR.',
    type: 'order',
    linkUrl: '#pedidos/BC-78942',
    isRead: false,
    createdAt: '2026-10-07T09:30:00Z'
  },
  {
    id: 'notif-2',
    title: '¡Tenés un cupón del 15% OFF disponible! 🎟️',
    message: 'Usá el código BIENVENIDA en tu próxima compra antes del 31 de octubre.',
    type: 'promotion',
    linkUrl: '#cupones',
    isRead: false,
    createdAt: '2026-10-05T12:00:00Z'
  },
  {
    id: 'notif-3',
    title: 'Solicitud de cambio aprobada ✅',
    message: 'Tu solicitud para el pedido #BC-65410 fue aprobada. Podés acercarte a nuestro Showroom o aguardar el retiro.',
    type: 'return',
    linkUrl: '#devoluciones',
    isRead: true,
    createdAt: '2026-09-29T15:00:00Z'
  }
];
