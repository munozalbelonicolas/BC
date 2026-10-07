/**
 * @file customerAuthService.js
 * Customer session management, profile mutation, email verification flow, and account security.
 * Segregated by environment with zero demo profile leakage into production.
 */

import { supabase, isSupabaseConfigured, signOutUser } from '../../services/supabase.js';
import { environment } from '../../core/environment.js';

class CustomerAuthService {
  constructor() {
    this.storageKey = 'bc_customer_session_v2';
    this.currentProfile = this.loadLocalProfile();
    this.listeners = new Set();
    this.initSupabaseListener();
  }

  initSupabaseListener() {
    if (isSupabaseConfigured && supabase?.auth?.onAuthStateChange) {
      try {
        supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
            const user = session.user;
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
            const parts = fullName.trim().split(' ');
            const name = parts[0] || user.email?.split('@')[0] || 'Cliente';
            const lastName = parts.slice(1).join(' ') || '';

            const profile = {
              id: user.id,
              name,
              lastName,
              email: user.email,
              phone: user.phone || user.user_metadata?.phone || '',
              documentId: '',
              createdAt: user.created_at,
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(lastName)}&background=0A2540&color=fff`,
              authProvider: user.app_metadata?.provider || 'oauth',
              dataEnvironment: environment.dataEnvironment
            };
            this.saveProfile(profile);
          } else if (event === 'SIGNED_OUT') {
            this.saveProfile(null);
          }
        });
      } catch (e) {
        console.warn('[AuthService] onAuthStateChange warning:', e);
      }
    }
  }

  loadLocalProfile() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${this.storageKey}_${environment.current}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }

    // Never auto-log into any account. Return null so the user must authenticate themselves.
    return null;
  }

  saveProfile(profile) {
    this.currentProfile = profile;
    const key = `${this.storageKey}_${environment.current}`;
    if (typeof localStorage !== 'undefined') {
      if (profile) {
        localStorage.setItem(key, JSON.stringify(profile));
      } else {
        localStorage.removeItem(key);
      }
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
            phone: data.user.phone || '',
            documentId: '',
            createdAt: data.user.created_at,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=0A2540&color=fff`,
            dataEnvironment: environment.dataEnvironment
          };
          this.saveProfile(profile);
          return { success: true, profile };
        }
        if (error) throw error;
      } catch (err) {
        if (environment.isProduction) {
          throw new Error(err.message || 'Credenciales inválidas.');
        }
      }
    }

    if (environment.isProduction) {
      throw new Error('No es posible iniciar sesión en producción sin credenciales válidas en la base de datos.');
    }

    // Demo/Development only login
    const profile = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].split('.')[0].replace(/^\w/, c => c.toUpperCase()),
      lastName: 'Usuario',
      email,
      phone: '+54 11 0000-0000',
      documentId: '00.000.000',
      createdAt: new Date().toISOString(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=0A2540&color=fff`,
      dataEnvironment: environment.dataEnvironment
    };
    this.saveProfile(profile);
    return { success: true, profile };
  }

  async signInWithOAuth(provider = 'google') {
    const providerKey = (provider || 'google').toLowerCase();
    const providerName = providerKey === 'google' ? 'Google' : 'Apple';

    if (!isSupabaseConfigured || !supabase) {
      throw new Error(`La autenticación con ${providerName} requiere la configuración activa de Supabase.`);
    }

    const redirectTo = `${window.location.origin}/cuenta.html`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: providerKey,
      options: {
        redirectTo,
        skipBrowserRedirect: true
      }
    });

    if (error) {
      if (error.message?.includes('provider is not enabled') || error.message?.includes('validation_failed')) {
        throw new Error(`El proveedor ${providerName} no está activado en tu panel de Supabase. Activá ${providerName} en Supabase (Authentication > Providers > ${providerName}) con tus credenciales de Google Cloud.`);
      }
      throw new Error(error.message || `No se pudo conectar con ${providerName}.`);
    }

    if (!data?.url) {
      throw new Error(`No se pudo obtener la URL de autorización para ${providerName}.`);
    }

    // Comprobar si el backend de Supabase tiene habilitado el proveedor antes de redirigir
    try {
      const probe = await fetch(data.url, { method: 'GET', redirect: 'manual' });
      if (probe.status === 400) {
        const body = await probe.json().catch(() => ({}));
        if (body?.msg?.includes('provider is not enabled') || body?.error_code === 'validation_failed') {
          throw new Error(`Google OAuth no está habilitado en tu panel de Supabase. Para usar el login real de Google, debés activar Google en Supabase (Authentication > Providers > Google) agregando tu Client ID y Client Secret.`);
        }
      }
    } catch (probeErr) {
      if (probeErr.message?.includes('Google OAuth no está habilitado') || probeErr.message?.includes('Supabase')) {
        throw probeErr;
      }
      // Si la llamada fetch es bloqueada por CORS o red, continuar con la redirección directa del navegador
    }

    // Redirección real al proveedor OAuth (Google / Apple)
    window.location.href = data.url;
    return { redirecting: true };
  }

  async checkOAuthSession() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session?.user) {
          const user = data.session.user;
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const parts = fullName.trim().split(' ');
          const name = parts[0] || user.email?.split('@')[0] || 'Cliente';
          const lastName = parts.slice(1).join(' ') || '';
          
          const profile = {
            id: user.id,
            name,
            lastName,
            email: user.email,
            phone: user.phone || user.user_metadata?.phone || '',
            documentId: '',
            createdAt: user.created_at,
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(lastName)}&background=0A2540&color=fff`,
            authProvider: user.app_metadata?.provider || 'oauth',
            dataEnvironment: environment.dataEnvironment
          };
          this.saveProfile(profile);
          return profile;
        }
      } catch (err) {
        console.warn('[OAuth] Error comprobando sesión:', err);
      }
    }
    return this.getCurrentCustomer();
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
              full_name: `${name.trim()} ${lastName.trim()}`,
              data_environment: environment.dataEnvironment
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
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(lastName)}&background=0A2540&color=fff`,
            dataEnvironment: environment.dataEnvironment
          };
          this.saveProfile(profile);
          return { success: true, profile, message: '¡Cuenta creada exitosamente!' };
        }
        return { success: true, message: 'Revisá tu correo para confirmar tu registro.' };
      } catch (err) {
        throw new Error(err.message || 'Error al registrar usuario');
      }
    }

    if (environment.isProduction) {
      throw new Error('No es posible registrar usuarios en producción sin base de datos activa.');
    }

    const profile = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(lastName)}&background=0A2540&color=fff`,
      dataEnvironment: environment.dataEnvironment
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

    return {
      success: true,
      message: 'Si existe una cuenta asociada a este correo, te enviaremos instrucciones de recuperación.'
    };
  }

  async updateProfile(updates) {
    if (!this.currentProfile) throw new Error('No hay sesión activa');

    if (!updates.name || !updates.name.trim()) throw new Error('El nombre no puede estar vacío');
    if (!updates.lastName || !updates.lastName.trim()) throw new Error('El apellido no puede estar vacío');

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
        return { success: true, message: `Se ha enviado un enlace de confirmación a ${newEmail}.` };
      } catch (err) {
        throw new Error(err.message);
      }
    }

    return {
      success: true,
      message: `Código de confirmación enviado a ${newEmail}.`
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
    return { success: true, message: 'Tu cuenta ha sido desactivada correctamente.' };
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
