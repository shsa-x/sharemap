import React, { useMemo } from 'react';
import './BackgroundBubbles.css';

const BackgroundBubbles = () => {
  const bubbles = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      size: Math.random() * 8 + 3, // 3px to 11px
      left: Math.random() * 100, // 0 to 100vw
      top: Math.random() * 100, // 0 to 100vh
      animationDuration: Math.random() * 10 + 5, // 5s to 15s
      animationDelay: Math.random() * -30, // start at random progress
      tx: Math.random() * 200 - 100, // -100px to 100px translation X
      ty: Math.random() * 200 - 100, // -100px to 100px translation Y
      opacity: Math.random() * 0.6 + 0.2,
      colorClass: Math.random() > 0.5 ? 'bubble-teal' : 'bubble-light'
    }));
  }, []);

  return (
    <div className="bubbles-container">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className={`bubble ${b.colorClass}`}
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}vw`,
            top: `${b.top}vh`,
            animationDuration: `${b.animationDuration}s`,
            animationDelay: `${b.animationDelay}s`,
            opacity: b.opacity,
            '--tx': `${b.tx}px`,
            '--ty': `${b.ty}px`
          }}
        ></div>
      ))}
    </div>
  );
};

export default BackgroundBubbles;
