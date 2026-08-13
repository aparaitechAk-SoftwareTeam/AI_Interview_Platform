import React, { useState } from 'react';

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="pricing section-pad reveal-section">
      <div className="container">
        <div className="section-heading" style={{ textAlign: 'center', margin: '0 auto 40px auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>TRANSPARENT PRICING</div>
          <h2>Simple plans for <span className="gradient-text">every team.</span></h2>
          <p style={{ color: '#8ea0bd', maxWidth: '600px', margin: '15px auto 0' }}>
            Choose the perfect plan to scale your hiring process with AI-powered interviews.
          </p>

          <div className="billing-toggle" style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', marginTop: '30px', background: 'rgba(9,18,37,0.8)', padding: '6px 16px', borderRadius: '99px', border: '1px solid rgba(106,155,230,0.2)' }}>
            <span style={{ fontSize: '13px', color: !annual ? '#fff' : '#7586a3', fontWeight: !annual ? 600 : 400, cursor: 'pointer' }} onClick={() => setAnnual(false)}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '99px',
                background: annual ? 'linear-gradient(90deg, #3b82ff, #00a8ff)' : 'rgba(255,255,255,0.15)',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: '0.3s'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: annual ? '23px' : '3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: '0.3s'
                }}
              />
            </button>
            <span style={{ fontSize: '13px', color: annual ? '#fff' : '#7586a3', fontWeight: annual ? 600 : 400, cursor: 'pointer' }} onClick={() => setAnnual(true)}>
              Yearly <small style={{ color: '#00c8ff', fontWeight: 600 }}>(Save 20%)</small>
            </span>
          </div>
        </div>

        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {/* Starter Plan */}
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="icon-box" style={{ marginBottom: '20px' }}>✦</div>
              <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>Free Starter</h3>
              <p style={{ fontSize: '13px', color: '#7d8ca5' }}>Ideal for individuals and small startups evaluating AI hiring.</p>
              <div style={{ margin: '24px 0', fontFamily: 'Space Grotesk' }}>
                <span style={{ fontSize: '42px', fontWeight: '700', color: '#fff' }}>$0</span>
                <span style={{ color: '#7d8ca5', fontSize: '14px' }}>/ month</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '13px', color: '#b4c6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>✓ 5 AI Interviews / month</li>
                <li>✓ Basic Resume Parsing</li>
                <li>✓ Standard Technical Questions</li>
                <li>✓ Summary PDF Report</li>
              </ul>
            </div>
            <a href="#top" className="btn btn-glass" style={{ width: '100%', marginTop: '20px' }}>Start Free</a>
          </div>

          {/* Pro Plan */}
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'rgba(0,168,255,0.4)', background: 'linear-gradient(150deg, rgba(12,28,58,0.85), rgba(4,9,21,0.9))', boxShadow: '0 20px 60px rgba(0,100,255,0.2)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'linear-gradient(90deg, #3b82ff, #7357ff)', padding: '4px 12px', borderRadius: '99px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em' }}>
              MOST POPULAR
            </div>
            <div>
              <div className="icon-box" style={{ marginBottom: '20px', background: 'rgba(0,168,255,0.15)', borderColor: '#00a8ff' }}>⌁</div>
              <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>Pro Team</h3>
              <p style={{ fontSize: '13px', color: '#7d8ca5' }}>For growing teams needing adaptive questions and detailed analytics.</p>
              <div style={{ margin: '24px 0', fontFamily: 'Space Grotesk' }}>
                <span style={{ fontSize: '42px', fontWeight: '700', color: '#fff' }}>{annual ? '$49' : '$59'}</span>
                <span style={{ color: '#7d8ca5', fontSize: '14px' }}>/ month</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '13px', color: '#b4c6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>✓ 50 AI Interviews / month</li>
                <li>✓ Advanced Resume Intelligence</li>
                <li>✓ Real-time Speech & Tone Analysis</li>
                <li>✓ Anti-Cheating & Video Recording</li>
                <li>✓ Custom Interview Templates</li>
              </ul>
            </div>
            <a href="#top" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>Upgrade to Pro</a>
          </div>

          {/* Enterprise Plan */}
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="icon-box" style={{ marginBottom: '20px' }}>◈</div>
              <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>Enterprise</h3>
              <p style={{ fontSize: '13px', color: '#7d8ca5' }}>For high-volume hiring organizations requiring custom AI models & ATS integration.</p>
              <div style={{ margin: '24px 0', fontFamily: 'Space Grotesk' }}>
                <span style={{ fontSize: '42px', fontWeight: '700', color: '#fff' }}>{annual ? '$199' : '$239'}</span>
                <span style={{ color: '#7d8ca5', fontSize: '14px' }}>/ month</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '13px', color: '#b4c6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>✓ Unlimited AI Interviews</li>
                <li>✓ Custom AI Fine-Tuning</li>
                <li>✓ Full ATS & Webhook Integrations</li>
                <li>✓ Dedicated Account Manager</li>
                <li>✓ Enterprise SLA & Security Compliance</li>
              </ul>
            </div>
            <a href="mailto:hello@aparaitech.com" className="btn btn-glass" style={{ width: '100%', marginTop: '20px' }}>Contact Sales</a>
          </div>
        </div>
      </div>
    </section>
  );
}
