/**
 * @file supabaseCustomerRepositories.js
 * Production customer repository implementations with strict user_id ownership and data_environment isolation.
 * Zero fallback-to-mock behavior.
 */

import { supabase, isSupabaseConfigured } from '../../../services/supabase.js';
import { environment } from '../../../core/environment.js';
import {
  ICustomerOrderRepository,
  ICustomerAddressRepository,
  ICustomerFavoritesRepository,
  ICustomerReturnRepository,
  ICustomerNotificationRepository
} from '../contracts.js';

// =====================================================================
// 1. CUSTOMER ORDER REPOSITORY
// =====================================================================
export class SupabaseCustomerOrderRepository extends ICustomerOrderRepository {
  async getMyOrders(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .eq('data_environment', environment.dataEnvironment)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

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
        paymentStatus: o.payment_status || 'paid',
        shippingAddress: o.customer?.address || { street: 'Domicilio registrado', city: 'CABA' },
        items: o.items || [],
        dataEnvironment: o.data_environment,
        timeline: [
          { step: 'Pedido confirmado', date: new Date(o.created_at).toLocaleDateString('es-AR'), completed: true },
          { step: 'Preparación de despacho', date: 'En depósito', completed: true },
          { step: 'En camino / Entrega', date: o.carrier, completed: o.status.includes('Entregado') }
        ],
        canCancel: o.status.includes('Pendiente')
      }));
    } catch {
      return [];
    }
  }

  async getOrderById(userId, orderId) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .eq('data_environment', environment.dataEnvironment)
        .single();

      if (error || !data) return null;
      return {
        ...data,
        total: Number(data.total),
        subtotal: Number(data.subtotal),
        dataEnvironment: data.data_environment
      };
    } catch {
      return null;
    }
  }

  async cancelOrder(userId, orderId, reason) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('orders')
      .update({ status: `Cancelado por cliente (${reason || 'Solicitud'})` })
      .eq('id', orderId)
      .eq('user_id', userId)
      .eq('data_environment', environment.dataEnvironment)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// =====================================================================
// 2. CUSTOMER ADDRESS REPOSITORY
// =====================================================================
export class SupabaseCustomerAddressRepository extends ICustomerAddressRepository {
  async getAddresses(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('data_environment', environment.dataEnvironment)
        .order('is_default', { ascending: false });
      if (error || !data) return [];
      return data.map(a => ({
        id: a.id,
        userId: a.user_id,
        alias: a.alias,
        recipientName: a.recipient_name,
        phone: a.phone,
        street: a.street,
        number: a.number,
        floor: a.floor,
        apartment: a.apartment,
        zipCode: a.zip_code,
        city: a.city,
        province: a.province,
        reference: a.reference,
        isDefault: a.is_default,
        dataEnvironment: a.data_environment
      }));
    } catch {
      return [];
    }
  }

  async createAddress(userId, address) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
    const payload = {
      user_id: userId,
      alias: address.alias,
      recipient_name: address.recipientName,
      phone: address.phone,
      street: address.street,
      number: address.number,
      floor: address.floor || '',
      apartment: address.apartment || '',
      zip_code: address.zipCode,
      city: address.city,
      province: address.province,
      reference: address.reference || '',
      is_default: address.isDefault || false,
      data_environment: environment.dataEnvironment
    };
    const { data, error } = await supabase.from('customer_addresses').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }

  async updateAddress(userId, addressId, updates) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
    const payload = {};
    if (updates.alias !== undefined) payload.alias = updates.alias;
    if (updates.recipientName !== undefined) payload.recipient_name = updates.recipientName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.street !== undefined) payload.street = updates.street;
    if (updates.number !== undefined) payload.number = updates.number;
    if (updates.floor !== undefined) payload.floor = updates.floor;
    if (updates.apartment !== undefined) payload.apartment = updates.apartment;
    if (updates.zipCode !== undefined) payload.zip_code = updates.zipCode;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.province !== undefined) payload.province = updates.province;
    if (updates.reference !== undefined) payload.reference = updates.reference;
    if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

    const { data, error } = await supabase
      .from('customer_addresses')
      .update(payload)
      .eq('id', addressId)
      .eq('user_id', userId)
      .eq('data_environment', environment.dataEnvironment)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteAddress(userId, addressId) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId)
      .eq('data_environment', environment.dataEnvironment);
    if (error) throw error;
    return { success: true };
  }

  async setDefault(userId, addressId) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('data_environment', environment.dataEnvironment);

    const { data, error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId)
      .eq('data_environment', environment.dataEnvironment)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// =====================================================================
// 3. CUSTOMER FAVORITES REPOSITORY
// =====================================================================
export class SupabaseCustomerFavoritesRepository extends ICustomerFavoritesRepository {
  async getFavorites(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('customer_favorites')
        .select('product_id, products(*)')
        .eq('user_id', userId)
        .eq('data_environment', environment.dataEnvironment);
      if (error || !data) return [];
      return data.map(f => f.products || { id: f.product_id });
    } catch {
      return [];
    }
  }

  async addFavorite(userId, productId) {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase.from('customer_favorites').upsert({
      user_id: userId,
      product_id: productId,
      data_environment: environment.dataEnvironment
    }, { onConflict: 'user_id,product_id' });
    return !error;
  }

  async removeFavorite(userId, productId) {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase
      .from('customer_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('data_environment', environment.dataEnvironment);
    return !error;
  }

  async isFavorite(userId, productId) {
    if (!isSupabaseConfigured || !supabase || !userId) return false;
    const { data } = await supabase
      .from('customer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('data_environment', environment.dataEnvironment)
      .single();
    return Boolean(data);
  }
}

// =====================================================================
// 4. CUSTOMER RETURN REPOSITORY
// =====================================================================
export class SupabaseCustomerReturnRepository extends ICustomerReturnRepository {
  async getMyReturns(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('customer_returns')
        .select('*')
        .eq('user_id', userId)
        .eq('data_environment', environment.dataEnvironment)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(r => ({
        id: r.id,
        orderId: r.order_id,
        productId: r.product_id,
        productName: r.product_name,
        quantity: r.quantity,
        reason: r.reason,
        comments: r.comments,
        status: r.status,
        createdAt: r.created_at,
        dataEnvironment: r.data_environment
      }));
    } catch {
      return [];
    }
  }

  async createReturn(userId, returnData) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Database not configured');
    const payload = {
      user_id: userId,
      order_id: returnData.orderId,
      product_id: returnData.productId,
      product_name: returnData.productName,
      quantity: returnData.quantity || 1,
      reason: returnData.reason,
      comments: returnData.comments || '',
      status: 'requested',
      data_environment: environment.dataEnvironment
    };
    const { data, error } = await supabase.from('customer_returns').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }
}

// =====================================================================
// 5. CUSTOMER NOTIFICATION REPOSITORY
// =====================================================================
export class SupabaseCustomerNotificationRepository extends ICustomerNotificationRepository {
  async getNotifications(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('data_environment', environment.dataEnvironment)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(n => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        linkUrl: n.link_url,
        isRead: n.is_read,
        createdAt: n.created_at,
        dataEnvironment: n.data_environment
      }));
    } catch {
      return [];
    }
  }

  async markAsRead(userId, notificationId) {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase
      .from('customer_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('data_environment', environment.dataEnvironment);
    return !error;
  }

  async markAllAsRead(userId) {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase
      .from('customer_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('data_environment', environment.dataEnvironment);
    return !error;
  }
}
