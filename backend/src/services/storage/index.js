import LocalStorageProvider from './LocalStorageProvider.js';

let instance = null;

export const getStorageProvider = () => {
  if (instance) return instance;
  
  console.log('[Storage Engine] Initializing LocalStorageProvider');
  instance = new LocalStorageProvider();
  
  return instance;
};
