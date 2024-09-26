import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function ARScene() {
  const ref = useRef();
  const [renderer, setRenderer] = useState(null);

  useEffect(() => {
    if (navigator.xr) {
      // Initialize Three.js renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      setRenderer(renderer);
      ref.current.appendChild(renderer.domElement);

      // Add AR button to start session
      document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

      // Create Three.js scene, camera, and light
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
      scene.add(camera);
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      // Load 3D model using GLTFLoader
      const loader = new GLTFLoader();
      let model = null;

      loader.load('/models/burger.glb', (gltf) => {
        model = gltf.scene;
        model.scale.set(0.1, 0.1, 0.1); // Adjust model size as needed
        model.visible = false; // Initially hidden until placed
        scene.add(model);
      }, undefined, (error) => {
        console.error('An error occurred while loading the model', error);
      });

      // WebXR session variables for hit-testing
      let hitTestSource = null;
      let localReferenceSpace = null;

      // Renderer loop
      renderer.setAnimationLoop((timestamp, frame) => {
        if (frame) {
          // Get hit-test results
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          // If a surface is detected
          if (hitTestResults.length > 0 && model) {
            const hit = hitTestResults[0];
            const referenceSpace = renderer.xr.getReferenceSpace();
            const pose = hit.getPose(referenceSpace);

            // Make model visible and adjust its position
            model.visible = true;
            model.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
            model.quaternion.set(
              pose.transform.orientation.x,
              pose.transform.orientation.y,
              pose.transform.orientation.z,
              pose.transform.orientation.w
            );
          }
        }

        renderer.render(scene, camera);
      });

      // When the AR session starts, set up hit-testing
      renderer.xr.addEventListener('sessionstart', async () => {
        const session = renderer.xr.getSession();

        // Request a hit-test source to find surfaces
        localReferenceSpace = await session.requestReferenceSpace('local');
        const viewerSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

        // On screen tap, fix the model's position to the detected surface
        session.addEventListener('select', () => {
          if (model) {
            console.log('Surface selected, model placed'); // Debug message
            model.visible = true; // Make the model visible
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
