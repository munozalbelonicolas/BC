/**
 * @file analyticsService.js
 * Dashboard metrics, period aggregations, and financial statistics calculator.
 * STRICT ISOLATION: Production reports consider ONLY real production data (data_environment = 'production').
 * Zero artificial numbers or fake data fallbacks.
 */

import { orderRepo, productRepo, customerRepo } from '../repositories/factory.js';
import { OrderStatus, PaymentStatus } from '../types/entities.js';
import { environment } from '../../core/environment.js';

export class AnalyticsService {
  /**
   * Calculate dashboard metrics for a chosen period
   * @param {'today'|'7days'|'30days'|'thisMonth'|'lastMonth'|'custom'} period
   * @param {Object} [customRange] { from: Date, to: Date }
   */
  static async getDashboardMetrics(period = '30days', customRange = null) {
    const { items: allOrders } = await orderRepo.getAll({ pageSize: 1000 });
    const { items: allProducts } = await productRepo.getAll({ pageSize: 1000 });
    const { items: allCustomers } = await customerRepo.getAll({ pageSize: 1000 });

    // STRICT ISOLATION FILTER: In production, exclude any record that isn't 'production'
    const orders = environment.isProduction
      ? allOrders.filter(o => o.dataEnvironment === 'production')
      : allOrders.filter(o => o.dataEnvironment === environment.dataEnvironment);

    const products = environment.isProduction
      ? allProducts.filter(p => p.dataEnvironment === 'production')
      : allProducts.filter(p => p.dataEnvironment === environment.dataEnvironment);

    const customers = environment.isProduction
      ? allCustomers.filter(c => c.dataEnvironment === 'production')
      : allCustomers.filter(c => c.dataEnvironment === environment.dataEnvironment);

    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'lastMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (period === 'custom' && customRange?.from) {
      startDate = new Date(customRange.from);
    }

    // Filter orders within period
    const periodOrders = orders.filter(o => new Date(o.createdAt) >= startDate);

    // Core financial KPIs (based solely on paid orders)
    const paidOrders = periodOrders.filter(o => o.paymentStatus === PaymentStatus.PAID || o.paymentStatus === 'paid');
    const totalSales = paidOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const ordersCount = periodOrders.length;
    const avgTicket = paidOrders.length > 0 ? Math.round(totalSales / paidOrders.length) : 0;

    // Order status breakdown
    const pendingOrders = periodOrders.filter(o => o.status === OrderStatus.PENDING || o.status.includes('Confirmado')).length;
    const preparingOrders = periodOrders.filter(o => o.status === OrderStatus.PREPARING || o.status.includes('Preparando')).length;
    const shippedOrders = periodOrders.filter(o => o.status === OrderStatus.SHIPPED || o.status.includes('camino')).length;
    const deliveredOrders = periodOrders.filter(o => o.status === OrderStatus.DELIVERED || o.status.includes('Entregado')).length;
    const cancelledOrders = periodOrders.filter(o => o.status === OrderStatus.CANCELLED || o.status.includes('Cancelado')).length;

    // Inventory health
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 2));
    const outOfStockProducts = products.filter(p => p.stock <= 0);

    // Payment methods breakdown
    const paymentMethods = {};
    periodOrders.forEach(o => {
      const method = o.paymentMethod || 'Otros';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Time series for charts
    const dailySeries = this.generateDailySeries(periodOrders, period === '7days' ? 7 : 14);

    // Top selling products (based purely on real items sold in periodOrders)
    const productSalesMap = {};
    periodOrders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = {
            id: item.id,
            name: item.name,
            image: item.image,
            unitsSold: 0,
            revenue: 0
          };
        }
        productSalesMap[item.id].unitsSold += (item.quantity || 1);
        const itemRevenue = item.subtotal || (item.unitPrice ? item.unitPrice * (item.quantity || 1) : 0);
        productSalesMap[item.id].revenue += itemRevenue;
      });
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      period,
      totalSales,
      ordersCount,
      avgTicket,
      totalCustomers: customers.length,
      statuses: {
        pending: pendingOrders,
        preparing: preparingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      inventory: {
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        lowStockItems: lowStockProducts.slice(0, 5),
        outOfStockItems: outOfStockProducts.slice(0, 5)
      },
      paymentMethods,
      dailySeries,
      topSellingProducts,
      recentOrders: orders.slice(0, 6),
      recentCustomers: customers.slice(0, 5)
    };
  }

  static generateDailySeries(orders, days = 7) {
    const series = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });

      // Find orders matching this day
      const dayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(dateStr));
      const daySales = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      // In production and real reporting: 0 is 0. No Math.random() fabrication!
      series.push({
        date: dateStr,
        label: dayLabel,
        sales: daySales,
        orders: dayOrders.length
      });
    }

    return series;
  }
}
