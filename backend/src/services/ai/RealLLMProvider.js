import LLMProvider from './LLMProvider.js';

class RealLLMProvider extends LLMProvider {
  constructor(apiKey, modelName) {
    super();
    this.apiKey = apiKey;
    this.modelName = modelName || 'gemini-2.5-flash';
  }

  async _callGemini(promptText, responseJsonSchema = null) {
    if (!this.apiKey) {
      throw new Error('AI_API_KEY is not configured.');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
    };

    if (responseJsonSchema) {
      payload.generationConfig = {
        responseMimeType: 'application/json',
      };
      // Include schema instructions in the prompt as fallback
      payload.contents[0].parts[0].text += `\n\nReturn the output STRICTLY in JSON format following this schema structure:\n${JSON.stringify(responseJsonSchema, null, 2)}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Empty response from Gemini API');
      }

      if (responseJsonSchema) {
        // Clean markdown tags like ```json ... ``` if Gemini returned them
        const cleaned = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(cleaned);
      }
      return textResponse;
    } catch (error) {
      console.error('[RealLLM] API call failed:', error);
      throw error;
    }
  }

  async analyzeResume(resumeText, jobRole) {
    console.log('[RealLLM] Analyzing resume...');
    const prompt = `
      You are an expert AI Resume Analyzer. Given the following resume text and the targeted job role details, extract key professional profiles.
      
      Job Role targeted: ${JSON.stringify(jobRole)}
      Resume Text:
      ${resumeText}
    `;

    const schema = {
      skills: ['string'],
      technologies: ['string'],
      projects: ['string'],
      education: ['string'],
      experience: ['string'],
      certifications: ['string'],
      keywords: ['string'],
    };

    return this._callGemini(prompt, schema);
  }

  async generateStrategy(candidateContext, templateConfig) {
    console.log('[RealLLM] Generating interview strategy...');
    const prompt = `
      You are an AI Interview Strategist. Based on the candidate profile and the interview template configuration, generate the interview roadmap.
      
      Candidate details: ${JSON.stringify(candidateContext)}
      Template config: ${JSON.stringify(templateConfig)}
    `;

    const schema = {
      role: 'string',
      duration: 30,
      expectedSkillCoverage: ['string'],
      difficultyProgression: 'string',
      mandatoryQuestionsCount: 0,
      questionBankCoverage: 'string',
      estimatedQuestionCount: 0,
      scoringWeightages: {
        technical: 40,
        resume: 20,
        problemSolving: 15,
        hr: 10,
        aptitude: 10,
        communication: 5,
      },
      mustCoverCompetencies: ['string'],
      estimatedTopicDistribution: {},
    };

    return this._callGemini(prompt, schema);
  }

  async selectNextQuestion(session, candidate, checkpoint) {
    console.log('[RealLLM] Dynamically determining next question...');
    const resumeProfile = candidate?.resume?.parsed || null;
    const prompt = `
      You are an adaptive AI Interviewer conducting a resume-based interview.
      This question MUST be grounded in the candidate's actual resume content below —
      do not ask generic questions that could apply to any candidate. Reference specific
      skills, technologies, or projects from their resume, and never repeat a topic already covered.

      Candidate name: ${candidate?.name || 'Candidate'}
      Job role applied for: ${candidate?.jobRole?.name || 'N/A'}
      Candidate resume analysis (skills/technologies/projects/experience extracted from their uploaded resume): ${JSON.stringify(resumeProfile)}
      Raw resume text excerpt (first 2000 chars): ${(candidate?.resume?.text || '').slice(0, 2000)}

      History of questions already asked and the candidate's answers so far: ${JSON.stringify(session.qa)}
      Topics already covered (do NOT repeat these): ${JSON.stringify(checkpoint?.topicCoverage || [])}
      Current adaptive difficulty level: ${checkpoint?.difficulty || '3'}

      If the resume analysis has no usable skills/projects, fall back to a general but role-relevant question.
    `;

    const schema = {
      question: 'string',
      category: 'technical | resume | problemSolving | hr | aptitude | communication',
      topic: 'string',
      difficulty: '1 | 2 | 3 | 4 | 5',
    };

    return this._callGemini(prompt, schema);
  }

  async generateQuestion(promptText) {
    console.log('[RealLLM] Generating custom question...');
    return this._callGemini(promptText);
  }

  async evaluateAnswer(question, answer, expectedCompetency) {
    console.log('[RealLLM] Evaluating answer...');
    const prompt = `
      Evaluate the candidate's answer to the given question.
      Question: ${question}
      Answer: ${answer}
      Expected Competency details: ${expectedCompetency || 'General technical proficiency'}
      
      Score categories should be rated from 0 to 100. Provide clear, constructive evaluation.
    `;

    const schema = {
      scores: {
        technical: 0,
        resume: 0,
        problemSolving: 0,
        hr: 0,
        aptitude: 0,
        communication: 0,
      },
      reasoning: 'string',
      feedback: 'string',
    };

    return this._callGemini(prompt, schema);
  }

  async decideFollowUp(question, answer, evaluation) {
    console.log('[RealLLM] Deciding if follow-up is required...');
    const prompt = `
      Based on the candidate's response to: "${question}" and the transcription: "${answer}" (with evaluation scores: ${JSON.stringify(evaluation.scores)}),
      determine if we should ask a contextual follow-up question to dig deeper or if we can proceed to the next topic.
    `;

    const schema = {
      shouldFollowUp: false,
      question: 'string',
      reason: 'string',
    };

    return this._callGemini(prompt, schema);
  }

  async generateFinalReport(session, candidate) {
    console.log('[RealLLM] Generating final interview report...');
    const prompt = `
      Generate a comprehensive performance evaluation report for this completed interview session.
      Candidate details: ${JSON.stringify(candidate)}
      All Q&As: ${JSON.stringify(session.qa)}
      Aggregated scores: ${JSON.stringify(session.scores)}
    `;

    const schema = {
      summary: 'string',
      strengths: ['string'],
      weaknesses: ['string'],
      recommendation: 'STRONGLY_RECOMMENDED | RECOMMENDED | CONSIDER | NEEDS_REVIEW | NOT_RECOMMENDED',
    };

    return this._callGemini(prompt, schema);
  }

  async generateBatchSummary(candidates, role) {
    console.log('[RealLLM] Generating cohort hiring summary...');
    const prompt = `
      Provide a high-level summary of the cohort's performance for the Role: ${role}.
      Candidates data list: ${JSON.stringify(candidates)}
    `;

    const schema = {
      candidatesInterviewed: 0,
      completionRate: 100,
      averageScores: { technical: 0, communication: 0, overall: 0 },
      commonStrengths: ['string'],
      commonSkillGaps: ['string'],
      integrityDistribution: {},
      templateEffectiveness: 'string',
      candidatesRequiringManualReview: 0,
    };

    return this._callGemini(prompt, schema);
  }
}

export default RealLLMProvider;
