/**
 * @file factory.js
 * Dependency Injection & Repository Factory.
 * Resolves repository instances depending on environment variables and connection health.
 */

import { isSupabaseConfigured } from '../../services/supabase.js';
import {
  MockProductRepository,
  MockCategoryRepository,
  MockBrandRepository,
  MockInventoryRepository,
  MockOrderRepository,
  MockCustomerRepository,
  MockPromotionRepository,
  MockCouponRepository,
  MockAdminUserRepository,
  MockSettingsRepository,
  MockAuditRepository
} from './mock/mockRepositories.js';

import {
  SupabaseProductRepository,
  SupabaseCategoryRepository,
  SupabaseBrandRepository,
  SupabaseInventoryRepository,
  SupabaseOrderRepository,
  SupabaseCustomerRepository,
  SupabasePromotionRepository,
  SupabaseCouponRepository,
  SupabaseAdminUserRepository,
  SupabaseSettingsRepository,
  SupabaseAuditRepository
} from './supabase/supabaseRepositories.js';

import { auditLogger } from '../core/audit.js';

class RepositoryContainer {
  constructor() {
    this.useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !isSupabaseConfigured;
    this.init();
  }

  init() {
    if (this.useMock) {
      this.productRepository = new MockProductRepository();
      this.categoryRepository = new MockCategoryRepository();
      this.brandRepository = new MockBrandRepository();
      this.inventoryRepository = new MockInventoryRepository(this.productRepository);
      this.orderRepository = new MockOrderRepository();
      this.customerRepository = new MockCustomerRepository();
      this.promotionRepository = new MockPromotionRepository();
      this.couponRepository = new MockCouponRepository();
      this.adminUserRepository = new MockAdminUserRepository();
      this.settingsRepository = new MockSettingsRepository();
      this.auditRepository = new MockAuditRepository();
    } else {
      this.productRepository = new SupabaseProductRepository();
      this.categoryRepository = new SupabaseCategoryRepository();
      this.brandRepository = new SupabaseBrandRepository();
      this.inventoryRepository = new SupabaseInventoryRepository(this.productRepository);
      this.orderRepository = new SupabaseOrderRepository();
      this.customerRepository = new SupabaseCustomerRepository();
      this.promotionRepository = new SupabasePromotionRepository();
      this.couponRepository = new SupabaseCouponRepository();
      this.adminUserRepository = new SupabaseAdminUserRepository();
      this.settingsRepository = new SupabaseSettingsRepository();
      this.auditRepository = new SupabaseAuditRepository();
    }

    auditLogger.setRepository(this.auditRepository);
  }

  isUsingMockData() {
    return this.useMock;
  }
}

export const container = new RepositoryContainer();
export const productRepo = container.productRepository;
export const categoryRepo = container.categoryRepository;
export const brandRepo = container.brandRepository;
export const inventoryRepo = container.inventoryRepository;
export const orderRepo = container.orderRepository;
export const customerRepo = container.customerRepository;
export const promotionRepo = container.promotionRepository;
export const couponRepo = container.couponRepository;
export const adminUserRepo = container.adminUserRepository;
export const settingsRepo = container.settingsRepository;
export const auditRepo = container.auditRepository;
