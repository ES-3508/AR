import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

function ARScene() {
  const ref = useRef();
  const [isARSessionStarted, setARSessionStarted] = useState(false);

  useEffect(() => {
    // Initialize Three.js renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // Enable WebXR
    ref.current.appendChild(renderer.domElement);

    // Create scene, camera, and lighting
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    scene.add(camera);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Add AR button to enter AR session
    const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
    document.body.appendChild(arButton);

    // Load model using GLTFLoader
    const loader = new GLTFLoader();
    let model = null;

    loader.load('/models/ice.glb', (gltf) => {
      model = gltf.scene;
      model.scale.set(0.1, 0.1, 0.1); // Adjust model size if needed
      model.visible = false; // Initially hide the model
      scene.add(model);
    }, undefined, (error) => {
      console.error('An error occurred while loading the model', error);
    });

    // Variables for hit-testing
    let hitTestSource = null;

    // Renderer loop to render the scene
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        // If hit test detects a surface
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace();
          const pose = hit.getPose(referenceSpace);

          // If model is loaded, position it on the detected surface
          if (model) {
            model.visible = true; // Make model visible when a surface is detected
            model.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
            model.quaternion.set(
              pose.transform.orientation.x,
              pose.transform.orientation.y,
              pose.transform.orientation.z,
              pose.transform.orientation.w
            );
          }
        }
      }

      renderer.render(scene, camera);
    });

    // Set up AR hit-testing when the session starts
    renderer.xr.addEventListener('sessionstart', async () => {
      setARSessionStarted(true); // Hide instructions when session starts
      const session = renderer.xr.getSession();
      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

      // On user tap, confirm model placement
      session.addEventListener('select', () => {
        if (model) {
          console.log('Model placed on surface'); // Debug message
          model.visible = true; // Make the model visible
        }
      });
    });

    // Cleanup on component unmount
    return () => {
      if (renderer && renderer.xr.getSession()) {
        renderer.xr.getSession().end();
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div>
      {/* AR View */}
      <div ref={ref} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>

      {/* Instruction Overlay */}
      {!isARSessionStarted && (
        <div style={styles.instructions}>
          <h2>Point your camera at a flat surface</h2>
          <p>Move your device around to find a surface, then tap to place the model.</p>
          <p style={{ fontSize: '0.8em', color: '#999' }}>Tap 'Start AR' to begin</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  instructions: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    zIndex: 10,
  },
};

function App() {
  return (
    <div>
      <ARScene />
    </div>
  );
}

export default App;
