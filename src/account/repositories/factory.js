/**
 * @file factory.js
 * Dependency injection container for Customer Portal repositories.
 */

import { isSupabaseConfigured } from '../../services/supabase.js';

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
    this.useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !isSupabaseConfigured;
    this.init();
  }

  init() {
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
}

export const customerContainer = new CustomerContainer();
export const customerOrderRepo = customerContainer.orderRepo;
export const customerAddressRepo = customerContainer.addressRepo;
export const customerFavoritesRepo = customerContainer.favoritesRepo;
export const customerReturnRepo = customerContainer.returnRepo;
export const customerNotificationRepo = customerContainer.notificationRepo;
