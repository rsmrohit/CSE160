// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// world.js - World scene management

var map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

class World {
  constructor(gl, textureManager) {
    this.gl = gl;
    this.textureManager = textureManager;
    this.objects = [];
    this.placedBlocks = new Map();
    this.grassCrosses = [];
    this.grassSwayTime = 0;
    
    // Initialize the world
    this.init();
  }
  
  /**
   * Initialize the world with default objects and textures
   */
  init() {
    // Create a default checkerboard texture for testing
    this.textureManager.createCheckerboardTexture('checkerboard', 64, [200, 200, 200], [50, 50, 50]);
    
    // Load custom textures
    this.textureManager.loadTexture('none', 'images/Untiled.jpg');
    this.textureManager.loadTexture('wall', 'images/wall.png');
    this.textureManager.loadTexture('ground', 'images/ground.png');
    this.textureManager.loadTexture('grass', 'images/grass.png');
    this.textureManager.loadTexture('myst', 'images/2508.jpg');
    
    // Create the test scene
    this.createTestScene();
    
    // Create walls from the map
    this.createWallsFromMap();

    // Scatter decorative grass crosses
    this.createGrassCrosses();
  }
  
  /**
   * Create walls based on the map array
   */
  createWallsFromMap() {
    const length = 5; // Size of each wall block
    const mapRows = map.length;
    const mapCols = map[0].length;
    
    // Center offset to place map at origin
    const offsetX = -length * mapCols / 2;
    const offsetZ = -length * mapRows / 2;
    
    for (let i = 0; i < mapRows; i++) {
      for (let j = 0; j < mapCols; j++) {
        if (map[i][j] === 1) {
          const wallBlock = new TexturedCube();
          wallBlock.position = [
            j * length + offsetX,
            length / 2, // Center wall vertically (half of wall height)
            i * length + offsetZ
          ];
          wallBlock.scale = [length, length, length];
          wallBlock.color = [0.7, 0.7, 0.7, 1.0]; // Gray
          wallBlock.setTexture('wall');
          wallBlock.useLighting = true;
          this.objects.push(wallBlock);
        }
      }
    }
    
    console.log(`Created ${this.objects.length} objects (including walls)`);
  }
  
  /**
   * Create a test scene with a few cubes
   */
  createTestScene() {
    // Ground plane (flat cube)
    const ground = new TexturedCube();
    ground.position = [0, -0.5, 0];
    ground.scale = [100, 0.1, 100];
    ground.color = [0.3, 0.8, 0.3, 1.0]; // Green
    ground.setTexture("ground");
    ground.useLighting = false;
    this.objects.push(ground);
    
    // Test cube 1
    const cube1 = new TexturedCube();
    cube1.position = [0, 0.5, 0];
    cube1.scale = [1, 1, 1];
    cube1.rotation = [0, 45, 0];
    cube1.color = [1.0, 0.5, 0.2, 1.0]; // Orange
    cube1.setTexture('myst');
    cube1.useLighting = false;
    this.objects.push(cube1);
    
    // // Test cube 2
    // const cube2 = new TexturedCube();
    // cube2.position = [-2, 0.5, -2];
    // cube2.scale = [0.5, 2, 0.5];
    // cube2.color = [0.2, 0.5, 1.0, 1.0]; // Blue
    // cube2.setTexture('checkerboard');
    // this.objects.push(cube2);
    
    // // Test cube 3
    // const cube3 = new TexturedCube();
    // cube3.position = [2, 0.5, -2];
    // cube3.scale = [0.5, 0.5, 0.5];
    // cube3.rotation = [45, 45, 0];
    // cube3.color = [1.0, 0.2, 0.5, 1.0]; // Pink
    // cube3.setTexture('checkerboard');
    // this.objects.push(cube3);

    // Animated characters
    const humanBasic = new HumanBasic();
    humanBasic.position = [-5, 1.0, 3];
    humanBasic.scale = [2, 1.5, 2];
    this.objects.push(humanBasic);

    const human = new Human();
    human.position = [-1, 1.0, 3];
    human.scale = [3, 3, 3];
    human.useLighting = true;
    this.objects.push(human);

    const camel = new Camel();
    camel.position = [5, 1.2, 0];
    camel.scale = [2.2, 2.2, 2.2];
    camel.rotation = [0, -130, 0];
    this.objects.push(camel);
  }

