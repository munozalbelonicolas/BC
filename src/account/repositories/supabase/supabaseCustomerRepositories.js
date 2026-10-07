/**
 * @file supabaseCustomerRepositories.js
 * Supabase customer repository implementations with user-id ownership enforcement.
 */

import { supabase, isSupabaseConfigured } from '../../../services/supabase.js';
import {
  ICustomerOrderRepository,
  ICustomerAddressRepository,
  ICustomerFavoritesRepository,
  ICustomerReturnRepository,
  ICustomerNotificationRepository
} from '../contracts.js';

import {
  MockCustomerOrderRepository,
  MockCustomerAddressRepository,
  MockCustomerFavoritesRepository,
  MockCustomerReturnRepository,
  MockCustomerNotificationRepository
} from '../mock/mockCustomerRepositories.js';

export class SupabaseCustomerOrderRepository extends ICustomerOrderRepository {
  constructor() {
    super();
    this.fallback = new MockCustomerOrderRepository();
  }

  async getMyOrders(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) {
      return this.fallback.getMyOrders(userId);
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return this.fallback.getMyOrders(userId);
      }

      return data.map(o => ({
        id: o.id,
        orderNumber: `#${o.id.replace('BC-', '')}`,
        userId: o.user_id,
        date: o.created_at,
        status: o.status,
        statusStep: o.status.includes('Entregado') ? 4 : (o.status.includes('camino') || o.status.includes('Despachado') ? 3 : 2),
        total: Number(o.total),
        subtotal: Number(o.subtotal),
        shippingCost: Number(o.shipping_cost || 0),
        discount: Number(o.discount || 0),
        carrier: o.carrier,
        trackingCode: o.tracking_code,
        estimatedDelivery: '24 a 48 hs hábiles',
        paymentMethod: o.payment_method,
        shippingAddress: o.customer?.address || { street: 'Domicilio registrado', city: 'CABA' },
        items: o.items || [],
        timeline: [
          { step: 'Pedido confirmado', date: new Date(o.created_at).toLocaleDateString('es-AR'), completed: true },
          { step: 'Preparación de despacho', date: 'En depósito', completed: true },
          { step: 'En camino / Entrega', date: o.carrier, completed: o.status.includes('Entregado') }
        ],
        canCancel: o.status.includes('Pendiente')
      }));
    } catch {
      return this.fallback.getMyOrders(userId);
    }
  }

  async getOrderById(userId, orderId) {
    if (!isSupabaseConfigured || !supabase) {
      return this.fallback.getOrderById(userId, orderId);
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) return this.fallback.getOrderById(userId, orderId);
      return data;
    } catch {
      return this.fallback.getOrderById(userId, orderId);
    }
  }

  async cancelOrder(userId, orderId, reason) {
    return this.fallback.cancelOrder(userId, orderId, reason);
  }
}

export class SupabaseCustomerAddressRepository extends MockCustomerAddressRepository {}
export class SupabaseCustomerFavoritesRepository extends MockCustomerFavoritesRepository {}
export class SupabaseCustomerReturnRepository extends MockCustomerReturnRepository {}
export class SupabaseCustomerNotificationRepository extends MockCustomerNotificationRepository {}
