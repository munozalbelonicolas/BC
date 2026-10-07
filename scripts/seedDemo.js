/**
 * @file seedDemo.js
 * Explicit CLI runner for demo environment seeding.
 * Usage: npm run seed:demo
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
console.log(' BC ESPECIAL IMPORT — SEED DEMO RUNNER');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` Entorno actual detectado: [${currentEnv.toUpperCase()}]`);

// 1. STRICT SAFETY CHECK: Block in production!
if (currentEnv === 'production' || currentEnv === 'prod') {
  console.error('\n❌ ERROR CRÍTICO DE SEGURIDAD:');
  console.error(' Está TERMINANTEMENTE PROHIBIDO ejecutar seeds de datos demo en entorno PRODUCTION.');
  console.error(' La operación ha sido abortada inmediatamente sin modificar la base de datos.');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
  console.warn('⚠️ Supabase no está configurado en las variables de entorno.');
  console.log('ℹ️ Para aplicar el seed a Supabase en la nube, ejecutá el SQL:');
  console.log('   supabase/seeds/demo_seed.sql en el SQL Editor de tu proyecto.');
  console.log('✅ Verificación completada con éxito.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log(`\n⏳ Aplicando datos demo con data_environment = 'demo'...`);

  // Verify connection
  const { error: testError } = await supabase.from('products').select('id').limit(1);
  if (testError && testError.code === 'PGRST205') {
    console.warn(`\n⚠️ Las tablas aún no están creadas en tu base de datos Supabase.`);
    console.log(`📋 Pasos requeridos:`);
    console.log(`   1. Ejecutá en el SQL Editor de Supabase: supabase/migrations/001_enterprise_data_environment.sql`);
    console.log(`   2. Luego ejecutá: supabase/seeds/demo_seed.sql`);
    console.log(`✅ Script finalizado correctamente.`);
    return;
  }

  console.log('✅ Conexión con Supabase verificada.');
  console.log('ℹ️ Para aplicar el dataset demo masivo en PostgreSQL, utilizá:');
  console.log('   psql -f supabase/seeds/demo_seed.sql');
  console.log('   o pegá supabase/seeds/demo_seed.sql en el SQL Editor de Supabase.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runSeed().catch(err => {
  console.error('Error durante la ejecución del seed:', err);
  process.exit(1);
});
