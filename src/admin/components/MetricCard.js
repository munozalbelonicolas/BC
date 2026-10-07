/**
 * @file MetricCard.js
 * KPI Metric card component with trend deltas and icons.
 */

export function renderMetricCard({
  title,
  value,
  iconSvg,
  delta = null,
  deltaText = 'vs período anterior',
  isCurrency = false
}) {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
    : (typeof value === 'number' ? value.toLocaleString('es-AR') : value);

  let deltaHtml = '';
  if (delta !== null) {
    const isPositive = delta >= 0;
    deltaHtml = `
      <span class="metric-delta ${isPositive ? 'positive' : 'negative'}">
        ${isPositive ? '↑' : '↓'} ${Math.abs(delta)}%
      </span>
      <span>${deltaText}</span>
    `;
  } else if (deltaText) {
    deltaHtml = `<span>${deltaText}</span>`;
  }

  return `
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-title">${title}</span>
        <div class="metric-icon-badge">${iconSvg}</div>
      </div>
      <div class="metric-value">${formattedValue}</div>
      <div class="metric-footer">${deltaHtml}</div>
    </div>
  `;
}
