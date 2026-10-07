/**
 * @file mockRepositories.js
 * In-memory repository implementations satisfying repository contracts.
 */

import {
  IProductRepository,
  ICategoryRepository,
  IBrandRepository,
  IInventoryRepository,
  IOrderRepository,
  ICustomerRepository,
  IPromotionRepository,
  ICouponRepository,
  IAdminUserRepository,
  ISettingsRepository,
  IAuditRepository
} from '../contracts.js';

import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_INVENTORY_MOVEMENTS,
  INITIAL_COUPONS,
  INITIAL_PROMOTIONS,
  INITIAL_ADMIN_USERS,
  INITIAL_STORE_SETTINGS
} from './mockData.js';

import { getStockStatus } from '../../types/entities.js';

export class MockProductRepository extends IProductRepository {
  constructor() {
    super();
    this.products = [...INITIAL_PRODUCTS];
  }

  async getAll(options = {}) {
    let result = [...this.products];

    // Filter by search
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (options.category && options.category !== 'all') {
      result = result.filter(p => p.category === options.category);
    }

    // Filter by brand
    if (options.brand && options.brand !== 'all') {
      result = result.filter(p => p.brand?.toLowerCase() === options.brand.toLowerCase());
    }

    // Filter by status
    if (options.status && options.status !== 'all') {
      result = result.filter(p => p.status === options.status);
    }

    // Filter by stock level
    if (options.stockFilter) {
      if (options.stockFilter === 'low') {
        result = result.filter(p => p.stock > 0 && p.stock <= (p.minStock || 3));
      } else if (options.stockFilter === 'out') {
        result = result.filter(p => p.stock <= 0);
      }
    }

    // Sort
    const sortBy = options.sortBy || 'updatedAt';
    const sortDir = options.sortDirection === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return -1 * sortDir;
      if (valA > valB) return 1 * sortDir;
      return 0;
    });

    const total = result.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const items = result.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getById(id) {
    const p = this.products.find(item => item.id === id);
    if (!p) throw new Error(`Producto con ID ${id} no encontrado`);
    return { ...p };
  }

  async create(product) {
    const exists = this.products.some(p => p.sku === product.sku && product.sku);
    if (exists) {
      throw new Error(`El SKU "${product.sku}" ya está registrado en otro producto.`);
    }

    const newProd = {
      ...product,
      id: product.id || `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.products.unshift(newProd);
    return newProd;
  }

  async update(id, updates) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Producto no encontrado: ${id}`);

    if (updates.sku) {
      const duplicateSku = this.products.some(p => p.sku === updates.sku && p.id !== id);
      if (duplicateSku) {
        throw new Error(`El SKU "${updates.sku}" ya está asignado a otro producto.`);
      }
    }

    const updated = {
      ...this.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.products[idx] = updated;
    return updated;
  }

  async delete(id) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Producto no encontrado: ${id}`);
    const deleted = this.products.splice(idx, 1)[0];
    return deleted;
  }

  async bulkUpdate(ids, updates) {
    let affected = 0;
    this.products = this.products.map(p => {
      if (ids.includes(p.id)) {
        affected++;
        return { ...p, ...updates, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    return { success: true, count: affected };
  }

  async bulkDelete(ids) {
    const initial = this.products.length;
    this.products = this.products.filter(p => !ids.includes(p.id));
    return { success: true, count: initial - this.products.length };
  }
}

export class MockCategoryRepository extends ICategoryRepository {
  constructor() {
    super();
    this.categories = [...INITIAL_CATEGORIES];
  }

  async getAll() {
    return [...this.categories];
  }

  async getById(id) {
    const c = this.categories.find(item => item.id === id);
    if (!c) throw new Error(`Categoría ${id} no encontrada`);
    return { ...c };
  }

  async create(cat) {
    const newCat = {
      ...cat,
      id: cat.id || cat.slug || `cat_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.categories.push(newCat);
    return newCat;
  }

  async update(id, updates) {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Categoría no encontrada: ${id}`);
    this.categories[idx] = { ...this.categories[idx], ...updates };
    return this.categories[idx];
  }

  async delete(id) {
    this.categories = this.categories.filter(c => c.id !== id);
    return { success: true };
  }
}

export class MockBrandRepository extends IBrandRepository {
  constructor() {
    super();
    this.brands = [...INITIAL_BRANDS];
  }

  async getAll() {
    return [...this.brands];
  }

  async getById(id) {
    const b = this.brands.find(item => item.id === id);
    if (!b) throw new Error(`Marca no encontrada`);
    return { ...b };
  }

  async create(brand) {
    const newBrand = {
      ...brand,
      id: brand.id || brand.slug || `brand_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.brands.push(newBrand);
    return newBrand;
  }

  async update(id, updates) {
    const idx = this.brands.findIndex(b => b.id === id);
    if (idx === -1) throw new Error(`Marca no encontrada`);
    this.brands[idx] = { ...this.brands[idx], ...updates };
    return this.brands[idx];
  }

  async delete(id) {
    this.brands = this.brands.filter(b => b.id !== id);
    return { success: true };
  }
}

