import DevelopmentLLMProvider from './DevelopmentLLMProvider.js';
import RealLLMProvider from './RealLLMProvider.js';

let instance = null;

export const getLLMProvider = () => {
  if (instance) return instance;

  const providerType = process.env.AI_PROVIDER || 'development';
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const modelName = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gemini-2.5-flash';

  if (providerType === 'real' && apiKey) {
    console.log(`[AI Engine] Initializing RealLLMProvider with model ${modelName}`);
    instance = new RealLLMProvider(apiKey, modelName);
  } else {
    console.log('[AI Engine] Initializing DevelopmentLLMProvider (Mock Fallback)');
    instance = new DevelopmentLLMProvider();
  }

  return instance;
};
