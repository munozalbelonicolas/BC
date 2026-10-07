/**
 * @file UsersView.js
 * Admin Users management & RBAC Permissions Matrix inspector.
 */

import { adminUserRepo } from '../repositories/factory.js';
import { ROLE_DEFINITIONS } from '../core/rbac.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { toast } from '../components/Toast.js';

export class UsersView {
  constructor(options = {}) {
    this.container = options.container;
    this.users = [];
  }

  async init() {
    this.renderLayout();
    await this.loadUsers();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Usuarios y Roles Administrativos (RBAC)</h1>
          <p>Control de acceso basado en roles con permisos granulares para cada área de la empresa</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="users-matrix-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
            Matriz de Permisos
          </button>
          <button class="btn btn-primary" id="users-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Invitar Usuario
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <span class="card-title">Operadores y Administradores del Sistema</span>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Operador</th>
                <th>Email</th>
                <th>Rol Asignado</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr><td colspan="6" style="text-align:center; padding:30px;">Cargando usuarios...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.querySelector('#users-new-btn').addEventListener('click', () => this.openUserModal());
    this.container.querySelector('#users-matrix-btn').addEventListener('click', () => this.openPermissionsMatrixModal());
  }

  async loadUsers() {
    try {
      this.users = await adminUserRepo.getAll();
      this.renderTable();
    } catch (err) {
      toast.show('Error al cargar usuarios: ' + err.message, 'danger');
    }
  }

  renderTable() {
    const tbody = this.container.querySelector('#users-table-body');
    if (this.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">No hay usuarios cargados.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.users.map(u => {
      const roleDef = ROLE_DEFINITIONS[u.role] || { name: u.role, badgeClass: 'badge-slate' };
      const lastLoginStr = u.lastLogin
        ? new Date(u.lastLogin).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Nunca';

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:34px; height:34px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px;">
                ${u.name.substring(0, 2).toUpperCase()}
              </div>
              <strong style="color:var(--text-main); font-size:13.5px;">${u.name}</strong>
            </div>
          </td>
          <td><span style="color:var(--text-muted); font-size:13px;">${u.email}</span></td>
          <td><span class="badge ${roleDef.badgeClass}">${roleDef.name}</span></td>
          <td><span class="badge ${u.status === 'active' ? 'badge-emerald' : 'badge-slate'}">${u.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
          <td><span style="font-size:12.5px; color:var(--text-muted);">${lastLoginStr}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm btn-icon" data-action="delete" data-id="${u.id}" style="color:var(--danger);">&times;</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: '¿Eliminar acceso?',
          message: 'El usuario perderá inmediatamente todos los permisos del panel administrativo.',
          isDanger: true
        });
        if (confirmed) {
          await adminUserRepo.delete(btn.dataset.id);
          toast.show('Usuario eliminado.', 'success');
          this.loadUsers();
        }
      });
    });
  }

  openUserModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width:440px;">
        <div class="modal-header">
          <h3 class="modal-title">Invitar Usuario Operador</h3>
          <button class="modal-close" id="um-close-btn">&times;</button>
        </div>
        <form id="user-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre Completo <span class="required">*</span></label>
            <input type="text" id="um-name" class="form-input" placeholder="Ej: Lucas Martínez" required />
          </div>
          <div class="form-group">
            <label class="form-label">Correo Electrónico <span class="required">*</span></label>
            <input type="email" id="um-email" class="form-input" placeholder="operador@bcespecialimport.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Rol y Alcance <span class="required">*</span></label>
            <select id="um-role" class="form-select">
              ${Object.values(ROLE_DEFINITIONS).map(r => `
                <option value="${r.id}">${r.name} - ${r.description}</option>
              `).join('')}
            </select>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="um-cancel-btn">Cancelar</button>
          <button type="submit" form="user-form" class="btn btn-primary">Registrar Usuario</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('#um-close-btn').addEventListener('click', close);
    backdrop.querySelector('#um-cancel-btn').addEventListener('click', close);

    backdrop.querySelector('#user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: backdrop.querySelector('#um-name').value.trim(),
        email: backdrop.querySelector('#um-email').value.trim(),
        role: backdrop.querySelector('#um-role').value,
        status: 'active'
      };

      try {
        await adminUserRepo.create(payload);
        toast.show('Usuario agregado con éxito.', 'success');
        close();
        this.loadUsers();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }

  openPermissionsMatrixModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const matrixHtml = Object.values(ROLE_DEFINITIONS).map(role => `
      <div style="border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-bottom:12px; background:#f8fafc;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <strong style="font-size:15px; color:var(--text-main);">${role.name}</strong>
            <p style="font-size:12px; color:var(--text-muted);">${role.description}</p>
          </div>
          <span class="badge ${role.badgeClass}">${role.permissions.length} permisos</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:4px; max-height:100px; overflow-y:auto;">
          ${role.permissions.map(p => `
            <span style="font-size:10.5px; font-family:monospace; background:white; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px; color:#334155;">${p}</span>
          `).join('')}
        </div>
      </div>
    `).join('');

    backdrop.innerHTML = `
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">Matriz de Autorización y Permisos (RBAC)</h3>
          <button class="modal-close" id="mx-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
            El sistema valida cada acción en frontend y rechaza operaciones de mutación en la base de datos si el token no cuenta con el alcance requerido.
          </p>
          ${matrixHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="mx-ok-btn">Entendido</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('#mx-close-btn').addEventListener('click', close);
    backdrop.querySelector('#mx-ok-btn').addEventListener('click', close);
  }
}
