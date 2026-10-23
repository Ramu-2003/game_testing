import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { observeElement, watchPageVisibility } from '../../utils/useVisibilityPause';

const createGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,180,100,0.8)');
  gradient.addColorStop(1, 'rgba(255,120,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
};

const createAsteroidGeometry = (radius, seed) => {
  const geometry = new THREE.IcosahedronGeometry(radius, 0);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const vx = positions.getX(i);
    const vy = positions.getY(i);
    const vz = positions.getZ(i);
    const wobble = 0.72 + Math.abs(Math.sin(i * 0.91 + seed * 1.41)) * 0.44;
    positions.setXYZ(i, vx * wobble, vy * (0.9 + wobble * 0.14), vz * wobble);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};

export const SpaceHeroScene = ({ theme }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03030d, 0.028);

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0.95, 13.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    mountElement.innerHTML = '';
    mountElement.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.34);
    const beamLight = new THREE.PointLight(theme.accent, 5.1, 58, 1.28);
    beamLight.position.set(0, 2.1, 1.4);
    const rimLight = new THREE.PointLight(0xffe4c9, 0.76, 36);
    rimLight.position.set(-5.2, 2.4, 8.5);
    const lowerBounce = new THREE.PointLight(theme.accent, 1.6, 28);
    lowerBounce.position.set(0, -2.8, 2.4);
    const sideFill = new THREE.PointLight(0xffc08f, 0.92, 36);
    sideFill.position.set(5.8, 2.6, 7.8);
    scene.add(ambient, beamLight, rimLight, lowerBounce, sideFill);

    const starsGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 2000; i += 1) {
      starVertices.push((Math.random() - 0.5) * 72);
      starVertices.push((Math.random() - 0.5) * 56);
      starVertices.push((Math.random() - 0.5) * 90);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.88 }),
    );
    scene.add(stars);

    const dustTexture = createGlowTexture();
    const nebulaDust = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: dustTexture, transparent: true, opacity: 0.23, depthWrite: false }),
    );
    nebulaDust.scale.set(25, 20, 1);
    nebulaDust.position.set(0, 1.15, -4.2);
    scene.add(nebulaDust);

    const glowTexture = createGlowTexture();
    const beamAuraMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: new THREE.Color(theme.accent),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beamAura = new THREE.Sprite(beamAuraMaterial);
    beamAura.scale.set(7.4, 25.2, 1);
    beamAura.position.set(0, 1.1, -0.4);
    scene.add(beamAura);

    const beamCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 19.8, 0.18),
      new THREE.MeshBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }),
    );
    beamCore.position.set(0, 1.1, 0.02);
    scene.add(beamCore);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.03, 10, 140),
      new THREE.MeshBasicMaterial({ color: theme.asteroid, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending }),
    );
    ring.rotation.x = Math.PI / 2.06;
    ring.position.set(0, 1.5, -0.05);
    scene.add(ring);

    const ringInner = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.014, 8, 120),
      new THREE.MeshBasicMaterial({ color: 0xfff0bf, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending }),
    );
    ringInner.rotation.x = Math.PI / 2.03;
    ringInner.position.set(0, 1.48, -0.08);
    scene.add(ringInner);

    const asteroidGroup = new THREE.Group();
    const asteroidMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.asteroid),
      emissive: new THREE.Color(theme.asteroid),
      emissiveIntensity: 0.62,
      roughness: 0.46,
      metalness: 0.03,
      flatShading: true,
    });

    const asteroidOrbitData = [];
    const orbitCenter = new THREE.Vector3(0, 1.72, 0.02);

    const addOrbitingRock = ({ index, size, scale, radius, depth, yOffset, speed, angle }) => {
      const mesh = new THREE.Mesh(createAsteroidGeometry(size, index + 11), asteroidMaterial.clone());
      mesh.scale.setScalar(scale);
      mesh.rotation.set(index * 0.31, index * 0.23, index * 0.47);
      asteroidGroup.add(mesh);
      asteroidOrbitData.push({
        mesh,
        radius,
        depth,
        yOffset,
        speed,
        angle,
        bob: Math.random() * Math.PI * 2,
      });
    };

    const primaryAsteroids = 24;
    for (let i = 0; i < primaryAsteroids; i += 1) {
      addOrbitingRock({
        index: i,
        size: 0.28 + Math.random() * 0.18,
        scale: 1 + Math.random() * 0.95,
        radius: 5 + Math.sin(i * 0.7) * 1.05 + Math.random() * 0.5,
        depth: 0.22 + Math.random() * 0.2,
        yOffset: -0.02 + (Math.random() - 0.5) * 0.24,
        speed: 0.18 + Math.random() * 0.08,
        angle: (i / primaryAsteroids) * Math.PI * 2,
      });
    }

    const secondaryAsteroids = 32;
    for (let i = 0; i < secondaryAsteroids; i += 1) {
      addOrbitingRock({
        index: i + 200,
        size: 0.12 + Math.random() * 0.08,
        scale: 0.85 + Math.random() * 0.75,
        radius: 4.55 + Math.sin(i * 1.1) * 1.2 + Math.random() * 0.6,
        depth: 0.18 + Math.random() * 0.16,
        yOffset: -0.18 + (Math.random() - 0.5) * 0.28,
        speed: 0.14 + Math.random() * 0.06,
        angle: (i / secondaryAsteroids) * Math.PI * 2 + Math.random() * 0.4,
      });
    }

    asteroidOrbitData.forEach((rock) => {
      const p = rock.angle;
      rock.mesh.position.set(
        orbitCenter.x + Math.cos(p) * rock.radius,
        orbitCenter.y + rock.yOffset,
        orbitCenter.z + Math.sin(p) * rock.radius * rock.depth,
      );
    });

    asteroidGroup.position.y = 0;
    scene.add(asteroidGroup);

    const shape = new THREE.Shape();
    shape.moveTo(0.375, 3.15);
    shape.lineTo(1.5, 3.15);
    shape.lineTo(0.225, 0.75);
    shape.lineTo(1.65, 0.75);
    shape.lineTo(-0.6, -3.6);
    shape.lineTo(0.225, -0.15);
    shape.lineTo(-1.2, -0.15);
    shape.lineTo(0.375, 3.15);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelOffset: 0,
      bevelSegments: 16,
    });
    geometry.center();

    const boltMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.thunder),
      emissive: new THREE.Color(theme.thunder),
      emissiveIntensity: 0.8,
      metalness: 1,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      reflectivity: 1,
    });

    const thunderbolt = new THREE.Mesh(geometry, boltMaterial);
    thunderbolt.scale.setScalar(0.58);
    thunderbolt.position.set(0, 2.25, 0.42);
    thunderbolt.rotation.z = 0.03;
    scene.add(thunderbolt);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const clock = new THREE.Clock();
    let frameId = null;
    let isVisible = true;
    let isInViewport = true;

    const startLoop = () => {
      if (!frameId && isVisible && isInViewport) {
        clock.start();
        loop();
      }
    };
    const stopLoop = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
        clock.stop();
      }
    };

    const loop = () => {
      const time = clock.getElapsedTime();

      thunderbolt.position.y = 2.25 + Math.sin(time * 1.3) * 0.08;
      thunderbolt.rotation.y = Math.sin(time * 0.3) * 0.09;
      thunderbolt.rotation.z = 0.03 + Math.sin(time * 0.95) * 0.013;

      asteroidOrbitData.forEach((rock, idx) => {
        const phase = rock.angle + time * rock.speed;
        rock.mesh.position.x = orbitCenter.x + Math.cos(phase) * rock.radius;
        rock.mesh.position.z = orbitCenter.z + Math.sin(phase) * rock.radius * rock.depth;
        rock.mesh.position.y = orbitCenter.y + rock.yOffset + Math.sin(time * 1.2 + rock.bob) * 0.06;
        rock.mesh.rotation.x += 0.0008 + idx * 0.000004;
        rock.mesh.rotation.y += 0.001;
      });

      beamAura.material.opacity = 0.69 + Math.sin(time * 2.3) * 0.14;
      beamCore.material.opacity = 0.6 + Math.sin(time * 2.6) * 0.18;
      ring.rotation.z += 0.0022;
      ringInner.rotation.z -= 0.0017;
      beamLight.intensity = 4.9 + Math.sin(time * 2.7) * 0.55;

      camera.position.x += (mouse.x * 0.65 - camera.position.x) * 0.03;
      camera.position.y += (0.96 + mouse.y * 0.22 - camera.position.y) * 0.03;
      camera.lookAt(0, 1.26, 0);

      stars.rotation.y += 0.00016;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(loop);
    };

    // Pause when tab is hidden, resume when visible again
    const cleanupPageVis = watchPageVisibility(
      () => { isVisible = true; startLoop(); },
      () => { isVisible = false; stopLoop(); }
    );

    // Pause when scrolled out of viewport, resume when scrolled back in
    const cleanupObserver = observeElement(
      mountElement,
      () => { isInViewport = true; startLoop(); },
      () => { isInViewport = false; stopLoop(); }
    );

    startLoop();

    return () => {
      stopLoop();
      cleanupPageVis();
      cleanupObserver();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);

      asteroidGroup.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });

      geometry.dispose();
      boltMaterial.dispose();
      starsGeometry.dispose();
      dustTexture.dispose();
      glowTexture.dispose();
      beamAuraMaterial.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      ringInner.geometry.dispose();
      ringInner.material.dispose();
      beamCore.geometry.dispose();
      beamCore.material.dispose();
      nebulaDust.material.dispose();
      renderer.dispose();

      if (mountElement?.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return <div ref={mountRef} className="absolute inset-0" data-testid="space-hero-webgl-canvas" />;
};
