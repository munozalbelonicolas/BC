/**
 * @file customerCouponService.js
 * Available personal discount coupons for authenticated customer.
 */

import { INITIAL_CUSTOMER_COUPONS } from '../repositories/mock/mockCustomerData.js';

export class CustomerCouponService {
  static async getAvailableCoupons() {
    return [...INITIAL_CUSTOMER_COUPONS];
  }
}
