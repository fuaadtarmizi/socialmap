import React, { useState, useEffect } from 'react';

const SPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80',
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&q=80',
  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1920&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
];

interface SplashScreenProps {
  isReady: boolean;
}

export const SplashScreen = ({ isReady }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [image] = useState(
    () => SPLASH_IMAGES[Math.floor(Math.random() * SPLASH_IMAGES.length)]
  );

  useEffect(() => {
    if (!isReady) return;
    setFading(true);
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, [isReady]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.7s ease',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" fillOpacity="0.15"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
          <h1 className="text-4xl font-bold text-white tracking-tight">Social Maps</h1>
        </div>

        <p className="text-white/60 text-sm tracking-wide">Discover places around you</p>

        <div className="flex gap-2 mt-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
