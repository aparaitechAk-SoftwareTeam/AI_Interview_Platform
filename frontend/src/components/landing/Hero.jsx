import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero section-pad">
      <div className="hero-grid container">
        <div className="hero-copy">
          <div className="eyebrow construct-target" data-construct="eyebrow">
            <span className="eyebrow-dot"></span> THE FUTURE OF INTERVIEWS IS HERE
          </div>
          <h1 className="hero-title">
            <span className="headline-line construct-target" data-construct="h1">AI Interviews.</span>
            <span className="headline-line gradient-text construct-target" data-construct="h2">Smarter Hiring.</span>
            <span className="headline-line construct-target" data-construct="h3">Better Future.</span>
          </h1>
          <p className="hero-description construct-target" data-construct="description">
            A premium AI interview platform that understands resumes, asks adaptive questions, listens to answers, evaluates confidence and technical skill, and generates a complete candidate report in real time.
          </p>
          <div className="hero-actions construct-target" data-construct="cta">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/interview')}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              Start Free Interview <span>→</span>
            </button>
            <a className="btn btn-glass" href="#final-cta">Book a Demo <span>↗</span></a>
          </div>
          <div className="hero-note construct-target" data-construct="note">
            No credit card required <span>•</span> Free plan available
          </div>
        </div>

        <div className="hero-visual construct-target" data-construct="avatar">
          <div className="avatar-aura"></div>
          <div className="avatar-stage">
            <div className="avatar-scan"></div>
            <div className="avatar-gridface"></div>
            <div className="avatar-head">
              <div className="face-core">
                <div className="brow brow-left"></div>
                <div className="brow brow-right"></div>
                <div className="eye eye-left"></div>
                <div className="eye eye-right"></div>
                <div className="nose-line"></div>
                <div className="mouth-line"></div>
                <div className="jaw jaw-left"></div>
                <div className="jaw jaw-right"></div>
              </div>
              <div className="headphone left-ear"></div>
              <div className="headphone right-ear"></div>
              <div className="circuit c1"></div>
              <div className="circuit c2"></div>
              <div className="circuit c3"></div>
            </div>
            <div className="energy-ring ring-outer"></div>
            <div className="energy-ring ring-inner"></div>
            <div className="ring-ticks"></div>
          </div>

          <div className="metric-card m1 construct-target" data-construct="m1">
            <div><span>Response Analysis</span><strong data-counter="98">98%</strong></div>
            <small>Confidence Score</small>
            <div className="bar"><i style={{ '--w': '98%' }}></i></div>
          </div>
          <div className="metric-card m2 construct-target" data-construct="m2">
            <div><span>Communication</span><strong data-counter="92">92%</strong></div>
            <small>Live Voice Score</small>
            <div className="bar"><i style={{ '--w': '92%' }}></i></div>
          </div>
          <div className="metric-card m3 construct-target" data-construct="m3">
            <div><span>Technical Skills</span><strong data-counter="93">93%</strong></div>
            <small>Answer Accuracy</small>
            <div className="bar"><i style={{ '--w': '93%' }}></i></div>
          </div>
          <div className="metric-card m4 construct-target" data-construct="m4">
            <div><span>Problem Solving</span><strong data-counter="95">95%</strong></div>
            <small>Reasoning Strength</small>
            <div className="bar"><i style={{ '--w': '95%' }}></i></div>
          </div>
        </div>
      </div>

      <div className="stats container construct-target" data-construct="stats">
        <div className="stat"><b data-count="10000">10,000+</b><span>Interviews Conducted</span></div>
        <div className="stat"><b data-count="500">500+</b><span>Companies Trust Us</span></div>
        <div className="stat"><b data-count="90">90%</b><span>Time Saved</span></div>
        <div className="stat"><b>4.9/5</b><span>User Rating</span></div>
      </div>
    </section>
  );
}
