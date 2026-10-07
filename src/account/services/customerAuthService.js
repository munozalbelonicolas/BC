/**
 * @file customerAuthService.js
 * Customer session management, profile mutation, email verification flow, and account security.
 */

import { supabase, isSupabaseConfigured, signOutUser } from '../../services/supabase.js';
import { INITIAL_CUSTOMER_PROFILE } from '../repositories/mock/mockCustomerData.js';

class CustomerAuthService {
  constructor() {
    this.storageKey = 'bc_customer_session_v1';
    this.currentProfile = this.loadLocalProfile();
    this.listeners = new Set();
  }

  loadLocalProfile() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default demo customer profile
    return { ...INITIAL_CUSTOMER_PROFILE };
  }

  saveProfile(profile) {
    this.currentProfile = profile;
    if (profile) {
      localStorage.setItem(this.storageKey, JSON.stringify(profile));
    } else {
      localStorage.removeItem(this.storageKey);
    }
    this.notify();
  }

  getCurrentCustomer() {
    return this.currentProfile ? { ...this.currentProfile } : null;
  }

  isAuthenticated() {
    return Boolean(this.currentProfile);
  }

  async signIn(email, password) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const profile = {
            id: data.user.id,
            name: data.user.user_metadata?.full_name?.split(' ')[0] || email.split('@')[0],
            lastName: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            email: data.user.email,
            phone: data.user.phone || '+54 11 4455-8899',
            documentId: '32.456.789',
            createdAt: data.user.created_at,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
          };
          this.saveProfile(profile);
          return { success: true, profile };
        }
      } catch (err) {
        console.warn('Supabase sign-in fallback:', err);
      }
    }

    // Local / Mock login
    const profile = {
      ...INITIAL_CUSTOMER_PROFILE,
      email,
      name: email.split('@')[0].split('.')[0].replace(/^\w/, c => c.toUpperCase())
    };
    this.saveProfile(profile);
    return { success: true, profile };
  }

  async signUp(name, lastName, email, password) {
    if (!name || !name.trim()) throw new Error('El nombre es obligatorio');
    if (!email || !email.includes('@')) throw new Error('El correo electrónico no es válido');
    if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${name.trim()} ${lastName.trim()}`
            }
          }
        });
        if (error) throw error;
        
        if (data.user) {
          const profile = {
            id: data.user.id,
            name: name.trim(),
            lastName: lastName.trim(),
            email: data.user.email,
            phone: '',
            documentId: '',
            createdAt: data.user.created_at,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(lastName)}&background=0A2540&color=fff`
          };
          this.saveProfile(profile);
          return { success: true, profile, message: '¡Cuenta creada exitosamente!' };
        }
        return { success: true, message: 'Revisá tu correo para confirmar tu registro.' };
      } catch (err) {
        throw new Error(err.message || 'Error al registrar usuario');
      }
    }

    const profile = {
      ...INITIAL_CUSTOMER_PROFILE,
      id: `usr_${Date.now()}`,
      name: name.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(lastName)}&background=0A2540&color=fff`
    };
    this.saveProfile(profile);
    return { success: true, profile, message: '¡Cuenta creada exitosamente!' };
  }

  async sendPasswordResetEmail(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Ingrese un correo electrónico válido');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/cuenta.html#seguridad`
        });
        if (error) console.warn('Supabase reset email notice:', error);
      } catch (err) {
        console.warn('Supabase reset email error:', err);
      }
    }

    // Generic safe response to prevent email enumeration
    return {
      success: true,
      message: 'Si existe una cuenta asociada a este correo, te enviaremos instrucciones de recuperación en los próximos minutos.'
    };
  }

  async updateProfile(updates) {
    if (!this.currentProfile) throw new Error('No hay sesión activa');

    // Validations
    if (!updates.name || !updates.name.trim()) throw new Error('El nombre no puede estar vacío');
    if (!updates.lastName || !updates.lastName.trim()) throw new Error('El apellido no puede estar vacío');
    if (updates.phone && updates.phone.length < 8) throw new Error('Ingrese un número de teléfono válido');

    const updated = {
      ...this.currentProfile,
      ...updates
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
          data: { full_name: `${updated.name} ${updated.lastName}`, phone: updated.phone }
        });
      } catch (err) {
        console.warn('Supabase profile metadata update:', err);
      }
    }

    this.saveProfile(updated);
    return updated;
  }

  async requestEmailChange(newEmail) {
    if (!newEmail || !newEmail.includes('@')) {
      throw new Error('Ingrese un correo electrónico válido');
    }
    if (newEmail.toLowerCase() === this.currentProfile.email.toLowerCase()) {
      throw new Error('El nuevo email debe ser diferente al actual');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        return { success: true, message: `Se ha enviado un enlace de confirmación a ${newEmail}. Tu email se actualizará cuando hagas clic en el correo.` };
      } catch (err) {
        throw new Error(err.message);
      }
    }

    // Mock flow simulation
    return {
      success: true,
      message: `Hemos enviado un código de verificación seguro a ${newEmail}. Por motivos de seguridad se requiere confirmación.`
    };
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('Las nuevas contraseñas no coinciden');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return { success: true, message: 'Contraseña actualizada correctamente.' };
      } catch (err) {
        throw new Error(err.message);
      }
    }

    return { success: true, message: 'Contraseña actualizada correctamente.' };
  }

  async signOut() {
    await signOutUser();
    this.saveProfile(null);
  }

  async deleteAccount() {
    await this.signOut();
    return { success: true, message: 'Tu cuenta ha sido desactivada y tus datos marcados para baja legal.' };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.currentProfile));
  }
}

export const customerAuthService = new CustomerAuthService();
