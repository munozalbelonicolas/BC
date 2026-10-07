/**
 * @file ShippingView.js
 * Shipping methods configuration and logistics provider management.
 */

import { toast } from '../components/Toast.js';

export class ShippingView {
  constructor(options = {}) {
    this.container = options.container;
  }

  async init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Métodos de Envío & Logística</h1>
          <p>Gestión de transportistas (Andreani, Correo Argentino, Expresos) y tarifas de entrega</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <div class="card" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <h3 style="font-size:16px; font-weight:700; color:var(--text-main);">Retiro en Showroom Central</h3>
              <p style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">Retiro gratuito en nuestro local comercial de CABA</p>
            </div>
            <span class="badge badge-emerald">Activo</span>
          </div>
          <div style="font-size:13px; line-height:1.6; margin-bottom:16px;">
            <div><strong>Costo:</strong> Gratis ($0)</div>
            <div><strong>Plazo:</strong> Inmediato (Lunes a Sábados 10 a 19hs)</div>
            <div><strong>Ubicación:</strong> Av. Corrientes 1450, Showroom CABA</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="alert('Configuración guardada.')">Editar Condiciones</button>
        </div>

        <div class="card" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <h3 style="font-size:16px; font-weight:700; color:var(--text-main);">Andreani Express (CABA & GBA)</h3>
              <p style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">Entrega prioritaria puerta a puerta con seguro total</p>
            </div>
            <span class="badge badge-emerald">Activo</span>
          </div>
          <div style="font-size:13px; line-height:1.6; margin-bottom:16px;">
            <div><strong>Costo Estándar:</strong> $6.500</div>
            <div><strong>Plazo:</strong> 24 a 48 hs hábiles</div>
            <div><strong>Envío Gratis:</strong> En compras superiores a $250.000</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="alert('Configuración guardada.')">Editar Tarifas</button>
        </div>

        <div class="card" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <h3 style="font-size:16px; font-weight:700; color:var(--text-main);">Andreani Nacional (Interior del País)</h3>
              <p style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">Cobertura a todas las provincias argentinas</p>
            </div>
            <span class="badge badge-emerald">Activo</span>
          </div>
          <div style="font-size:13px; line-height:1.6; margin-bottom:16px;">
            <div><strong>Costo Estándar:</strong> $11.900</div>
            <div><strong>Plazo:</strong> 3 a 5 días hábiles</div>
            <div><strong>Envío Gratis:</strong> En compras superiores a $350.000</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="alert('Configuración guardada.')">Editar Tarifas</button>
        </div>

        <div class="card" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <h3 style="font-size:16px; font-weight:700; color:var(--text-main);">Expreso Carga Pesada (Línea Blanca)</h3>
              <p style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">Heladeras, lavarropas y bultos grandes paletizados</p>
            </div>
            <span class="badge badge-emerald">Activo</span>
          </div>
          <div style="font-size:13px; line-height:1.6; margin-bottom:16px;">
            <div><strong>Costo Estándar:</strong> $18.500</div>
            <div><strong>Plazo:</strong> 4 a 7 días hábiles</div>
            <div><strong>Transportistas:</strong> Cruz del Sur, Vía Cargo, Expreso Luján</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="alert('Configuración guardada.')">Editar Tarifas</button>
        </div>
      </div>
    `;
  }
}
