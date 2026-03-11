import * as THREE from 'three';

/**
 * Engine — owns the renderer, scene, camera, resize handler, and animation loop.
 */
export class Engine {
    constructor(canvas) {
        // ─── Renderer ─────────────────────────────────────────────────
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // ─── Scene ────────────────────────────────────────────────────
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

        // ─── Camera ───────────────────────────────────────────────────
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 6);

        // ─── Clock ────────────────────────────────────────────────────
        this.clock = new THREE.Clock();

        // Resize handling
        window.addEventListener('resize', () => this._onResize());

        // Systems that receive update(delta) each frame
        this._updateSystems = [];
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    }

    /**
     * Register an object with an `update(delta)` method to be called each frame.
     */
    addSystem(system) {
        this._updateSystems.push(system);
    }

    /**
     * Start the render loop.
     */
    start() {
        this.renderer.setAnimationLoop((time) => {
            const delta = Math.min(this.clock.getDelta(), 0.1);

            for (const sys of this._updateSystems) {
                sys.update(delta);
            }

            this.renderer.render(this.scene, this.camera);
        });
    }
}
