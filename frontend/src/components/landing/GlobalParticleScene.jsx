import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { watchPageVisibility } from '../../utils/useVisibilityPause';

/**
 * GlobalParticleScene — a single fixed-position WebGL canvas that covers
 * the entire viewport at all times. Particles drift freely across every
 * section boundary from "Discover Our Features" all the way to the final
 * "GAME IN MY STYLE" card.
 *
 * This replaces the 7 identical per-section particle scenes with one
 * unified, continuously flowing particle field.
 *
 * The canvas is:
 *   - position: fixed (always covers the viewport regardless of scroll)
 *   - pointer-events: none (never blocks clicks)
 *   - z-index: 2 (above section backgrounds, below all content)
 *
 * Scroll parallax: the particle cloud slowly drifts upward as the user
 * scrolls down, giving a depth illusion that works across all sections.
 */
export const GlobalParticleScene = ({ theme }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    let renderer;
    let frameId = null;
    let isVisible = true;

    try {
      // ── Scene + Camera ──────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 3;

      // ── Renderer (alpha so section backgrounds show through) ───────────────
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
      renderer.setClearColor(0x000000, 0);

      mountElement.innerHTML = '';
      mountElement.appendChild(renderer.domElement);

      // ── Particles ──────────────────────────────────────────────────────────
      // Expanded particle field spanning a much larger vertical area (Y axis)
      // to ensure particles cover the entire viewport even after scrolling
      // down to the very bottom "Game In My Style" section.
      const particleCount = 6000;
      const posArray = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i]     = (Math.random() - 0.5) * 22; // x — wide spread
        posArray[i + 1] = (Math.random() - 0.5) * 85; // y — tall vertical spread spanning all sections
        posArray[i + 2] = (Math.random() - 0.5) * 16; // z — deep field
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const material = new THREE.PointsMaterial({
        size: 0.028,
        color: new THREE.Color(theme.accent),
        transparent: true,
        opacity: 0.82,
        sizeAttenuation: true,
      });

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);

      // ── Mouse + Scroll tracking ────────────────────────────────────────────
      let targetRotationX = 0;
      let targetRotationY = 0;
      let currentRotationX = 0;
      let currentRotationY = 0;
      let isMouseMoving = false;
      let mouseMoveTimeout;

      // Scroll parallax state
      let scrollY = window.scrollY;
      let targetScrollOffset = 0;
      let currentScrollOffset = 0;

      const handleMouseMove = (e) => {
        const mx = (e.clientX / window.innerWidth) * 2 - 1;
        const my = -(e.clientY / window.innerHeight) * 2 + 1;
        targetRotationX = my * 0.4;
        targetRotationY = mx * 0.4;
        isMouseMoving = true;
        clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = setTimeout(() => { isMouseMoving = false; }, 1000);
      };

      const handleScroll = () => {
        scrollY = window.scrollY;
        // Map scroll to a subtle Y drift of the particle cloud.
        // Every 600px of scroll moves particles 0.8 units in world space.
        targetScrollOffset = -(scrollY / 600) * 0.8;
      };

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize);

      // ── Animation loop ─────────────────────────────────────────────────────
      const smoothing = 0.06;

      const startLoop = () => {
        if (!frameId && isVisible) loop();
      };
      const stopLoop = () => {
        if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
      };

      const loop = () => {
        // Smooth mouse rotation
        if (isMouseMoving) {
          currentRotationX += (targetRotationX - currentRotationX) * smoothing;
          currentRotationY += (targetRotationY - currentRotationY) * smoothing;
        } else {
          currentRotationX *= 0.97;
          currentRotationY *= 0.97;
        }

        // Smooth scroll parallax — particle cloud drifts upward as user scrolls down
        currentScrollOffset += (targetScrollOffset - currentScrollOffset) * 0.05;

        particles.rotation.x = currentRotationX;
        particles.rotation.y = currentRotationY;
        // Slow perpetual Z spin so particles always feel alive
        particles.rotation.z += 0.00008;

        // Apply scroll parallax via Y position of the particle group
        particles.position.y = currentScrollOffset;

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(loop);
      };

      // Pause when tab hidden
      const cleanupPageVis = watchPageVisibility(
        () => { isVisible = true; startLoop(); },
        () => { isVisible = false; stopLoop(); }
      );

      startLoop();

      // ── Cleanup ────────────────────────────────────────────────────────────
      return () => {
        stopLoop();
        clearTimeout(mouseMoveTimeout);
        cleanupPageVis();
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (mountElement?.contains(renderer.domElement)) {
          mountElement.removeChild(renderer.domElement);
        }
      };
    } catch (error) {
      console.error('GlobalParticleScene WebGL Error:', error);
      return () => {};
    }
  }, [theme]);

  return (
    <div
      ref={mountRef}
      data-testid="global-particle-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
        // Only show from DiscoverFeatures onwards — this div's opacity is
        // controlled purely by CSS scroll-driven fade via the sibling class
      }}
    />
  );
};
