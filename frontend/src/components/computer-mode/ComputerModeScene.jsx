import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ComputerModeScene = ({ theme }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
      renderer.setClearColor(0x000000, 0);

      mountElement.innerHTML = '';
      mountElement.appendChild(renderer.domElement);

      camera.position.z = 3;

      const particlesGeometry = new THREE.BufferGeometry();
      const particleCount = 2000;
      const posArray = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 10;
        posArray[i + 1] = (Math.random() - 0.5) * 10;
        posArray[i + 2] = (Math.random() - 0.5) * 10;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.03,
        color: new THREE.Color(theme.accent),
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      });

      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('resize', handleResize);

      let frameId = null;

      const animate = () => {
        frameId = requestAnimationFrame(animate);

        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.0005;
        particles.rotation.x += mouseY * 0.0002;
        particles.rotation.y += mouseX * 0.0002;

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);

        particlesGeometry.dispose();
        particlesMaterial.dispose();
        renderer.dispose();

        if (mountElement?.contains(renderer.domElement)) {
          mountElement.removeChild(renderer.domElement);
        }
      };
    } catch (error) {
      console.error('WebGL Error:', error);
      return () => {};
    }
  }, [theme]);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
};
