/**
 * @file AccountAuthView.js
 * Customer authentication view: Login, Registration, and Password Recovery.
 */

import { customerAuthService } from '../services/customerAuthService.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountAuthView {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.currentMode = 'login'; // 'login' | 'register' | 'forgot' | 'verify_email'
    this.pendingEmail = '';
    this.isLoading = false;
  }

  setMode(mode) {
    this.currentMode = mode;
    this.render();
  }

  render(container = this.container) {
    if (!container) return;
    this.container = container;

    let formContent = '';

    if (this.currentMode === 'login') {
      formContent = `
        <div class="auth-header">
          <div class="auth-badge">Acceso a Clientes</div>
          <h2 class="auth-title">Iniciar sesión</h2>
          <p class="auth-subtitle">Ingresá a tu cuenta para gestionar tus compras, envíos y perfil.</p>
        </div>

        <form id="customer-login-form" class="auth-form" novalidate>
          <div class="account-field">
            <label class="account-label" for="login-email">Correo electrónico</label>
            <input 
              type="email" 
              id="login-email" 
              class="account-input" 
              placeholder="tunombre@ejemplo.com" 
              value="nicolas.munoz@ejemplo.com"
              required 
              autocomplete="email"
            />
          </div>

          <div class="account-field">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label class="account-label" for="login-password">Contraseña</label>
              <button type="button" class="auth-link-btn" id="btn-goto-forgot">¿Olvidaste tu contraseña?</button>
            </div>
            <div style="position:relative;">
              <input 
                type="password" 
                id="login-password" 
                class="account-input" 
                placeholder="••••••••" 
                value="password123"
                required 
                autocomplete="current-password"
              />
              <button type="button" class="password-toggle-btn" id="toggle-password" aria-label="Mostrar contraseña">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="account-btn account-btn-primary" style="width:100%; height:46px; font-size:15px;" id="login-submit-btn" ${this.isLoading ? 'disabled' : ''}>
            ${this.isLoading ? '<span class="account-spinner"></span> Ingresando...' : 'Iniciar Sesión'}
          </button>

          <div class="auth-divider">
            <span>o continuá con</span>
          </div>

          <div class="social-auth-grid">
            <button type="button" class="account-btn account-btn-outline social-auth-btn" id="social-google-btn">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17.4C3.7 21.1 7.5 24 12 24z"/></svg>
              Google
            </button>
            <button type="button" class="account-btn account-btn-outline social-auth-btn" id="social-apple-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.13.64-2.77 1.39-.57.65-1.07 1.72-.94 2.76 1.08.08 2.12-.57 2.7-1.28z"/></svg>
              Apple
            </button>
          </div>

          <div class="auth-switch-box">
            ¿No tenés una cuenta? 
            <button type="button" class="auth-highlight-btn" id="btn-goto-register">Registrate acá</button>
          </div>

          <div class="auth-demo-tip">
            💡 <strong>Modo Demo / Prueba:</strong> Podés ingresar con cualquier correo o usar los datos prellenados para explorar la experiencia completa de cliente.
          </div>
        </form>
      `;
    } else if (this.currentMode === 'register') {
      formContent = `
        <div class="auth-header">
          <div class="auth-badge">Nuevo Cliente</div>
          <h2 class="auth-title">Crear tu cuenta</h2>
          <p class="auth-subtitle">Registrate para realizar compras más rápido, rastrear tus pedidos y acceder a promociones.</p>
        </div>

        <form id="customer-register-form" class="auth-form" novalidate>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div class="account-field">
              <label class="account-label" for="reg-name">Nombre *</label>
              <input type="text" id="reg-name" class="account-input" placeholder="Ej: Juan" required autocomplete="given-name" />
            </div>
            <div class="account-field">
              <label class="account-label" for="reg-lastname">Apellido *</label>
              <input type="text" id="reg-lastname" class="account-input" placeholder="Ej: Gómez" required autocomplete="family-name" />
            </div>
          </div>

          <div class="account-field">
            <label class="account-label" for="reg-email">Correo electrónico *</label>
            <input type="email" id="reg-email" class="account-input" placeholder="tunombre@ejemplo.com" required autocomplete="email" />
          </div>

          <div class="account-field">
            <label class="account-label" for="reg-password">Contraseña *</label>
            <input type="password" id="reg-password" class="account-input" placeholder="Mínimo 6 caracteres" required autocomplete="new-password" />
            <span class="account-hint">Usá al menos 6 caracteres seguros.</span>
          </div>

          <div class="account-field" style="margin-top: 14px;">
            <label class="account-checkbox-label">
              <input type="checkbox" id="reg-terms" required />
              <span>Acepto los <a href="#terminos" target="_blank" style="color:var(--color-customer-primary); font-weight:600;">Términos y Condiciones</a> y la <a href="#privacidad" target="_blank" style="color:var(--color-customer-primary); font-weight:600;">Política de Privacidad</a>. *</span>
            </label>
          </div>

          <div class="account-field" style="margin-top: 6px;">
            <label class="account-checkbox-label">
              <input type="checkbox" id="reg-marketing" />
              <span>Deseo recibir ofertas exclusivas, cupones y novedades por email. (Opcional)</span>
            </label>
          </div>

          <button type="submit" class="account-btn account-btn-primary" style="width:100%; height:46px; font-size:15px; margin-top:12px;" id="register-submit-btn" ${this.isLoading ? 'disabled' : ''}>
            ${this.isLoading ? '<span class="account-spinner"></span> Creando cuenta...' : 'Crear Cuenta'}
          </button>

          <div class="auth-switch-box">
            ¿Ya tenés una cuenta? 
            <button type="button" class="auth-highlight-btn" id="btn-goto-login">Iniciá sesión</button>
          </div>
        </form>
      `;
    } else if (this.currentMode === 'forgot') {
      formContent = `
        <div class="auth-header">
          <div class="auth-badge">Recuperación</div>
          <h2 class="auth-title">Recuperar contraseña</h2>
          <p class="auth-subtitle">Ingresá tu correo electrónico registrado y te enviaremos las instrucciones de recuperación.</p>
        </div>

        <form id="customer-forgot-form" class="auth-form" novalidate>
          <div class="account-field">
            <label class="account-label" for="forgot-email">Correo electrónico</label>
            <input type="email" id="forgot-email" class="account-input" placeholder="tunombre@ejemplo.com" required autocomplete="email" />
          </div>

          <button type="submit" class="account-btn account-btn-primary" style="width:100%; height:46px; font-size:15px;" id="forgot-submit-btn" ${this.isLoading ? 'disabled' : ''}>
            ${this.isLoading ? '<span class="account-spinner"></span> Enviando...' : 'Enviar Instrucciones'}
          </button>

          <div class="auth-switch-box">
            <button type="button" class="auth-highlight-btn" id="btn-goto-login-from-forgot">← Volver al inicio de sesión</button>
          </div>
        </form>
      `;
    } else if (this.currentMode === 'verify_email') {
      formContent = `
        <div class="auth-header" style="text-align:center;">
          <div class="auth-icon-success">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9"></path><polyline points="22,6 12,13 2,6"></polyline><circle cx="18" cy="18" r="3"></circle><polyline points="17 18 18 19 20 17"></polyline></svg>
          </div>
          <h2 class="auth-title" style="margin-top:16px;">Revisá tu correo</h2>
          <p class="auth-subtitle">Hemos enviado un enlace de confirmación a <strong>${this.pendingEmail || 'tu casilla'}</strong>. Por favor verificalo para continuar.</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; margin-top:24px;">
          <button type="button" class="account-btn account-btn-outline" style="width:100%; height:44px;" id="btn-resend-verify">
            Reenviar correo de verificación
          </button>
          <button type="button" class="account-btn account-btn-primary" style="width:100%; height:44px;" id="btn-goto-login-verified">
            Ir a Iniciar Sesión
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="auth-container">
        <div class="auth-brand-bar">
          <a href="/" class="auth-logo-link">
            <img src="/images/logo-transparent.png" alt="BC Especial Import" class="auth-logo-img" onerror="this.src='/images/logo.png'"/>
          </a>
          <a href="/" class="auth-back-store-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver a la tienda
          </a>
        </div>

        <div class="auth-card">
          ${formContent}
        </div>

        <div class="auth-footer-help">
          <p>¿Tenés problemas para ingresar? <a href="https://wa.me/5491112345678" target="_blank" rel="noopener">Contactar soporte técnico</a></p>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    // Mode switches
    const btnGotoRegister = container.querySelector('#btn-goto-register');
    if (btnGotoRegister) btnGotoRegister.addEventListener('click', () => this.setMode('register'));

    const btnGotoLogin = container.querySelector('#btn-goto-login');
    if (btnGotoLogin) btnGotoLogin.addEventListener('click', () => this.setMode('login'));

    const btnGotoForgot = container.querySelector('#btn-goto-forgot');
    if (btnGotoForgot) btnGotoForgot.addEventListener('click', () => this.setMode('forgot'));

    const btnGotoLoginFromForgot = container.querySelector('#btn-goto-login-from-forgot');
    if (btnGotoLoginFromForgot) btnGotoLoginFromForgot.addEventListener('click', () => this.setMode('login'));

    const btnGotoLoginVerified = container.querySelector('#btn-goto-login-verified');
    if (btnGotoLoginVerified) btnGotoLoginVerified.addEventListener('click', () => this.setMode('login'));

    // Password toggle
    const toggleBtn = container.querySelector('#toggle-password');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const input = container.querySelector('#login-password');
        if (input) {
          const isPass = input.type === 'password';
          input.type = isPass ? 'text' : 'password';
          toggleBtn.innerHTML = isPass 
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
      });
    }

    // Social buttons
    const googleBtn = container.querySelector('#social-google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        accountToast.info('Inicio con Google preparado. En modo demo podés ingresar directamente con el formulario.');
      });
    }

    const appleBtn = container.querySelector('#social-apple-btn');
    if (appleBtn) {
      appleBtn.addEventListener('click', () => {
        accountToast.info('Inicio con Apple preparado. En modo demo podés ingresar directamente con el formulario.');
      });
    }

    // Re-send verification
    const btnResend = container.querySelector('#btn-resend-verify');
    if (btnResend) {
      btnResend.addEventListener('click', () => {
        btnResend.disabled = true;
        btnResend.textContent = 'Enviando...';
        setTimeout(() => {
          btnResend.disabled = false;
          btnResend.textContent = 'Reenviar correo de verificación';
          accountToast.success('Correo de verificación reenviado.');
        }, 1200);
      });
    }

    // Login submit
    const loginForm = container.querySelector('#customer-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email')?.value?.trim();
        const password = container.querySelector('#login-password')?.value;

        if (!email || !password) {
          accountToast.error('Por favor completá tu correo y contraseña');
          return;
        }

        this.isLoading = true;
        this.render();

        try {
          const res = await customerAuthService.signIn(email, password);
          if (res.success) {
            accountToast.success(`¡Bienvenido de nuevo, ${res.profile.name}!`);
            if (this.onAuthSuccess) this.onAuthSuccess(res.profile);
          }
        } catch (err) {
          accountToast.error(err.message || 'Credenciales incorrectas');
          this.isLoading = false;
          this.render();
        }
      });
    }

    // Register submit
    const regForm = container.querySelector('#customer-register-form');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = container.querySelector('#reg-name')?.value?.trim();
        const lastName = container.querySelector('#reg-lastname')?.value?.trim();
        const email = container.querySelector('#reg-email')?.value?.trim();
        const password = container.querySelector('#reg-password')?.value;
        const terms = container.querySelector('#reg-terms')?.checked;

        if (!name || !lastName || !email || !password) {
          accountToast.error('Por favor completá todos los campos obligatorios');
          return;
        }

        if (!terms) {
          accountToast.error('Debés aceptar los Términos y Condiciones para crear tu cuenta');
          return;
        }

        this.isLoading = true;
        this.render();

        try {
          const res = await customerAuthService.signUp(name, lastName, email, password);
          if (res.profile) {
            accountToast.success(res.message || 'Cuenta creada exitosamente');
            if (this.onAuthSuccess) this.onAuthSuccess(res.profile);
          } else {
            this.pendingEmail = email;
            this.isLoading = false;
            this.setMode('verify_email');
          }
        } catch (err) {
          accountToast.error(err.message || 'No se pudo crear la cuenta');
          this.isLoading = false;
          this.render();
        }
      });
    }

    // Forgot submit
    const forgotForm = container.querySelector('#customer-forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#forgot-email')?.value?.trim();

        if (!email) {
          accountToast.error('Por favor ingresá tu correo electrónico');
          return;
        }

        this.isLoading = true;
        this.render();

        try {
          const res = await customerAuthService.sendPasswordResetEmail(email);
          accountToast.success(res.message);
          this.pendingEmail = email;
          this.isLoading = false;
          this.setMode('verify_email');
        } catch (err) {
          accountToast.error(err.message || 'Error al procesar solicitud');
          this.isLoading = false;
          this.render();
        }
      });
    }
  }
}
