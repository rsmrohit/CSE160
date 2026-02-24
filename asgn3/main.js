// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// main.js - Main application entry point

// Global variables
let gl;
let canvas;
let camera;
let world;
let textureManager;
let player;
let lighting;
let audioManager;

// Shader locations
let a_Position;
let a_UV;
let a_Normal;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_NormalMatrix;
let u_Sampler;
let u_UseTexture;
let u_UseLighting;
let u_Color;
let u_LightDirection;
let u_LightColor;
let u_AmbientColor;
let u_FogColor;
let u_FogNear;
let u_FogFar;

// Performance tracking
let g_lastFrameTime = performance.now();
let g_fps = 0;
let g_lastTickTime = performance.now();

// Control state
let useTexture = true;
let mouseLookEnabled = false;
const mouseLookSensitivity = 0.2;
const mousePanMultiplier = 2.5;
let lastMouseX = null;
let lastMouseY = null;

// Mapping for keys
const keyMap = new Set();

/**
 * Initialize WebGL context
 */
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  
  return true;
}

/**
 * Connect variables to GLSL shader programs
 */
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return false;
  }

  // Get attribute locations
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return false;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return false;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return false;
  }

  // Get uniform locations
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  u_UseTexture = gl.getUniformLocation(gl.program, 'u_UseTexture');
  u_UseLighting = gl.getUniformLocation(gl.program, 'u_UseLighting');
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
  u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
  u_FogNear = gl.getUniformLocation(gl.program, 'u_FogNear');
  u_FogFar = gl.getUniformLocation(gl.program, 'u_FogFar');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_ProjectionMatrix || !u_NormalMatrix ||
      !u_Sampler || !u_UseTexture || !u_UseLighting || !u_Color ||
      !u_LightDirection || !u_LightColor || !u_AmbientColor ||
      !u_FogColor || !u_FogNear || !u_FogFar) {
    console.log('Failed to get uniform locations');
    return false;
  }

  return true;
}

/**
 * Set up event listeners for UI controls
 */
function addActionListeners() {
  // Camera position controls
  document.getElementById('camera-x').addEventListener('input', function() {
    const p = player.getPosition().elements;
    player.setPosition(parseFloat(this.value), p[1], p[2], false);
    syncCameraToPlayer();
    document.getElementById('camera-x-value').textContent = this.value;
  });

  document.getElementById('camera-y').addEventListener('input', function() {
    const p = player.getPosition().elements;
    player.setPosition(p[0], parseFloat(this.value), p[2], true);
    syncCameraToPlayer();
    document.getElementById('camera-y-value').textContent = this.value;
  });

  document.getElementById('camera-z').addEventListener('input', function() {
    const p = player.getPosition().elements;
    player.setPosition(p[0], p[1], parseFloat(this.value), false);
    syncCameraToPlayer();
    document.getElementById('camera-z-value').textContent = this.value;
  });

  document.getElementById('camera-pan').addEventListener('input', function() {
    camera.pan = parseFloat(this.value);
    document.getElementById('camera-pan-value').textContent = this.value;
  });

  document.getElementById('camera-tilt').addEventListener('input', function() {
    camera.tilt = parseFloat(this.value);
    document.getElementById('camera-tilt-value').textContent = this.value;
  });

  // Debug controls
  document.getElementById('toggle-texture').addEventListener('click', function() {
    useTexture = !useTexture;
  });

  document.getElementById('reset-camera').addEventListener('click', function() {
    camera.reset();
    player.reset([camera.position.elements[0], camera.position.elements[1], camera.position.elements[2]]);
    syncCameraToPlayer();
    updateCameraSliders();
  });

  const mouseLookToggle = document.getElementById('mouse-look-toggle');
  mouseLookToggle.addEventListener('change', function() {
    mouseLookEnabled = this.checked;
    lastMouseX = null;
    lastMouseY = null;
  });

  const crowdCountSlider = document.getElementById('crowd-count');
  const crowdRadiusSlider = document.getElementById('crowd-radius');
  const crowdCountValue = document.getElementById('crowd-count-value');
  const crowdRadiusValue = document.getElementById('crowd-radius-value');

  crowdCountSlider.value = String(world.maxHumans);
  crowdRadiusSlider.value = String(Math.round(world.humanSpawnRadius));
  crowdCountValue.textContent = crowdCountSlider.value;
  crowdRadiusValue.textContent = crowdRadiusSlider.value;

  const applyCrowdSettings = function() {
    const count = parseInt(crowdCountSlider.value, 10);
    const radius = parseFloat(crowdRadiusSlider.value);
    crowdCountValue.textContent = crowdCountSlider.value;
    crowdRadiusValue.textContent = crowdRadiusSlider.value;
    world.setCrowdSettings(count, radius, player.getPosition().elements);
  };

  crowdCountSlider.addEventListener('input', applyCrowdSettings);
  crowdRadiusSlider.addEventListener('input', applyCrowdSettings);

  // Keyboard controls for camera movement (WASD)
  document.addEventListener('keydown', function(ev) {
    if (audioManager) audioManager.unlock();
    handleKeyDown(ev, "down");
  });

  document.addEventListener('keyup', function(ev) {
    handleKeyDown(ev, "up");
  });

  // Mouse look controls: mouse X -> pan, mouse Y -> tilt
  canvas.addEventListener('mouseleave', function() {
    lastMouseX = null;
    lastMouseY = null;
  });

  canvas.addEventListener('mousemove', function(ev) {
    if (!mouseLookEnabled) return;

    if (lastMouseX === null || lastMouseY === null) {
      lastMouseX = ev.clientX;
      lastMouseY = ev.clientY;
      return;
    }

    let dx = ev.movementX;
    let dy = ev.movementY;
    if (dx === undefined || dy === undefined) {
      dx = ev.clientX - lastMouseX;
      dy = ev.clientY - lastMouseY;
    }

    camera.pan += dx * mouseLookSensitivity * mousePanMultiplier;
    camera.tilt -= dy * mouseLookSensitivity;
    lastMouseX = ev.clientX;
    lastMouseY = ev.clientY;

    if (camera.tilt > 89) camera.tilt = 89;
    if (camera.tilt < -89) camera.tilt = -89;
  });

  canvas.addEventListener('mousedown', function() {
    if (audioManager) audioManager.unlock();
  });
}

