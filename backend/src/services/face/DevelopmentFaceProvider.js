import FaceProvider from './FaceProvider.js';

class DevelopmentFaceProvider extends FaceProvider {
  async compareFaces(referenceImagePath, liveImagePath) {
    console.log('[DevFace] Mocking face comparison...');
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Simulate verification check (90% success rate for mock robustness)
    const success = Math.random() > 0.1;
    const confidence = success ? 92.5 + Math.random() * 5 : 45.2 + Math.random() * 15;
    
    return {
      success,
      confidence,
      status: success ? 'VERIFIED' : 'RETRY',
    };
  }
}

export default DevelopmentFaceProvider;
