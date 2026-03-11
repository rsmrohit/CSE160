/**
 * main.js — Entry point.
 * Wires together Engine, Input, World, Physics, and UI.
 */

import * as THREE from 'three';
import { Engine } from './src/core/Engine.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { setupLighting } from './src/world/Lighting.js';
import { createGround } from './src/world/Ground.js';
import { Windmill } from './src/world/Windmill.js';
import { LoadingUI } from './src/ui/LoadingUI.js';
import { PhysicsWorld } from './src/physics/PhysicsWorld.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// Initialize RectAreaLight support
RectAreaLightUniformsLib.init();

// Wait for Ammo to load and initialize via WASM
Ammo().then(() => {
    // ─── Bootstrap ────────────────────────────────────────────────────────────────
    const canvas = document.getElementById('webgl');

    // Core systems
    const engine = new Engine(canvas);
    const loadingUI = new LoadingUI();

    // Physics
    const physics = new PhysicsWorld();
    physics.init();
    engine.addSystem(physics);

    // Controls
    const controls = new PointerLockControls(engine.camera, document.body);

    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '50%';
    instructions.style.transform = 'translateX(-50%)';
    instructions.style.color = 'white';
    instructions.style.background = 'rgba(0,0,0,0.5)';
    instructions.style.padding = '10px';
    instructions.style.cursor = 'pointer';
    instructions.style.zIndex = '100';
    instructions.innerHTML = 'Click here to play (FPS controls)';
    document.body.appendChild(instructions);

    instructions.addEventListener('click', () => {
        controls.lock();
    });
    controls.addEventListener('lock', () => {
        instructions.style.display = 'none';
    });
    controls.addEventListener('unlock', () => {
        instructions.style.display = 'block';
    });

    let currentThrowable = 0; // 0: Sphere, 1: Cube, 2: Textured Cube, 3: Light Object
    const throwableTypes = ['Sphere', 'Cube', 'Textured Cube', 'Light Object'];
    const uiModeElement = document.getElementById('throwable-mode');

    const moveState = { forward: false, backward: false, left: false, right: false, jump: false };
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveState.forward = true; break;
            case 'KeyS': moveState.backward = true; break;
            case 'KeyA': moveState.left = true; break;
            case 'KeyD': moveState.right = true; break;
            case 'Space': moveState.jump = true; break;
            case 'KeyG':
                if (controls.isLocked) {
                    currentThrowable = (currentThrowable + 1) % 4;
                    if (uiModeElement) uiModeElement.innerText = `Current Item: ${throwableTypes[currentThrowable]}`;
                }
                break;
        }
    });
    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveState.forward = false; break;
            case 'KeyS': moveState.backward = false; break;
            case 'KeyA': moveState.left = false; break;
            case 'KeyD': moveState.right = false; break;
            case 'Space': moveState.jump = false; break;
        }
    });

    // World setup
    setupLighting(engine.scene);

    // Create visual ground
    const groundMesh = createGround(engine.scene);

    // Add physics body for ground (matches vertex geometry)
    physics.addStaticMesh(groundMesh);

    // Player Physics setup
    const playerObject = new THREE.Object3D();
    playerObject.position.set(0, 5, 10);
    const boxSize = new THREE.Vector3(1.0, 2.0, 1.0); // 1x2x1 box
    const halfExtents = new Ammo.btVector3(boxSize.x * 0.5, boxSize.y * 0.5, boxSize.z * 0.5);
    const playerShape = new Ammo.btBoxShape(halfExtents);
    const playerBody = physics.addDynamicBody(playerObject, 60, playerShape, true); // true to lock rotation

    // Wireframe for player
    const playerViz = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z),
        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    );
    playerObject.add(playerViz);
    engine.scene.add(playerObject);

    // Remove friction so we easily slide over ground
    playerBody.setFriction(0.0);
    // Don't sleep
    playerBody.setActivationState(4);

    const tmpVec = new Ammo.btVector3();

    const playerSystem = {
        update(delta) {
            if (!controls.isLocked) return;

            // Align camera to physics player object
            engine.camera.position.copy(playerObject.position);
            engine.camera.position.y += 0.8; // eye height above center

            // Movement logic applying forces/velocities
            const moveSpeed = 10.0;

            // PointerLockControls has native getDirection / getRight
            const forward = new THREE.Vector3();
            controls.getDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3();
            right.crossVectors(forward, engine.camera.up).normalize();

            const desiredVelocity = new THREE.Vector3();
            if (moveState.forward) desiredVelocity.add(forward);
            if (moveState.backward) desiredVelocity.sub(forward);
            if (moveState.right) desiredVelocity.add(right);
            if (moveState.left) desiredVelocity.sub(right);

            if (desiredVelocity.lengthSq() > 0) {
                desiredVelocity.normalize().multiplyScalar(moveSpeed);

                // Get current velocity
                const velocity = playerBody.getLinearVelocity();

                // Apply horizontal movement directly
                tmpVec.setValue(desiredVelocity.x, velocity.y(), desiredVelocity.z);
                playerBody.setLinearVelocity(tmpVec);
            } else {
                // Instantly stop horizontal sliding
                const velocity = playerBody.getLinearVelocity();
                tmpVec.setValue(0, velocity.y(), 0);
                playerBody.setLinearVelocity(tmpVec);
            }

            // Jump
            if (moveState.jump) {
                const velocity = playerBody.getLinearVelocity();
                // Simple check if roughly not moving vertically (close to ground)
                // Increased threshold from 0.1 to 2.0 to account for physics jitter when resting
                if (Math.abs(velocity.y()) < 2.0) {
                    tmpVec.setValue(velocity.x(), 12, velocity.z());
                    playerBody.setLinearVelocity(tmpVec);
                }
                moveState.jump = false;
            }
        }
    };
    engine.addSystem(playerSystem);

    const textureLoader = new THREE.TextureLoader();
    const flowerTexture = textureLoader.load('./resources/images/flower-1.jpg');

    // Pre-allocate Light Pool to prevent shader recompilation lag
    const numLights = 5;
    const lightPool = [];
    let lightIndex = 0;

    for (let i = 0; i < numLights; i++) {
        // Point Light Object (Sphere)
        const pMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshStandardMaterial({ emissive: 0xffaa00, emissiveIntensity: 2.0, color: 0x000000 })
        );
        const pLight = new THREE.PointLight(0xffaa00, 0, 20); // starts with 0 intensity
        pMesh.add(pLight);
        pMesh.castShadow = true;
        pMesh.receiveShadow = true;
        pMesh.position.set(0, -100, 0); // Keep visible but off-screen
        engine.scene.add(pMesh);
        lightPool.push({ mesh: pMesh, light: pLight, body: null });
    }

    document.addEventListener('click', () => {
        if (!controls.isLocked) return;

        let mesh;
        let mass = 1.0;
        let body;

        const direction = new THREE.Vector3();
        engine.camera.getWorldDirection(direction);

        if (currentThrowable === 3) {
            // Use pooled light object
            const pooled = lightPool[lightIndex];
            lightIndex = (lightIndex + 1) % numLights;

            pooled.mesh.visible = true;
            pooled.light.intensity = 100;

            pooled.mesh.position.copy(engine.camera.position);
            pooled.mesh.position.addScaledVector(direction, 2.0);

            if (!pooled.body) {
                pooled.body = physics.addDynamicSphere(pooled.mesh, mass, 0.3);
            } else {
                // Teleport existing physics body
                const transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(pooled.mesh.position.x, pooled.mesh.position.y, pooled.mesh.position.z));

                pooled.body.setWorldTransform(transform);
                if (pooled.body.getMotionState()) {
                    pooled.body.getMotionState().setWorldTransform(transform);
                }
                pooled.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
                pooled.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
                pooled.body.clearForces();

                // Wake up the body
                pooled.body.activate(true);
            }
            body = pooled.body;

        } else {
            // Standard objects
            switch (currentThrowable) {
                case 0: // Sphere
                    mesh = new THREE.Mesh(
                        new THREE.SphereGeometry(0.5, 16, 16),
                        new THREE.MeshStandardMaterial({ color: 0x0055ff, roughness: 0.3 })
                    );
                    break;
                case 1: // Cube
                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(1.0, 1.0, 1.0),
                        new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5 })
                    );
                    break;
                case 2: // Textured Cube (Flower)
                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(1.0, 1.0, 1.0),
                        new THREE.MeshStandardMaterial({ map: flowerTexture, roughness: 0.8 })
                    );
                    break;
            }

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.position.copy(engine.camera.position);
            mesh.position.addScaledVector(direction, 2.0);
            engine.scene.add(mesh);

            if (currentThrowable === 0) {
                body = physics.addDynamicSphere(mesh, mass, 0.5);
            } else {
                body = physics.addDynamicCube(mesh, mass, 1.0, 1.0, 1.0);
            }
        }

        // Apply velocity
        const shootSpeed = currentThrowable === 3 ? 15.0 : 30.0;
        tmpVec.setValue(direction.x * shootSpeed, direction.y * shootSpeed, direction.z * shootSpeed);
        body.setLinearVelocity(tmpVec);
    });

    // ─── Load Windmill ────────────────────────────────────────────────────────────
    loadingUI.setStatus('Loading…');

    new Windmill(engine.scene, {
        onProgress(pct) {
            loadingUI.setStatus(`Loading: ${pct}%`);
        },

        onLoaded(model) {
            // Add a simple bounding box collider for the windmill
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

            const windmillCollider = new THREE.Object3D();
            windmillCollider.position.copy(center);

            // Inflate slightly
            const windmillBody = physics.addStaticBox(windmillCollider, size.x + 0.5, size.y + 0.5, size.z + 0.5);
            windmillBody.setFriction(0.0);

            // Wireframe for Windmill Collider
            const windmillViz = new THREE.Mesh(
                new THREE.BoxGeometry(size.x + 0.5, size.y + 0.5, size.z + 0.5),
                new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
            );
            windmillCollider.add(windmillViz);
            engine.scene.add(windmillCollider);

            loadingUI.setStatus('Ready!');
            setTimeout(() => loadingUI.hide(), 800);
        },

        onError(_err) {
            loadingUI.setStatus('Error loading model — check the console.');
        },
    });

    // ─── Go! ──────────────────────────────────────────────────────────────────────
    engine.start();
});