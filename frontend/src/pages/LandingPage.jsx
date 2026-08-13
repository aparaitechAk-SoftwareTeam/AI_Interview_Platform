import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import ParticleCanvas from '../components/landing/ParticleCanvas';
import CursorGlow from '../components/landing/CursorGlow';
import IntroSequence from '../components/landing/IntroSequence';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Showcase from '../components/landing/Showcase';
import TrustedBy from '../components/landing/TrustedBy';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Capabilities from '../components/landing/Capabilities';
import Pricing from '../components/landing/Pricing';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

import LoginModal from '../components/landing/LoginModal';

import '../landing.css';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const setupScrollAnimations = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    ScrollTrigger.getAll().forEach(t => t.kill());

    gsap.utils.toArray('.reveal-section').forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 55 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            once: true
          }
        }
      );
    });

    gsap.to('.timeline-line span', {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 72%',
        end: 'bottom 65%',
        scrub: 1
      }
    });

    gsap.utils.toArray('.step').forEach((el, i) => {
      gsap.fromTo(
        el,
        { x: -25, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.65,
          delay: i * 0.04,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true
          }
        }
      );
    });

    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  };

  useEffect(() => {
    setupScrollAnimations();
  }, []);

  return (
    <>
      <div className="noise" aria-hidden="true"></div>
      <CursorGlow />
      <ParticleCanvas />

      <IntroSequence onIntroComplete={setupScrollAnimations} />

      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <main id="top">
        <Hero />
        <Showcase />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <Capabilities />
        <Pricing />
        <FinalCTA />
      </main>

      <Footer />

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
}
