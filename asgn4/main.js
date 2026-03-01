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
let lightMarker;

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
let u_EnableLighting;
let u_ShowNormals;
let u_Color;
let u_NumLights;
let u_Lights;
let u_AmbientColor;
let u_CameraPos;
// let u_FogColor;
// let u_FogNear;
// let u_FogFar;

// Performance tracking
let g_lastFrameTime = performance.now();
let g_fps = 0;
let g_lastTickTime = performance.now();
const MAX_LIGHTS = 4;

// Control state
let useTexture = true;
let lightingEnabled = true;
let spotlightEnabled = false;
let mouseLookEnabled = false;
let showNormals = false;
const mouseLookSensitivity = 0.2;
const mousePanMultiplier = 2.5;
let lastMouseX = null;
let lastMouseY = null;
let lightX = 0.0;
let lightZ = 0.0;
let lightY = 5.0;
let lightOrbitRadius = 5.0;
let lightOrbitSpeed = 1.2;
let lightTargetY = 0.0;

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
  u_EnableLighting = gl.getUniformLocation(gl.program, 'u_EnableLighting');
  u_ShowNormals = gl.getUniformLocation(gl.program, 'u_ShowNormals');
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  u_NumLights = gl.getUniformLocation(gl.program, 'u_NumLights');
  u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
  u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');
  u_Lights = [];
  for (let i = 0; i < MAX_LIGHTS; i++) {
    u_Lights.push({
      type: gl.getUniformLocation(gl.program, `u_Lights[${i}].type`),
      enabled: gl.getUniformLocation(gl.program, `u_Lights[${i}].enabled`),
      position: gl.getUniformLocation(gl.program, `u_Lights[${i}].position`),
      direction: gl.getUniformLocation(gl.program, `u_Lights[${i}].direction`),
      color: gl.getUniformLocation(gl.program, `u_Lights[${i}].color`),
      intensity: gl.getUniformLocation(gl.program, `u_Lights[${i}].intensity`),
      range: gl.getUniformLocation(gl.program, `u_Lights[${i}].range`),
      spotInnerCos: gl.getUniformLocation(gl.program, `u_Lights[${i}].spotInnerCos`),
      spotOuterCos: gl.getUniformLocation(gl.program, `u_Lights[${i}].spotOuterCos`),
    });
  }
  // u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
  // u_FogNear = gl.getUniformLocation(gl.program, 'u_FogNear');
  // u_FogFar = gl.getUniformLocation(gl.program, 'u_FogFar');

  if (u_ModelMatrix === null || u_ViewMatrix === null || u_ProjectionMatrix === null || u_NormalMatrix === null ||
      u_Sampler === null || u_UseTexture === null || u_UseLighting === null || u_EnableLighting === null || u_ShowNormals === null || u_Color === null ||
      u_NumLights === null || u_AmbientColor === null || u_CameraPos === null) {
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
  const toggleLightingBtn = document.getElementById('toggle-lighting');
  toggleLightingBtn.addEventListener('click', function() {
    lightingEnabled = !lightingEnabled;
    toggleLightingBtn.textContent = lightingEnabled ? 'Lighting: On' : 'Lighting: Off';
  });
  const toggleSpotlightBtn = document.getElementById('toggle-spotlight');
  toggleSpotlightBtn.addEventListener('click', function() {
    spotlightEnabled = !spotlightEnabled;
    if (lighting && lighting.lights && lighting.lights[1]) {
      lighting.lights[1].enabled = spotlightEnabled;
    }
    toggleSpotlightBtn.textContent = spotlightEnabled ? 'Spotlight: On' : 'Spotlight: Off';
  });
  const toggleNormalsBtn = document.getElementById('toggle-normals');
  toggleNormalsBtn.addEventListener('click', function() {
    showNormals = !showNormals;
    toggleNormalsBtn.textContent = showNormals ? 'Normals: On' : 'Normals: Off';
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

  const lightXSlider = document.getElementById('light-x');
  const lightZSlider = document.getElementById('light-z');
  const lightYSlider = document.getElementById('light-y');
  const lightRadiusSlider = document.getElementById('light-radius');
  const lightSpeedSlider = document.getElementById('light-speed');
  const lightTargetYSlider = document.getElementById('light-target-y');
  const lightXValue = document.getElementById('light-x-value');
  const lightZValue = document.getElementById('light-z-value');
  const lightYValue = document.getElementById('light-y-value');
  const lightRadiusValue = document.getElementById('light-radius-value');
  const lightSpeedValue = document.getElementById('light-speed-value');
  const lightTargetYValue = document.getElementById('light-target-y-value');

  lightXSlider.value = String(lightX);
  lightZSlider.value = String(lightZ);
  lightYSlider.value = String(lightY);
  lightRadiusSlider.value = String(lightOrbitRadius);
  lightSpeedSlider.value = String(lightOrbitSpeed);
  lightTargetYSlider.value = String(lightTargetY);
  lightXValue.textContent = lightX.toFixed(1);
  lightZValue.textContent = lightZ.toFixed(1);
  lightYValue.textContent = lightY.toFixed(1);
  lightRadiusValue.textContent = lightOrbitRadius.toFixed(1);
  lightSpeedValue.textContent = lightOrbitSpeed.toFixed(1);
  lightTargetYValue.textContent = lightTargetY.toFixed(1);

  const applyLightSettings = function() {
    lightX = parseFloat(lightXSlider.value);
    lightZ = parseFloat(lightZSlider.value);
    lightY = parseFloat(lightYSlider.value);
    lightOrbitRadius = parseFloat(lightRadiusSlider.value);
    lightOrbitSpeed = parseFloat(lightSpeedSlider.value);
    lightTargetY = parseFloat(lightTargetYSlider.value);
    lightXValue.textContent = lightX.toFixed(1);
    lightZValue.textContent = lightZ.toFixed(1);
    lightYValue.textContent = lightY.toFixed(1);
    lightRadiusValue.textContent = lightOrbitRadius.toFixed(1);
    lightSpeedValue.textContent = lightOrbitSpeed.toFixed(1);
    lightTargetYValue.textContent = lightTargetY.toFixed(1);
  };

  lightXSlider.addEventListener('input', applyLightSettings);
  lightZSlider.addEventListener('input', applyLightSettings);
  lightYSlider.addEventListener('input', applyLightSettings);
  lightRadiusSlider.addEventListener('input', applyLightSettings);
  lightSpeedSlider.addEventListener('input', applyLightSettings);
  lightTargetYSlider.addEventListener('input', applyLightSettings);

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
  updateCameraSliders();
}

function syncCameraToPlayer() {
  const p = player.getPosition().elements;
  camera.position.elements[0] = p[0];
  camera.position.elements[1] = p[1];
  camera.position.elements[2] = p[2];
}

function createPointLight(options = {}) {
  return {
    type: 'point',
    enabled: options.enabled !== false,
    position: options.position || [0.0, 5.0, 0.0],
    direction: options.direction || [0.0, -1.0, 0.0],
    color: options.color || [1.0, 1.0, 1.0],
    intensity: Number.isFinite(options.intensity) ? options.intensity : 1.0,
    range: Number.isFinite(options.range) ? options.range : 30.0,
    // Disabled cone by default for point lights.
    spotInnerCos: -1.0,
    spotOuterCos: -1.0,
  };
}

function createSpotLight(options = {}) {
  const innerDeg = Number.isFinite(options.innerDeg) ? options.innerDeg : 18.0;
  const outerDeg = Number.isFinite(options.outerDeg) ? options.outerDeg : 26.0;
  return {
    type: 'point',
    enabled: options.enabled !== false,
    position: options.position || [0.0, 5.0, 0.0],
    direction: options.direction || [0.0, -1.0, 0.0],
    color: options.color || [1.0, 1.0, 1.0],
    intensity: Number.isFinite(options.intensity) ? options.intensity : 1.0,
    range: Number.isFinite(options.range) ? options.range : 30.0,
    spotInnerCos: Math.cos(innerDeg * Math.PI / 180),
    spotOuterCos: Math.cos(outerDeg * Math.PI / 180),
  };
}

function createDirectionalLight(options = {}) {
  return {
    type: 'directional',
    enabled: options.enabled !== false,
    position: [0.0, 0.0, 0.0],
    direction: options.direction || [0.5, -1.0, 0.2],
    color: options.color || [1.0, 1.0, 1.0],
    intensity: Number.isFinite(options.intensity) ? options.intensity : 1.0,
    range: 0.0,
    spotInnerCos: -1.0,
    spotOuterCos: -1.0,
  };
}

function uploadLightingUniforms() {
  if (!lighting || !u_Lights) return;

  const ambient = lighting.ambient || [0.2, 0.2, 0.2];
  const lights = Array.isArray(lighting.lights) ? lighting.lights : [];
  const count = Math.min(lights.length, MAX_LIGHTS);

  gl.uniform1i(u_NumLights, count);
  gl.uniform3fv(u_AmbientColor, ambient);

  for (let i = 0; i < MAX_LIGHTS; i++) {
    const loc = u_Lights[i];
    if (!loc) continue;

    if (i >= count) {
      if (loc.enabled !== null) gl.uniform1f(loc.enabled, 0.0);
      continue;
    }

    const light = lights[i];
    const type = light.type === 'directional' ? 1.0 : 0.0;
    const enabled = light.enabled === false ? 0.0 : 1.0;
    const position = light.position || [0, 0, 0];
    const direction = light.direction || [0, -1, 0];
    const color = light.color || [1, 1, 1];
    const intensity = Number.isFinite(light.intensity) ? light.intensity : 1.0;
    const range = Number.isFinite(light.range) ? light.range : 0.0;
    const spotInnerCos = Number.isFinite(light.spotInnerCos) ? light.spotInnerCos : -1.0;
    const spotOuterCos = Number.isFinite(light.spotOuterCos) ? light.spotOuterCos : -1.0;

    if (loc.type !== null) gl.uniform1f(loc.type, type);
    if (loc.enabled !== null) gl.uniform1f(loc.enabled, enabled);
    if (loc.position !== null) gl.uniform3fv(loc.position, position);
    if (loc.direction !== null) gl.uniform3fv(loc.direction, direction);
    if (loc.color !== null) gl.uniform3fv(loc.color, color);
    if (loc.intensity !== null) gl.uniform1f(loc.intensity, intensity);
    if (loc.range !== null) gl.uniform1f(loc.range, range);
    if (loc.spotInnerCos !== null) gl.uniform1f(loc.spotInnerCos, spotInnerCos);
    if (loc.spotOuterCos !== null) gl.uniform1f(loc.spotOuterCos, spotOuterCos);
  }
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
    radius: 0.9,
  });
  
  // Update camera
  camera.update();
  
  // Clear buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform3fv(u_CameraPos, camera.position.elements);
  gl.uniform1i(u_EnableLighting, lightingEnabled ? 1 : 0);
  gl.uniform1i(u_ShowNormals, showNormals ? 1 : 0);
  updateLighting();
  uploadLightingUniforms();

  const primaryLight = (lighting && lighting.lights && lighting.lights.length > 0) ? lighting.lights[0] : null;
  if (lightMarker && primaryLight && primaryLight.position) {
    lightMarker.position[0] = primaryLight.position[0];
    lightMarker.position[1] = primaryLight.position[1];
    lightMarker.position[2] = primaryLight.position[2];
  }
  
  // Render the world
  world.render(gl, camera, useTexture, lighting);
  if (lightMarker) {
    lightMarker.render(gl, camera, textureManager, useTexture, lighting);
  }
  
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
  player = new Player([camera.position.elements[0], camera.position.elements[1], camera.position.elements[2]]);
  syncCameraToPlayer();
  world.placeSpecialHumanInFront(camera);

  // Modular lighting state; lights[] supports point, directional, and spot-ready fields.
  lighting = {
    ambient: [0.2, 0.2, 0.2],
    lights: [
      createPointLight({ position: [0.0, 5.0, 0.0], range: 30.0 }),
      createSpotLight({
        enabled: spotlightEnabled,
        position: [5.0, 10.0, 0.0],
        direction: [-0.75, -1.0, 0.0],
        range: 40.0,
        innerDeg: 8.0,
        outerDeg: 12.0,
      }),
    ],
  };
  lightMarker = new TexturedCube();
  lightMarker.scale = [0.3, 0.3, 0.3];
  lightMarker.color = [1.0, 1.0, 1.0, 1.0];
  lightMarker.setTexture('checkerboard');
  lightMarker.useLighting = false;
  
  // Set up UI controls
  addActionListeners();
  updateCameraSliders();
  
  // Set clear color
  gl.clearColor(0.64, 0.64, 0.64, 1.0); // Sky blue
  
  // Start rendering loop
  requestAnimationFrame(tick);
  
  console.log('Assignment 4 initialized successfully');
}

// function setFogUniforms() {
//   gl.uniform3f(u_FogColor, 0.64, 0.64, 0.64);
//   gl.uniform1f(u_FogNear, 1);
//   gl.uniform1f(u_FogFar, 20);
// }

function updateLighting() {
  if (!lighting || !lighting.lights || lighting.lights.length === 0) return;

  const t = performance.now() * 0.001;
  const centerX = lightX;
  const centerZ = lightZ;

  const angle = t * lightOrbitSpeed;
  const lx = centerX + Math.cos(angle) * lightOrbitRadius;
  const ly = lightY;
  const lz = centerZ + Math.sin(angle) * lightOrbitRadius;
  const light = lighting.lights[0];
  light.position = [lx, ly, lz];

  // Directional light points from light position toward orbit center.
  let dx = centerX - lx;
  let dy = lightTargetY - ly;
  let dz = centerZ - lz;
  const len = Math.hypot(dx, dy, dz) || 1.0;
  dx /= len;
  dy /= len;
  dz /= len;
  light.direction = [dx, dy, dz];
}
