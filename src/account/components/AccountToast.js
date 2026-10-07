/**
 * @file AccountToast.js
 * Clean, subtle toast notification for customer account portal.
 */

class AccountToast {
  constructor() {
    this.container = null;
    this.ensureContainer();
  }

  ensureContainer() {
    if (!this.container) {
      let el = document.getElementById('account-toast-container');
      if (!el) {
        el = document.createElement('div');
        el.id = 'account-toast-container';
        el.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(el);
      }
      this.container = el;
    }
  }

  show(message, type = 'success', duration = 3000) {
    this.ensureContainer();

    const toast = document.createElement('div');
    toast.style.cssText = `
      pointer-events: auto;
      background: #0f172a;
      color: white;
      padding: 12px 18px;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15);
      font-size: 13.5px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideUp 200ms ease-out;
      border-left: 4px solid ${type === 'success' ? '#10b981' : (type === 'danger' ? '#ef4444' : '#3b82f6')};
    `;

    toast.innerHTML = `
      <span>${message}</span>
      <button style="background:transparent; border:none; color:rgba(255,255,255,0.6); cursor:pointer; font-size:16px; margin-left:8px;" onclick="this.parentElement.remove()">✕</button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    this.show(message, 'danger', duration);
  }

  danger(message, duration = 4000) {
    this.show(message, 'danger', duration);
  }

  warning(message, duration = 3500) {
    this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }
}

export const accountToast = new AccountToast();
