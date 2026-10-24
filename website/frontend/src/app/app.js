/**
 * Astro Jyotish Main Application Orchestrator
 * Modular ES-module wrapper connecting components, state, and controllers.
 */

export const getAppInstance = () => {
  return window.App || (typeof App !== 'undefined' ? App : null);
};

export default getAppInstance;
