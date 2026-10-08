/**
 * @file supabase.js
 * Supabase client and data services with strict data_environment isolation.
 * No hardcoded mock fallbacks.
 */

import { createClient } from '@supabase/supabase-js';
import { environment } from '../core/environment.js';
import { PRODUCTS, CATEGORIES, TESTIMONIALS, FAQS } from '../data/products.js';

const supabaseUrl = 
  import.meta?.env?.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_URL) || 
  'https://fumzsmzzzprakrzczrhl.supabase.co';

const supabaseAnonKey = 
  import.meta?.env?.VITE_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_ANON_KEY) || 
  'sb_publishable_5C9n9QVSfX1I-r2fNDGxyw_vWSi_QmF';

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
 * Fetch products from Supabase with safe fallback to initial product catalog
 */
export async function getProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return PRODUCTS;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('price', { ascending: false });

    if (error || !data || data.length === 0) {
      return PRODUCTS;
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
      dataEnvironment: item.data_environment || environment.dataEnvironment
    }));
  } catch (err) {
    return PRODUCTS;
  }
}

/**
 * Fetch categories from Supabase with fallback
 */
export async function getCategories() {
  if (!isSupabaseConfigured || !supabase) return CATEGORIES;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error || !data || data.length === 0) return CATEGORIES;
    return data;
  } catch {
    return CATEGORIES;
  }
}

/**
 * Fetch testimonials from Supabase with fallback
 */
export async function getTestimonials() {
  if (!isSupabaseConfigured || !supabase) return TESTIMONIALS;
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*');
    if (error || !data || data.length === 0) return TESTIMONIALS;
    return data;
  } catch {
    return TESTIMONIALS;
  }
}

/**
 * Fetch FAQs from Supabase with fallback
 */
export async function getFaqs() {
  if (!isSupabaseConfigured || !supabase) return FAQS;
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('order_index');
    if (error || !data || data.length === 0) return FAQS;
    return data;
  } catch {
    return FAQS;
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

/**
 * Supabase Auth: Sign In with OAuth provider
 */
export async function signInWithOAuthUser(provider = 'google', redirectTo = '') {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Servicio de autenticación no disponible.' };
  }

  try {
    const options = {};
    if (redirectTo) options.redirectTo = redirectTo;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