/**
 * Update camera slider values to match camera state
 */
function updateCameraSliders() {
  document.getElementById('camera-x').value = camera.position.elements[0];
  document.getElementById('camera-x-value').textContent = camera.position.elements[0].toFixed(1);
  
  document.getElementById('camera-y').value = camera.position.elements[1];
  document.getElementById('camera-y-value').textContent = camera.position.elements[1].toFixed(1);
  
  document.getElementById('camera-z').value = camera.position.elements[2];
  document.getElementById('camera-z-value').textContent = camera.position.elements[2].toFixed(1);
  
  document.getElementById('camera-pan').value = camera.pan;
  document.getElementById('camera-pan-value').textContent = camera.pan.toFixed(0);
  
  document.getElementById('camera-tilt').value = camera.tilt;
  document.getElementById('camera-tilt-value').textContent = camera.tilt.toFixed(0);
}

/**
 * Handle keyboard input for camera movement
 */
function handleKeyDown(ev=null, placement=null, deltaTime=0) {


  if (ev) {
    if (ev.keyCode === 13 && placement === "down") {
      console.log(
        "Camera position:",
        `x=${player.getPosition().elements[0].toFixed(2)}, ` +
        `y=${player.getPosition().elements[1].toFixed(2)}, ` +
        `z=${player.getPosition().elements[2].toFixed(2)}`
      );
    }

    if (placement == "down") {
      if (ev.keyCode === 67 && !ev.repeat) { // C
        world.addCheckerboardBlockInFront(camera);
      }
      if (ev.keyCode === 88 && !ev.repeat) { // X
        world.removeLookedAtPlacedBlock(camera);
      }
      keyMap.add(ev.keyCode);
    } else if (placement == "up") {
      keyMap.delete(ev.keyCode);
    }
    ev.preventDefault();
    return;
  }

  const rotateSpeed = 120.0 * deltaTime;
  if (!mouseLookEnabled) {
    if (keyMap.has(81)) camera.pan -= rotateSpeed; // Q
    if (keyMap.has(69)) camera.pan += rotateSpeed; // E
    if (keyMap.has(38)) camera.tilt += rotateSpeed; // Up
    if (keyMap.has(40)) camera.tilt -= rotateSpeed; // Down
  }

  if (camera.tilt > 89) camera.tilt = 89;
  if (camera.tilt < -89) camera.tilt = -89;

  player.update(keyMap, deltaTime, camera.pan);
  syncCameraToPlayer();

  // for (const code of keyMap) {
  //   if (code == 87) // W - forward
  //     camera.moveForward(moveSpeed);
  //   if (code == 83) // S - backward
  //     camera.moveForward(-moveSpeed);
  //   if (code == 65) // A - left
  //     camera.moveRight(-moveSpeed);
  //   if (code == 68) // D - right
  //     camera.moveRight(moveSpeed);
  //   if (code == 81) // Q - up
  //     camera.moveUp(moveSpeed);
  //   if (code == 69) // E - down
  //     camera.moveUp(-moveSpeed);
  //   if (code == 37) // Left arrow - pan left
  //     camera.pan -= rotateSpeed;
  //   if (code == 39) // Right arrow - pan right
  //     camera.pan += rotateSpeed;
  //   if (code == 38) // Up arrow - tilt up
  //     camera.tilt += rotateSpeed;
  //   if (code == 40) // Down arrow - tilt down
  //     camera.tilt -= rotateSpeed;
  // }

  updateCameraSliders();
}

