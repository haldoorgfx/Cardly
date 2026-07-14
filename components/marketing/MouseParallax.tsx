'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/* Subtle mouse-follow parallax. Uses the CSS `translate` property (not
   `transform`) so it composes with any inner float/scale transform. Small
   magnitude, eased, resets on leave, and fully disabled under reduced motion. */
export default function MouseParallax({
  children,
  strength = 10,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return; // no parallax for reduced-motion users

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * strength;
        const y = (e.clientY / window.innerHeight - 0.5) * strength;
        if (ref.current) ref.current.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
    };
    const onLeave = () => {
      if (ref.current) ref.current.style.translate = '0px 0px';
    };

    window.addEventListener('mousemove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ transition: 'translate 0.35s ease-out', willChange: 'transform' }}>
      {children}
    </div>
  );
}
