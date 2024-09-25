import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

function ARScene() {
  const [renderer, setRenderer] = useState(null);
  const ref = useRef();

  useEffect(() => {
    // Check if WebXR is supported
    if (navigator.xr) {
      // Initialize the Three.js renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      setRenderer(renderer);

      // Append the renderer to the DOM
      ref.current.appendChild(renderer.domElement);

      // Add AR Button to the DOM to start the AR session
      document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

      // Create Three.js scene and camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
      scene.add(camera);

      // Add lighting to the scene
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      // Create a virtual object (cube) to place in AR space
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      cube.visible = false; // Initially invisible until placed
      scene.add(cube);

      // Renderer loop
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

      // WebXR session variables
      let hitTestSource = null;
      let localReferenceSpace = null;

      // Setup hit-testing when AR session starts
      renderer.xr.addEventListener('sessionstart', () => {
        const session = renderer.xr.getSession();

        session.requestReferenceSpace('viewer').then((referenceSpace) => {
          localReferenceSpace = referenceSpace;

          session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            hitTestSource = source;
          });
        });

        // Handle object placement on screen tap
        session.addEventListener('select', () => {
          if (hitTestSource && cube) {
            cube.visible = true;
          }
        });
      });

      // Clean up when component unmounts
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