export class MockInventoryRepository extends IInventoryRepository {
  constructor(productRepo) {
    super();
    this.productRepo = productRepo;
    this.movements = [...INITIAL_INVENTORY_MOVEMENTS];
  }

  async getStockOverview(options = {}) {
    const { items: products } = await this.productRepo.getAll({ pageSize: 100 });
    let overview = products.map(p => {
      const stockStatus = getStockStatus(p.stock, p.minStock || 3);
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        image: p.image,
        variant: p.variants?.[0]?.name || 'Principal',
        variantSku: p.variants?.[0]?.sku || p.sku,
        availableStock: p.stock,
        reservedStock: p.reservedStock || 0,
        minStock: p.minStock || 3,
        status: stockStatus
      };
    });

    if (options.status && options.status !== 'all') {
      overview = overview.filter(item => item.status === options.status);
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      overview = overview.filter(item =>
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    }

    return overview;
  }

  async adjustStock({ productId, quantity, type, reason, userEmail, variantSku }) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Debe especificar un motivo detallado para el movimiento de inventario.');
    }
    const product = await this.productRepo.getById(productId);
    const stockBefore = product.stock;
    const qtyNum = Number(quantity);
    
    let stockAfter = stockBefore;
    if (type === 'ingreso') {
      stockAfter = stockBefore + Math.abs(qtyNum);
    } else if (type === 'egreso') {
      stockAfter = Math.max(0, stockBefore - Math.abs(qtyNum));
    } else if (type === 'ajuste') {
      stockAfter = Math.max(0, qtyNum);
    }

    // Update product stock
    await this.productRepo.update(productId, { stock: stockAfter });

    // Record movement (Never silent)
    const movement = {
      id: `mov_${Date.now()}`,
      productId,
      productName: product.name,
      variantSku: variantSku || product.sku,
      type,
      quantity: stockAfter - stockBefore,
      stockBefore,
      stockAfter,
      reason,
      userEmail: userEmail || 'operador@bcimport.com',
      createdAt: new Date().toISOString()
    };

    this.movements.unshift(movement);
    return { movement, stockAfter };
  }

  async getMovements(options = {}) {
    let result = [...this.movements];
    if (options.productId) {
      result = result.filter(m => m.productId === options.productId);
    }
    return result;
  }
}

export class MockOrderRepository extends IOrderRepository {
  constructor() {
    super();
    this.orders = [...INITIAL_ORDERS];
  }

