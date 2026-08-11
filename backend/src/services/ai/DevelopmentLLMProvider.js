import LLMProvider from './LLMProvider.js';

// Known skill/technology keywords the lightweight offline analyzer looks for inside
// the actual extracted resume text. This lets the Development (no paid AI key)
// provider still produce a per-candidate, resume-driven profile instead of a fixed
// hardcoded one, so two different resumes generate two different results.
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

class DevelopmentLLMProvider extends LLMProvider {
  async analyzeResume(resumeText, jobRole) {
    console.log('[DevLLM] Analyzing resume text (offline heuristic analyzer)...');
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const text = (resumeText || '').toString();
    const lowerText = text.toLowerCase();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // 1. Skills / technologies actually found in this resume's text
    const foundSkills = SKILL_KEYWORDS.filter((kw) => lowerText.includes(kw.toLowerCase()));
    const skills = foundSkills.slice(0, 10);
    const technologies = foundSkills.slice(10, 20).length ? foundSkills.slice(10, 20) : foundSkills.slice(0, 6);

    // 2. Project lines - lines that mention "project" or look like a bullet/title under a Projects section
    const projectLines = lines.filter((l) => /project/i.test(l) && l.length < 140);
    const projects = [...new Set(projectLines)].slice(0, 5);

    // 3. Education lines
    const educationLines = lines.filter((l) => /(bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|university|college|degree|diploma)/i.test(l) && l.length < 140);
    const education = [...new Set(educationLines)].slice(0, 3);

    // 4. Experience lines
    const experienceLines = lines.filter((l) => /(intern|experience|years|worked as|developer at|engineer at)/i.test(l) && l.length < 160);
    const experience = [...new Set(experienceLines)].slice(0, 5);

    // 5. Certifications
    const certLines = lines.filter((l) => /(certified|certification|certificate)/i.test(l) && l.length < 140);
    const certifications = [...new Set(certLines)].slice(0, 5);

    // 6. Keywords - a mix of role name + top skills, used as generic tags
    const keywords = [
      ...(jobRole?.name ? [jobRole.name] : []),
      ...skills.slice(0, 5),
    ];

    // Sensible fallback ONLY if truly nothing could be detected in the text,
    // so the interview still has something concrete to ask about, but this
    // fallback still varies with the resume length/content, not a fixed list.
    if (skills.length === 0 && projects.length === 0 && experience.length === 0) {
      return {
        skills: [],
        technologies: [],
        projects: [],
        education,
        experience: experience.length ? experience : ['Not clearly specified in uploaded resume'],
        certifications,
        keywords: keywords.length ? keywords : ['general'],
      };
    }

    return { skills, technologies, projects, education, experience, certifications, keywords };
  }

  async generateStrategy(candidateContext, templateConfig) {
    console.log('[DevLLM] Mocking generateStrategy...');
    return {
      role: candidateContext.jobRoleName || 'Frontend Developer',
      duration: templateConfig.duration || 30,
      expectedSkillCoverage: ['React Hooks', 'State Management', 'REST API integration', 'Component Lifecycle'],
      difficultyProgression: 'Starts at Beginner, escalates on correct answers, caps at Expert',
      mandatoryQuestionsCount: templateConfig.mandatoryQuestions?.length || 0,
      questionBankCoverage: 'Will pull 2-3 questions from Question Bank dynamically',
      estimatedQuestionCount: 10,
      scoringWeightages: templateConfig.weights || { technical: 40, communication: 10, HR: 10 },
      mustCoverCompetencies: ['Technical knowledge', 'Problem Solving', 'Communication'],
      estimatedTopicDistribution: { React: '40%', Node: '30%', General: '30%' },
    };
  }

  async selectNextQuestion(session, candidate, checkpoint) {
    console.log('[DevLLM] Selecting next question from candidate resume profile...');
    const questionIndex = session.qa.length;
    const parsed = candidate?.resume?.parsed || {};
    const skills = (parsed.skills && parsed.skills.length ? parsed.skills : parsed.technologies) || [];
    const projects = parsed.projects || [];
    const roleName = candidate?.jobRole?.name || 'this role';
    const alreadyAskedTopics = new Set((session.qa || []).map((q) => q.topic));

    const questionsList = [];

    // Q0: Resume walkthrough / intro — always resume-grounded
    questionsList.push({
      question: skills.length
        ? `I can see from your resume that you've worked with ${skills.slice(0, 3).join(', ')}. Could you walk me through your experience and how you've applied these in real projects?`
        : `Could you walk me through your resume and highlight the experience most relevant to the ${roleName} role?`,
      category: 'resume',
      topic: 'Resume Walkthrough',
      difficulty: '2',
    });

    // Q1: Project deep-dive — pulled straight from the parsed resume projects
    questionsList.push({
      question: projects.length
        ? `Tell me more about "${projects[0]}". What was your specific contribution, and what technical challenges did you face?`
        : `Tell me about a project from your resume that you're most proud of, and what technical challenges you faced.`,
      category: 'resume',
      topic: 'Project Deep Dive',
      difficulty: '3',
    });

    // Q2-Q4: Skill-specific technical questions, one per detected skill (cycled)
    const skillQuestionTemplates = (skill) => [
      `Explain the core concepts of ${skill} and describe a real scenario from your experience where you used it effectively.`,
      `What are some common pitfalls or performance issues you've encountered while working with ${skill}, and how did you resolve them?`,
      `How would you explain ${skill} to a junior developer, and what best practices do you follow when using it?`,
    ];

    if (skills.length) {
      for (let i = 0; i < Math.min(3, skills.length); i++) {
        const skill = skills[i % skills.length];
        const templates = skillQuestionTemplates(skill);
        const template = templates[i % templates.length];
        questionsList.push({
          question: template,
          category: 'technical',
          topic: `${skill} Deep Dive`,
          difficulty: String(Math.min(5, 2 + i)),
        });
      }
    } else {
      questionsList.push({
        question: `Describe a technical problem you solved recently and walk me through your approach step by step.`,
        category: 'technical',
        topic: 'Problem Solving',
        difficulty: '3',
      });
    }

    // Problem solving question, referencing a skill if we have one
    questionsList.push({
      question: skills.length
        ? `If you had a production issue involving ${skills[0]}, how would you go about debugging and fixing it under time pressure?`
        : `If you encountered an unexpected production issue, how would you approach debugging and fixing it under time pressure?`,
      category: 'problemSolving',
      topic: 'Debugging',
      difficulty: '4',
    });

    // HR wrap-up questions
    questionsList.push({
      question: 'Describe a scenario where you had to work with a team member who had a completely different technical approach. How did you resolve it?',
      category: 'hr',
      topic: 'Conflict Resolution',
      difficulty: '2',
    });
    questionsList.push({
      question: 'Do you have any questions for us regarding the company culture or our engineering processes?',
      category: 'hr',
      topic: 'Wrap Up',
      difficulty: '1',
    });

    const nextQ = questionsList[questionIndex] || {
      question: "That concludes my planned questions. Do you have anything you'd like to highlight from your resume before we finish?",
      category: 'hr',
      topic: 'Wrap Up',
      difficulty: '1',
    };

    return nextQ;
  }

