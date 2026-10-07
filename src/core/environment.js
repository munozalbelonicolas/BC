/**
 * @file environment.js
 * Centralized environment configuration and single source of truth for runtime mode.
 * Segregates: DEVELOPMENT, DEMO, TEST, PRODUCTION.
 */

export const ENV_TYPES = Object.freeze({
  DEVELOPMENT: 'development',
  DEMO: 'demo',
  TEST: 'test',
  PRODUCTION: 'production'
});

/**
 * Resolve current environment from runtime context (Vite import.meta.env or Node process.env)
 * @returns {'development'|'demo'|'test'|'production'}
 */
export function resolveCurrentEnvironment() {
  // 1. Check Vite environment variable
  let envVal = null;
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envVal = import.meta.env.VITE_APP_ENV || import.meta.env.APP_ENV;
    if (!envVal && import.meta.env.PROD) {
      envVal = ENV_TYPES.PRODUCTION;
    }
  }

  // 2. Fallback to process.env in Node / CLI / Test runners
  if (!envVal && typeof process !== 'undefined' && process.env) {
    envVal = process.env.VITE_APP_ENV || process.env.APP_ENV || process.env.NODE_ENV;
  }

  const normalized = (envVal || '').trim().toLowerCase();

  if (normalized === 'production' || normalized === 'prod') return ENV_TYPES.PRODUCTION;
  if (normalized === 'demo') return ENV_TYPES.DEMO;
  if (normalized === 'test') return ENV_TYPES.TEST;
  return ENV_TYPES.DEVELOPMENT;
}

class EnvironmentManager {
  constructor() {
    this._override = null;
  }

  /**
   * For automated testing: allow safe temporary environment override
   * @param {'development'|'demo'|'test'|'production'|null} env
   */
  setOverride(env) {
    this._override = env ? env.toLowerCase() : null;
  }

  get current() {
    return this._override || resolveCurrentEnvironment();
  }

  get isProduction() {
    return this.current === ENV_TYPES.PRODUCTION;
  }

  get isDemo() {
    return this.current === ENV_TYPES.DEMO;
  }

  get isTest() {
    return this.current === ENV_TYPES.TEST;
  }

  get isDevelopment() {
    return this.current === ENV_TYPES.DEVELOPMENT;
  }

  /**
   * Data partition tag for database queries and writes
   */
  get dataEnvironment() {
    return this.current;
  }

  /**
   * Strict guard preventing demo or test mutations in production
   * @param {string} operation
   */
  assertNotProduction(operation = 'Operación') {
    if (this.isProduction) {
      throw new Error(`[SEGURIDAD AMBIENTAL] Prohibido ejecutar ${operation} en entorno PRODUCTION.`);
    }
  }
}

export const environment = new EnvironmentManager();
export const getCurrentEnvironment = () => environment.current;
export const getDataEnvironment = () => environment.dataEnvironment;
export const isProduction = () => environment.isProduction;
export const isDemo = () => environment.isDemo;
export const assertNotProduction = (op) => environment.assertNotProduction(op);
