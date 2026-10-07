/**
 * @file customerReturnsService.js
 * Return and exchange workflow with commercial policy checks.
 */

import { customerReturnRepo } from '../repositories/factory.js';
import { customerAuthService } from './customerAuthService.js';
import { CustomerOrderService } from './customerOrderService.js';

export class CustomerReturnsService {
  static async getReturns() {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) return [];
    return customerReturnRepo.getMyReturns(user.id);
  }

  /**
   * Request a return/exchange for a delivered order
   */
  static async requestReturn({ orderId, productId, quantity = 1, reason, comments = '' }) {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) throw new Error('No autorizado');

    const order = await CustomerOrderService.getOrderById(orderId);
    if (!order) throw new Error('Pedido inexistente');

    // Commercial policy check: only delivered orders within 30 days
    if (!order.status.includes('Entregado')) {
      throw new Error('Solo se pueden solicitar cambios o devoluciones sobre pedidos que ya hayan sido entregados.');
    }

    const orderDate = new Date(order.date);
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOrder > 30) {
      throw new Error('El plazo legal de garantía para devolución directa (30 días corridos) ha expirado. Por favor, contactá a soporte técnico oficial.');
    }

    const item = order.items.find(i => i.id === productId);
    if (!item) throw new Error('El producto no pertenece al pedido indicado.');

    const returnRequest = await customerReturnRepo.createReturn(user.id, {
      orderId,
      productId,
      productName: item.name,
      quantity,
      reason,
      comments
    });

    return returnRequest;
  }
}
