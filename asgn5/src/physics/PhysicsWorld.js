import * as THREE from 'three';

/**
 * PhysicsWorld wraps Ammo.js initialization and stepping.
 * Maps Ammo rigid bodies to Three.js objects.
 */
export class PhysicsWorld {
    constructor() {
        // Initialization needs to wait for Ammo() promise
        this.world = null;
        this.rigidBodies = [];
        this.tmpTrans = new Ammo.btTransform();
    }

    init() {
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const broadphase = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();

        this.world = new Ammo.btDiscreteDynamicsWorld(
            dispatcher,
            broadphase,
            solver,
            collisionConfiguration
        );
        // Default gravity in units/s^2
        this.world.setGravity(new Ammo.btVector3(0, -30, 0));
    }

    /**
     * Create a static box body for ground or obstacles.
     */
    addStaticBox(mesh, sizeX, sizeY, sizeZ) {
        mesh.updateMatrixWorld();
        const position = mesh.position;
        const quaternion = mesh.quaternion;

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

        const motionState = new Ammo.btDefaultMotionState(transform);

        const halfExtents = new Ammo.btVector3(sizeX * 0.5, sizeY * 0.5, sizeZ * 0.5);
        const shape = new Ammo.btBoxShape(halfExtents);
        shape.setMargin(0.05);

        const localInertia = new Ammo.btVector3(0, 0, 0);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        this.world.addRigidBody(body);
        return body;
    }

    /**
     * Create a static rigid body perfectly matching a visual mesh geometry.
     */
    addStaticMesh(mesh) {
        mesh.updateMatrixWorld();
        const geometry = mesh.geometry;

        // Ensure we're using world coordinates for the vertices
        const position = geometry.attributes.position;
        const index = geometry.index;

        const ammoMesh = new Ammo.btTriangleMesh();

        const p1 = new Ammo.btVector3();
        const p2 = new Ammo.btVector3();
        const p3 = new Ammo.btVector3();

        // Helper to convert local vertex to world coordinate
        const v = new THREE.Vector3();
        const getVertex = (idx, target) => {
            v.fromBufferAttribute(position, idx);
            v.applyMatrix4(mesh.matrixWorld);
            target.setValue(v.x, v.y, v.z);
        };

        if (index !== null) {
            for (let i = 0; i < index.count; i += 3) {
                getVertex(index.getX(i), p1);
                getVertex(index.getX(i + 1), p2);
                getVertex(index.getX(i + 2), p3);
                ammoMesh.addTriangle(p1, p2, p3, true);
            }
        } else {
            for (let i = 0; i < position.count; i += 3) {
                getVertex(i, p1);
                getVertex(i + 1, p2);
                getVertex(i + 2, p3);
                ammoMesh.addTriangle(p1, p2, p3, true);
            }
        }

        const shape = new Ammo.btBvhTriangleMeshShape(ammoMesh, true, true);

        // For btBvhTriangleMeshShape, the transform is usually identity because we baked 
        // the world transform directly into the vertices when creating the btTriangleMesh.
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        const motionState = new Ammo.btDefaultMotionState(transform);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, new Ammo.btVector3(0, 0, 0));
        const body = new Ammo.btRigidBody(rbInfo);

        this.world.addRigidBody(body);
        return body;
    }

    /**
     * Create a dynamic box or capsule. For simplicity, we use a box for the player.
     * Set preventRotation=true for character controllers, false for general rigid bodies.
     */
    addDynamicBody(mesh, mass, shape, preventRotation = false) {
        mesh.updateMatrixWorld();
        const position = mesh.position;
        const quaternion = mesh.quaternion;

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

        const motionState = new Ammo.btDefaultMotionState(transform);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        if (preventRotation) {
            // Prevent rotation for a standard character controller feel
            body.setAngularFactor(new Ammo.btVector3(0, 0, 0));
        }
        // Keep active
        body.setActivationState(4); // DISABLE_DEACTIVATION

        this.world.addRigidBody(body);

        this.rigidBodies.push({ mesh, body });
        return body;
    }

    /**
     * Create a dynamic sphere.
     */
    addDynamicSphere(mesh, mass, radius) {
        const shape = new Ammo.btSphereShape(radius);
        return this.addDynamicBody(mesh, mass, shape, false);
    }

    /**
     * Create a dynamic box/cube.
     */
    addDynamicCube(mesh, mass, sizeX, sizeY, sizeZ) {
        const halfExtents = new Ammo.btVector3(sizeX * 0.5, sizeY * 0.5, sizeZ * 0.5);
        const shape = new Ammo.btBoxShape(halfExtents);
        shape.setMargin(0.05);
        return this.addDynamicBody(mesh, mass, shape, false);
    }

    /**
     * Create a kinematic character body.
     */
    createPlayerShape(radius, height) {
        // A capsule shape is best for players
        return new Ammo.btCapsuleShape(radius, height);
    }

    update(delta) {
        if (!this.world) return;

        // Step simulation
        this.world.stepSimulation(delta, 10);

        // Update Three.js meshes
        for (let i = 0; i < this.rigidBodies.length; i++) {
            const obj = this.rigidBodies[i];
            const ms = obj.body.getMotionState();
            if (ms) {
                ms.getWorldTransform(this.tmpTrans);
                const p = this.tmpTrans.getOrigin();
                const q = this.tmpTrans.getRotation();

                obj.mesh.position.set(p.x(), p.y(), p.z());
                obj.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }
        }
    }
}
