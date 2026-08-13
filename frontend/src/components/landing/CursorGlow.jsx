import React, { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    if (window.matchMedia('(pointer:fine)').matches) {
      const handleMouseMove = (e) => {
        glow.style.opacity = '.9';
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return <div className="cursor-glow" ref={glowRef} aria-hidden="true"></div>;
}
