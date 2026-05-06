import { useEffect, useRef, useState } from 'react';

interface UseEntranceAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  sessionKey?: string;
}

export function useEntranceAnimation(options: UseEntranceAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    sessionKey = 'hero-animation-played'
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Check if animation has already played in this session
    const hasPlayed = sessionStorage.getItem(sessionKey);
    
    if (hasPlayed) {
      // If already played, show element immediately without animation
      setShouldAnimate(false);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation for users who prefer reduced motion
      setShouldAnimate(false);
      sessionStorage.setItem(sessionKey, 'true');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldAnimate(true);
            // Mark animation as played in session storage
            sessionStorage.setItem(sessionKey, 'true');
            // Disconnect observer after animation triggers
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, sessionKey]);

  return { elementRef, shouldAnimate };
}
