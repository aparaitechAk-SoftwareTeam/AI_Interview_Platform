import React, { useEffect, useRef } from 'react';

export default function Showcase() {
  const tiltRef = useRef(null);

  useEffect(() => {
    const tilt = tiltRef.current;
    if (!tilt || !window.matchMedia('(pointer:fine)').matches) return;

    const handleMouseMove = (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(1100px) rotateX(${-y * 3}deg) rotateY(${x * 4}deg)`;
    };

    const handleMouseLeave = () => {
      tilt.style.transform = 'perspective(1100px) rotateX(0) rotateY(0)';
    };

    tilt.addEventListener('mousemove', handleMouseMove);
    tilt.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      tilt.removeEventListener('mousemove', handleMouseMove);
      tilt.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section id="showcase" className="showcase section-pad reveal-section">
      <div className="container showcase-grid">
        <div className="section-copy">
          <div className="eyebrow">AI POWERED PLATFORM</div>
          <h2>Interviews that <span className="gradient-text">understand more.</span></h2>
          <p>Aparaitech AI evaluates more than answers. It analyzes communication, confidence, technical understanding, problem-solving ability, and overall interview performance.</p>
          <div className="feature-list">
            <span>✦ Real-time AI Questioning</span>
            <span>✦ In-depth Candidate Evaluation</span>
            <span>✦ Intelligent Follow-up Questions</span>
            <span>✦ Resume-Based Interviews</span>
            <span>✦ Communication Analysis</span>
            <span>✦ Detailed Reports & Insights</span>
          </div>
          <a className="btn btn-primary" href="#features">Explore Features <span>→</span></a>
        </div>

        <div className="dashboard-card tilt-card" ref={tiltRef}>
          <div className="dash-sidebar">
            <div className="dash-logo">A<span>I</span></div>
            <button className="active">◈ Dashboard</button>
            <button>◫ Interviews</button>
            <button>◉ Candidates</button>
            <button>⌁ Analytics</button>
            <button>▤ Reports</button>
            <button>⚙ Settings</button>
          </div>
          <div className="dash-main">
            <div className="dash-head">
              <div>
                <small>LIVE INTERVIEW</small>
                <h3>Frontend Developer Interview</h3>
              </div>
              <div className="timer">12:45</div>
              <button>End Interview</button>
            </div>
            <div className="dash-grid">
              <div className="question-panel glass-panel">
                <div className="question-top">
                  <span>QUESTION 04</span>
                  <em>Medium</em>
                </div>
                <h4>Explain the concept of Virtual DOM in React.</h4>
                <div className="waveform" aria-hidden="true">
                  <i style={{ '--d': 2 }}></i>
                  <i style={{ '--d': 3 }}></i>
                  <i style={{ '--d': 4 }}></i>
                  <i style={{ '--d': 5 }}></i>
                  <i style={{ '--d': 6 }}></i>
                  <i style={{ '--d': 7 }}></i>
                  <i style={{ '--d': 8 }}></i>
                  <i style={{ '--d': 9 }}></i>
                  <i style={{ '--d': 2 }}></i>
                  <i style={{ '--d': 3 }}></i>
                  <i style={{ '--d': 4 }}></i>
                  <i style={{ '--d': 5 }}></i>
                  <i style={{ '--d': 6 }}></i>
                  <i style={{ '--d': 7 }}></i>
                  <i style={{ '--d': 8 }}></i>
                  <i style={{ '--d': 9 }}></i>
                  <i style={{ '--d': 2 }}></i>
                  <i style={{ '--d': 3 }}></i>
                  <i style={{ '--d': 4 }}></i>
                  <i style={{ '--d': 5 }}></i>
                  <i style={{ '--d': 6 }}></i>
                  <i style={{ '--d': 7 }}></i>
                  <i style={{ '--d': 8 }}></i>
                  <i style={{ '--d': 9 }}></i>
                  <i style={{ '--d': 2 }}></i>
                  <i style={{ '--d': 3 }}></i>
                  <i style={{ '--d': 4 }}></i>
                  <i style={{ '--d': 5 }}></i>
                </div>
                <div className="listening"><span></span> Listening...</div>
                <div className="transcript">
                  <small>LIVE TRANSCRIPT</small>
                  <p>“The Virtual DOM is an in-memory representation of the UI. React compares changes efficiently before updating the real DOM...”</p>
                </div>
              </div>
              <div className="analysis-panel glass-panel">
                <div className="panel-title">Live Analysis <span>● ACTIVE</span></div>
                <div className="metric-row"><span>Communication</span><b>92%</b><i style={{ '--w': '92%' }}></i></div>
                <div className="metric-row"><span>Technical Skills</span><b>93%</b><i style={{ '--w': '93%' }}></i></div>
                <div className="metric-row"><span>Problem Solving</span><b>90%</b><i style={{ '--w': '90%' }}></i></div>
                <div className="metric-row"><span>Confidence</span><b>91%</b><i style={{ '--w': '91%' }}></i></div>
                <div className="score-ring">
                  <div><strong>92%</strong><span>Excellent</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
