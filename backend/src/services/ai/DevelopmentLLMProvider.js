import LLMProvider from './LLMProvider.js';

const SKILL_KEYWORDS = [
  'React', 'React Native', 'Angular', 'Vue', 'Next.js', 'Redux', 'JavaScript', 'TypeScript',
  'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'jQuery',
  'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot',
  '.NET', 'ASP.NET', 'Laravel', 'Ruby on Rails', 'PHP',
  'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Kotlin', 'Swift', 'Scala', 'R',
  'MongoDB', 'MySQL', 'PostgreSQL', 'SQLite', 'Redis', 'Firebase', 'DynamoDB', 'Oracle', 'SQL Server',
  'REST', 'REST APIs', 'GraphQL', 'gRPC', 'Microservices', 'WebSockets',
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Postman',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Pandas', 'NumPy', 'Scikit-learn',
  'Data Structures', 'Algorithms', 'OOP', 'System Design', 'Agile', 'Scrum',
  'Linux', 'Unix', 'Bash', 'Shell Scripting',
  'Android', 'iOS', 'Flutter',
  'Selenium', 'Jest', 'Mocha', 'Cypress', 'JUnit',
];

function buildCandidateProfile(candidate) {
  const parsed = candidate?.resume?.parsed || {};
  const jobRole = candidate?.jobRole || {};
  const roleName = jobRole.name || 'Software Engineer';
  const roleRequiredSkills = Array.isArray(jobRole.requiredSkills) ? jobRole.requiredSkills : [];

  const verifiedResumeSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
  const verifiedResumeTechnologies = Array.isArray(parsed.technologies) ? parsed.technologies : [];

  const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
  const verifiedProjects = rawProjects
    .map((p) => p.replace(/^[-*•\s]+/, '').trim())
    .filter((p) => p && !/^(projects?|personal projects?|key projects?|project details?):?$/i.test(p));

  const verifiedEducation = Array.isArray(parsed.education) ? parsed.education : [];
  const verifiedExperience = Array.isArray(parsed.experience) ? parsed.experience : [];
  const verifiedCertifications = Array.isArray(parsed.certifications) ? parsed.certifications : [];

  return {
    candidateId: candidate?._id ? String(candidate._id) : 'unknown',
    candidateName: candidate?.name || 'Candidate',
    hasUploadedResume: Boolean(candidate?.resume?.text || verifiedResumeSkills.length),

    // VERIFIED CANDIDATE RESUME FACTS ONLY (NO ROLE MERGING)
    candidate: {
      skills: verifiedResumeSkills,
      technologies: verifiedResumeTechnologies,
      projects: verifiedProjects,
      experience: verifiedExperience,
      education: verifiedEducation,
      certifications: verifiedCertifications,
      experienceLevel: candidate?.experienceLevel || 'Fresher',
    },

    // SEPARATE TARGET JOB ROLE REQUIREMENTS
    jobRole: {
      name: roleName,
      requiredSkills: roleRequiredSkills,
      description: jobRole.description || '',
    },
  };
}

class DevelopmentLLMProvider extends LLMProvider {
  async analyzeResume(resumeText, jobRole) {
    console.log('[DevLLM] Analyzing resume text (word-boundary precision parser)...');

    const text = (resumeText || '').toString();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // Exact word-boundary matching so 'Go' does not match inside 'Django' or 'PostgreSQL',
    // 'R' does not match inside 'Docker', and 'C' does not match inside 'CSS'
    const foundSkills = SKILL_KEYWORDS.filter((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(text);
    });

    const skills = foundSkills.slice(0, 10);
    const technologies = foundSkills.length > 5 ? foundSkills.slice(5, 15) : foundSkills.slice(0, 5);

    // Project lines - ignore standalone headers
    const projectLines = lines.filter((l) => /project/i.test(l) && l.length < 140 && !/^(projects?|personal projects?|key projects?):?$/i.test(l.trim()));
    const projects = [...new Set(projectLines)].slice(0, 5);

    const educationLines = lines.filter((l) => /(bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|university|college|degree|diploma)/i.test(l) && l.length < 140);
    const education = [...new Set(educationLines)].slice(0, 3);

    const experienceLines = lines.filter((l) => /(intern|experience|years|worked as|developer at|engineer at)/i.test(l) && l.length < 160);
    const experience = [...new Set(experienceLines)].slice(0, 5);

    const certLines = lines.filter((l) => /(certified|certification|certificate)/i.test(l) && l.length < 140);
    const certifications = [...new Set(certLines)].slice(0, 5);

    const keywords = [
      ...(jobRole?.name ? [jobRole.name] : []),
      ...skills.slice(0, 5),
    ];

    return { skills, technologies, projects, education, experience, certifications, keywords };
  }

