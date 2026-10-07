import { createClient } from '@supabase/supabase-js';
import { PRODUCTS, CATEGORIES, TESTIMONIALS } from '../data/products.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
 * Fetch products from Supabase with fallback to local static data
 */
export async function getProducts() {
  if (!isSupabaseConfigured) {
    return PRODUCTS;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('price', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase query error or empty result, using local fallback:', error);
      return PRODUCTS;
    }

    // Map snake_case to camelCase if needed
    return data.map(item => ({
      id: item.id,
      brand: item.brand,
      name: item.name,
      category: item.category,
      specsSummary: item.specs_summary || item.specsSummary,
      description: item.description,
      price: Number(item.price),
      originalPrice: item.original_price ? Number(item.original_price) : null,
      rating: item.rating || 5,
      reviewsCount: item.reviews_count || item.reviewsCount || 0,
      image: item.image,
      badge: item.badge,
      stock: item.stock,
      specs: item.specs || {},
      featured: item.featured,
      isNew: item.is_new ?? item.isNew
    }));
  } catch (err) {
    console.error('Failed to load products from Supabase:', err);
    return PRODUCTS;
  }
}

/**
 * Save order to Supabase
 */
export async function saveOrderToSupabase(order) {
  if (!isSupabaseConfigured) {
    return { success: true, localOnly: true };
  }

  try {
    const payload = {
      id: order.id,
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping_cost: order.shippingCost,
      total: order.total,
      status: order.status,
      tracking_code: order.trackingCode,
      carrier: order.carrier,
      payment_method: order.paymentMethod
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
  if (!isSupabaseConfigured) {
    return { success: true, localOnly: true };
  }

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email }]);
      
    if (error && error.code !== '23505') { // ignore unique constraint duplicate
      throw error;
    }
    return { success: true };
  } catch (err) {
    console.error('Error subscribing email to Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Supabase Authentication helpers
 */
export async function signInUser(email, password) {
  if (!isSupabaseConfigured) {
    return { success: true, user: { email, name: email.split('@')[0] }, isMock: true };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function signUpUser(email, password, name) {
  if (!isSupabaseConfigured) {
    return { success: true, user: { email, name }, isMock: true };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function signOutUser() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}
