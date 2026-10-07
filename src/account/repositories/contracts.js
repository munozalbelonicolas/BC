/**
 * @file contracts.js
 * Contract definitions for customer account repositories.
 */

export class ICustomerOrderRepository {
  async getMyOrders(userId) { throw new Error('Not implemented'); }
  async getOrderById(userId, orderId) { throw new Error('Not implemented'); }
  async cancelOrder(userId, orderId, reason) { throw new Error('Not implemented'); }
}

export class ICustomerAddressRepository {
  async getAddresses(userId) { throw new Error('Not implemented'); }
  async createAddress(userId, address) { throw new Error('Not implemented'); }
  async updateAddress(userId, addressId, updates) { throw new Error('Not implemented'); }
  async deleteAddress(userId, addressId) { throw new Error('Not implemented'); }
  async setDefault(userId, addressId) { throw new Error('Not implemented'); }
}

export class ICustomerFavoritesRepository {
  async getFavorites(userId) { throw new Error('Not implemented'); }
  async addFavorite(userId, productId) { throw new Error('Not implemented'); }
  async removeFavorite(userId, productId) { throw new Error('Not implemented'); }
  async isFavorite(userId, productId) { throw new Error('Not implemented'); }
}

export class ICustomerReturnRepository {
  async getMyReturns(userId) { throw new Error('Not implemented'); }
  async createReturn(userId, returnData) { throw new Error('Not implemented'); }
}

export class ICustomerNotificationRepository {
  async getNotifications(userId) { throw new Error('Not implemented'); }
  async markAsRead(userId, notificationId) { throw new Error('Not implemented'); }
  async markAllAsRead(userId) { throw new Error('Not implemented'); }
}
