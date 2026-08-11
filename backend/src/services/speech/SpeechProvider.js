class SpeechProvider {
  async speechToText(audioBuffer, language = 'en') {
    throw new Error('Not implemented');
  }

  async textToSpeech(text, voice = 'default') {
    throw new Error('Not implemented');
  }
}

export default SpeechProvider;
