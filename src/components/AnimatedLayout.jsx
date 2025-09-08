import React, { useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import '../App.css';

export default function AnimatedLayout({ gridSize = 25, pixelColor = '#00031E', duration = 0.6 }) {
  const overlayRef = useRef();
  const navigate = useNavigate();
  const isAnimating = useRef(false);

  const createGrid = useCallback(() => {
    const container = overlayRef.current;
    if (!container) return;

    container.innerHTML = '';
    const size = 150 / gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixel-transition-block');
        Object.assign(pixel.style, {
          backgroundColor: pixelColor,
          width: `${size}%`,
          height: `${size}%`,
          top: `${row * size}%`,
          left: `${col * size}%`,
          position: 'absolute',
          opacity: 0,
          zIndex: 999999999,
        });
        container.appendChild(pixel);
      }
    }
  }, [gridSize, pixelColor]);
  const animateAndNavigate = useCallback((to, callback) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
  
    const pixels = overlayRef.current?.querySelectorAll('.pixel-transition-block');
    if (!pixels?.length) return;
  
    const stagger = duration / 2 / pixels.length;
    gsap.set(pixels, { opacity: 0, display: 'block' });
  
    gsap.to(pixels, {
      opacity: 1,
      duration: 0.3,
      stagger: { each: stagger, from: 'random' },
      onComplete: () => {
        if (to) navigate(to);
        if (callback) callback(); // 👈 Aquí entra goBack
  
        gsap.to(pixels, {
          opacity: 0,
          duration: 0.3,
          delay: 0.1,
          stagger: { each: stagger, from: 'random' },
          onComplete: () => {
            gsap.set(pixels, { display: 'none' });
            isAnimating.current = false;
          },
        });
      },
    });
  }, [duration, navigate]);
  

  useEffect(() => {
    createGrid();
  }, [createGrid]);

  return (
    <div className="animated-layout-container">
      <div className="pixel-transition-overlay" ref={overlayRef} />
      <div className="page-wrapper">
        <Outlet context={{ animateAndNavigate }} />
      </div>
    </div>
  );
}
