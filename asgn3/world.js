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
    this.collisionSystem = new CollisionSystem(map, 5);
    this.humanAgents = [];
    this.maxHumans = 200;
    this.humanMoveBounds = null;
    this.humanActiveRange = 10;
    this.humanSpawnRadius = 18;
    this.humanYawOffsetDeg = 0;
    this.humanTurnSpeedDeg = 240;
    this.humanPriorityMin = 1;
    this.humanPriorityMax = 100;
    this.crowdResolveReverse = false;
    this.specialHuman = null;
    this.specialHumanRadius = 0.45;
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
    this.textureManager.loadTexture('ground', 'images/sidewalk.jpg');
    this.textureManager.loadTexture('grass', 'images/grass.png');
    this.textureManager.loadTexture('myst', 'images/2508.jpg');
    
    // Create the test scene
    this.createTestScene();
    
    // Create walls from the map
    this.createWallsFromMap();

    // Scene focus: humans only.
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
          this.addObjectCollider(wallBlock);
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

    this.createHumanCrowd(this.maxHumans, null, this.humanSpawnRadius);
    this.createSpecialBlueHuman();
  }

  getMapWorldBounds() {
    const length = 5;
    const rows = map.length;
    const cols = map[0].length;
    const offsetX = -length * cols / 2;
    const offsetZ = -length * rows / 2;
    return {
      minX: offsetX,
      maxX: offsetX + (cols - 1) * length,
      minZ: offsetZ,
      maxZ: offsetZ + (rows - 1) * length,
    };
  }

  randomUnitDirectionXZ() {
    const angle = Math.random() * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  }

  getHumanYawFromDirection(dirX, dirZ) {
    return Human.directionToYawDeg(dirX, dirZ, this.humanYawOffsetDeg);
  }

  rotateAngleToward(currentDeg, targetDeg, maxStepDeg) {
    let delta = ((targetDeg - currentDeg + 540) % 360) - 180;
    if (delta > maxStepDeg) delta = maxStepDeg;
    if (delta < -maxStepDeg) delta = -maxStepDeg;
    return currentDeg + delta;
  }

  getRandomWalkablePosition(y = 1.0, centerXZ = null, radius = null) {
    if (centerXZ && radius && radius > 0) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        const x = centerXZ[0] + Math.cos(angle) * r;
        const z = centerXZ[1] + Math.sin(angle) * r;
        const pos = [x, y, z];

        if (this.collisionSystem.isMapWalkable(pos, 0.2)) return pos;
      }
    }

    const length = 5;
    const rows = map.length;
    const cols = map[0].length;
    const offsetX = -length * cols / 2;
    const offsetZ = -length * rows / 2;

    for (let attempt = 0; attempt < 80; attempt++) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if (map[row][col] !== 0) continue;

      const x = col * length + offsetX + (Math.random() - 0.5) * length * 0.5;
      const z = row * length + offsetZ + (Math.random() - 0.5) * length * 0.5;
      const pos = [x, y, z];

      if (this.collisionSystem.isMapWalkable(pos, 0.2)) return pos;
    }

    return [0, y, 0];
  }

  createHumanCrowd(maxHumans = 48, centerXZ = null, spawnRadius = null) {
    this.humanAgents = [];
    const useRadius = (spawnRadius && spawnRadius > 0) ? spawnRadius : this.humanSpawnRadius;

    const bounds = this.getMapWorldBounds();
    this.humanMoveBounds = {
      minX: bounds.minX - 1,
      maxX: bounds.maxX + 1,
      minZ: bounds.minZ - 1,
      maxZ: bounds.maxZ + 1,
    };

    for (let i = 0; i < maxHumans; i++) {
      const human = new Human();
      const spawn = this.getRandomWalkablePosition(1.0, centerXZ, useRadius);
      const dir = this.randomUnitDirectionXZ();
      const speed = 0.6 + Math.random() * 0.8;
      const uniformScale = 2.0 + Math.random() * 1.0;
      const priority = Math.floor(
        this.humanPriorityMin +
        Math.random() * (this.humanPriorityMax - this.humanPriorityMin + 1)
      );

      human.position = [spawn[0], spawn[1], spawn[2]];
      human.scale = [uniformScale, uniformScale, uniformScale];
      human.rotation = [0, this.getHumanYawFromDirection(dir[0], dir[1]), 0];
      human.useLighting = true;
      this.objects.push(human);
      const collider = this.addObjectCollider(human, {
        sizeScale: [0.28, 0.40, 0.28],
      });

      this.humanAgents.push({
        human,
        collider,
        dirX: dir[0],
        dirZ: dir[1],
        speed,
        collisionRadius: uniformScale * 0.14,
        priority,
      });
    }
  }

  clearHumanCrowd() {
    for (let i = 0; i < this.humanAgents.length; i++) {
      this.removeObject(this.humanAgents[i].human);
    }
    this.humanAgents = [];
  }

  setCrowdSettings(count, spawnRadius, focusPosition = null) {
    const nextCount = Math.max(0, Math.floor(count));
    const nextRadius = Math.max(1, parseFloat(spawnRadius));
    this.maxHumans = nextCount;
    this.humanSpawnRadius = nextRadius;

    const centerXZ = focusPosition ? [focusPosition[0], focusPosition[2]] : null;
    this.clearHumanCrowd();
    this.createHumanCrowd(this.maxHumans, centerXZ, this.humanSpawnRadius);
  }

  createSpecialBlueHuman() {
    const human = new Human();
    const spawn = this.getRandomWalkablePosition(0.75);
    const shortScale = 1.35;

    human.position = [spawn[0], spawn[1], spawn[2]];
    human.scale = [shortScale, shortScale, shortScale];
    human.rotation = [0, Math.random() * 360, 0];
    human.useLighting = true;
    human.color = [0.20, 0.45, 1.0, 1.0];
    this.objects.push(human);

    this.specialHuman = human;
    this.specialHumanRadius = shortScale * 0.22;
  }

  relocateSpecialHuman() {
    if (!this.specialHuman) return;
    const spawn = this.getRandomWalkablePosition(this.specialHuman.position[1]);
    this.specialHuman.position[0] = spawn[0];
    this.specialHuman.position[2] = spawn[2];
    this.specialHuman.rotation[1] = Math.random() * 360;
  }

  placeSpecialHumanInFront(camera, distance = 4.5) {
    if (!this.specialHuman || !camera) return;
    const forward = this.getForwardDirection(camera);
    const camPos = camera.position.elements;

    const offsets = [0, -0.8, 0.8, -1.6, 1.6];
    for (let i = 0; i < offsets.length; i++) {
      const d = distance + offsets[i];
      const x = camPos[0] + forward.x * d;
      const z = camPos[2] + forward.z * d;
      if (this.collisionSystem.isMapWalkable([x, this.specialHuman.position[1], z], this.specialHumanRadius)) {
        this.specialHuman.position[0] = x;
        this.specialHuman.position[2] = z;
        this.specialHuman.rotation[1] = this.getHumanYawFromDirection(-forward.x, -forward.z);
        return;
      }
    }

    // Fallback to a known valid map spawn.
    this.relocateSpecialHuman();
  }

  updateSpecialHumanInteraction(focusPosition, focusRadius) {
    if (!this.specialHuman || !focusPosition) return;

    const dx = this.specialHuman.position[0] - focusPosition[0];
    const dz = this.specialHuman.position[2] - focusPosition[2];
    const combined = this.specialHumanRadius + focusRadius;
    if ((dx * dx + dz * dz) <= (combined * combined)) {
      this.relocateSpecialHuman();
    }
  }

  recycleHumanAgent(agent) {
    const b = this.humanMoveBounds;
    const h = agent.human;
    let x = h.position[0];
    let z = h.position[2];

    if (x < b.minX) x = b.maxX;
    else if (x > b.maxX) x = b.minX;
    if (z < b.minZ) z = b.maxZ;
    else if (z > b.maxZ) z = b.minZ;

    let recycled = [x, h.position[1], z];
    if (!this.collisionSystem.isMapWalkable(recycled, 0.2)) {
      recycled = this.getRandomWalkablePosition(h.position[1]);
    }

    h.position[0] = recycled[0];
    h.position[2] = recycled[2];

    const dir = this.randomUnitDirectionXZ();
    agent.dirX = dir[0];
    agent.dirZ = dir[1];
    h.rotation[1] = this.getHumanYawFromDirection(agent.dirX, agent.dirZ);
  }

  recycleHumanAgentAroundFocus(agent, focusPosition) {
    const h = agent.human;
    const fx = focusPosition[0];
    const fz = focusPosition[2];
    let vx = h.position[0] - fx;
    let vz = h.position[2] - fz;
    let len = Math.hypot(vx, vz);

    if (len < 0.001) {
      const randomDir = this.randomUnitDirectionXZ();
      vx = randomDir[0];
      vz = randomDir[1];
      len = 1;
    }

    vx /= len;
    vz /= len;

    const targetDist = this.humanActiveRange * (0.85 + Math.random() * 0.1);
    let x = fx - vx * targetDist + (Math.random() - 0.5) * 2.0;
    let z = fz - vz * targetDist + (Math.random() - 0.5) * 2.0;
    let recycled = [x, h.position[1], z];

    if (!this.collisionSystem.isMapWalkable(recycled, 0.2)) {
      recycled = this.getRandomWalkablePosition(h.position[1]);
    }

    h.position[0] = recycled[0];
    h.position[2] = recycled[2];

    const dir = this.randomUnitDirectionXZ();
    agent.dirX = dir[0];
    agent.dirZ = dir[1];
    h.rotation[1] = this.getHumanYawFromDirection(agent.dirX, agent.dirZ);
  }

  circlesOverlapXZ(aPos, aRadius, bPos, bRadius) {
    const dx = aPos[0] - bPos[0];
    const dz = aPos[2] - bPos[2];
    const combined = aRadius + bRadius;
    return (dx * dx + dz * dz) < (combined * combined);
  }

  isCandidatePositionValid(candidatePos, agent, focusPosition, focusRadius) {
    // Humans are allowed to pass through wall/map geometry.

    if (focusPosition) {
      if (this.circlesOverlapXZ(candidatePos, agent.collisionRadius, focusPosition, focusRadius)) {
        return false;
      }
    }

    return true;
  }

  computeAgentDesiredPosition(agent, startPos, deltaTime, focusPosition, focusRadius) {
    const forwardDist = Math.max(0.02, agent.speed * deltaTime);
    const forwardPos = Human.stepForward(startPos, agent.dirX, agent.dirZ, forwardDist);

    if (this.isCandidatePositionValid(
      forwardPos,
      agent,
      focusPosition,
      focusRadius
    )) {
      return forwardPos;
    }

    const slideBase = Math.max(0.10, forwardDist * 0.9);
    const attempts = [
      { side: 1, mult: 1.0 },
      { side: -1, mult: 1.0 },
      { side: 1, mult: 1.7 },
      { side: -1, mult: 1.7 },
    ];

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const slidePos = Human.stepRight(startPos, agent.dirX, agent.dirZ, slideBase * attempt.mult, attempt.side);
      if (this.isCandidatePositionValid(
        slidePos,
        agent,
        focusPosition,
        focusRadius
      )) {
        return slidePos;
      }
    }

    return startPos;
  }

  applyPlayerPriorityPush(focusPosition, focusRadius) {
    if (!focusPosition) return;

    const extraSeparation = 0.08;
    for (let i = 0; i < this.humanAgents.length; i++) {
      const agent = this.humanAgents[i];
      const h = agent.human;

      let dx = h.position[0] - focusPosition[0];
      let dz = h.position[2] - focusPosition[2];
      let dist = Math.hypot(dx, dz);
      const minDist = focusRadius + agent.collisionRadius + extraSeparation;
      if (dist >= minDist) continue;

      if (dist < 1e-6) {
        const dir = this.randomUnitDirectionXZ();
        dx = dir[0];
        dz = dir[1];
        dist = 1;
      } else {
        dx /= dist;
        dz /= dist;
      }

      const push = minDist - dist;
      h.position[0] += dx * push;
      h.position[2] += dz * push;
    }
  }

  applyHumanPriorityPush(finalPositions, iterations = 3) {
    const count = this.humanAgents.length;
    const epsilon = 0.03;
    const bounds = this.humanMoveBounds;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const a = this.humanAgents[i];
          const b = this.humanAgents[j];
          const pa = finalPositions[i];
          const pb = finalPositions[j];

          let dx = pb[0] - pa[0];
          let dz = pb[2] - pa[2];
          let dist = Math.hypot(dx, dz);
          const minDist = a.collisionRadius + b.collisionRadius + epsilon;
          if (dist >= minDist) continue;

          let winnerIndex = i;
          let loserIndex = j;
          if (b.priority > a.priority || (b.priority === a.priority && j < i)) {
            winnerIndex = j;
            loserIndex = i;
          }

          const winnerPos = finalPositions[winnerIndex];
          const loserPos = finalPositions[loserIndex];
          dx = loserPos[0] - winnerPos[0];
          dz = loserPos[2] - winnerPos[2];
          dist = Math.hypot(dx, dz);

          if (dist < 1e-6) {
            const randDir = this.randomUnitDirectionXZ();
            dx = randDir[0];
            dz = randDir[1];
            dist = 1;
          } else {
            dx /= dist;
            dz /= dist;
          }

          const push = minDist - dist;
          loserPos[0] += dx * push;
          loserPos[2] += dz * push;

          if (bounds) {
            if (loserPos[0] < bounds.minX) loserPos[0] = bounds.minX;
            if (loserPos[0] > bounds.maxX) loserPos[0] = bounds.maxX;
            if (loserPos[2] < bounds.minZ) loserPos[2] = bounds.minZ;
            if (loserPos[2] > bounds.maxZ) loserPos[2] = bounds.maxZ;
          }
        }
      }
    }
  }

  updateHumanCrowd(deltaTime, focus = null) {
    if (this.humanAgents.length === 0) return;
    const focusPosition = focus && focus.position ? focus.position : focus;
    const focusRadius = focus && focus.radius ? focus.radius : 0.9;
    const count = this.humanAgents.length;
    const startPositions = new Array(count);
    const desiredPositions = new Array(count);
    const finalPositions = new Array(count);

    for (let i = 0; i < count; i++) {
      const p = this.humanAgents[i].human.position;
      const copy = [p[0], p[1], p[2]];
      startPositions[i] = copy;
      finalPositions[i] = [p[0], p[1], p[2]];
    }

    for (let i = 0; i < count; i++) {
      const agent = this.humanAgents[i];
      const startPos = startPositions[i];
      const h = agent.human;

      if (focusPosition) {
        const dx = startPos[0] - focusPosition[0];
        const dz = startPos[2] - focusPosition[2];
        if ((dx * dx + dz * dz) > (this.humanActiveRange * this.humanActiveRange)) {
          this.recycleHumanAgentAroundFocus(agent, focusPosition);
          const rp = agent.human.position;
          const recycled = [rp[0], rp[1], rp[2]];
          startPositions[i] = recycled;
          finalPositions[i] = [rp[0], rp[1], rp[2]];
          desiredPositions[i] = recycled;
          continue;
        }
      }

      const trialPos = Human.stepForward(startPos, agent.dirX, agent.dirZ, Math.max(0.02, agent.speed * deltaTime));
      const b = this.humanMoveBounds;
      const outOfRange =
        trialPos[0] < b.minX || trialPos[0] > b.maxX ||
        trialPos[2] < b.minZ || trialPos[2] > b.maxZ;
      if (outOfRange) {
        this.recycleHumanAgent(agent);
        const rp = agent.human.position;
        const recycled = [rp[0], rp[1], rp[2]];
        startPositions[i] = recycled;
        finalPositions[i] = [rp[0], rp[1], rp[2]];
        desiredPositions[i] = recycled;
        continue;
      }

      desiredPositions[i] = this.computeAgentDesiredPosition(
        agent,
        startPositions[i],
        deltaTime,
        focusPosition,
        focusRadius
      );
    }

    const order = [];
    if (this.crowdResolveReverse) {
      for (let i = count - 1; i >= 0; i--) order.push(i);
    } else {
      for (let i = 0; i < count; i++) order.push(i);
    }
    this.crowdResolveReverse = !this.crowdResolveReverse;

    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      const agent = this.humanAgents[i];
      const candidate = desiredPositions[i];
      if (!candidate) continue;

      const start = startPositions[i];
      if (candidate[0] === start[0] && candidate[2] === start[2]) continue;

      let blocked = false;
      for (let j = 0; j < count; j++) {
        if (j === i) continue;
        if (this.circlesOverlapXZ(
          candidate,
          agent.collisionRadius,
          finalPositions[j],
          this.humanAgents[j].collisionRadius
        )) {
          const other = this.humanAgents[j];
          if (agent.priority > other.priority) continue;
          if (agent.priority === other.priority && i < j) continue;
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        finalPositions[i] = [candidate[0], candidate[1], candidate[2]];
      }
    }

    this.applyHumanPriorityPush(finalPositions);

    for (let i = 0; i < count; i++) {
      const h = this.humanAgents[i].human;
      const dx = finalPositions[i][0] - startPositions[i][0];
      const dz = finalPositions[i][2] - startPositions[i][2];
      if ((dx * dx + dz * dz) > 1e-6) {
        const targetYaw = this.getHumanYawFromDirection(dx, dz);
        const maxStep = this.humanTurnSpeedDeg * deltaTime;
        h.rotation[1] = this.rotateAngleToward(h.rotation[1], targetYaw, maxStep);
      }
      h.position[0] = finalPositions[i][0];
      h.position[2] = finalPositions[i][2];
    }

    this.applyPlayerPriorityPush(focusPosition, focusRadius);
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
    if (object.collider) {
      this.collisionSystem.addCollider(object.collider);
    }
  }

  addObjectCollider(object, colliderOptions = {}) {
    const collider = ColliderFactory.boxFromObject(object, colliderOptions);
    object.collider = collider;
    this.collisionSystem.addCollider(collider);
    return collider;
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
    this.addObjectCollider(block);
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

      this.removeObject(block);
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
    this.collisionSystem.removeCollidersForObject(object);
  }
  
  /**
   * Clear all objects from the world
   */
  clear() {
    this.objects = [];
    this.collisionSystem.colliders = [];
  }
  
  /**
   * Update all objects in the world (for animations, physics, etc.)
   */
  update(deltaTime, focus = null) {
    this.grassSwayTime += deltaTime;

    for (let i = 0; i < this.grassCrosses.length; i++) {
      const data = this.grassCrosses[i];
      data.cross.rotation[2] =
        data.baseZ + Math.sin(this.grassSwayTime * data.speed + data.phase) * data.amplitude;
    }

    this.updateHumanCrowd(deltaTime, focus);
    const focusPosition = focus && focus.position ? focus.position : focus;
    const focusRadius = focus && focus.radius ? focus.radius : 0.9;
    this.updateSpecialHumanInteraction(focusPosition, focusRadius);
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

  getCollisionSystem() {
    return this.collisionSystem;
  }

  getSpecialHumanPosition() {
    if (!this.specialHuman) return null;
    return this.specialHuman.position;
  }
}