  async generateStrategy(candidateContext, templateConfig) {
    return {
      role: candidateContext.jobRoleName || 'Software Developer',
      duration: templateConfig.duration || 30,
      expectedSkillCoverage: candidateContext.skills || ['Technical Competency', 'Problem Solving', 'Architecture'],
      difficultyProgression: 'Adaptive: Escalate on strong answers, clarify on partial, switch on weak',
      mandatoryQuestionsCount: templateConfig.mandatoryQuestions?.length || 0,
      questionBankCoverage: 'Resume-grounded dynamic questions',
      estimatedQuestionCount: 8,
      scoringWeightages: templateConfig.weights || { technical: 40, resume: 20, problemSolving: 20, communication: 20 },
      mustCoverCompetencies: ['Technical knowledge', 'Problem Solving', 'Communication'],
      estimatedTopicDistribution: { Core: '40%', Architecture: '30%', General: '30%' },
    };
  }

  async selectNextQuestion(session, candidate, checkpoint) {
    const profile = buildCandidateProfile(candidate);
    const questionIndex = (session.qa || []).length;
    const { candidateName } = profile;
    const { skills, projects } = profile.candidate;
    const { name: roleName, requiredSkills } = profile.jobRole;

    console.log(`[DevLLM] [RESUME AUDIT] Candidate: ${candidateName} (${profile.candidateId}) | Verified Resume Skills: [${skills.join(', ')}] | Verified Projects: [${projects.join(', ')}] | Role: ${roleName}`);

    const lastQA = session.qa && session.qa.length > 0 ? session.qa[session.qa.length - 1] : null;
    const lastScore = lastQA?.scores?.technical ?? 70;

    // Question 0: Grounded opening question using ONLY verified candidate resume facts
    if (questionIndex === 0) {
      if (projects.length > 0 && skills.length > 0) {
        return {
          question: `Hello ${candidateName}, welcome. Your resume highlights your work on "${projects[0]}" using ${skills.slice(0, 2).join(' and ')}. What were your core technical contributions and architectural decisions on this project?`,
          category: 'resume',
          topic: `${projects[0]} Architecture`,
          difficulty: '2',
        };
      }
      if (skills.length > 0) {
        return {
          question: `Hello ${candidateName}, welcome. Your profile highlights verified hands-on experience in ${skills.slice(0, 3).join(', ')}. How have you applied ${skills[0]} to solve complex technical challenges in your projects?`,
          category: 'resume',
          topic: `${skills[0]} Expertise`,
          difficulty: '2',
        };
      }
      // If NO resume uploaded, ask about job-role requirements WITHOUT claiming candidate has hands-on experience
      const roleSkillRef = requiredSkills.length > 0 ? requiredSkills[0] : 'software architecture';
      return {
        question: `Hello ${candidateName}, welcome to your ${roleName} technical interview. This role involves ${roleSkillRef}. Could you share your overall approach to designing scalable ${roleName} systems?`,
        category: 'resume',
        topic: `${roleName} Competency`,
        difficulty: '2',
      };
    }

    // Question 1: Project Deep-Dive or Second Verified Skill
    if (questionIndex === 1) {
      if (projects.length > 0) {
        return {
          question: `Regarding "${projects[0]}", what major performance bottlenecks or architectural trade-offs did you encounter during implementation, and how did you resolve them?`,
          category: 'resume',
          topic: `${projects[0]} Deep Dive`,
          difficulty: '3',
        };
      }
      const primarySkill = skills[0] || (requiredSkills[0] || roleName);
      return {
        question: `Focusing on ${primarySkill}, how do you structure applications to ensure maintainability, scalability, and clean code principles?`,
        category: 'technical',
        topic: `${primarySkill} Architecture`,
        difficulty: '3',
      };
    }

    // Question 2+: Adaptive Branching based on Previous Evaluated Answer
    if (lastQA && lastScore >= 75) {
      const topicSkill = (skills.length > 0 ? skills[(questionIndex - 1) % skills.length] : (requiredSkills[0] || 'System Design'));
      return {
        question: `Building on your previous strong answer regarding ${topicSkill}, how would you approach optimizing performance and handling high-concurrency throughput in production?`,
        category: 'technical',
        topic: `${topicSkill} Optimization`,
        difficulty: '4',
      };
    }

    if (lastQA && lastScore >= 40 && lastScore < 75) {
      const topicSkill = (skills.length > 0 ? skills[(questionIndex - 1) % skills.length] : (requiredSkills[0] || 'Technical Design'));
      return {
        question: `To follow up on your previous response regarding ${topicSkill}, what specific design patterns or error-handling strategies do you implement to prevent production failures?`,
        category: 'technical',
        topic: `${topicSkill} Patterns`,
        difficulty: '3',
      };
    }

    // Weak / Not Answered (< 40): Switch to another verified skill from candidate's resume
    const fallbackSkill = (skills.length > 0 ? skills[questionIndex % skills.length] : (requiredSkills[0] || 'Core Software Engineering'));
    return {
      question: `Let's discuss ${fallbackSkill}. Can you explain the fundamental principles of ${fallbackSkill} and share a practical example of how it is applied?`,
      category: 'technical',
      topic: `${fallbackSkill} Fundamentals`,
      difficulty: '2',
    };
  }

