/**
 * @file customerNotificationService.js
 * In-app notifications and preferences manager.
 */

import { customerNotificationRepo } from '../repositories/factory.js';
import { customerAuthService } from './customerAuthService.js';

export class CustomerNotificationService {
  static async getNotifications() {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) return [];
    return customerNotificationRepo.getNotifications(user.id);
  }

  static async markAsRead(notificationId) {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) return false;
    return customerNotificationRepo.markAsRead(user.id, notificationId);
  }

  static async markAllAsRead() {
    const user = customerAuthService.getCurrentCustomer();
    if (!user) return false;
    return customerNotificationRepo.markAllAsRead(user.id);
  }

  static getNotificationPreferences() {
    try {
      const stored = localStorage.getItem('bc_notif_prefs');
      return stored ? JSON.parse(stored) : {
        orderUpdates: true,
        promotions: true,
        whatsappUpdates: true,
        emailSummaries: true
      };
    } catch {
      return { orderUpdates: true, promotions: true, whatsappUpdates: true, emailSummaries: true };
    }
  }

  static saveNotificationPreferences(prefs) {
    localStorage.setItem('bc_notif_prefs', JSON.stringify(prefs));
  }
}
