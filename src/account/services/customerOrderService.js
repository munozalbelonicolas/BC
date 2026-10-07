/**
 * @file customerOrderService.js
 * Order queries, status checks, re-order validation engine, and support triggers.
 */

import { customerOrderRepo } from '../repositories/factory.js';
import { customerAuthService } from './customerAuthService.js';
import { store } from '../../state.js';
import { PRODUCTS } from '../../data/products.js';

export class CustomerOrderService {
  static async getOrders() {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) return [];
    return customerOrderRepo.getMyOrders(user.id);
  }

  static async getOrderById(orderId) {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) throw new Error('Debes iniciar sesión para consultar este pedido');
    return customerOrderRepo.getOrderById(user.id, orderId);
  }

  /**
   * Reorder items with strict stock and price validation.
   * Never silently recreate an order with stale historic prices!
   */
  static reorderItems(orderItems) {
    if (!orderItems || orderItems.length === 0) {
      throw new Error('No hay artículos para agregar al carrito.');
    }

    const added = [];
    const unavailable = [];

    orderItems.forEach(item => {
      // Find current active product in live catalog
      const liveProd = PRODUCTS.find(p => p.id === item.id || p.sku === item.sku);

      if (!liveProd) {
        unavailable.push(`${item.name} (Ya no se encuentra disponible en catálogo)`);
        return;
      }

      if (liveProd.stock <= 0) {
        unavailable.push(`${liveProd.name} (Sin stock actualmente)`);
        return;
      }

      // Add to store cart with current live price and stock
      store.addToCart(liveProd.id, Math.min(item.quantity || 1, liveProd.stock));
      added.push({
        id: liveProd.id,
        name: liveProd.name,
        currentPrice: liveProd.price,
        hadPriceChange: liveProd.price !== item.unitPrice
      });
    });

    return {
      success: added.length > 0,
      added,
      unavailable
    };
  }

  static async cancelOrder(orderId, reason) {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) throw new Error('No autorizado');
    return customerOrderRepo.cancelOrder(user.id, orderId, reason);
  }
}
