import DevelopmentFaceProvider from './DevelopmentFaceProvider.js';

let instance = null;

export const getFaceProvider = () => {
  if (instance) return instance;
  
  console.log('[Face Engine] Initializing DevelopmentFaceProvider');
  instance = new DevelopmentFaceProvider();
  
  return instance;
};