  async generateQuestion(promptText) {
    return 'Could you describe a technical problem you solved recently and explain your step-by-step approach?';
  }

  async evaluateAnswer(question, answer, expectedCompetency) {
    console.log('[DevLLM] Evaluating answer deterministically...');
    const trimmed = (answer || '').trim();
    const textLen = trimmed.length;
    const lowerAns = trimmed.toLowerCase();

    const isIDontKnow = /(don't know|do not know|not sure|no idea|haven't worked|no experience|can't recall|cannot recall)/i.test(lowerAns);
    if (!trimmed || textLen < 15 || isIDontKnow) {
      return {
        scores: { technical: 15, resume: 20, problemSolving: 10, hr: 30, aptitude: 20, communication: 30 },
        classification: 'NOT_ANSWERED',
        reasoning: 'Candidate explicitly indicated lack of knowledge or provided an insufficient response to the question.',
        feedback: 'Candidate was unable to answer the question directly. Review core concepts in this topic.',
        strengths: [],
        weaknesses: ['Demonstrated lack of familiarity with the requested technical concept'],
        missingPoints: ['Core definition and implementation details'],
      };
    }

    let baseScore = 60;
    if (textLen > 80) baseScore += 15;
    if (textLen > 200) baseScore += 10;
    if (/(because|therefore|for example|instance|approach|strategy|solution|architecture|design|pattern|optimization)/i.test(lowerAns)) {
      baseScore += 10;
    }

    const finalScore = Math.min(95, Math.max(25, baseScore));
    let classification = 'CORRECT';
    if (finalScore < 50) classification = 'INCORRECT';
    else if (finalScore < 75) classification = 'PARTIALLY_CORRECT';

    return {
      scores: {
        technical: finalScore,
        resume: Math.min(100, finalScore + 5),
        problemSolving: Math.max(10, finalScore - 5),
        hr: 75,
        aptitude: finalScore,
        communication: Math.min(100, Math.max(40, textLen > 50 ? 80 : 50)),
      },
      classification,
      reasoning: `Candidate provided a ${classification.toLowerCase().replace('_', ' ')} response containing ${textLen} characters. Explained core principles with structured reasoning.`,
      feedback: finalScore >= 75
        ? 'Strong technical explanation with clear architectural understanding.'
        : 'Good effort. Could be improved by detailing specific production constraints and trade-offs.',
      strengths: ['Addressed the core topic', 'Clear verbal delivery'],
      weaknesses: finalScore < 75 ? ['Could provide deeper technical implementation details'] : [],
      missingPoints: finalScore < 75 ? ['Advanced trade-offs analysis'] : [],
    };
  }

  async decideFollowUp(question, answer, evaluation) {
    const techScore = evaluation?.scores?.technical ?? 70;
    if (techScore >= 50 && techScore < 75) {
      return {
        shouldFollowUp: true,
        question: `Could you elaborate on the key trade-offs and performance implications of the approach you just described?`,
        reason: 'Candidate provided a partial answer; requesting deeper trade-off analysis.',
      };
    }
    return { shouldFollowUp: false };
  }

  async generateFinalReport(session, candidate) {
    const qaList = session.qa || [];
    let totalScore = 0;
    let answeredCount = 0;

    qaList.forEach((q) => {
      if (q.scores?.technical !== undefined) {
        totalScore += q.scores.technical;
        answeredCount++;
      }
    });

    const avgScore = answeredCount > 0 ? Math.round(totalScore / answeredCount) : (session.scores?.overall || 50);

    let recommendation = 'RECOMMENDED';
    if (avgScore >= 85) recommendation = 'STRONGLY_RECOMMENDED';
    else if (avgScore < 50) recommendation = 'NOT_RECOMMENDED';
    else if (avgScore < 65) recommendation = 'NEEDS_REVIEW';

    return {
      summary: `Candidate completed ${qaList.length} interview questions for the ${candidate?.jobRole?.name || 'assigned'} role. Demonstrated an overall average score of ${avgScore}/100.`,
      strengths: [
        'Demonstrated understanding of core technical concepts',
        'Communicated responses clearly and logically',
        'Structured resume experience aligned with job role',
      ],
      weaknesses: avgScore < 75 ? [
        'Could provide deeper architectural trade-off analysis under high scale constraints'
      ] : ['Minor technical areas for further production experience'],
      recommendation,
    };
  }

  async generateBatchSummary(candidates, role) {
    return {
      candidatesInterviewed: candidates.length,
      completionRate: 100,
      averageScores: { technical: 75, communication: 75, overall: 75 },
      commonStrengths: ['Good understanding of core engineering principles'],
      commonSkillGaps: ['Deep system architecture optimization under heavy scale'],
      integrityDistribution: { LowRisk: candidates.length },
      templateEffectiveness: 'High. Assessed all critical competencies accurately.',
      candidatesRequiringManualReview: 0,
    };
  }
}

export default DevelopmentLLMProvider;
export { buildCandidateProfile };
