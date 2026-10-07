/**
 * @file storage.js
 * Storage adapter abstraction for product and category image uploads.
 */

import { supabase, isSupabaseConfigured } from '../../services/supabase.js';

export class StorageService {
  /**
   * Upload an image file
   * @param {File} file
   * @param {string} folder - 'products' | 'categories' | 'brands'
   * @returns {Promise<{ url: string, name: string, size: number }>}
   */
  static async uploadImage(file, folder = 'products') {
    if (!file) throw new Error('No se seleccionó ningún archivo');

    // 1. If Supabase is available and bucket is active
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('store-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('store-assets')
            .getPublicUrl(fileName);

          if (publicUrlData && publicUrlData.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              name: file.name,
              size: file.size
            };
          }
        }
      } catch (err) {
        console.warn('Storage bucket upload fallback:', err);
      }
    }

    // 2. Client-side Data URL fallback for immediate preview & persistence
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          url: e.target.result,
          name: file.name,
          size: file.size
        });
      };
      reader.onerror = (err) => reject(new Error('Error al procesar el archivo local: ' + err));
      reader.readAsDataURL(file);
    });
  }
}
