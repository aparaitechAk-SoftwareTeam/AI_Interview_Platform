class LLMProvider {
  async analyzeResume(resumeText, jobRole) {
    throw new Error('Not implemented');
  }
  async generateStrategy(candidateContext, templateConfig) {
    throw new Error('Not implemented');
  }
  async selectNextQuestion(session, candidate, checkpoint) {
    throw new Error('Not implemented');
  }
  async generateQuestion(promptText) {
    throw new Error('Not implemented');
  }
  async evaluateAnswer(question, answer, expectedCompetency) {
    throw new Error('Not implemented');
  }
  async decideFollowUp(question, answer, evaluation) {
    throw new Error('Not implemented');
  }
  async generateFinalReport(session, candidate) {
    throw new Error('Not implemented');
  }
  async generateBatchSummary(candidates, role) {
    throw new Error('Not implemented');
  }
}

export default LLMProvider;
