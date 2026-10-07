/**
 * @file clearDemo.js
 * Explicit CLI runner to safely purge ONLY demo records.
 * Usage: npm run clear:demo
 * STRICTLY FORBIDDEN IN PRODUCTION.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Parse .env if present
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      const key = k.trim();
      if (key && v.length && !process.env[key]) {
        process.env[key] = v.join('=').trim();
      }
    }
  });
}

const currentEnv = (process.env.VITE_APP_ENV || process.env.APP_ENV || 'development').toLowerCase();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' BC ESPECIAL IMPORT — CLEAR DEMO DATA RUNNER');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` Entorno actual detectado: [${currentEnv.toUpperCase()}]`);

// 1. STRICT SAFETY CHECK: Block in production!
if (currentEnv === 'production' || currentEnv === 'prod') {
  console.error('\n❌ ERROR CRÍTICO DE SEGURIDAD:');
  console.error(' Está TERMINANTEMENTE PROHIBIDO ejecutar clear:demo en entorno PRODUCTION.');
  console.error(' La operación ha sido abortada inmediatamente.');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
  console.warn('⚠️ Supabase no está configurado en las variables de entorno.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES_TO_CLEAR = [
  'payment_transactions',
  'inventory_movements',
  'orders',
  'customers',
  'products',
  'categories',
  'brands',
  'coupons',
  'promotions',
  'faqs',
  'testimonials'
];

async function runClear() {
  console.log(`\n⏳ Purgando ÚNICAMENTE registros con data_environment = 'demo'...`);

  for (const table of TABLES_TO_CLEAR) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('data_environment', 'demo');

      if (error && error.code !== 'PGRST205') {
        console.warn(`  - Tabla ${table}: advertencia: ${error.message}`);
      } else {
        console.log(`  ✓ Tabla ${table}: limpiados registros demo`);
      }
    } catch (err) {
      console.warn(`  - Tabla ${table}: no pudo ser limpiada: ${err.message}`);
    }
  }

  console.log('\n✅ Limpieza de datos demo completada con éxito.');
  console.log(' Los datos productivos (data_environment = "production") se mantuvieron intactos.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runClear().catch(err => {
  console.error('Error durante la purga demo:', err);
  process.exit(1);
});
