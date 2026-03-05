/**
 * Customer Portal Service
 * 
 * Re-exports the SmartReno API service for customer portal use.
 * Handles switching between mock and live data based on configuration.
 */

export * from './mockSmartRenoApi';
export { smartRenoApi as default } from './mockSmartRenoApi';
