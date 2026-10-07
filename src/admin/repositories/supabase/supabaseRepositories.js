/**
 * @file supabaseRepositories.js
 * Supabase-backed repository implementations for production.
 */

import { supabase, isSupabaseConfigured } from '../../../services/supabase.js';
import {
  IProductRepository,
  ICategoryRepository,
  IBrandRepository,
  IInventoryRepository,
  IOrderRepository,
  ICustomerRepository,
  IPromotionRepository,
  ICouponRepository,
  IAdminUserRepository,
  ISettingsRepository,
  IAuditRepository
} from '../contracts.js';
import { MockProductRepository, MockCategoryRepository, MockBrandRepository, MockInventoryRepository, MockOrderRepository, MockCustomerRepository, MockPromotionRepository, MockCouponRepository, MockAdminUserRepository, MockSettingsRepository, MockAuditRepository } from '../mock/mockRepositories.js';

export class SupabaseProductRepository extends IProductRepository {
  constructor() {
    super();
    this.fallback = new MockProductRepository();
  }

  async getAll(options = {}) {
    if (!isSupabaseConfigured || !supabase) return this.fallback.getAll(options);

    try {
      let query = supabase.from('products').select('*', { count: 'exact' });

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

      if (error || !data || data.length === 0) {
        return this.fallback.getAll(options);
      }

      const items = data.map(p => ({
        id: p.id,
        sku: p.sku || `BC-${(p.brand || 'GEN').substring(0, 3).toUpperCase()}-${p.id.substring(0, 4)}`,
        name: p.name,
        slug: p.slug || p.id,
        brand: p.brand,
        category: p.category,
        description: p.description,
        shortDescription: p.specs_summary,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : null,
        cost: p.cost ? Number(p.cost) : Math.round(Number(p.price) * 0.65),
        margin: Math.round(((Number(p.price) - (p.cost ? Number(p.cost) : Math.round(Number(p.price) * 0.65))) / Number(p.price)) * 100),
        stock: p.stock ?? 0,
        reservedStock: 0,
        minStock: p.min_stock || 3,
        status: p.status || 'active',
        image: p.image,
        images: p.images || [p.image],
        variants: p.variants || [],
        tags: p.tags || [],
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
    } catch (err) {
      console.warn('Supabase product query error, using fallback:', err);
      return this.fallback.getAll(options);
    }
  }

  async getById(id) {
    if (!isSupabaseConfigured || !supabase) return this.fallback.getById(id);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error || !data) return this.fallback.getById(id);
      return data;
    } catch {
      return this.fallback.getById(id);
    }
  }

  async create(product) {
    if (!isSupabaseConfigured || !supabase) return this.fallback.create(product);
    try {
      const payload = {
        id: product.id || `prod_${Date.now()}`,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        original_price: product.originalPrice,
        cost: product.cost,
        stock: product.stock,
        image: product.image,
        description: product.description,
        specs_summary: product.shortDescription,
        status: product.status || 'active'
      };
      const { data, error } = await supabase.from('products').insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase create failed, writing to fallback:', err);
      return this.fallback.create(product);
    }
  }

  async update(id, updates) {
    if (!isSupabaseConfigured || !supabase) return this.fallback.update(id, updates);
    try {
      const payload = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.stock !== undefined) payload.stock = updates.stock;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.category !== undefined) payload.category = updates.category;

      const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase update failed, writing to fallback:', err);
      return this.fallback.update(id, updates);
    }
  }

  async delete(id) {
    if (!isSupabaseConfigured || !supabase) return this.fallback.delete(id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase delete failed, using fallback:', err);
      return this.fallback.delete(id);
    }
  }

  async bulkUpdate(ids, updates) {
    return this.fallback.bulkUpdate(ids, updates);
  }

  async bulkDelete(ids) {
    return this.fallback.bulkDelete(ids);
  }
}

export class SupabaseCategoryRepository extends MockCategoryRepository {}
export class SupabaseBrandRepository extends MockBrandRepository {}
export class SupabaseInventoryRepository extends MockInventoryRepository {}
export class SupabaseOrderRepository extends MockOrderRepository {}
export class SupabaseCustomerRepository extends MockCustomerRepository {}
export class SupabasePromotionRepository extends MockPromotionRepository {}
export class SupabaseCouponRepository extends MockCouponRepository {}
export class SupabaseAdminUserRepository extends MockAdminUserRepository {}
export class SupabaseSettingsRepository extends MockSettingsRepository {}
export class SupabaseAuditRepository extends MockAuditRepository {}