  async generateQuestion(promptText) {
    console.log('[DevLLM] Mocking generateQuestion...');
    return 'Could you describe a time when you had to optimize performance in a web application?';
  }

  async evaluateAnswer(question, answer, expectedCompetency) {
    console.log('[DevLLM] Mocking evaluateAnswer...');
    // Simple mock heuristic: longer answers get slightly better scores, but randomized to look real
    const textLen = (answer || '').trim().length;
    let baseScore = 50;
    if (textLen > 100) baseScore = 75;
    if (textLen > 250) baseScore = 88;
    if (textLen < 20) baseScore = 30;

    const technical = Math.min(100, Math.max(10, baseScore + Math.floor(Math.random() * 10) - 5));
    const resume = Math.min(100, Math.max(10, baseScore + Math.floor(Math.random() * 10) - 5));
    const problemSolving = Math.min(100, Math.max(10, baseScore + Math.floor(Math.random() * 10) - 5));
    const hr = Math.min(100, Math.max(10, baseScore + Math.floor(Math.random() * 10) - 5));
    const aptitude = Math.min(100, Math.max(10, baseScore + Math.floor(Math.random() * 10) - 5));
    const communication = Math.min(100, Math.max(10, baseScore + Math.floor(Math.random() * 10) - 5));

    return {
      scores: { technical, resume, problemSolving, hr, aptitude, communication },
      reasoning: 'The candidate provided a structured explanation covering basic principles, but could improve by detailing concrete production outcomes and constraints.',
      feedback: 'Good fundamental understanding. Recommend diving deeper into runtime performance metrics.',
    };
  }

  async decideFollowUp(question, answer, evaluation) {
    console.log('[DevLLM] Mocking decideFollowUp...');
    // 30% chance of asking a follow-up for realism
    const shouldFollowUp = Math.random() < 0.35;
    if (shouldFollowUp) {
      return {
        shouldFollowUp: true,
        question: `You mentioned utilizing specific hook dependencies. Can you elaborate on the potential issues of including reference objects directly in the dependency array?`,
        reason: 'Candidate mentioned reference objects but did not explain standard caching pitfalls.',
      };
    }
    return { shouldFollowUp: false };
  }

  async generateFinalReport(session, candidate) {
    console.log('[DevLLM] Mocking generateFinalReport...');
    const scores = session.scores || { technical: 75, communication: 80 };
    let recommendation = 'RECOMMENDED';
    if (scores.overall >= 85) recommendation = 'STRONGLY_RECOMMENDED';
    else if (scores.overall < 50) recommendation = 'NOT_RECOMMENDED';
    else if (scores.overall < 65) recommendation = 'NEEDS_REVIEW';

    return {
      summary: 'The candidate demonstrated a strong knowledge of modern frontend architectures, especially React. They communicated thoughts clearly, showing solid technical fundamentals.',
      strengths: [
        'Clear understanding of Component Lifecycle and virtual DOM updates',
        'Articulate communication during problem-solving processes',
        'Structured resume experience matching job description requirements',
      ],
      weaknesses: [
        'Some hesitation in explaining advanced node routing middleware parameters',
        'Less familiarity with production level CI/CD deployment workflows',
      ],
      recommendation,
    };
  }

  async generateBatchSummary(candidates, role) {
    console.log('[DevLLM] Mocking generateBatchSummary...');
    return {
      candidatesInterviewed: candidates.length,
      completionRate: 100,
      averageScores: { technical: 78, communication: 75, overall: 76 },
      commonStrengths: ['Good understanding of modular UI design', 'Strong responsive layouts implementation capabilities'],
      commonSkillGaps: ['Deep systems architectures optimization', 'Realtime web sockets scale issues'],
      integrityDistribution: { LowRisk: candidates.length },
      templateEffectiveness: 'High. Assessed all critical competencies accurately.',
      candidatesRequiringManualReview: 0,
    };
  }
}

export default DevelopmentLLMProvider;
