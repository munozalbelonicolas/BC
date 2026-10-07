/**
 * @file customerCouponService.js
 * Available personal discount coupons for authenticated customer retrieved from data layer.
 * Zero hardcoded mock arrays.
 */

import { supabase, isSupabaseConfigured } from '../../services/supabase.js';
import { environment } from '../../core/environment.js';

export class CustomerCouponService {
  static async getAvailableCoupons() {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('data_environment', environment.dataEnvironment)
        .eq('status', 'active');

      if (error || !data) return [];

      return data.map(c => ({
        id: c.id,
        code: c.code,
        title: c.code,
        discountText: c.type === 'percentage' ? `${c.value}% OFF` : `$${Number(c.value).toLocaleString('es-AR')} OFF`,
        description: `Válido para compras superiores a $${Number(c.min_spend || 0).toLocaleString('es-AR')}`,
        validUntil: c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-AR') : 'Sin vencimiento',
        minSpend: Number(c.min_spend || 0)
      }));
    } catch {
      return [];
    }
  }
}
