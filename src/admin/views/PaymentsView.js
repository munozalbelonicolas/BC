/**
 * @file PaymentsView.js
 * Payment transactions ledger loaded dynamically from paymentRepo.
 * Zero hardcoded mock transactions.
 */

import { paymentRepo } from '../repositories/factory.js';
import { toast } from '../components/Toast.js';

export class PaymentsView {
  constructor(options = {}) {
    this.container = options.container;
  }

  async init() {
    try {
      const transactions = await paymentRepo.getAll();
      this.render(transactions || []);
    } catch (err) {
      toast.show('Error al cargar transacciones: ' + err.message, 'danger');
      this.render([]);
    }
  }

  render(transactions = []) {
    const rows = transactions.length === 0
      ? `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">No hay transacciones registradas en este entorno.</td></tr>`
      : transactions.map(tx => {
        const providerMap = {
          mercadopago: { label: 'Mercado Pago', cls: 'badge-blue' },
          stripe: { label: 'Stripe', cls: 'badge-purple' },
          bank_transfer: { label: 'Transferencia Bancaria', cls: 'badge-emerald' }
        };
        const p = providerMap[tx.provider] || { label: tx.provider, cls: 'badge-slate' };
        const statusMap = {
          approved: { label: 'Aprobado', cls: 'badge-emerald' },
          pending: { label: 'Pendiente', cls: 'badge-amber' },
          rejected: { label: 'Rechazado', cls: 'badge-danger' }
        };
        const s = statusMap[tx.status] || { label: tx.status, cls: 'badge-slate' };

        return `
          <tr>
            <td><strong style="font-family:monospace; color:var(--primary); font-size:13px;">${tx.id}</strong></td>
            <td><strong>${tx.orderId}</strong></td>
            <td>${tx.customerName}</td>
            <td><strong style="color:var(--text-main); font-size:14px;">$${Number(tx.amount).toLocaleString('es-AR')}</strong></td>
            <td><span class="badge ${p.cls}">${p.label}</span></td>
            <td><code style="font-size:11.5px; color:var(--text-muted);">${tx.providerTransactionId || '-'}</code></td>
            <td><span class="badge ${s.cls}">${s.label}</span></td>
            <td style="font-size:12.5px; color:var(--text-muted);">${new Date(tx.date || tx.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        `;
      }).join('');

    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Pagos y Transacciones</h1>
          <p>Registro centralizado de cobros con pasarelas integradas (Mercado Pago, Stripe, CBU/Alias)</p>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID Transacción</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Importe</th>
                <th>Pasarela</th>
                <th>ID Externo Gateway</th>
                <th>Estado</th>
                <th>Fecha</th>
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
