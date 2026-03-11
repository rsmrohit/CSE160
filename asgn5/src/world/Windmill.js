import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Windmill — loads the windmill GLTF model and sets up shadows / color spaces.
 *
 * Emits a callback when the model is ready so other systems
 * can process it.
 */
export class Windmill {
    constructor(scene, {
        modelPath = 'resources/models/windmill/windmill_001.glb',
        onProgress = null,
        onLoaded = null,
        onError = null,
    } = {}) {
        this.scene = scene;
        this.model = null;

        const loader = new GLTFLoader();

        loader.load(
            modelPath,
            (gltf) => {
                this.model = gltf.scene;

                // Enable shadows and fix color spaces on every mesh
                this.model.traverse((child) => {
                    if (!child.isMesh) return;
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const mats = Array.isArray(child.material)
                        ? child.material
                        : [child.material];

                    mats.forEach((mat) => {
                        if (!mat) return;
                        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
                        if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                        if (mat.envMap) mat.envMap.colorSpace = THREE.SRGBColorSpace;
                        mat.needsUpdate = true;
                    });
                });

                scene.add(this.model);
                if (onLoaded) onLoaded(this.model);
            },
            (xhr) => {
                if (onProgress && xhr.lengthComputable) {
                    const pct = Math.round((xhr.loaded / xhr.total) * 100);
                    onProgress(pct);
                }
            },
            (error) => {
                console.error('Failed to load windmill model:', error);
                if (onError) onError(error);
            }
        );
    }
}
