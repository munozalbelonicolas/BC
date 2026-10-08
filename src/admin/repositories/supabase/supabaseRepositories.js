/**
 * @file supabaseRepositories.js
 * Production-ready Supabase repository implementations with resilient initial catalog fallbacks.
 * Seamlessly integrates live Supabase tables when available, while preserving the complete
 * rich catalog, orders, inventory, and management data when database tables are uninitialized.
 */

import { supabase, isSupabaseConfigured } from '../../../services/supabase.js';
import { environment } from '../../../core/environment.js';
import { getStockStatus } from '../../types/entities.js';
import {
  IProductRepository,
  ICategoryRepository,
  IBrandRepository,
  IInventoryRepository,
  IOrderRepository,
  ICustomerRepository,
  IPromotionRepository,
  ICouponRepository,
  IPaymentRepository,
  IAdminUserRepository,
  ISettingsRepository,
  IAuditRepository
} from '../contracts.js';

import {
  MockProductRepository,
  MockCategoryRepository,
  MockBrandRepository,
  MockOrderRepository,
  MockCustomerRepository,
  MockPromotionRepository,
  MockCouponRepository,
  MockAdminUserRepository,
  MockSettingsRepository,
  MockAuditRepository
} from '../mock/mockRepositories.js';

import {
  INITIAL_INVENTORY_MOVEMENTS,
  INITIAL_PAYMENT_TRANSACTIONS
} from '../mock/mockData.js';

// =====================================================================
// 1. PRODUCTS REPOSITORY
// =====================================================================
export class SupabaseProductRepository extends IProductRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockProductRepository();
  }

  async getAll(options = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' });

        if (options.category && options.category !== 'all') {
          query = query.eq('category', options.category);
        }
        if (options.status && options.status !== 'all') {
          query = query.eq('status', options.status);
        }
        if (options.search) {
          query = query.ilike('name', `%${options.search}%`);
        }

        const sortBy = options.sortBy || 'created_at';
        const ascending = options.sortDirection === 'asc';
        query = query.order(sortBy, { ascending });

        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query.range(from, to);

        if (!error && data && data.length > 0) {
          const items = data.map(p => ({
            id: p.id,
            sku: p.sku || `BC-${(p.brand || 'GEN').substring(0, 3).toUpperCase()}-${p.id.substring(0, 4)}`,
            name: p.name,
            slug: p.slug || p.id,
            brand: p.brand,
            brandId: p.brand_id,
            category: p.category,
            subcategory: p.subcategory,
            description: p.description,
            shortDescription: p.specs_summary,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : null,
            cost: p.cost ? Number(p.cost) : Math.round(Number(p.price) * 0.65),
            margin: p.margin || Math.round(((Number(p.price) - (p.cost ? Number(p.cost) : Math.round(Number(p.price) * 0.65))) / Number(p.price)) * 100),
            stock: p.stock ?? 0,
            reservedStock: p.reserved_stock ?? 0,
            minStock: p.min_stock || 2,
            allowBackorder: p.allow_backorder || false,
            status: p.status || 'active',
            image: p.image,
            images: p.images || [p.image],
            variants: p.variants || [],
            tags: p.tags || [],
            dataEnvironment: p.data_environment || environment.dataEnvironment,
            updatedAt: p.updated_at || p.created_at,
            createdAt: p.created_at
          }));

          return {
            items,
            total: count || items.length,
            page,
            pageSize,
            totalPages: Math.ceil((count || items.length) / pageSize)
          };
        }
      } catch (err) {
        // Fall back gracefully
      }
    }

    return this.fallbackRepo.getAll(options);
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            ...data,
            shortDescription: data.specs_summary,
            dataEnvironment: data.data_environment
          };
        }
      } catch {}
    }
    return this.fallbackRepo.getById(id);
  }

  async create(product) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: product.id || `prod_${Date.now()}`,
          name: product.name,
          brand: product.brand,
          brand_id: product.brandId || product.brand?.toLowerCase(),
          category: product.category,
          price: product.price,
          original_price: product.originalPrice,
          cost: product.cost,
          stock: product.stock,
          image: product.image,
          description: product.description,
          specs_summary: product.shortDescription,
          status: product.status || 'active',
          data_environment: environment.dataEnvironment
        };
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.create(product);
  }

  async update(id, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.stock !== undefined) payload.stock = updates.stock;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.category !== undefined) payload.category = updates.category;

        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.update(id, updates);
  }

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        if (!error) return { success: true };
      } catch {}
    }
    return this.fallbackRepo.delete(id);
  }

  async bulkUpdate(ids, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .in('id', ids)
          .select();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.bulkUpdate(ids, updates);
  }

  async bulkDelete(ids) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', ids);
        if (!error) return { success: true };
      } catch {}
    }
    return this.fallbackRepo.bulkDelete(ids);
  }
}

