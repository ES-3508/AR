import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

function ARModelViewer({ modelPath, modelScale = [0.1, 0.1, 0.1] }) {
  const ref = useRef();
  const [isARSessionStarted, setARSessionStarted] = useState(false);
  const [hasSurface, setHasSurface] = useState(false);

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
    let isModelPlaced = false; // Track if model has been placed

    loader.load(modelPath, (gltf) => {
      model = gltf.scene;
      model.scale.set(...modelScale); // Adjust model size based on props
      model.visible = false; // Initially hide the model
      scene.add(model);
    }, undefined, (error) => {
      console.error('An error occurred while loading the model', error);
    });

    // Variables for hit-testing
    let hitTestSource = null;

    // Add a reticle for visual feedback
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.06, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    reticle.visible = false;
    scene.add(reticle);

    // Renderer loop to render the scene
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        // If hit test detects a surface
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace();
          const pose = hit.getPose(referenceSpace);

          // Place reticle on the detected surface
          reticle.visible = true;
          setHasSurface(true);
          reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
          reticle.quaternion.set(
            pose.transform.orientation.x,
            pose.transform.orientation.y,
            pose.transform.orientation.z,
            pose.transform.orientation.w
          );

          // Move model along with the reticle until it's placed
          if (!isModelPlaced && model) {
            model.visible = true;
            model.position.copy(reticle.position);
            model.quaternion.copy(reticle.quaternion);
          }
        } else {
          reticle.visible = false; // Hide reticle when no surface is detected
          setHasSurface(false);
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

      // On user tap, place the model at reticle position and stop moving it
      session.addEventListener('select', () => {
        if (model && reticle.visible) {
          // Confirm model placement
          isModelPlaced = true;
          model.position.copy(reticle.position);
          model.quaternion.copy(reticle.quaternion);
          console.log('Model placed on surface'); // Debug message
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
  }, [modelPath, modelScale]);

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
      {/* Surface Detection Indicator */}
      {isARSessionStarted && !hasSurface && (
        <div style={styles.surfaceWarning}>
          <p>Looking for a flat surface...</p>
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
  surfaceWarning: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    padding: '10px',
    borderRadius: '5px',
    zIndex: 10,
  },
};

function App() {
  return (
    <div>
      {/* Example Usage of ARModelViewer Component */}
      <ARModelViewer modelPath="/models/ice.glb" modelScale={[0.1, 0.1, 0.1]} />
      {/* To use with a different model */}
      <ARModelViewer modelPath="/models/burger.glb" modelScale={[0.1, 0.1, 0.1]} />
      {/* <ARModelViewer modelPath="/models/car.glb" modelScale={[0.2, 0.2, 0.2]} /> */}
    </div>
  );
}

export default App;
