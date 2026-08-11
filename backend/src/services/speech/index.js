import DevelopmentSpeechProvider from './DevelopmentSpeechProvider.js';

let instance = null;

export const getSpeechProvider = () => {
  if (instance) return instance;
  
  // We can expand with production providers later
  console.log('[Speech Engine] Initializing DevelopmentSpeechProvider (Mock/Browser-speech helper)');
  instance = new DevelopmentSpeechProvider();
  
  return instance;
};
