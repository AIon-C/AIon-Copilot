'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface TextPressureProps {
  text: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
  minFontSize?: number;
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (dist: number, maxDist: number, minVal: number, maxVal: number) => {
  const value = maxVal - Math.abs((maxVal * dist) / maxDist);
  return Math.max(minVal, value + minVal);
};

const debounce = (func: () => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func();
    }, delay);
  };
};

export const TextPressure = ({
  text,
  fontFamily = 'Compressa VF',
  fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
  width = true,
  weight = true,
  italic = true,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = '#FFFFFF',
  strokeColor = '#22d3ee',
  strokeWidth = 2,
  className,
  minFontSize = 24,
}: TextPressureProps) => {
  const uniqueId = useId().replace(/:/g, '_');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });

  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);

  const chars = text.split('');

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      cursorRef.current.x = event.clientX;
      cursorRef.current.y = event.clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      cursorRef.current.x = touch.clientX;
      cursorRef.current.y = touch.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    if (containerRef.current) {
      const { left, top, width: boxWidth, height: boxHeight } = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + boxWidth / 2;
      mouseRef.current.y = top + boxHeight / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    let nextFontSize = containerWidth / Math.max(chars.length / 2, 1);
    nextFontSize = Math.max(nextFontSize, minFontSize);

    setFontSize(nextFontSize);
    setScaleY(1);
    setLineHeight(1);

    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();

      if (scale && textRect.height > 0) {
        const ratioY = containerHeight / textRect.height;
        setScaleY(ratioY);
        setLineHeight(ratioY);
      }
    });
  }, [chars.length, minFontSize, scale]);

  useEffect(() => {
    const debouncedSetSize = debounce(setSize, 100);
    debouncedSetSize();
    window.addEventListener('resize', debouncedSetSize);
    return () => window.removeEventListener('resize', debouncedSetSize);
  }, [setSize]);

  useEffect(() => {
    let rafId = 0;

    const animate = () => {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = titleRect.width / 2;

        spansRef.current.forEach((span) => {
          if (!span) return;

          const rect = span.getBoundingClientRect();
          const charCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };

          const dist = distance(mouseRef.current, charCenter);

          const wdth = width ? Math.floor(getAttr(dist, maxDist, 5, 200)) : 100;
          const wght = weight ? Math.floor(getAttr(dist, maxDist, 100, 900)) : 400;
          const italVal = italic ? getAttr(dist, maxDist, 0, 1).toFixed(2) : '0';
          const alphaVal = alpha ? getAttr(dist, maxDist, 0, 1).toFixed(2) : '1';

          const variation = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;

          if (span.style.fontVariationSettings !== variation) {
            span.style.fontVariationSettings = variation;
          }
          if (alpha && span.style.opacity !== alphaVal) {
            span.style.opacity = alphaVal;
          }
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [alpha, italic, weight, width]);

  const scopeClass = `text-pressure-${uniqueId}`;

  const styleElement = useMemo(
    () => (
      <style>{`
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontUrl}');
          font-style: normal;
        }

        .${scopeClass}.stroke span {
          position: relative;
          color: ${textColor};
        }
        .${scopeClass}.stroke span::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: ${strokeWidth}px;
          -webkit-text-stroke-color: ${strokeColor};
        }
      `}</style>
    ),
    [fontFamily, fontUrl, scopeClass, strokeColor, strokeWidth, textColor],
  );

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden bg-transparent', className)}>
      {styleElement}
      <span
        ref={titleRef}
        className={cn(scopeClass, 'block select-none text-center', {
          'flex justify-between': flex,
          stroke,
        })}
        style={{
          fontFamily,
          fontSize,
          lineHeight,
          transform: `scale(1, ${scaleY})`,
          transformOrigin: 'center top',
          margin: 0,
          fontWeight: 100,
          color: stroke ? undefined : textColor,
          whiteSpace: 'nowrap',
        }}
        aria-label={text}
      >
        {chars.map((char, index) => (
          <span
            key={`${char}-${index}`}
            ref={(el) => {
              spansRef.current[index] = el;
            }}
            data-char={char}
            className="inline-block"
            style={{ color: stroke ? undefined : textColor }}
            aria-hidden="true"
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
};
