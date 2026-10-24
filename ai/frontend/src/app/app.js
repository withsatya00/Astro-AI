/**
 * AI Consultation Main Application Coordinator
 */

export const getAIAppInstance = () => {
  return window.ChatController || (typeof ChatController !== 'undefined' ? ChatController : null);
};

export default getAIAppInstance;