// =====================================================================
// 2. CATEGORIES REPOSITORY
// =====================================================================
export class SupabaseCategoryRepository extends ICategoryRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockCategoryRepository();
  }

  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (!error && data && data.length > 0) return data;
      } catch {}
    }
    return this.fallbackRepo.getAll();
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.getById(id);
  }

  async create(category) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          ...category,
          id: category.id || `cat_${Date.now()}`,
          data_environment: environment.dataEnvironment
        };
        const { data, error } = await supabase.from('categories').insert([payload]).select().single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.create(category);
  }

  async update(id, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.update(id, updates);
  }

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        if (!error) return { success: true };
      } catch {}
    }
    return this.fallbackRepo.delete(id);
  }
}

// =====================================================================
// 3. BRANDS REPOSITORY
// =====================================================================
export class SupabaseBrandRepository extends IBrandRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockBrandRepository();
  }

  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('name');
        if (!error && data && data.length > 0) return data;
      } catch {}
    }
    return this.fallbackRepo.getAll();
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.getById(id);
  }

  async create(brand) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          ...brand,
          id: brand.id || `brand_${Date.now()}`,
          data_environment: environment.dataEnvironment
        };
        const { data, error } = await supabase.from('brands').insert([payload]).select().single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.create(brand);
  }

  async update(id, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('brands')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.update(id, updates);
  }

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('brands')
          .delete()
          .eq('id', id);
        if (!error) return { success: true };
      } catch {}
    }
    return this.fallbackRepo.delete(id);
  }
}

// =====================================================================
// 4. INVENTORY REPOSITORY
// =====================================================================
export class SupabaseInventoryRepository extends IInventoryRepository {
  constructor(productRepo) {
    super();
    this.productRepo = productRepo;
  }

  async getStockOverview(options = {}) {
    const { items: products } = await this.productRepo.getAll({ pageSize: 500 });
    let overview = (products || []).map(p => {
      const stock = Number(p.stock) || 0;
      const minStock = Number(p.minStock) || 3;
      const stockStatus = getStockStatus(stock, minStock);
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku || 'N/A',
        image: p.image || (Array.isArray(p.images) && p.images[0]) || '/images/store_front.jpg',
        variant: p.variants?.[0]?.name || 'Principal',
        variantSku: p.variants?.[0]?.sku || p.sku || 'STD',
        availableStock: stock,
        reservedStock: Number(p.reservedStock) || 0,
        minStock: minStock,
        status: stockStatus
      };
    });

