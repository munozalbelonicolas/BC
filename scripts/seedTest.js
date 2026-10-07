/**
 * @file seedTest.js
 * Explicit CLI runner for isolated test fixtures.
 * Usage: npm run seed:test
 * STRICTLY FORBIDDEN IN PRODUCTION.
 */

import { environment } from '../src/core/environment.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' BC ESPECIAL IMPORT — SEED TEST RUNNER');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (environment.isProduction) {
  console.error('\n❌ ERROR CRÍTICO DE SEGURIDAD:');
  console.error(' Prohibido ejecutar seed:test en entorno PRODUCTION.');
  process.exit(1);
}

console.log('✅ Seed test verificado y listo para el runner de pruebas.');
