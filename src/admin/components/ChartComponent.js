/**
 * @file ChartComponent.js
 * High-performance, lightweight pure SVG charts (Area, Bar, and Donut) with responsive layout.
 */

export class ChartComponent {
  /**
   * Render an interactive Area/Line Chart for sales or revenue
   * @param {Array<{ label: string, sales: number }>} series
   * @param {Object} options
   */
  static renderAreaChart(series = [], options = {}) {
    const width = 640;
    const height = options.height || 220;
    const padding = { top: 20, right: 20, bottom: 35, left: 55 };

    if (!series || series.length === 0) {
      return `<div style="padding:40px; text-align:center; color:var(--text-muted);">Sin datos disponibles</div>`;
    }

    const maxVal = Math.max(...series.map(s => s.sales), 100000) * 1.15;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = series.map((s, idx) => {
      const x = padding.left + (idx / Math.max(series.length - 1, 1)) * chartW;
      const y = padding.top + chartH - (s.sales / maxVal) * chartH;
      return { x, y, ...s };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Horizontal grid lines
    const gridLines = [0, 0.33, 0.66, 1].map(ratio => {
      const y = padding.top + chartH - ratio * chartH;
      const val = Math.round(ratio * maxVal);
      const label = val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${Math.round(val / 1000)}k`;
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" />
        <text x="${padding.left - 8}" y="${y + 4}" fill="#94a3b8" font-size="10" text-anchor="end" font-family="sans-serif">${label}</text>
      `;
    }).join('');

    // X axis labels
    const xLabels = points.map(p => `
      <text x="${p.x}" y="${height - 10}" fill="#64748b" font-size="11" text-anchor="middle" font-weight="500">${p.label}</text>
    `).join('');

    // Circles and tooltips
    const circles = points.map(p => `
      <g class="chart-point">
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#2563eb" stroke="#ffffff" stroke-width="2" />
        <title>${p.label}: $${p.sales.toLocaleString('es-AR')}</title>
      </g>
    `).join('');

    return `
      <div style="width:100%; overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; min-width:320px; max-height:${height}px;">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2563eb" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#2563eb" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          ${gridLines}
          <path d="${areaD}" fill="url(#chartGradient)" />
          <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          ${circles}
          ${xLabels}
        </svg>
      </div>
    `;
  }

  /**
   * Render a Bar Chart for orders per day
   * @param {Array<{ label: string, orders: number }>} series
   */
  static renderBarChart(series = [], options = {}) {
    const width = 640;
    const height = options.height || 200;
    const padding = { top: 20, right: 20, bottom: 35, left: 40 };

    if (!series || series.length === 0) return '';

    const maxVal = Math.max(...series.map(s => s.orders), 5) * 1.2;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barWidth = Math.max(12, (chartW / series.length) * 0.55);

    const bars = series.map((s, idx) => {
      const x = padding.left + (idx + 0.5) * (chartW / series.length) - barWidth / 2;
      const barH = (s.orders / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      return `
        <g class="chart-bar">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="#3b82f6">
            <title>${s.label}: ${s.orders} pedidos</title>
          </rect>
          <text x="${x + barWidth / 2}" y="${height - 10}" fill="#64748b" font-size="11" text-anchor="middle" font-weight="500">${s.label}</text>
        </g>
      `;
    }).join('');

    return `
      <div style="width:100%; overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; min-width:300px; max-height:${height}px;">
          ${bars}
        </svg>
      </div>
    `;
  }

  /**
   * Render a Donut Chart for payment methods breakdown
   * @param {Object} methodMap - { "Mercado Pago": 12, "Stripe": 5, "Transferencia": 8 }
   */
  static renderDonutChart(methodMap = {}) {
    const entries = Object.entries(methodMap);
    const total = entries.reduce((acc, [, val]) => acc + val, 0);

    if (total === 0) {
      return `<div style="padding:40px; text-align:center; color:var(--text-muted); font-size:13px;">Sin datos registrados</div>`;
    }

    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    const segments = entries.map(([name, count], idx) => {
      const percentage = (count / total);
      const strokeDash = percentage * circumference;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeDash;
      const color = colors[idx % colors.length];

      return {
        name,
        count,
        percentage: Math.round(percentage * 100),
        color,
        strokeDash,
        strokeDashoffset
      };
    });

    const circles = segments.map(seg => `
      <circle
        cx="90" cy="90" r="${radius}"
        fill="transparent"
        stroke="${seg.color}"
        stroke-width="24"
        stroke-dasharray="${seg.strokeDash} ${circumference - seg.strokeDash}"
        stroke-dashoffset="${seg.strokeDashoffset}"
      />
    `).join('');

    const legend = segments.map(seg => `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; font-size:12.5px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:10px; height:10px; border-radius:3px; background:${seg.color};"></span>
          <span style="color:var(--text-main); font-weight:500;">${seg.name}</span>
        </div>
        <span style="color:var(--text-muted); font-weight:600;">${seg.percentage}% (${seg.count})</span>
      </div>
    `).join('');

    return `
      <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
        <svg viewBox="0 0 180 180" style="width:140px; height:140px; transform:rotate(-90deg); flex-shrink:0;">
          ${circles}
        </svg>
        <div style="flex:1; min-width:180px;">${legend}</div>
      </div>
    `;
  }
}
