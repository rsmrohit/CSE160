// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// main.js - Main application entry point

// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  
  varying vec2 v_UV;
  
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  
  uniform sampler2D u_Sampler;
  uniform bool u_UseTexture;
  uniform vec4 u_Color;
  
  varying vec2 v_UV;
  
  void main() {
    if (u_UseTexture) {
      vec4 texColor = texture2D(u_Sampler, v_UV);
      if (texColor.a < 0.1) discard;
      gl_FragColor = texColor;
    } else {
      gl_FragColor = u_Color;
    }
  }
`;

// Global variables
let gl;
let canvas;
let camera;
let world;
let textureManager;
let player;

// Shader locations
let a_Position;
let a_UV;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler;
let u_UseTexture;
let u_Color;

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

  // Get uniform locations
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  u_UseTexture = gl.getUniformLocation(gl.program, 'u_UseTexture');
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_ProjectionMatrix || 
      !u_Sampler || !u_UseTexture || !u_Color) {
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
    camera.position.elements[0] = parseFloat(this.value);
    document.getElementById('camera-x-value').textContent = this.value;
  });

  document.getElementById('camera-y').addEventListener('input', function() {
    camera.position.elements[1] = parseFloat(this.value);
    document.getElementById('camera-y-value').textContent = this.value;
  });

  document.getElementById('camera-z').addEventListener('input', function() {
    camera.position.elements[2] = parseFloat(this.value);
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
    updateCameraSliders();
  });

  const mouseLookToggle = document.getElementById('mouse-look-toggle');
  mouseLookToggle.addEventListener('change', function() {
    mouseLookEnabled = this.checked;
    lastMouseX = null;
    lastMouseY = null;
  });

  // Keyboard controls for camera movement (WASD)
  document.addEventListener('keydown', function(ev) {
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
        `x=${camera.position.elements[0].toFixed(2)}, ` +
        `y=${camera.position.elements[1].toFixed(2)}, ` +
        `z=${camera.position.elements[2].toFixed(2)}`
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

  player.update(keyMap, deltaTime, mouseLookEnabled);

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
  world.update(deltaTime);
  
  // Update camera
  camera.update();
  
  // Clear buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Render the world
  world.render(gl, camera, useTexture);
  
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
  
  // Initialize camera
  camera = new Camera();
  camera.position = new Vector3([0, 2, 5]);
  
  // Initialize world
  world = new World(gl, textureManager);
  player = new Player(map, world.getObjects(), camera);
  
  // Set up UI controls
  addActionListeners();
  updateCameraSliders();
  
  // Set clear color
  gl.clearColor(0.53, 0.81, 0.92, 1.0); // Sky blue
  
  // Start rendering loop
  requestAnimationFrame(tick);
  
  console.log('Assignment 3 initialized successfully');
}
