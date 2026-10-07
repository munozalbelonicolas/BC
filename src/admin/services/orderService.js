/**
 * @file orderService.js
 * Order lifecycle management, status state-machine transitions, and timeline updates.
 */

import { orderRepo } from '../repositories/factory.js';
import { authorizer } from '../core/rbac.js';
import { auditLogger } from '../core/audit.js';

export class OrderService {
  static async getOrders(options = {}) {
    return orderRepo.getAll(options);
  }

  static async getOrderById(id) {
    return orderRepo.getById(id);
  }

  static async updateOrderStatus(id, newStatus, reason = '') {
    const user = authorizer.getCurrentUser();
    const updated = await orderRepo.updateStatus(id, newStatus, reason, user.name);

    await auditLogger.log({
      action: 'ORDER_STATUS_UPDATED',
      entity: 'Order',
      entityId: id,
      newValues: { status: newStatus, reason },
      notes: `Estado de pedido modificado a ${newStatus} por ${user.name}`
    });

    return updated;
  }

  static async updateTracking(id, carrier, trackingCode) {
    const updated = await orderRepo.updateTracking(id, carrier, trackingCode);
    await auditLogger.log({
      action: 'ORDER_TRACKING_UPDATED',
      entity: 'Order',
      entityId: id,
      newValues: { carrier, trackingCode },
      notes: `Información de envío actualizada: ${carrier} (${trackingCode})`
    });
    return updated;
  }

  static async addInternalNote(id, note) {
    return orderRepo.addInternalNote(id, note);
  }
}
