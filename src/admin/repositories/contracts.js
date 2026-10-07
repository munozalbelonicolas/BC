/**
 * @file contracts.js
 * Interfaces and contract definitions for repositories.
 */

/**
 * @typedef {Object} QueryOptions
 * @property {string} [search]
 * @property {string} [category]
 * @property {string} [status]
 * @property {string} [sortBy]
 * @property {'asc'|'desc'} [sortDirection]
 * @property {number} [page]
 * @property {number} [pageSize]
 */

/**
 * @typedef {Object} PaginatedResult
 * @property {Array} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 */

export class IProductRepository {
  async getAll(options) { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async create(product) { throw new Error('Not implemented'); }
  async update(id, updates) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
  async bulkUpdate(ids, updates) { throw new Error('Not implemented'); }
  async bulkDelete(ids) { throw new Error('Not implemented'); }
}

export class ICategoryRepository {
  async getAll() { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async create(category) { throw new Error('Not implemented'); }
  async update(id, updates) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

export class IBrandRepository {
  async getAll() { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async create(brand) { throw new Error('Not implemented'); }
  async update(id, updates) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

export class IInventoryRepository {
  async getStockOverview(options) { throw new Error('Not implemented'); }
  async adjustStock(adjustment) { throw new Error('Not implemented'); }
  async getMovements(options) { throw new Error('Not implemented'); }
}

export class IOrderRepository {
  async getAll(options) { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async updateStatus(id, newStatus, reason) { throw new Error('Not implemented'); }
  async updateTracking(id, carrier, trackingCode) { throw new Error('Not implemented'); }
  async addInternalNote(id, note) { throw new Error('Not implemented'); }
}

export class ICustomerRepository {
  async getAll(options) { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async update(id, updates) { throw new Error('Not implemented'); }
}

export class IPromotionRepository {
  async getAll() { throw new Error('Not implemented'); }
  async create(promotion) { throw new Error('Not implemented'); }
  async update(id, updates) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

export class ICouponRepository {
  async getAll() { throw new Error('Not implemented'); }
  async getByCode(code) { throw new Error('Not implemented'); }
  async create(coupon) { throw new Error('Not implemented'); }
  async update(id, updates) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

export class IAdminUserRepository {
  async getAll() { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async create(user) { throw new Error('Not implemented'); }
  async update(id, updates) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

export class ISettingsRepository {
  async getSettings() { throw new Error('Not implemented'); }
  async updateSettings(settings) { throw new Error('Not implemented'); }
}

export class IAuditRepository {
  async getAll(options) { throw new Error('Not implemented'); }
  async create(entry) { throw new Error('Not implemented'); }
}
