import LLMProvider from './LLMProvider.js';
import { buildCandidateProfile } from './DevelopmentLLMProvider.js';

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
    console.log('[RealLLM] Analyzing resume with Gemini AI...');
    const prompt = `
      You are an expert AI Resume Analyzer. Given the following resume text and targeted job role, extract key candidate details.
      Do NOT invent or hallucinate skills, projects, or experience that are not present in the text.
      
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
      You are an AI Interview Strategist. Based on the candidate profile and template configuration, generate an adaptive interview roadmap.
      
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
    const profile = buildCandidateProfile(candidate);
    const previousQA = session.qa || [];
    const lastQA = previousQA.length > 0 ? previousQA[previousQA.length - 1] : null;

    console.log(`[RealLLM] Dynamically generating candidate-specific question for ${profile.candidateName} (${profile.candidateId})...`);

    const prompt = `
      You are an adaptive AI Interviewer conducting a resume-grounded technical interview for Candidate "${profile.candidateName}" applying for the Job Role "${profile.jobRole.name}".
      
      CRITICAL DATA SEPARATION RULES:
      1. VERIFIED CANDIDATE RESUME FACTS (ONLY THIS REPRESENTS THE CANDIDATE'S EXPERIENCE):
         - Verified Candidate Skills: ${JSON.stringify(profile.candidate.skills)}
         - Verified Candidate Technologies: ${JSON.stringify(profile.candidate.technologies)}
         - Verified Candidate Projects: ${JSON.stringify(profile.candidate.projects)}
         - Raw Resume Excerpt: ${(candidate?.resume?.text || '').slice(0, 1500)}

      2. TARGET JOB ROLE REQUIREMENTS (SEPARATE SOURCE - NOT CANDIDATE EXPERIENCE):
         - Target Role Name: ${profile.jobRole.name}
         - Role Required Skills: ${JSON.stringify(profile.jobRole.requiredSkills)}

      STRICT ZERO-HALLUCINATION INSTRUCTIONS:
      - NEVER claim that the candidate has experience, expertise, knowledge, or projects with a technology UNLESS that technology appears in the VERIFIED CANDIDATE RESUME FACTS list above.
      - Role Required Skills are NOT candidate skills. Do not phrase questions as "You have experience with X" unless X is in the Verified Candidate Resume Facts.
      - For Candidate Opening Question (Question 1): Address Candidate "${profile.candidateName}" by name and ask a personalized technical question referencing their verified projects (${JSON.stringify(profile.candidate.projects)}) or verified skills (${JSON.stringify(profile.candidate.skills)}).
      - ADAPTIVE BRANCHING:
         - If last answer score >= 75 (Strong): Escalate to a deeper technical/architectural question on the topic.
         - If last answer score 40-74 (Partial): Ask a practical implementation or trade-off question.
         - If last answer score < 40 / NOT_ANSWERED: Switch to another verified skill from candidate profile.
      - DO NOT repeat questions or topics already asked.

      Previous Asked Questions & Evaluated Answers: ${JSON.stringify(previousQA)}
      Topics Covered: ${JSON.stringify(checkpoint?.topicCoverage || [])}
      Adaptive Difficulty Level (1-5): ${checkpoint?.difficulty || '3'}
      Last QA Result: ${JSON.stringify(lastQA ? { question: lastQA.question, answer: lastQA.answer, scores: lastQA.scores } : null)}
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
    return this._callGemini(promptText);
  }

  async evaluateAnswer(question, answer, expectedCompetency) {
    console.log('[RealLLM] Evaluating answer strictly against question & expected concepts...');
    const prompt = `
      Evaluate the candidate's answer strictly against the question asked.
      
      Question: "${question}"
      Candidate Answer Transcript: "${answer}"
      Expected Competency Domain: ${expectedCompetency || 'Technical proficiency'}

      RULES:
      1. Evaluate relevance: Did the candidate answer the actual question?
      2. If candidate says "I don't know", "no idea", "not sure", or gives empty/irrelevant response, score 0-15 and classify as NOT_ANSWERED or INCORRECT.
      3. Do NOT penalize valid alternative explanations or technical approaches.
      4. Rate scores from 0 to 100 for each dimension.
      5. Provide classification: CORRECT, PARTIALLY_CORRECT, INCORRECT, or NOT_ANSWERED.
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
      classification: 'CORRECT | PARTIALLY_CORRECT | INCORRECT | NOT_ANSWERED',
      reasoning: 'string',
      feedback: 'string',
      strengths: ['string'],
      weaknesses: ['string'],
      missingPoints: ['string'],
    };

    return this._callGemini(prompt, schema);
  }

  async decideFollowUp(question, answer, evaluation) {
    const prompt = `
      Based on question: "${question}", answer: "${answer}", and scores: ${JSON.stringify(evaluation.scores)},
      determine if a follow-up question is needed to clarify or probe deeper.
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
