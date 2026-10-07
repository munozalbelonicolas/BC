/**
 * @file AuditView.js
 * Immutable Audit Logs inspector with before/after state diffs and operator attribution.
 */

import { auditLogger } from '../core/audit.js';

export class AuditView {
  constructor(options = {}) {
    this.container = options.container;
  }

  async init() {
    this.render();
  }

  render() {
    const logs = auditLogger.getRecentLogs(100);

    const rows = logs.length > 0 ? logs.map(l => {
      const dateFormatted = new Date(l.createdAt).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'medium'
      });

      let changesHtml = '';
      if (l.oldValues || l.newValues) {
        changesHtml = `
          <details style="font-size:11.5px; margin-top:4px; cursor:pointer;">
            <summary style="color:var(--primary); font-weight:500;">Ver detalle de cambios</summary>
            <div style="background:#f1f5f9; padding:8px; border-radius:6px; margin-top:4px; font-family:monospace; font-size:11px;">
              ${l.oldValues ? `<div><strong>Anterior:</strong> ${JSON.stringify(l.oldValues)}</div>` : ''}
              ${l.newValues ? `<div><strong>Nuevo:</strong> ${JSON.stringify(l.newValues)}</div>` : ''}
            </div>
          </details>
        `;
      }

      return `
        <tr>
          <td><span style="font-size:12px; color:var(--text-muted);">${dateFormatted}</span></td>
          <td><strong style="color:var(--text-main); font-size:13px;">${l.userName || l.userEmail}</strong></td>
          <td><span class="badge badge-purple">${l.action}</span></td>
          <td><span style="font-weight:600;">${l.entity}</span> (ID: <code style="font-size:11px;">${l.entityId}</code>)</td>
          <td>
            <div style="font-size:13px; color:var(--text-main);">${l.notes || '-'}</div>
            ${changesHtml}
          </td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">Sin eventos de auditoría registrados en esta sesión.</td></tr>`;

    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Registro de Auditoría (Audit Trail)</h1>
          <p>Trazabilidad inmutable de operaciones administrativas y modificaciones de datos</p>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Operador</th>
                <th>Acción Realizada</th>
                <th>Entidad Afectada</th>
                <th>Detalle y Cambios Registrados</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
