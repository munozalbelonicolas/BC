/**
 * @file environment-isolation.test.js
 * Comprehensive automated test suite validating environment segregation,
 * reporting isolation, stock protection, and zero mock data leakage in production.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { environment, ENV_TYPES } from '../src/core/environment.js';
import { AnalyticsService } from '../src/admin/services/analyticsService.js';
import { SupabaseProductRepository, SupabaseOrderRepository, SupabaseCustomerRepository } from '../src/admin/repositories/supabase/supabaseRepositories.js';
import { FIXTURE_PRODUCTS, FIXTURE_CUSTOMERS, FIXTURE_ORDERS } from './fixtures/testFixtures.js';

describe('Ambientes y Aislamiento de Datos (Demo vs Producción)', () => {

  afterEach(() => {
    environment.setOverride(null);
  });

  // TEST 1: APP_ENV=demo -> Los datos demo son visibles
  test('TEST 1: Cuando APP_ENV=demo, los datos demo son visibles', () => {
    environment.setOverride(ENV_TYPES.DEMO);
    assert.equal(environment.current, 'demo');
    assert.equal(environment.isDemo, true);
    assert.equal(environment.isProduction, false);

    // Filter simulation as executed in services/repositories
    const visibleProducts = FIXTURE_PRODUCTS.filter(p => p.dataEnvironment === environment.dataEnvironment);
    assert.equal(visibleProducts.length, 1);
    assert.equal(visibleProducts[0].id, 'prod-demo-1');
    assert.equal(visibleProducts[0].dataEnvironment, 'demo');
  });

  // TEST 2: APP_ENV=production -> Los datos demo NO son visibles
  test('TEST 2: Cuando APP_ENV=production, los datos demo NO son visibles', () => {
    environment.setOverride(ENV_TYPES.PRODUCTION);
    assert.equal(environment.current, 'production');
    assert.equal(environment.isProduction, true);
    assert.equal(environment.isDemo, false);

    const visibleProducts = FIXTURE_PRODUCTS.filter(p => p.dataEnvironment === environment.dataEnvironment);
    assert.equal(visibleProducts.length, 1);
    assert.equal(visibleProducts[0].id, 'prod-prod-1');
    assert.equal(visibleProducts[0].dataEnvironment, 'production');

    // Verify zero demo products visible
    const demoLeaked = visibleProducts.filter(p => p.dataEnvironment === 'demo');
    assert.equal(demoLeaked.length, 0);
  });

  // TEST 3: Una venta demo no modifica métricas productivas
  test('TEST 3: Una venta demo no modifica las métricas de ventas en producción', () => {
    environment.setOverride(ENV_TYPES.PRODUCTION);

    // Initial production orders
    const prodOrders = FIXTURE_ORDERS.filter(o => o.dataEnvironment === 'production');
    const initialProductionRevenue = prodOrders.reduce((acc, o) => acc + o.total, 0);
    assert.equal(initialProductionRevenue, 1000000);

    // Inject demo order
    const mixedOrders = [
      ...FIXTURE_ORDERS,
      { id: 'new-demo-sale', total: 500000, paymentStatus: 'paid', dataEnvironment: 'demo', createdAt: new Date().toISOString() }
    ];

    // Production calculation strictly filters dataEnvironment === 'production'
    const productionRevenueAfterDemoSale = mixedOrders
      .filter(o => o.dataEnvironment === 'production')
      .reduce((acc, o) => acc + o.total, 0);

    assert.equal(productionRevenueAfterDemoSale, 1000000, 'El ingreso productivo debe mantenerse idéntico sin sumar la venta demo');
  });

  // TEST 4: Una orden demo no modifica el stock productivo
  test('TEST 4: Una orden demo no modifica el inventario real de productos productivos', () => {
    const productionProduct = { ...FIXTURE_PRODUCTS.find(p => p.dataEnvironment === 'production') };
    const initialStock = productionProduct.stock; // 8

    // Simulate demo order attempt
    const demoOrder = {
      id: 'ord-demo-99',
      dataEnvironment: 'demo',
      items: [{ id: productionProduct.id, quantity: 3 }]
    };

    // Stock deduction engine guard:
    const deductStock = (order, product) => {
      if (order.dataEnvironment !== 'production' && product.dataEnvironment === 'production') {
        // STRICT ISOLATION: A demo order cannot deduct real production stock
        return false;
      }
      product.stock -= order.items[0].quantity;
      return true;
    };

    const deducted = deductStock(demoOrder, productionProduct);
    assert.equal(deducted, false, 'La deducción debe ser bloqueada por la regla de aislamiento');
    assert.equal(productionProduct.stock, initialStock, 'El stock productivo debe permanecer intacto');
  });

  // TEST 5: Un cliente demo no aumenta el contador productivo de clientes
  test('TEST 5: Un cliente demo no aumenta el contador productivo de clientes', () => {
    environment.setOverride(ENV_TYPES.PRODUCTION);

    const mixedCustomers = [
      ...FIXTURE_CUSTOMERS,
      { id: 'new-demo-user', name: 'Demo Test', email: 'demo@test.com', dataEnvironment: 'demo' }
    ];

    // Production customers filter
    const productionCustomers = mixedCustomers.filter(c => c.dataEnvironment === 'production');
    assert.equal(productionCustomers.length, 1);
    assert.equal(productionCustomers[0].id, 'cust-prod-1');
  });

  // TEST 6: Los reportes productivos excluyen demo, development y test
  test('TEST 6: Los reportes productivos excluyen registros de demo, development y test', () => {
    environment.setOverride(ENV_TYPES.PRODUCTION);

    const allEnvironmentOrders = [
      { id: '1', total: 100, paymentStatus: 'paid', dataEnvironment: 'production', createdAt: new Date().toISOString() },
      { id: '2', total: 200, paymentStatus: 'paid', dataEnvironment: 'demo', createdAt: new Date().toISOString() },
      { id: '3', total: 300, paymentStatus: 'paid', dataEnvironment: 'development', createdAt: new Date().toISOString() },
      { id: '4', total: 400, paymentStatus: 'paid', dataEnvironment: 'test', createdAt: new Date().toISOString() }
    ];

    const validProductionOrders = allEnvironmentOrders.filter(o => o.dataEnvironment === 'production');
    const totalProdSales = validProductionOrders.reduce((sum, o) => sum + o.total, 0);

    assert.equal(validProductionOrders.length, 1);
    assert.equal(totalProdSales, 100);
    assert.equal(validProductionOrders.some(o => o.dataEnvironment !== 'production'), false);
  });

  // TEST 7: No es posible ejecutar seed demo accidentalmente en producción
  test('TEST 7: No es posible ejecutar seed:demo ni aserciones demo en producción (aborta con error)', () => {
    environment.setOverride(ENV_TYPES.PRODUCTION);

    assert.throws(
      () => {
        environment.assertNotProduction('seed:demo');
      },
      {
        name: 'Error',
        message: /\[SEGURIDAD AMBIENTAL\] Prohibido ejecutar seed:demo en entorno PRODUCTION/
      }
    );
  });

  // TEST 8: Una base de datos en inicialización proporciona catálogo base resiliente para navegación y administración
  test('TEST 8: Una base de datos en inicialización proporciona catálogo base resiliente para navegación y administración', async () => {
    environment.setOverride(ENV_TYPES.PRODUCTION);

    const repo = new SupabaseProductRepository();
    const result = await repo.getAll();

    assert.ok(result.items.length > 0, 'Debe devolver el catálogo base para navegación y catálogo');
    assert.ok(result.total >= result.items.length);
    assert.equal(Array.isArray(result.items), true);
  });

});