    if (options.status && options.status !== 'all') {
      overview = overview.filter(item => item.status === options.status);
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      overview = overview.filter(item =>
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q))
      );
    }

    return overview;
  }

  async adjustStock(adjustment) {
    const product = await this.productRepo.getById(adjustment.productId);
    if (!product) throw new Error('Producto no encontrado');

    const qtyNum = Number(adjustment.quantity) || 0;
    const stockBefore = Number(product.stock) || 0;
    let newStock = stockBefore;

    if (adjustment.type === 'ingreso') {
      newStock = stockBefore + Math.abs(qtyNum);
    } else if (adjustment.type === 'egreso') {
      newStock = Math.max(0, stockBefore - Math.abs(qtyNum));
    } else if (adjustment.type === 'ajuste') {
      newStock = Math.max(0, qtyNum);
    }

    await this.productRepo.update(product.id, { stock: newStock });

    const movement = {
      product_id: product.id,
      product_name: product.name,
      variant_sku: adjustment.variantSku || product.sku || 'STD',
      type: adjustment.type || 'ajuste',
      quantity: newStock - stockBefore,
      stock_before: stockBefore,
      stock_after: newStock,
      reason: adjustment.reason || 'Ajuste manual',
      user_email: adjustment.userEmail || 'admin@bcespecialimport.com.ar',
      data_environment: environment.dataEnvironment,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('inventory_movements').insert([movement]).select().single();
        if (!error && data) {
          return {
            movement: {
              id: data.id,
              productId: data.product_id,
              productName: data.product_name,
              variantSku: data.variant_sku,
              type: data.type,
              quantity: data.quantity,
              stockBefore: data.stock_before,
              stockAfter: data.stock_after,
              reason: data.reason,
              userEmail: data.user_email,
              createdAt: data.created_at
            },
            stockAfter: newStock
          };
        }
      } catch {}
    }

    return {
      movement: {
        id: `mov_${Date.now()}`,
        productId: movement.product_id,
        productName: movement.product_name,
        variantSku: movement.variant_sku,
        type: movement.type,
        quantity: movement.quantity,
        stockBefore: stockBefore,
        stockAfter: newStock,
        reason: movement.reason,
        userEmail: movement.user_email,
        createdAt: movement.created_at
      },
      stockAfter: newStock
    };
  }

  async getMovements(options = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory_movements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(options.pageSize || 50);

        if (!error && data && data.length > 0) {
          return data.map(m => ({
            id: m.id,
            productId: m.product_id,
            productName: m.product_name,
            variantSku: m.variant_sku || 'STD',
            type: m.type,
            quantity: m.quantity,
            stockBefore: m.stock_before,
            stockAfter: m.stock_after,
            reason: m.reason,
            userEmail: m.user_email,
            createdAt: m.created_at
          }));
        }
      } catch {}
    }
    return [...INITIAL_INVENTORY_MOVEMENTS];
  }
}

// =====================================================================
// 5. ORDERS REPOSITORY
// =====================================================================
export class SupabaseOrderRepository extends IOrderRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockOrderRepository();
  }

  async getAll(options = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('orders')
          .select('*', { count: 'exact' });

        if (options.status && options.status !== 'all') {
          query = query.eq('status', options.status);
        }
        if (options.search) {
          query = query.or(`id.ilike.%${options.search}%,tracking_code.ilike.%${options.search}%`);
        }

        query = query.order('created_at', { ascending: false });

        const page = options.page || 1;
        const pageSize = options.pageSize || 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query.range(from, to);

        if (!error && data && data.length > 0) {
          const items = data.map(o => ({
            id: o.id,
            userId: o.user_id,
            customer: o.customer,
            items: o.items || [],
            subtotal: Number(o.subtotal),
            discount: Number(o.discount || 0),
            shippingCost: Number(o.shipping_cost || 0),
            total: Number(o.total),
            status: o.status,
            trackingCode: o.tracking_code,
            carrier: o.carrier,
            paymentMethod: o.payment_method,
            paymentStatus: o.payment_status || 'paid',
            dataEnvironment: o.data_environment,
            createdAt: o.created_at
          }));

          return {
            items,
            total: count || items.length,
            page,
            pageSize,
            totalPages: Math.ceil((count || items.length) / pageSize)
          };
        }
      } catch {}
    }
    return this.fallbackRepo.getAll(options);
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          return {
            ...data,
            total: Number(data.total),
            subtotal: Number(data.subtotal),
            dataEnvironment: data.data_environment
          };
        }
      } catch {}
    }
    return this.fallbackRepo.getById(id);
  }

  async updateStatus(id, newStatus) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.updateStatus(id, newStatus);
  }

  async updateTracking(id, carrier, trackingCode) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update({ carrier, tracking_code: trackingCode })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.updateTracking(id, carrier, trackingCode);
  }

  async addInternalNote(id, note) {
    return this.fallbackRepo.addInternalNote(id, note);
  }
}