function syncCameraToPlayer() {
  const p = player.getPosition().elements;
  camera.position.elements[0] = p[0];
  camera.position.elements[1] = p[1];
  camera.position.elements[2] = p[2];
}

/**
 * Main rendering loop
 */
function tick() {
  let now = performance.now();
  let deltaTime = (now - g_lastTickTime) / 1000.0;
  g_lastTickTime = now;
  deltaTime = Math.min(deltaTime, 0.05);

  // Update FPS
  updateFPS();
  handleKeyDown(null, null, deltaTime);
  world.update(deltaTime, {
    position: player.getPosition().elements,
    radius: player.collisionRadius,
  });
  if (audioManager) {
    audioManager.update(
      deltaTime,
      player.getPosition().elements,
      world.getSpecialHumanPosition()
    );
  }
  
  // Update camera
  camera.update();
  
  // Clear buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  setFogUniforms();
  updateLightingFromPlayer();
  
  // Render the world
  world.render(gl, camera, useTexture, lighting);
  
  // Request next frame
  requestAnimationFrame(tick);
}

/**
 * Calculate and display FPS
 */
function updateFPS() {
  let now = performance.now();
  let duration = now - g_lastFrameTime;
  g_lastFrameTime = now;

  if (duration > 0) {
    g_fps = 1000.0 / duration;
    document.getElementById('performance-display').textContent = 
      'FPS: ' + Math.floor(g_fps);
  }
}

/**
 * Main initialization function
 */
function main() {
  // Set up WebGL
  if (!setupWebGL()) return;
  
  // Connect shader variables
  if (!connectVariablesToGLSL()) return;
  
  // Initialize texture manager
  textureManager = new TextureManager(gl);
  audioManager = new AudioManager();
  
  // Initialize camera
  camera = new Camera();
  camera.position = new Vector3([0, 2, 5]);
  
  // Initialize world
  world = new World(gl, textureManager);
  player = new Player(world.getCollisionSystem(), [camera.position.elements[0], camera.position.elements[1], camera.position.elements[2]]);
  syncCameraToPlayer();
  world.placeSpecialHumanInFront(camera);

  // Shared lighting object (decoupled from camera/player and easy to modify)
  lighting = {
    direction: [0.6, 1.0, 0.4],
    color: [1.0, 1.0, 1.0],
    ambient: [0.2, 0.2, 0.2],
  };
  
  // Set up UI controls
  addActionListeners();
  updateCameraSliders();
  
  // Set clear color
  gl.clearColor(0.64, 0.64, 0.64, 1.0); // Sky blue
  
  // Start rendering loop
  requestAnimationFrame(tick);
  
  console.log('Assignment 3 initialized successfully');
}

function setFogUniforms() {
  gl.uniform3f(u_FogColor, 0.64, 0.64, 0.64);
  gl.uniform1f(u_FogNear, 1);
  gl.uniform1f(u_FogFar, 20);
}

function updateLightingFromPlayer() {
  if (!lighting || !player) return;

  const p = player.getPosition().elements;
  const panRad = camera.pan * Math.PI / 180;
  const tiltRad = camera.tilt * Math.PI / 180;

  // Place light in front of and above the player.
  const offsetForward = 1;
  const offsetUp = 1;
  const lx = p[0] + Math.sin(panRad) * offsetForward;
  const ly = p[1] + offsetUp;
  const lz = p[2] - Math.cos(panRad) * offsetForward;
  lighting.position = [lx, ly, lz];

  // Match light direction to the exact camera/player look direction.
  lighting.direction = [
    Math.sin(panRad) * Math.cos(tiltRad),
    Math.sin(tiltRad),
    -Math.cos(panRad) * Math.cos(tiltRad),
  ];
}
