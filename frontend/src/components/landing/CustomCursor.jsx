import { useEffect, useRef } from 'react';

export const CustomCursor = ({ theme }) => {
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);

  useEffect(() => {
    // Only initialize on desktop
    if (window.innerWidth <= 768) return;

    document.body.classList.add('custom-cursor-active');

    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    const cursorDot = document.createElement('div');
    cursorDot.classList.add('cursor-dot');
    cursor.appendChild(cursorDot);
    document.body.appendChild(cursor);
    
    cursorRef.current = cursor;
    cursorDotRef.current = cursorDot;

    // Apply initial theme if available
    if (theme) {
      cursor.style.borderColor = theme.ui;
      cursorDot.style.backgroundColor = theme.ui;
    }

    let lastX = 0;
    let lastY = 0;
    let rafId = null;

    const updateCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.left = lastX + 'px';
        cursorRef.current.style.top = lastY + 'px';
      }
    };

    const handleMouseMove = (e) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          updateCursor();
          rafId = null;
        });
      }

      if (cursorRef.current) {
        if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
          cursorRef.current.style.opacity = '0';
        } else {
          cursorRef.current.style.opacity = '1';
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.body.classList.remove('custom-cursor-active');
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleMouseMove);
      if (cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }
      cursorRef.current = null;
      cursorDotRef.current = null;
    };
  }, [theme]);

  // Update cursor color when theme changes
  useEffect(() => {
    if (theme) {
      if (cursorRef.current) {
        cursorRef.current.style.borderColor = theme.ui;
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.style.backgroundColor = theme.ui;
      }
    }
  }, [theme]);

  return null;
};
