'use client';

import { type CSSProperties, type ReactNode, useId, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

type ShinyDirection = 'left' | 'right';

interface ShinyTextProps {
  children: ReactNode;
  className?: string;
  color?: string;
  shineColor?: string;
  speed?: number;
  delay?: number;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: ShinyDirection;
  disabled?: boolean;
}

export const ShinyText = ({
  children,
  className,
  color = '#b5b5b5',
  shineColor = '#ffffff',
  speed = 2,
  delay = 0,
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
  disabled = false,
}: ShinyTextProps) => {
  const id = useId().replace(/:/g, '_');
  const [isHovered, setIsHovered] = useState(false);

  const animationName = useMemo(() => `shiny-text-${id}`, [id]);
  const from = direction === 'left' ? '200%' : '-200%';
  const to = direction === 'left' ? '-200%' : '200%';

  if (disabled) {
    return (
      <span className={className} style={{ color }}>
        {children}
      </span>
    );
  }

  const style: CSSProperties = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 40%, ${shineColor} 50%, ${color} 60%, ${color} 100%)`,
    backgroundSize: '200% 100%',
    backgroundPosition: `${from} 50%`,
    backgroundColor: 'transparent',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    animationName,
    animationDuration: `${Math.max(speed, 0.1)}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationDirection: yoyo ? 'alternate' : 'normal',
    animationDelay: `${Math.max(delay, 0)}s`,
    animationPlayState: pauseOnHover && isHovered ? 'paused' : 'running',
  };

  return (
    <>
      <style>{`@keyframes ${animationName} { from { background-position: ${from} 50%; } to { background-position: ${to} 50%; } }`}</style>
      <span
        className={cn('inline-block whitespace-pre bg-clip-text text-transparent', className)}
        style={style}
        onMouseEnter={() => {
          if (pauseOnHover) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (pauseOnHover) setIsHovered(false);
        }}
      >
        {children}
      </span>
    </>
  );
};
