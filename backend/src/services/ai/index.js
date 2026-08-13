import DevelopmentLLMProvider from './DevelopmentLLMProvider.js';
import RealLLMProvider from './RealLLMProvider.js';

let instance = null;

export const getLLMProvider = () => {
  if (instance) return instance;

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  const providerType = process.env.AI_PROVIDER || (apiKey ? 'real' : 'development');
  const modelName = process.env.AI_MODEL || process.env.OPENAI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if ((providerType === 'real' || apiKey) && apiKey) {
    console.log(`[AI Engine] Initializing RealLLMProvider with model ${modelName}`);
    instance = new RealLLMProvider(apiKey, modelName);
  } else {
    console.log('[AI Engine] Initializing DevelopmentLLMProvider (Offline Resume-Grounded Engine)');
    instance = new DevelopmentLLMProvider();
  }

  return instance;
};