  async getAll(options = {}) {
    let result = [...this.orders];
    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q)
      );
    }

    if (options.status && options.status !== 'all') {
      result = result.filter(o => o.status === options.status);
    }

    if (options.paymentStatus && options.paymentStatus !== 'all') {
      result = result.filter(o => o.paymentStatus === options.paymentStatus);
    }

    const total = result.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const items = result.slice((page - 1) * pageSize, page * pageSize);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id) {
    const o = this.orders.find(item => item.id === id);
    if (!o) throw new Error(`Pedido no encontrado: ${id}`);
    return { ...o };
  }

  async updateStatus(id, newStatus, reason = '', user = 'Administrador') {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Pedido no encontrado: ${id}`);

    const current = this.orders[idx];
    const timelineEntry = {
      status: newStatus,
      title: `Estado actualizado a ${newStatus.toUpperCase()}`,
      date: new Date().toISOString(),
      user,
      reason
    };

    current.status = newStatus;
    current.timeline = current.timeline || [];
    current.timeline.push(timelineEntry);

    this.orders[idx] = { ...current };
    return this.orders[idx];
  }

  async updateTracking(id, carrier, trackingCode) {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Pedido no encontrado: ${id}`);
    this.orders[idx].carrier = carrier;
    this.orders[idx].trackingCode = trackingCode;
    return this.orders[idx];
  }

  async addInternalNote(id, note) {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Pedido no encontrado: ${id}`);
    const existing = this.orders[idx].internalNotes || '';
    this.orders[idx].internalNotes = existing ? `${existing}\n- ${note}` : note;
    return this.orders[idx];
  }
}

export class MockCustomerRepository extends ICustomerRepository {
  constructor() {
    super();
    this.customers = [...INITIAL_CUSTOMERS];
  }

  async getAll(options = {}) {
    let result = [...this.customers];
    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }
    const total = result.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const items = result.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id) {
    const c = this.customers.find(item => item.id === id);
    if (!c) throw new Error(`Cliente no encontrado: ${id}`);
    return { ...c };
  }

  async update(id, updates) {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Cliente no encontrado: ${id}`);
    this.customers[idx] = { ...this.customers[idx], ...updates };
    return this.customers[idx];
  }
}

export class MockPromotionRepository extends IPromotionRepository {
  constructor() {
    super();
    this.promotions = [...INITIAL_PROMOTIONS];
  }

  async getAll() {
    return [...this.promotions];
  }

  async create(promo) {
    const newPromo = { ...promo, id: promo.id || `promo_${Date.now()}` };
    this.promotions.push(newPromo);
    return newPromo;
  }

  async update(id, updates) {
    const idx = this.promotions.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Promoción no encontrada');
    this.promotions[idx] = { ...this.promotions[idx], ...updates };
    return this.promotions[idx];
  }

  async delete(id) {
    this.promotions = this.promotions.filter(p => p.id !== id);
    return { success: true };
  }
}

export class MockCouponRepository extends ICouponRepository {
  constructor() {
    super();
    this.coupons = [...INITIAL_COUPONS];
  }

  async getAll() {
    return [...this.coupons];
  }

  async getByCode(code) {
    return this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
  }

  async create(coupon) {
    const exists = this.coupons.some(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (exists) throw new Error(`El código ${coupon.code} ya existe.`);
    const newCoupon = { ...coupon, id: coupon.id || `coup_${Date.now()}`, usesCount: 0 };
    this.coupons.push(newCoupon);
    return newCoupon;
  }

  async update(id, updates) {
    const idx = this.coupons.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Cupón no encontrado');
    this.coupons[idx] = { ...this.coupons[idx], ...updates };
    return this.coupons[idx];
  }

  async delete(id) {
    this.coupons = this.coupons.filter(c => c.id !== id);
    return { success: true };
  }
}

export class MockAdminUserRepository extends IAdminUserRepository {
  constructor() {
    super();
    this.users = [...INITIAL_ADMIN_USERS];
  }

  async getAll() {
    return [...this.users];
  }

  async getById(id) {
    const u = this.users.find(user => user.id === id);
    if (!u) throw new Error('Usuario no encontrado');
    return { ...u };
  }

  async create(user) {
    const exists = this.users.some(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (exists) throw new Error('Ya existe un usuario con este correo electrónico.');
    const newUser = {
      ...user,
      id: user.id || `user_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id, updates) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuario no encontrado');
    this.users[idx] = { ...this.users[idx], ...updates };
    return this.users[idx];
  }

  async delete(id) {
    this.users = this.users.filter(u => u.id !== id);
    return { success: true };
  }
}

export class MockSettingsRepository extends ISettingsRepository {
  constructor() {
    super();
    this.settings = JSON.parse(JSON.stringify(INITIAL_STORE_SETTINGS));
  }

  async getSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  async updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    return this.settings;
  }
}

export class MockAuditRepository extends IAuditRepository {
  constructor() {
    super();
    this.logs = [];
  }

  async getAll(options = {}) {
    let result = [...this.logs];
    if (options.entity) {
      result = result.filter(l => l.entity === options.entity);
    }
    return result;
  }

  async create(entry) {
    this.logs.unshift(entry);
    return entry;
  }
}