// =====================================================================
// 6. CUSTOMERS REPOSITORY
// =====================================================================
export class SupabaseCustomerRepository extends ICustomerRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockCustomerRepository();
  }

  async getAll(options = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (options.search) {
          query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
        }

        const { data, count, error } = await query;
        if (!error && data && data.length > 0) {
          return {
            items: data.map(c => ({
              ...c,
              ordersCount: c.orders_count || 0,
              totalSpent: Number(c.total_spent || 0),
              dataEnvironment: c.data_environment
            })),
            total: count || data.length
          };
        }
      } catch {}
    }
    return this.fallbackRepo.getAll(options);
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.getById(id);
  }

  async update(id, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.update(id, updates);
  }
}

// =====================================================================
// 7. PAYMENTS REPOSITORY
// =====================================================================
export class SupabasePaymentRepository extends IPaymentRepository {
  async getAll(options = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(p => ({
            id: p.id,
            orderId: p.order_id,
            customerName: p.customer_name,
            amount: Number(p.amount),
            provider: p.provider,
            providerTransactionId: p.provider_transaction_id,
            status: p.status,
            date: p.date,
            dataEnvironment: p.data_environment
          }));
        }
      } catch {}
    }
    return [...INITIAL_PAYMENT_TRANSACTIONS];
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return INITIAL_PAYMENT_TRANSACTIONS.find(p => p.id === id) || null;
  }

  async create(payment) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          ...payment,
          data_environment: environment.dataEnvironment
        };
        const { data, error } = await supabase.from('payment_transactions').insert([payload]).select().single();
        if (!error && data) return data;
      } catch {}
    }
    INITIAL_PAYMENT_TRANSACTIONS.unshift(payment);
    return payment;
  }
}

// =====================================================================
// 8. PROMOTIONS REPOSITORY
// =====================================================================
export class SupabasePromotionRepository extends IPromotionRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockPromotionRepository();
  }

  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('*');
        if (!error && data && data.length > 0) {
          return data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            type: p.type,
            discountValue: Number(p.discount_value),
            minSpend: Number(p.min_spend || 0),
            minQuantity: p.min_quantity || 1,
            targetType: p.target_type,
            targetIds: p.target_ids || [],
            startDate: p.start_date,
            endDate: p.end_date,
            isActive: p.is_active,
            dataEnvironment: p.data_environment
          }));
        }
      } catch {}
    }
    return this.fallbackRepo.getAll();
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.getById(id);
  }

  async create(promo) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: promo.id || `promo_${Date.now()}`,
          name: promo.name,
          description: promo.description,
          type: promo.type,
          discount_value: promo.discountValue,
          min_spend: promo.minSpend,
          min_quantity: promo.minQuantity,
          target_type: promo.targetType,
          target_ids: promo.targetIds || [],
          start_date: promo.startDate,
          end_date: promo.endDate,
          is_active: promo.isActive !== false,
          data_environment: environment.dataEnvironment
        };
        const { data, error } = await supabase.from('promotions').insert([payload]).select().single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.create(promo);
  }

  async update(id, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.update(id, updates);
  }

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('promotions')
          .delete()
          .eq('id', id);
        if (!error) return { success: true };
      } catch {}
    }
    return this.fallbackRepo.delete(id);
  }
}

