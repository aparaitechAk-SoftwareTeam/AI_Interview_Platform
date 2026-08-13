import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function IntroSequence({ onIntroComplete }) {
  const [finished, setFinished] = useState(false);
  const timelineRef = useRef(null);

  useEffect(() => {
    const FORCE_INTRO = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const introSeen = sessionStorage.getItem('aparaitech_intro_seen') === '1';

    const revealAll = () => {
      document.body.classList.remove('intro-lock');
      gsap.set('.construct-target', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 });
      setFinished(true);
      sessionStorage.setItem('aparaitech_intro_seen', '1');
      if (onIntroComplete) onIntroComplete();
    };

    if (reduceMotion) {
      revealAll();
    } else if (FORCE_INTRO || !introSeen) {
      document.body.classList.add('intro-lock');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: revealAll });
      timelineRef.current = tl;

      tl.to('.core-wrap', { opacity: 1, duration: .35 }, .5)
        .fromTo('.core-dot', { scale: .3 }, { scale: 1.5, duration: .45, yoyo: true, repeat: 1 }, .7)
        .from('.core-ring', { scale: .3, opacity: 0, stagger: .1, duration: .7 }, .7)
        .to('.trail', { opacity: 1, width: '70vw', stagger: .08, duration: .65, ease: 'power2.inOut' }, 1.25)
        .to('[data-construct="nav"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .75 }, 1.9)
        .to('[data-construct="eyebrow"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .55 }, 2.15)
        .to('[data-construct="h1"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .6 }, 2.35)
        .to('[data-construct="h2"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .6 }, 2.62)
        .to('[data-construct="h3"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .6 }, 2.9)
        .to('[data-construct="avatar"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: 1.2 }, 2.65)
        .from('.avatar-head', { clipPath: 'inset(0 0 100% 0)', duration: 1.2 }, 2.75)
        .from('.avatar-gridface,.circuit', { opacity: 0, stagger: .08, duration: .65 }, 3.05)
        .from('.energy-ring,.ring-ticks', { scale: .6, opacity: 0, stagger: .1, duration: .7 }, 3.35)
        .to('[data-construct="m1"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .5 }, 4.05)
        .to('[data-construct="m2"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .5 }, 4.3)
        .to('[data-construct="m3"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .5 }, 4.55)
        .to('[data-construct="m4"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .5 }, 4.8)
        .to('[data-construct="description"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .55 }, 4.7)
        .to('[data-construct="cta"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .55 }, 5.05)
        .to('[data-construct="note"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .4 }, 5.3)
        .to('[data-construct="stats"]', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: .75 }, 5.6)
        .fromTo('.intro-sweep', { x: 0, opacity: 0 }, { x: '140vw', opacity: 1, duration: 1.05, ease: 'power2.inOut' }, 6.1)
        .to('.intro-sweep', { opacity: 0, duration: .25 }, 6.95)
        .to('.trail,.core-wrap', { opacity: 0, duration: .65 }, 6.5)
        .to('.intro', { backgroundColor: 'rgba(1,3,10,0)', duration: .8 }, 6.65);
    } else {
      revealAll();
    }

    return () => {
      if (timelineRef.current) timelineRef.current.kill();
      document.body.classList.remove('intro-lock');
    };
  }, []);

  const handleSkip = () => {
    if (timelineRef.current) {
      timelineRef.current.progress(1);
      timelineRef.current.kill();
    }
    document.body.classList.remove('intro-lock');
    gsap.set('.construct-target', { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 });
    setFinished(true);
    sessionStorage.setItem('aparaitech_intro_seen', '1');
    if (onIntroComplete) onIntroComplete();
  };

  if (finished) return null;

  return (
    <div id="intro" className={`intro ${finished ? 'finished' : ''}`} aria-hidden="true">
      <button id="skipIntro" className="skip-intro" onClick={handleSkip}>Skip Intro</button>
      <div className="core-wrap">
        <div className="core-dot"></div>
        <div className="core-ring ring-a"></div>
        <div className="core-ring ring-b"></div>
        <div className="core-ring ring-c"></div>
      </div>
      <div className="trail trail-1"></div>
      <div className="trail trail-2"></div>
      <div className="trail trail-3"></div>
      <div className="trail trail-4"></div>
      <div className="intro-sweep"></div>
    </div>
  );
}
