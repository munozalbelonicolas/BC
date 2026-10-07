/**
 * @file supabase.js
 * Supabase client and data services with strict data_environment isolation.
 * No hardcoded mock fallbacks.
 */

import { createClient } from '@supabase/supabase-js';
import { environment } from '../core/environment.js';

const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Fetch products from Supabase filtered by data_environment
 * In production: strictly queries data_environment = 'production'.
 * If empty or unconfigured: returns [] (NEVER returns mock fallback).
 */
export async function getProducts() {
  if (!isSupabaseConfigured || !supabase) {
    if (environment.isProduction) {
      console.warn('[DATABASE] Supabase no está configurado en producción.');
    }
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('data_environment', environment.dataEnvironment)
      .eq('status', 'active')
      .order('price', { ascending: false });

    if (error || !data) {
      if (error && error.code !== 'PGRST205') {
        console.error('[Supabase getProducts] Query error:', error);
      }
      return [];
    }

    return data.map(item => ({
      id: item.id,
      brand: item.brand,
      brandId: item.brand_id,
      name: item.name,
      slug: item.slug || item.id,
      sku: item.sku,
      category: item.category,
      specsSummary: item.specs_summary || item.specsSummary,
      description: item.description,
      price: Number(item.price),
      originalPrice: item.original_price ? Number(item.original_price) : null,
      cost: item.cost ? Number(item.cost) : 0,
      rating: item.rating || 5,
      reviewsCount: item.reviews_count || item.reviewsCount || 0,
      image: item.image,
      images: item.images || [item.image],
      badge: item.badge,
      stock: item.stock ?? 0,
      specs: item.specs || {},
      featured: item.featured,
      isNew: item.is_new ?? item.isNew,
      dataEnvironment: item.data_environment
    }));
  } catch (err) {
    console.error('Failed to load products from Supabase:', err);
    return [];
  }
}

/**
 * Fetch categories from Supabase filtered by data_environment
 */
export async function getCategories() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('data_environment', environment.dataEnvironment)
      .order('name');
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Fetch testimonials from Supabase filtered by data_environment
 */
export async function getTestimonials() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('data_environment', environment.dataEnvironment);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Fetch FAQs from Supabase filtered by data_environment
 */
export async function getFaqs() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('data_environment', environment.dataEnvironment)
      .order('order_index');
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Save order to Supabase with automatic data_environment tagging
 */
export async function saveOrderToSupabase(order) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, localOnly: true };
  }

  try {
    const payload = {
      id: order.id,
      user_id: order.userId || null,
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      shipping_cost: order.shippingCost || 0,
      total: order.total,
      status: order.status,
      tracking_code: order.trackingCode,
      carrier: order.carrier,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus || 'paid',
      data_environment: environment.dataEnvironment
    };

    const { error } = await supabase.from('orders').insert([payload]);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error saving order to Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe newsletter email in Supabase
 */
export async function subscribeNewsletterToSupabase(email) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, localOnly: true };
  }

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadySubscribed: true };
      }
      throw error;
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Supabase Auth: Sign In
 */
export async function signInUser(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Servicio de autenticación no disponible.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Supabase Auth: Sign Up
 */
export async function signUpUser(email, password, metadata = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Servicio de autenticación no disponible.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Supabase Auth: Sign Out
 */
export async function signOutUser() {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
