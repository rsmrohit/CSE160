import * as THREE from 'three';

/**
 * Lighting — sets up ambient, directional sun, hemisphere, and fill lights.
 */
export function setupLighting(scene) {
    // Warm ambient
    const ambientLight = new THREE.AmbientLight(0xfff4e0, 0.6);
    scene.add(ambientLight);

    // Directional "sun"
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    // Sky / ground hemisphere
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x5a8a3c, 0.8);
    scene.add(hemiLight);

    // Soft fill from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-3, 2, 5);
    scene.add(fillLight);

    return { ambientLight, sunLight, hemiLight, fillLight };
}
