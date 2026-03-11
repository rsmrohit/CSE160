import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

/**
 * Ground — creates procedural rolling hills.
 */
export function createGround(scene) {
    const size = 150;
    const segments = 64; // Subdivisions for the hills

    // Create detailed plane
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2); // Lay flat

    const positions = geometry.attributes.position;

    // Initialize noise
    const noise2D = createNoise2D();

    // Deform vertices
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Multi-layered noise (Fractal Brownian Motion)
        // Adjust these to change the shape/frequency of hills
        const scale1 = 0.05;
        const scale2 = 0.15;

        // y is the vertical axis after rotation
        let y = noise2D(x * scale1, z * scale1) * 1.5; // Broad hills (reduced intensity)
        y += noise2D(x * scale2, z * scale2) * 0.5;   // Small bumps (reduced intensity)

        positions.setY(i, y);
    }

    // Essential for shading to work correctly on modified geometry
    geometry.computeVertexNormals();

    const ground = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
            color: 0x5a8a3c,
            roughness: 0.9,
            flatShading: true // Can look nice for low-poly terrain, set to false for smooth hills
        })
    );
    ground.receiveShadow = true;
    scene.add(ground);

    return ground;
}
