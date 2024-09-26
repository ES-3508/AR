import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

function ARScene() {
  const ref = useRef();
  const [renderer, setRenderer] = useState(null);

  useEffect(() => {
    if (navigator.xr) {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      setRenderer(renderer);
      ref.current.appendChild(renderer.domElement);

      // Create AR Button
      document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

      // Create Scene, Camera, and Lighting
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
      scene.add(camera);
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      // Add a simple cube for debugging
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0, -0.5); // Place cube in front of the camera
      scene.add(cube);

      // Animation loop
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

      // Cleanup
      return () => {
        if (renderer && renderer.xr.getSession()) {
          renderer.xr.getSession().end();
        }
        renderer.dispose();
      };
    } else {
      console.error('WebXR is not supported on this device or browser.');
    }
  }, []);

  return <div ref={ref}></div>;
}

function App() {
  return (
    <div>
      <ARScene />
    </div>
  );
}

export default App;
