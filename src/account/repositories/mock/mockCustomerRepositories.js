/**
 * @file mockCustomerRepositories.js
 * In-memory repository implementations for customer data with ownership guarantees.
 */

import {
  ICustomerOrderRepository,
  ICustomerAddressRepository,
  ICustomerFavoritesRepository,
  ICustomerReturnRepository,
  ICustomerNotificationRepository
} from '../contracts.js';

import {
  INITIAL_CUSTOMER_ORDERS,
  INITIAL_CUSTOMER_ADDRESSES,
  INITIAL_CUSTOMER_COUPONS,
  INITIAL_CUSTOMER_RETURNS,
  INITIAL_CUSTOMER_NOTIFICATIONS,
  INITIAL_CUSTOMER_PROFILE
} from './mockCustomerData.js';

import { PRODUCTS } from '../../../data/products.js';

export class MockCustomerOrderRepository extends ICustomerOrderRepository {
  constructor() {
    super();
    this.orders = [...INITIAL_CUSTOMER_ORDERS];
  }

  async getMyOrders(userId) {
    return this.orders.filter(o => !o.userId || o.userId === userId);
  }

  async getOrderById(userId, orderId) {
    const o = this.orders.find(item => item.id === orderId && (!item.userId || item.userId === userId));
    if (!o) throw new Error(`Pedido no encontrado o no pertenece a tu cuenta.`);
    return { ...o };
  }

  async cancelOrder(userId, orderId, reason) {
    const idx = this.orders.findIndex(item => item.id === orderId && item.userId === userId);
    if (idx === -1) throw new Error('Pedido no encontrado');
    if (!this.orders[idx].canCancel) {
      throw new Error('El pedido ya se encuentra en preparación o despachado y no puede cancelarse de forma automática.');
    }
    this.orders[idx].status = 'Cancelado';
    this.orders[idx].cancelReason = reason;
    return this.orders[idx];
  }
}

export class MockCustomerAddressRepository extends ICustomerAddressRepository {
  constructor() {
    super();
    this.addresses = [...INITIAL_CUSTOMER_ADDRESSES];
  }

  async getAddresses(userId) {
    return this.addresses.filter(a => a.userId === userId);
  }

  async createAddress(userId, address) {
    const newAddr = {
      ...address,
      id: `addr_${Date.now()}`,
      userId,
      isDefault: this.addresses.filter(a => a.userId === userId).length === 0 ? true : Boolean(address.isDefault)
    };

    if (newAddr.isDefault) {
      this.addresses.forEach(a => { if (a.userId === userId) a.isDefault = false; });
    }

    this.addresses.push(newAddr);
    return newAddr;
  }

  async updateAddress(userId, addressId, updates) {
    const idx = this.addresses.findIndex(a => a.id === addressId && a.userId === userId);
    if (idx === -1) throw new Error('Dirección no encontrada');

    if (updates.isDefault) {
      this.addresses.forEach(a => { if (a.userId === userId) a.isDefault = false; });
    }

    this.addresses[idx] = { ...this.addresses[idx], ...updates };
    return this.addresses[idx];
  }

  async deleteAddress(userId, addressId) {
    this.addresses = this.addresses.filter(a => !(a.id === addressId && a.userId === userId));
    return { success: true };
  }

  async setDefault(userId, addressId) {
    this.addresses.forEach(a => {
      if (a.userId === userId) {
        a.isDefault = (a.id === addressId);
      }
    });
    return { success: true };
  }
}

export class MockCustomerFavoritesRepository extends ICustomerFavoritesRepository {
  constructor() {
    super();
    this.favoritesMap = new Map();
    // Preload some favorites for demo user
    this.favoritesMap.set('b42c925d-41d7-4264-a122-13670261f37a', new Set(['heladera-samsung-rt47', 'dji-mini-4-pro']));
  }

  async getFavorites(userId) {
    const set = this.favoritesMap.get(userId) || new Set();
    const result = [];
    set.forEach(id => {
      const prod = PRODUCTS.find(p => p.id === id);
      if (prod) result.push(prod);
    });
    return result;
  }

  async addFavorite(userId, productId) {
    if (!this.favoritesMap.has(userId)) {
      this.favoritesMap.set(userId, new Set());
    }
    this.favoritesMap.get(userId).add(productId);
    return true;
  }

  async removeFavorite(userId, productId) {
    if (this.favoritesMap.has(userId)) {
      this.favoritesMap.get(userId).delete(productId);
    }
    return true;
  }

  async isFavorite(userId, productId) {
    const set = this.favoritesMap.get(userId);
    return set ? set.has(productId) : false;
  }
}

export class MockCustomerReturnRepository extends ICustomerReturnRepository {
  constructor() {
    super();
    this.returns = [...INITIAL_CUSTOMER_RETURNS];
  }

  async getMyReturns(userId) {
    return [...this.returns];
  }

  async createReturn(userId, returnData) {
    const newRet = {
      ...returnData,
      id: `ret_${Date.now()}`,
      userId,
      status: 'Solicitud enviada',
      createdAt: new Date().toISOString()
    };
    this.returns.unshift(newRet);
    return newRet;
  }
}

export class MockCustomerNotificationRepository extends ICustomerNotificationRepository {
  constructor() {
    super();
    this.notifications = [...INITIAL_CUSTOMER_NOTIFICATIONS];
  }

  async getNotifications(userId) {
    return [...this.notifications];
  }

  async markAsRead(userId, notificationId) {
    const n = this.notifications.find(item => item.id === notificationId);
    if (n) n.isRead = true;
    return true;
  }

  async markAllAsRead(userId) {
    this.notifications.forEach(n => n.isRead = true);
    return true;
  }
}
