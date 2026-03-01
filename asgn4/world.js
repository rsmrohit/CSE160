// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// world.js - World scene management

var map = [
  [1, 1, 1],
  [1, 0, 0],
  [1, 0, 0],
];

class World {
  constructor(gl, textureManager) {
    this.gl = gl;
    this.textureManager = textureManager;
    this.objects = [];
    this.placedBlocks = new Map();
    this.maxHumans = 0;
    this.humanSpawnRadius = 10;
    this.specialHuman = null;
    this.blockY = 0.5;
    this.blockSize = 1;

    this.init();
  }

  init() {
    this.textureManager.createCheckerboardTexture('checkerboard', 64, [200, 200, 200], [50, 50, 50]);
    this.textureManager.loadTexture('none', 'images/Untiled.jpg');
    this.textureManager.loadTexture('wall', 'images/wall.png');
    this.textureManager.loadTexture('ground', 'images/sidewalk.jpg');

    this.createTestScene();
    this.createWallsFromMap();
  }

  createTestScene() {
    const ground = new TexturedCube();
    ground.position = [0, 0.0, 0];
    ground.scale = [50, 0.1, 50];
    ground.color = [0.4, 0.8, 0.4, 1.0];
    // ground.setTexture('ground');
    ground.useLighting = true;
    this.objects.push(ground);

    this.createCenterHuman();
  }

  createWallsFromMap() {
    const length = 5;
    const mapRows = map.length;
    const mapCols = map[0].length;
    const offsetX = -length * mapCols / 2;
    const offsetZ = -length * mapRows / 2;

    for (let i = 0; i < mapRows; i++) {
      for (let j = 0; j < mapCols; j++) {
        if (map[i][j] !== 1) continue;

        const wallBlock = new TexturedCube();
        wallBlock.position = [
          j * length + offsetX,
          length / 2,
          i * length + offsetZ,
        ];
        wallBlock.scale = [length, length, length];
        wallBlock.color = [0.7, 0.7, 0.7, 1.0];
        wallBlock.setTexture('wall');
        wallBlock.useLighting = true;
        this.objects.push(wallBlock);
      }
    }
  }

  createCenterHuman() {
    const human = new Human();
    human.position = [0, 0.75, 0];
    human.scale = [2.35, 2.35, 2.35];
    human.rotation = [0, 180, 0];
    human.useLighting = true;
    human.color = [0.6, 0.6, 0.6, 1.0];
    this.objects.push(human);
    this.specialHuman = human;
  }

  setCrowdSettings(count, spawnRadius) {
    this.maxHumans = 0;
    this.humanSpawnRadius = Math.max(1, parseFloat(spawnRadius));
  }

  relocateSpecialHuman() {
    if (!this.specialHuman) return;
    this.specialHuman.position[0] = 0;
    this.specialHuman.position[2] = 0;
    this.specialHuman.rotation[1] = 180;
  }

  placeSpecialHumanInFront(camera, distance = 4.5) {
    this.relocateSpecialHuman();
  }

  getForwardDirection(camera) {
    const panRad = camera.pan * Math.PI / 180;
    return {
      x: Math.sin(panRad),
      z: -Math.cos(panRad),
    };
  }

  snapToBlockGrid(value, blockSize = 1) {
    return Math.round(value / blockSize) * blockSize;
  }

  getBlockKey(position) {
    return `${position[0].toFixed(2)}|${position[1].toFixed(2)}|${position[2].toFixed(2)}`;
  }

  addCheckerboardBlockInFront(camera, distance = 3, blockSize = 1) {
    const forward = this.getForwardDirection(camera);
    const camPos = camera.position.elements;

    const position = [
      this.snapToBlockGrid(camPos[0] + forward.x * distance, blockSize),
      this.blockY,
      this.snapToBlockGrid(camPos[2] + forward.z * distance, blockSize),
    ];

    const key = this.getBlockKey(position);
    if (this.placedBlocks.has(key)) return false;

    const block = new TexturedCube();
    block.position = [position[0], position[1], position[2]];
    block.scale = [blockSize, blockSize, blockSize];
    block.color = [1, 1, 1, 1];
    block.setTexture('checkerboard');
    block.useLighting = true;

    this.objects.push(block);
    this.placedBlocks.set(key, block);
    return true;
  }

  removeLookedAtPlacedBlock(camera, maxDistance = 12, step = 0.25, blockSize = 1) {
    const forward = this.getForwardDirection(camera);
    const camPos = camera.position.elements;
    let prevKey = null;

    for (let d = 1; d <= maxDistance; d += step) {
      const candidatePos = [
        this.snapToBlockGrid(camPos[0] + forward.x * d, blockSize),
        this.blockY,
        this.snapToBlockGrid(camPos[2] + forward.z * d, blockSize),
      ];
      const key = this.getBlockKey(candidatePos);
      if (key === prevKey) continue;
      prevKey = key;

      const block = this.placedBlocks.get(key);
      if (!block) continue;

      this.removeObject(block);
      this.placedBlocks.delete(key);
      return true;
    }

    return false;
  }

  removeObject(object) {
    const index = this.objects.indexOf(object);
    if (index > -1) this.objects.splice(index, 1);
  }

  clear() {
    this.objects = [];
    this.placedBlocks.clear();
  }

  update(deltaTime, focus = null) {
    if (!this.specialHuman) return;
    this.relocateSpecialHuman();
  }

  render(gl, camera, useTexture, lighting = null) {
    for (let i = 0, n = this.objects.length; i < n; i++) {
      this.objects[i].render(gl, camera, this.textureManager, useTexture, lighting);
    }
  }

  getObjects() {
    return this.objects;
  }
  getSpecialHumanPosition() {
    if (!this.specialHuman) return null;
    return this.specialHuman.position;
  }
}
