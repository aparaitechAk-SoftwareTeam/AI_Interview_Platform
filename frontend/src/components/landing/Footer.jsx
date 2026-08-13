import React from 'react';

export default function Footer() {
  return (
    <footer id="resources" className="footer">
      <div className="container footer-grid">
        <div>
          <a className="brand" href="#top">
            <span className="brand-mark">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span>Aparaitech <strong>AI Interview</strong></span>
          </a>
          <p>AI-powered interview intelligence for modern hiring teams, students and institutions.</p>
        </div>
        <div>
          <h4>Platform</h4>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#showcase">Dashboard</a>
        </div>
        <div>
          <h4>Resources</h4>
          <a href="#">Documentation</a>
          <a href="#">Help Center</a>
          <a href="#">Interview Guide</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Careers</a>
          <a href="#">Contact</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Security</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Aparaitech AI Interview. All rights reserved.</span>
        <span>LinkedIn · Instagram · X</span>
      </div>
    </footer>
  );
}
