import React from 'react';

export default function Features() {
  return (
    <section id="features" className="features section-pad reveal-section">
      <div className="container">
        <div className="section-heading">
          <div className="eyebrow">WHY CHOOSE APARAITECH</div>
          <h2>Built for <span className="gradient-text">intelligent hiring.</span></h2>
        </div>
        <div className="cards-grid">
          <article className="feature-card">
            <div className="icon-box">✦</div>
            <h3>AI-Powered</h3>
            <p>Advanced AI analyzes candidate responses intelligently and consistently.</p>
          </article>
          <article className="feature-card">
            <div className="icon-box">⌁</div>
            <h3>Scalable</h3>
            <p>Conduct hundreds of interviews without sacrificing evaluation quality.</p>
          </article>
          <article className="feature-card">
            <div className="icon-box">◇</div>
            <h3>Secure</h3>
            <p>Enterprise-grade architecture designed to protect candidate data.</p>
          </article>
          <article className="feature-card">
            <div className="icon-box">◈</div>
            <h3>Insightful</h3>
            <p>Transform interview responses into clear hiring insights and reports.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
