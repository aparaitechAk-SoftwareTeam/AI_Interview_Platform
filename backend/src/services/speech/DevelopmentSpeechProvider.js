import SpeechProvider from './SpeechProvider.js';

class DevelopmentSpeechProvider extends SpeechProvider {
  async speechToText(audioBuffer, language = 'en') {
    console.log('[DevSpeech] Mocking speechToText translation...');
    // Simulate speech-to-text processing time
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    // We return a mock transcript that makes sense for testing
    const mockTranscripts = [
      "I have worked with React for about two years now, building custom hooks and reusable UI components.",
      "State represents local data that changes inside a component, while props are configuration options passed down from parents.",
      "The virtual DOM is an in-memory representation of real DOM elements, allowing efficient diffing and batch rendering.",
      "I would typically use the Context API for lightweight global state, and Redux if there is a high frequency of state updates.",
      "To debug memory leaks in React, I profile the memory heap using Chrome DevTools and clean up event listeners inside useEffect.",
      "Node.js runs an event loop that offloads blocking file and network operations to background worker threads.",
      "I always prioritize constructive collaboration, listening to opposing technical trade-offs, and building consensus.",
      "Yes, I would love to know how your engineering team prioritizes technical debt versus new features."
    ];

    const randomIndex = Math.floor(Math.random() * mockTranscripts.length);
    return mockTranscripts[randomIndex];
  }

  async textToSpeech(text, voice = 'default') {
    console.log('[DevSpeech] Mocking textToSpeech synthesis...');
    // In dev, the client-side browser SpeechSynthesis handles the audio playback.
    // So the server can just return a mock response or empty audio link.
    return {
      audioPath: '',
      voiceUsed: voice,
      format: 'mp3',
    };
  }
}

export default DevelopmentSpeechProvider;
