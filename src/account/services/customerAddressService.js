/**
 * @file customerAddressService.js
 * Address book management for shipping addresses.
 */

import { customerAddressRepo } from '../repositories/factory.js';
import { customerAuthService } from './customerAuthService.js';

export class CustomerAddressService {
  static async getAddresses() {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) return [];
    return customerAddressRepo.getAddresses(user.id);
  }

  static async saveAddress(addressData) {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) throw new Error('No autorizado');

    if (!addressData.street || !addressData.number) {
      throw new Error('La calle y el número de puerta son obligatorios.');
    }
    if (!addressData.city || !addressData.province) {
      throw new Error('La ciudad y provincia son obligatorias.');
    }
    if (!addressData.zipCode) {
      throw new Error('El código postal es requerido para calcular los envíos.');
    }

    if (addressData.id) {
      return customerAddressRepo.updateAddress(user.id, addressData.id, addressData);
    } else {
      return customerAddressRepo.createAddress(user.id, addressData);
    }
  }

  static async deleteAddress(addressId) {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) throw new Error('No autorizado');
    return customerAddressRepo.deleteAddress(user.id, addressId);
  }

  static async setDefault(addressId) {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) throw new Error('No autorizado');
    return customerAddressRepo.setDefault(user.id, addressId);
  }
}
