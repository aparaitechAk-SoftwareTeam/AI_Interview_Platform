import React from 'react';

export default function HowItWorks() {
  return (
    <section id="how" className="how section-pad reveal-section">
      <div className="container">
        <div className="section-heading">
          <div className="eyebrow">HOW IT WORKS</div>
          <h2>From candidate to <span className="gradient-text">decision.</span></h2>
        </div>
        <div className="timeline">
          <div className="timeline-line"><span></span></div>
          <div className="step">
            <b>01</b>
            <div>
              <h3>Candidate Joins Interview</h3>
              <p>Secure invitation-based access starts the interview session.</p>
            </div>
          </div>
          <div className="step">
            <b>02</b>
            <div>
              <h3>AI Reads Resume</h3>
              <p>Skills, projects, technologies and experience are extracted automatically.</p>
            </div>
          </div>
          <div className="step">
            <b>03</b>
            <div>
              <h3>AI Conducts Interview</h3>
              <p>Adaptive technical, HR and follow-up questions are generated in real time.</p>
            </div>
          </div>
          <div className="step">
            <b>04</b>
            <div>
              <h3>AI Evaluates Responses</h3>
              <p>Communication, confidence, accuracy and reasoning are continuously scored.</p>
            </div>
          </div>
          <div className="step">
            <b>05</b>
            <div>
              <h3>Detailed Report Generated</h3>
              <p>Recruiters receive a clear scorecard, strengths, risks and final recommendation.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
