// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// camera.js - Camera class for managing view and projection

class Camera {
  constructor() {
    // Camera position in world space
    this.position = new Vector3([0, 2, 5]);
    
    // Camera rotation (Euler angles in degrees)
    this.pan = 0;   // Rotation around Y axis (left/right)
    this.tilt = 0;  // Rotation around X axis (up/down)
    
    // Projection parameters
    this.fov = 60;         // Field of view in degrees
    this.near = 0.1;       // Near clipping plane
    this.far = 100.0;      // Far clipping plane
    this.aspect = 640/480; // Aspect ratio (will be updated)
    
    // Matrices
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    
    // Target point (for lookAt)
    this.target = new Vector3([0, 0, 0]);
    
    // Up vector
    this.up = new Vector3([0, 1, 0]);
    
    this.updateProjectionMatrix();
  }
  
  /**
   * Reset camera to default position and orientation
   */
  reset() {
    this.position = new Vector3([0, 2, 5]);
    this.pan = 0;
    this.tilt = 0;
  }
  
  /**
   * Update projection matrix based on current parameters
   */
  updateProjectionMatrix() {
    this.projectionMatrix.setPerspective(
      this.fov,
      this.aspect,
      this.near,
      this.far
    );
  }
  
  /**
   * Update view matrix based on current position and rotation
   */
  updateViewMatrix() {
    // Calculate camera forward direction from pan and tilt
    let panRad = this.pan * Math.PI / 180;
    let tiltRad = this.tilt * Math.PI / 180;
    
    // Forward vector (where camera is looking)
    let forward = new Vector3([
      Math.sin(panRad) * Math.cos(tiltRad),
      Math.sin(tiltRad),
      -Math.cos(panRad) * Math.cos(tiltRad)
    ]);
    
    // Calculate target point
    this.target = new Vector3([
      this.position.elements[0] + forward.elements[0],
      this.position.elements[1] + forward.elements[1],
      this.position.elements[2] + forward.elements[2]
    ]);
    
    // Set view matrix using lookAt
    this.viewMatrix.setLookAt(
      this.position.elements[0], this.position.elements[1], this.position.elements[2],
      this.target.elements[0], this.target.elements[1], this.target.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }
  
  /**
   * Move camera forward/backward in the direction it's facing
   */
  moveForward(distance) {
    let panRad = this.pan * Math.PI / 180;
    
    // Move in XZ plane (ignore tilt for movement)
    this.position.elements[0] += Math.sin(panRad) * distance;
    this.position.elements[2] -= Math.cos(panRad) * distance;
  }

    // Added
  moveForwardGet(distance) {
    let panRad = this.pan * Math.PI / 180;

    return [this.position.elements[0] + Math.sin(panRad) * distance, this.position.elements[1], this.position.elements[2] - Math.cos(panRad) * distance];
  }
  
  /**
   * Move camera right/left perpendicular to facing direction
   */
  moveRight(distance) {
    let panRad = this.pan * Math.PI / 180;
    
    // Right vector is perpendicular to forward in XZ plane
    this.position.elements[0] += Math.cos(panRad) * distance;
    this.position.elements[2] += Math.sin(panRad) * distance;
  }

  // Added
  moveRightGet(distance) {
    let panRad = this.pan * Math.PI / 180;

    return [this.position.elements[0] + Math.cos(panRad) * distance, this.position.elements[1], this.position.elements[2] + Math.sin(panRad) * distance];
  }
  
  /**
   * Move camera up/down in world space
   */
  moveUp(distance) {
    this.position.elements[1] += distance;
  }
  
  /**
   * Update camera matrices (call this before rendering)
   */
  update() {
    this.updateViewMatrix();
  }
  
  /**
   * Get the view matrix for rendering
   */
  getViewMatrix() {
    return this.viewMatrix;
  }
  
  /**
   * Get the projection matrix for rendering
   */
  getProjectionMatrix() {
    return this.projectionMatrix;
  }
  
  /**
   * Set aspect ratio and update projection matrix
   */
  setAspectRatio(width, height) {
    this.aspect = width / height;
    this.updateProjectionMatrix();
  }
}