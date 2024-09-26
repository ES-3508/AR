import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function ModelViewer() {
  const ref = useRef();

  useEffect(() => {
    // Initialize Three.js renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    ref.current.appendChild(renderer.domElement);

    // Create Three.js scene
    const scene = new THREE.Scene();

    // Create camera
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(0, 1, 2); // Position the camera

    // Add light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Load 3D model using GLTFLoader
    const loader = new GLTFLoader();
    let model = null;

    loader.load('/models/ice.glb', (gltf) => {
      console.log('Model loaded successfully'); // Debug message
      model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5); // Adjust model size as needed
      scene.add(model);
    }, undefined, (error) => {
      console.error('An error occurred while loading the model', error);
    });

    // Animation loop to render the scene
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the model for visualization if loaded
      if (model) {
        model.rotation.y += 0.01; // Rotate the model for a better view
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on component unmount
    return () => {
      renderer.dispose();
    };
  }, []);

  return <div ref={ref}></div>;
}

function App() {
  return (
    <div>
      <ModelViewer />
    </div>
  );
}

export default App;