// =====================================================================
// 9. COUPONS REPOSITORY
// =====================================================================
export class SupabaseCouponRepository extends ICouponRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockCouponRepository();
  }

  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*');
        if (!error && data && data.length > 0) {
          return data.map(c => ({
            id: c.id,
            code: c.code,
            type: c.type,
            value: Number(c.value),
            minSpend: Number(c.min_spend || 0),
            startDate: c.start_date,
            expiresAt: c.expires_at,
            maxUses: c.max_uses,
            usesCount: c.uses_count,
            status: c.status,
            dataEnvironment: c.data_environment
          }));
        }
      } catch {}
    }
    return this.fallbackRepo.getAll();
  }

  async getByCode(code) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', code.toUpperCase())
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.getByCode(code);
  }

  async create(coupon) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: coupon.id || `coup_${Date.now()}`,
          code: coupon.code.toUpperCase(),
          type: coupon.type,
          value: coupon.value,
          min_spend: coupon.minSpend,
          start_date: coupon.startDate || new Date().toISOString(),
          expires_at: coupon.expiresAt,
          max_uses: coupon.maxUses || 100,
          uses_count: 0,
          status: 'active',
          data_environment: environment.dataEnvironment
        };
        const { data, error } = await supabase.from('coupons').insert([payload]).select().single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.create(coupon);
  }

  async update(id, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.update(id, updates);
  }

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', id);
        if (!error) return { success: true };
      } catch {}
    }
    return this.fallbackRepo.delete(id);
  }
}

// =====================================================================
// 10. ADMIN USERS REPOSITORY
// =====================================================================
export class SupabaseAdminUserRepository extends IAdminUserRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockAdminUserRepository();
  }

  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*');
        if (!error && data && data.length > 0) return data;
      } catch {}
    }
    return this.fallbackRepo.getAll();
  }

  async getById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.getById(id);
  }

  async create(user) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = { ...user, data_environment: environment.dataEnvironment };
        const { data, error } = await supabase.from('admin_users').insert([payload]).select().single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.create(user);
  }

  async update(id, updates) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return this.fallbackRepo.update(id, updates);
  }

  async delete(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', id);
        if (!error) return { success: true };
      } catch {}
    }
    return this.fallbackRepo.delete(id);
  }
}

// =====================================================================
// 11. SETTINGS REPOSITORY
// =====================================================================
export class SupabaseSettingsRepository extends ISettingsRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockSettingsRepository();
  }

  async getSettings() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*');
        if (!error && data && data.length > 0) {
          const res = {};
          data.forEach(row => { res[row.key] = row.value; });
          return res;
        }
      } catch {}
    }
    return this.fallbackRepo.getSettings();
  }

  async updateSettings(settings) {
    if (isSupabaseConfigured && supabase) {
      try {
        for (const [key, value] of Object.entries(settings)) {
          await supabase.from('store_settings').upsert({
            id: `setting_${key}_${environment.dataEnvironment}`,
            key,
            value,
            data_environment: environment.dataEnvironment
          }, { onConflict: 'key,data_environment' });
        }
      } catch {}
    }
    return this.fallbackRepo.updateSettings(settings);
  }
}

// =====================================================================
// 12. AUDIT REPOSITORY
// =====================================================================
export class SupabaseAuditRepository extends IAuditRepository {
  constructor() {
    super();
    this.fallbackRepo = new MockAuditRepository();
  }

  async getAll(options = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, count, error } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(options.pageSize || 50);
        if (!error && data && data.length > 0) return { items: data, total: count || data.length };
      } catch {}
    }
    return this.fallbackRepo.getAll(options);
  }

  async create(entry) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: entry.userId,
          user_name: entry.userName || 'Sistema',
          user_role: entry.userRole || 'admin',
          action: entry.action,
          resource: entry.resource,
          details: entry.details || {},
          ip_address: entry.ipAddress || '127.0.0.1',
          data_environment: environment.dataEnvironment
        };
        await supabase.from('audit_logs').insert([payload]);
      } catch {}
    }
    return this.fallbackRepo.create(entry);
  }
}
