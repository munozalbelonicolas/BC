/**
 * @file factory.js
 * Dependency injection container for Customer Portal repositories.
 * In PRODUCTION, mock repositories are strictly disabled.
 */

import { isSupabaseConfigured } from '../../services/supabase.js';
import { environment } from '../../core/environment.js';

import {
  MockCustomerOrderRepository,
  MockCustomerAddressRepository,
  MockCustomerFavoritesRepository,
  MockCustomerReturnRepository,
  MockCustomerNotificationRepository
} from './mock/mockCustomerRepositories.js';

import {
  SupabaseCustomerOrderRepository,
  SupabaseCustomerAddressRepository,
  SupabaseCustomerFavoritesRepository,
  SupabaseCustomerReturnRepository,
  SupabaseCustomerNotificationRepository
} from './supabase/supabaseCustomerRepositories.js';

class CustomerContainer {
  constructor() {
    this.init();
  }

  init() {
    // In production, mock data is TERMINANTEMENTE PROHIBIDO!
    if (environment.isProduction) {
      this.useMock = false;
      this.orderRepo = new SupabaseCustomerOrderRepository();
      this.addressRepo = new SupabaseCustomerAddressRepository();
      this.favoritesRepo = new SupabaseCustomerFavoritesRepository();
      this.returnRepo = new SupabaseCustomerReturnRepository();
      this.notificationRepo = new SupabaseCustomerNotificationRepository();
      return;
    }

    const explicitMock = import.meta?.env?.VITE_USE_MOCK_DATA === 'true' || !isSupabaseConfigured;
    this.useMock = explicitMock;

    if (this.useMock) {
      this.orderRepo = new MockCustomerOrderRepository();
      this.addressRepo = new MockCustomerAddressRepository();
      this.favoritesRepo = new MockCustomerFavoritesRepository();
      this.returnRepo = new MockCustomerReturnRepository();
      this.notificationRepo = new MockCustomerNotificationRepository();
    } else {
      this.orderRepo = new SupabaseCustomerOrderRepository();
      this.addressRepo = new SupabaseCustomerAddressRepository();
      this.favoritesRepo = new SupabaseCustomerFavoritesRepository();
      this.returnRepo = new SupabaseCustomerReturnRepository();
      this.notificationRepo = new SupabaseCustomerNotificationRepository();
    }
  }

  isUsingMockData() {
    if (environment.isProduction) return false;
    return this.useMock;
  }
}

export const customerContainer = new CustomerContainer();
export const customerOrderRepo = customerContainer.orderRepo;
export const customerAddressRepo = customerContainer.addressRepo;
export const customerFavoritesRepo = customerContainer.favoritesRepo;
export const customerReturnRepo = customerContainer.returnRepo;
export const customerNotificationRepo = customerContainer.notificationRepo;
