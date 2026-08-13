import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenLogin }) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleGetStarted = () => {
    closeMenu();
    navigate('/interview');
  };

  return (
    <header className={`nav-shell construct-target ${isScrolled ? 'scrolled' : ''}`} data-construct="nav">
      <nav className={`nav container ${isOpen ? 'open' : ''}`}>
        <a className="brand" href="#top" aria-label="Aparaitech AI Interview home" onClick={closeMenu}>
          <span className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span>Aparaitech <strong>AI Interview</strong></span>
        </a>
        <button
          className="menu-toggle"
          aria-label="Open navigation"
          aria-expanded={isOpen}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
        </button>
        <div className="nav-links">
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how" onClick={closeMenu}>How It Works</a>
          <a href="#use-cases" onClick={closeMenu}>Use Cases</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#resources" onClick={closeMenu}>Resources</a>
        </div>
        <div className="nav-actions">
          <button
            className="btn btn-ghost"
            onClick={() => { closeMenu(); onOpenLogin && onOpenLogin(); }}
            style={{ cursor: 'pointer' }}
          >
            Login
          </button>
          <button
            className="btn btn-primary small"
            onClick={handleGetStarted}
            style={{ cursor: 'pointer' }}
          >
            Get Started <span>↗</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
