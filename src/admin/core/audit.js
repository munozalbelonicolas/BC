/**
 * @file audit.js
 * Centralized Audit Trail service for immutable tracking of admin operations.
 */

import { authorizer } from './rbac.js';

class AuditLogger {
  constructor() {
    this.logs = [];
    this.repository = null;
  }

  setRepository(repo) {
    this.repository = repo;
  }

  /**
   * Log an administrative event
   * @param {Object} entry
   * @param {string} entry.action - e.g. 'PRODUCT_CREATED', 'STOCK_ADJUSTED', 'PRICE_UPDATED'
   * @param {string} entry.entity - e.g. 'Product', 'Order', 'Inventory'
   * @param {string} entry.entityId
   * @param {Object} [entry.oldValues]
   * @param {Object} [entry.newValues]
   * @param {string} [entry.notes]
   */
  async log({ action, entity, entityId, oldValues = null, newValues = null, notes = '' }) {
    const user = authorizer.getCurrentUser();
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action,
      entity,
      entityId,
      oldValues,
      newValues,
      notes,
      createdAt: new Date().toISOString()
    };

    this.logs.unshift(entry);

    if (this.repository && typeof this.repository.create === 'function') {
      try {
        await this.repository.create(entry);
      } catch (err) {
        console.warn('Audit repository sync warning:', err);
      }
    }

    return entry;
  }

  getRecentLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }
}

export const auditLogger = new AuditLogger();