  createGrassCrosses() {
    const length = 5;
    const mapRows = map.length;
    const mapCols = map[0].length;
    const offsetX = -length * mapCols / 2;
    const offsetZ = -length * mapRows / 2;

    for (let i = 0; i < mapRows; i++) {
      for (let j = 0; j < mapCols; j++) {
        if (map[i][j] !== 0) continue;
        if (Math.random() < 0.10) continue;

        const cross = new TexturedCross();
        const size = 0.45 + Math.random() * 0.25;

        cross.position = [
          j * length + offsetX + (Math.random() - 0.5) * (length * 0.7),
          size * 0.5,
          i * length + offsetZ + (Math.random() - 0.5) * (length * 0.7),
        ];
        cross.scale = [size, size, size];
        cross.rotation = [0, Math.random() * 360, 0];
        cross.color = [1.0, 1.0, 1.0, 1.0];
        cross.setTexture('grass');
        cross.useLighting = false;
        this.objects.push(cross);

        this.grassCrosses.push({
          cross,
          baseZ: 0,
          amplitude: 4 + Math.random() * 6,
          speed: 0.8 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }
  
  /**
   * Add an object to the world
   */
  addObject(object) {
    this.objects.push(object);
  }

  getForwardDirection(camera) {
    const panRad = camera.pan * Math.PI / 180;
    const tiltRad = camera.tilt * Math.PI / 180;
    return {
      x: Math.sin(panRad) * Math.cos(tiltRad),
      y: Math.sin(tiltRad),
      z: -Math.cos(panRad) * Math.cos(tiltRad),
    };
  }

  snapToBlockGrid(value, blockSize = 1) {
    return Math.round(value / blockSize) * blockSize;
  }

  getBlockKey(position) {
    return `${position[0]}|${position[1]}|${position[2]}`;
  }

  hasBlockAt(position, epsilon = 0.001) {
    const key = this.getBlockKey(position);
    if (this.placedBlocks.has(key)) return true;

    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      if (!(obj instanceof TexturedCube)) continue;
      if (!obj.position) continue;
      if (Math.abs(obj.position[0] - position[0]) < epsilon &&
          Math.abs(obj.position[1] - position[1]) < epsilon &&
          Math.abs(obj.position[2] - position[2]) < epsilon) return true;
    }
    return false;
  }

  addCheckerboardBlockInFront(camera, distance = 3, blockSize = 1) {
    const forward = this.getForwardDirection(camera);
    const camPos = camera.position.elements;

    const targetPos = [
      this.snapToBlockGrid(camPos[0] + forward.x * distance, blockSize),
      0.5,
      this.snapToBlockGrid(camPos[2] + forward.z * distance, blockSize),
    ];

    if (this.hasBlockAt(targetPos)) return false;

    const block = new TexturedCube();
    block.position = targetPos;
    block.scale = [blockSize, blockSize, blockSize];
    block.color = [1.0, 1.0, 1.0, 1.0];
    block.setTexture('checkerboard');
    block.useLighting = false;
    this.objects.push(block);
    this.placedBlocks.set(this.getBlockKey(targetPos), block);
    return true;
  }

  removeLookedAtPlacedBlock(camera, maxDistance = 12, step = 0.25, blockSize = 1) {
    if (this.placedBlocks.size === 0) return false;

    const forward = this.getForwardDirection(camera);
    const camPos = camera.position.elements;
    let prevKey = null;

    for (let d = 1; d <= maxDistance; d += step) {
      const candidatePos = [
        this.snapToBlockGrid(camPos[0] + forward.x * d, blockSize),
        0.5,
        this.snapToBlockGrid(camPos[2] + forward.z * d, blockSize),
      ];
      const key = this.getBlockKey(candidatePos);
      if (key === prevKey) continue;
      prevKey = key;

      const block = this.placedBlocks.get(key);
      if (!block) continue;

      const index = this.objects.indexOf(block);
      if (index > -1) this.objects.splice(index, 1);
      this.placedBlocks.delete(key);
      return true;
    }

    return false;
  }
  
  /**
   * Remove an object from the world
   */
  removeObject(object) {
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }
  
  /**
   * Clear all objects from the world
   */
  clear() {
    this.objects = [];
  }
  
  /**
   * Update all objects in the world (for animations, physics, etc.)
   */
  update(deltaTime) {
    this.grassSwayTime += deltaTime;

    for (let i = 0; i < this.grassCrosses.length; i++) {
      const data = this.grassCrosses[i];
      data.cross.rotation[2] =
        data.baseZ + Math.sin(this.grassSwayTime * data.speed + data.phase) * data.amplitude;
    }

    // Example: rotate test cubes
    if (this.objects.length > 2) {
      this.objects[1].rotation[1] += deltaTime * 20; // 20 degrees per second
    }
  }
  
  /**
   * Render all objects in the world
   */
  render(gl, camera, useTexture, lighting=null) {
    // Simply render all objects
    for (let i = 0, n = this.objects.length; i < n; i++) {
      this.objects[i].render(gl, camera, this.textureManager, useTexture, lighting);
    }
  }
  
  /**
   * Get all objects in the world
   */
  getObjects() {
    return this.objects;
  }
}
