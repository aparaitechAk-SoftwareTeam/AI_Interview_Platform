import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section id="final-cta" className="final-cta section-pad reveal-section">
      <div className="cta-orb"></div>
      <div className="container final-box">
        <div className="eyebrow">READY WHEN YOU ARE</div>
        <h2>Ready to experience the <span className="gradient-text">future of interviews?</span></h2>
        <p>Start your AI-powered interview experience today.</p>
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/interview')}
            style={{ cursor: 'pointer', border: 'none' }}
          >
            Start Interview <span>→</span>
          </button>
          <a className="btn btn-glass" href="mailto:hello@aparaitech.com">Request Demo <span>↗</span></a>
        </div>
      </div>
    </section>
  );
}
