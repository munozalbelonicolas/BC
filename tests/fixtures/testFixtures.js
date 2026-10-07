/**
 * @file testFixtures.js
 * Isolated test fixtures for automated environment-isolation tests.
 * Cleanly separated from application runtime.
 */

export const FIXTURE_PRODUCTS = [
  {
    id: 'prod-demo-1',
    name: 'Heladera Demo 470L',
    brand: 'Samsung',
    category: 'electrodomesticos',
    price: 1100000,
    cost: 700000,
    stock: 10,
    minStock: 2,
    dataEnvironment: 'demo'
  },
  {
    id: 'prod-prod-1',
    name: 'Heladera Real Producción 470L',
    brand: 'Samsung',
    category: 'electrodomesticos',
    price: 1100000,
    cost: 700000,
    stock: 8,
    minStock: 2,
    dataEnvironment: 'production'
  }
];

export const FIXTURE_CUSTOMERS = [
  {
    id: 'cust-demo-1',
    name: 'Juan Demo',
    email: 'juan.demo@example.com',
    dataEnvironment: 'demo'
  },
  {
    id: 'cust-prod-1',
    name: 'Juan Real',
    email: 'juan.real@example.com',
    dataEnvironment: 'production'
  }
];

export const FIXTURE_ORDERS = [
  {
    id: 'ord-demo-1',
    total: 250000,
    paymentStatus: 'paid',
    status: 'Entregado',
    items: [{ id: 'prod-demo-1', name: 'Heladera Demo 470L', quantity: 1, unitPrice: 250000 }],
    createdAt: new Date().toISOString(),
    dataEnvironment: 'demo'
  },
  {
    id: 'ord-prod-1',
    total: 1000000,
    paymentStatus: 'paid',
    status: 'Entregado',
    items: [{ id: 'prod-prod-1', name: 'Heladera Real Producción 470L', quantity: 1, unitPrice: 1000000 }],
    createdAt: new Date().toISOString(),
    dataEnvironment: 'production'
  }
];
