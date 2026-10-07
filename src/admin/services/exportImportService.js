/**
 * @file exportImportService.js
 * Comprehensive CSV/XLSX Parser, column mapping wizard, validator, and exporter.
 */

import { ProductService } from './productService.js';
import { auditLogger } from '../core/audit.js';

export class ExportImportService {
  /**
   * Export dataset as downloadable CSV file
   * @param {Array<Object>} items
   * @param {string} filename
   */
  static exportToCSV(items, filename = 'export.csv') {
    if (!items || items.length === 0) {
      throw new Error('No hay datos para exportar.');
    }

    const headers = Object.keys(items[0]);
    const csvRows = [headers.join(',')];

    items.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Parse uploaded CSV file into raw rows and headers
   * @param {File} file
   * @returns {Promise<{ headers: string[], rows: any[] }>}
   */
  static parseCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
          if (lines.length < 2) {
            throw new Error('El archivo CSV debe contener encabezados y al menos una fila de datos.');
          }

          // Simple CSV line parser taking quotes into account
          const parseLine = (line) => {
            const result = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' && line[i + 1] === '"') {
                cur += '"';
                i++;
              } else if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
              } else {
                cur += char;
              }
            }
            result.push(cur.trim());
            return result;
          };

          const headers = parseLine(lines[0]);
          const rows = [];
          for (let i = 1; i < lines.length; i++) {
            const values = parseLine(lines[i]);
            const rowObj = {};
            headers.forEach((h, idx) => {
              rowObj[h] = values[idx] || '';
            });
            rows.push(rowObj);
          }

          resolve({ headers, rows });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsText(file);
    });
  }

  /**
   * Validate mapped rows before importing
   * @param {Array<Object>} rows
   * @param {Object} columnMap
   */
  static validateProductImport(rows, columnMap) {
    const validRows = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +1 header, +1 1-index
      const name = row[columnMap.name]?.trim();
      const sku = row[columnMap.sku]?.trim();
      const priceStr = row[columnMap.price];
      const stockStr = row[columnMap.stock];
      const category = row[columnMap.category]?.trim();

      const rowErrors = [];

      if (!name) rowErrors.push('Falta el nombre del producto');
      if (!sku) rowErrors.push('Falta el código SKU');
      
      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) {
        rowErrors.push(`Precio inválido ("${priceStr}")`);
      }

      const stock = parseInt(stockStr, 10);
      if (isNaN(stock) || stock < 0) {
        rowErrors.push(`Stock numérico inválido ("${stockStr}")`);
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNum,
          sku: sku || 'S/D',
          name: name || 'S/D',
          errors: rowErrors
        });
      } else {
        validRows.push({
          name,
          sku,
          brand: row[columnMap.brand]?.trim() || 'Genérico',
          category: category || 'electrodomesticos',
          price,
          cost: parseFloat(row[columnMap.cost]) || Math.round(price * 0.65),
          stock,
          image: row[columnMap.image]?.trim() || '/images/store_front.jpg',
          description: row[columnMap.description]?.trim() || ''
        });
      }
    });

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      validRows,
      errors
    };
  }

  /**
   * Commit verified imported products
   */
  static async commitProductImport(validProducts) {
    let importedCount = 0;
    for (const prod of validProducts) {
      try {
        await ProductService.createProduct(prod);
        importedCount++;
      } catch (err) {
        console.warn(`Error al importar fila ${prod.sku}:`, err);
      }
    }

    await auditLogger.log({
      action: 'PRODUCTS_IMPORTED_CSV',
      entity: 'Product',
      entityId: `[${importedCount} importados]`,
      notes: `Importación masiva completada: ${importedCount} productos creados.`
    });

    return { importedCount };
  }
}
