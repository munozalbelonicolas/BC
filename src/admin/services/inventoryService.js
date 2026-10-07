/**
 * @file inventoryService.js
 * Inventory control, stock adjustments, and non-silent audit movement logging.
 */

import { inventoryRepo } from '../repositories/factory.js';
import { authorizer } from '../core/rbac.js';
import { auditLogger } from '../core/audit.js';

export class InventoryService {
  static async getOverview(options = {}) {
    return inventoryRepo.getStockOverview(options);
  }

  static async getMovements(options = {}) {
    return inventoryRepo.getMovements(options);
  }

  /**
   * Adjust stock with mandatory reason and operator traceability
   * @param {Object} params
   * @param {string} params.productId
   * @param {number} params.quantity
   * @param {'ingreso'|'egreso'|'ajuste'} params.type
   * @param {string} params.reason
   * @param {string} [params.variantSku]
   */
  static async recordStockAdjustment({ productId, quantity, type, reason, variantSku }) {
    if (!reason || reason.trim().length < 6) {
      throw new Error('Es obligatorio especificar un motivo detallado (mínimo 6 caracteres) para justificar la alteración de inventario.');
    }

    const user = authorizer.getCurrentUser();
    const result = await inventoryRepo.adjustStock({
      productId,
      quantity,
      type,
      reason,
      userEmail: user.email,
      variantSku
    });

    await auditLogger.log({
      action: 'STOCK_ADJUSTED',
      entity: 'Inventory',
      entityId: productId,
      oldValues: { stockBefore: result.movement.stockBefore },
      newValues: { stockAfter: result.movement.stockAfter, type, quantity },
      notes: `Movimiento de stock registrado (${type}): ${reason}`
    });

    return result;
  }
}
