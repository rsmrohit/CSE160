// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// asgn2.js

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  void main() {
    gl_Position = u_ViewMatrix * u_ModelMatrix * a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global GL variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ViewMatrix;

let g_vertexBuffer = null;

// Current rotation angle
let g_selectedAngle = 0.0;
let g_selectedAngle2 = 0.0;
let g_selectedAngle3 = 0.0;
let g_selectedZoom = 50.0;

let g_selectedAngle4 = 0.0;
let g_selectedAngle5 = 0.0;

//Animation triggers
let g_animation = false;
let g_animation2 = false;
let g_animation2StartTime = 0;

// Animation angles
//g_legs angles, where the first is for the upper leg and the second is for the lower leg
let g_legsAngles = [[0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]]; // left back, right back, left front, right front
let neck_cubes_count = 7;
//edit need to incorporate pitch
// let g_neckAngles = [[0.0, 5.0],[0.0, 5.0], [0.0, 5.0], [0.0, 5.0], [0.0, 5.0], [0.0, 5.0], [0.0, 5.0]]; // yaw, roll, pitch
let g_neckAngles = [];
for(var i = 0; i < neck_cubes_count; i++) {
    g_neckAngles.push([0.0, 0.0, 0.0]); // yaw, pitch, roll
}
let show_hump = false;

function initBuffers() {
    g_vertexBuffer = gl.createBuffer();
    if (!g_vertexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    return true;
}

function setUpWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  gl.enable(gl.DEPTH_TEST);

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if(!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionListeners() {
  // Angle slider - updates rotation and re-renders
  document.getElementById('angle-slider').addEventListener('mousemove', function() {
    g_selectedAngle = this.value;
    // renderAllShapes();  
  });

  document.getElementById('slider-2').addEventListener('mousemove', function() {
    g_selectedAngle2 = this.value;
  });

  document.getElementById('slider-3').addEventListener('mousemove', function() {
    g_selectedAngle3 = this.value;
  });

  document.getElementById('anon-slider').addEventListener('mousemove', function() {
    // g_selectedAngle4 = this.value;
    // need to write to animate legs array
    //make it opposite
    for (let i = 0; i < 4; i++) {
        // g_legsAngles[i][0] = this.value;
        if (i % 2 === 0) {
            g_legsAngles[i][0] = this.value;
        } else {
            g_legsAngles[i][0] = -this.value;
        }
    }
  });

  document.getElementById('slider-5').addEventListener('mousemove', function() {
    // control lower legs
    //opposite need to be oppsite
    for (let i = 0; i < 4; i++) {
        // g_legsAngles[i][1] = this.value;
        if (i % 2 === 0) {
            g_legsAngles[i][1] = this.value;
        } else {
            g_legsAngles[i][1] = -this.value;
        }
    }

  });

  document.getElementById('remove-hump').addEventListener('change', function() {
    show_hump = this.checked;
 });

  document.getElementById('start-animation1').addEventListener('click', function() {
    g_animation = true;
 });

  document.getElementById('stop-animation1').addEventListener('click', function() {
    g_animation = false;
  });

    document.getElementById('start-animation2').addEventListener('click', function() {
        g_animation2 = true;
        g_animation2StartTime = g_seconds;
    });

  document.getElementById('stop-animation2').addEventListener('click', function() {
    g_animation2 = false;
  });

  document.getElementById('slider-4').addEventListener('mousemove', function() {
    g_selectedZoom = this.value;
});
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
    g_seconds = performance.now()/1000.0 - g_startTime;
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

function updateAnimationAngles() {

    // First animation: if animate is true
    // We animate legs, using animate legs array
    // upper legs move in sinusoidal from -45 to 45 degrees

    if (g_animation) {
        let angleUpper = 45.0 * Math.sin(g_seconds * 2.0); // Speed factor of 2.0
        let angleLower = 30.0 * Math.sin(g_seconds * 2.0 + Math.PI); // Opposite phase
        for (let i = 0; i < 4; i++) {
            // Alternate legs move opposite
            if (i % 2 === 0) {
                g_legsAngles[i][0] = angleUpper;
                g_legsAngles[i][1] = angleLower;
            } else {
                g_legsAngles[i][0] = -angleUpper;
                g_legsAngles[i][1] = -angleLower;
            }
        }

        // neck should say from -5 to 5 degrees
        let neckAngle = 7.0 * Math.sin(g_seconds * 1.8); // Slower speed factor of 1.5
        for (let i = 0; i < neck_cubes_count; i++) {
            g_neckAngles[i][1] = neckAngle;
        }
    }

    // second animateion, temporarily use g_animation2 variable
    //make the knees buckle, the upper legs will rotate to 90 and lower legs to -90
    // then after a brief pause
    // the neck will look left and right (on neckAgnles[i][0]) will go from -5 to 5 to 0 only ONCE
    // then neck will go down (pitch on neckAngles[i][2]) from 0 to -20 to 0 only ONCE

    if (g_animation2) {
        let buckleDuration = 1.5;  // Buckle for 1.5 seconds
        let pauseDuration = 0.5;   // Pause for 0.5 seconds
        let lookDuration = 2.0;    // Look left-right for 2 seconds
        let pitchDuration = 2.0;   // Pitch down for 2 seconds
        
        let totalDuration = buckleDuration + pauseDuration + lookDuration + pitchDuration;
        let t = g_seconds - g_animation2StartTime;  // Use actual time, not modulo (so it only happens once)

        if (t < buckleDuration) {
            // Phase 1: Buckling legs
            let progress = Math.min(t / buckleDuration, 1.0);  // Clamp to [0,1]
            let smoothProgress = progress * progress * (3 - 2 * progress);  // Smooth ease
            for (let i = 0; i < 4; i++) {
                g_legsAngles[i][0] = 75.0 * smoothProgress;
                g_legsAngles[i][1] = -140.0 * smoothProgress;
            }
            // Reset neck
            for (let i = 0; i < neck_cubes_count; i++) {
                g_neckAngles[i][0] = 0;
                g_neckAngles[i][2] = 0;
            }
            
        } else if (t < buckleDuration + pauseDuration) {
            // Phase 2: Pause (keep legs buckled)
            for (let i = 0; i < 4; i++) {
                g_legsAngles[i][0] = 75.0;
                g_legsAngles[i][1] = -140.0;
            }
            
        } else if (t < buckleDuration + pauseDuration + lookDuration) {
            // Phase 3: Look left and right
            let lookTime = t - (buckleDuration + pauseDuration);
            let lookProgress = lookTime / lookDuration;
            // sin goes 0→1→0 over one period, multiply by 2π to get full cycle
            let yawAngle = 5.0 * Math.sin(lookProgress * Math.PI * 2);
            
            for (let i = 0; i < neck_cubes_count; i++) {
                g_neckAngles[i][0] = yawAngle;
                g_neckAngles[i][2] = 0;  // No pitch yet
            }
            
        }  else if (t < totalDuration) {
            // Phase 4: Pitch down with bounce
            let pitchTime = t - (buckleDuration + pauseDuration + lookDuration);
            let pitchProgress = pitchTime / pitchDuration;
            
            // Main motion: goes down and back up
            let mainMotion = Math.sin(pitchProgress * Math.PI);
            
            // Bounce: add quick oscillations (frequency of 8 means 4 bounces during the down phase)
            let bounceFrequency = 8;
            let bounceAmount = 0.15;  // 15% of the main motion
            let bounce = Math.sin(pitchProgress * Math.PI * bounceFrequency) * bounceAmount;
            
            // Fade out the bounce as we go (so it's bouncy at the bottom, smooth at the end)
            let bounceFade = 1.0 - pitchProgress;  // Starts at 1, ends at 0
            
            let pitchAngle = -20.0 * mainMotion * (1.0 + bounce * bounceFade);
            
            for (let i = 0; i < neck_cubes_count; i++) {
                g_neckAngles[i][0] = 0;
                g_neckAngles[i][2] = pitchAngle;
            }
            
        }
    }
}

function renderAllShapes() {
  var start_time = performance.now();

  // Apply global rotation based on slider
  var globalViewMatrix = new Matrix4().rotate(g_selectedAngle, 0, 1, 0);
  globalViewMatrix.rotate(g_selectedAngle2, 0, 0, 1);
  globalViewMatrix.rotate(g_selectedAngle3, 1, 0, 0);
    globalViewMatrix.scale(g_selectedZoom / 50.0, g_selectedZoom / 50.0, g_selectedZoom / 50.0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, globalViewMatrix.elements);

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Starting new animal camel

    body_lhw = [100, 40, 60].map(x => x / 100.0);
    hump_lhw = [40, 18, 34].map(x => x / 100.0);

    upperleg_lhw = [17, 45, 17].map(x => x / 100.0);
    lowerleg_lhw = [14, 43, 14].map(x => x / 100.0);

    var adjustment = 0.15;

    // var g_camelTranslate = new Matrix4();
    // g_camelTranslate.setIdentity();

    var body = new Cube();
    body.color = [0.79, 0.53, 0.27, 1.0];
    // global translation
    body.matrix.setTranslate(-body_lhw[0]/2.0, -body_lhw[1]/2.0, -body_lhw[2]/2.0);
    var body_matrix = new Matrix4(body.matrix);
    body.matrix.scale(body_lhw[0], body_lhw[1], body_lhw[2]);
    body.render();

    var hump = new Cube();
    hump.color = [0.6, 0.4, 0.2, 1.0];
    hump.matrix = new Matrix4(body_matrix);
    hump.matrix.translate(0.0 + body_lhw[0]/2.0 - hump_lhw[0]/2.0, 
                            body_lhw[1], 
                            0.0 + body_lhw[2]/2.0 - hump_lhw[2]/2.0);
    var hump_matrix = new Matrix4(hump.matrix);
    hump.matrix.scale(hump_lhw[0], hump_lhw[1], hump_lhw[2]);
    hump.render();
    
    
    // LEFT BACK LEG

    var leftUpperLeg = new Cube();
    leftUpperLeg.color = [0.79, 0.53, 0.27, 1.0];
    leftUpperLeg.matrix = new Matrix4(body_matrix);
    leftUpperLeg.matrix.translate(0.0, -upperleg_lhw[1] + adjustment, 0.0);
    
    //undo temp translation
    leftUpperLeg.matrix.translate(0.0, upperleg_lhw[1], 0.0)
    leftUpperLeg.matrix.rotate(g_legsAngles[0][0], 0, 0, 1);
    //temp translation for rotating on the top
    leftUpperLeg.matrix.translate(0.0, -upperleg_lhw[1], 0.0)
    var leftUpperLeg_matrix = new Matrix4(leftUpperLeg.matrix);
    leftUpperLeg.matrix.scale(upperleg_lhw[0], upperleg_lhw[1], upperleg_lhw[2]);
    leftUpperLeg.render();

    var leftLowerLeg = new Cube();
    leftLowerLeg.color = [0.79, 0.53, 0.27, 1.0];
    leftLowerLeg.matrix = new Matrix4(leftUpperLeg_matrix);
    leftLowerLeg.matrix.translate(upperleg_lhw[0]/2.0 - lowerleg_lhw[0]/2.0,
                                    -lowerleg_lhw[1] + 0.05,
                                    upperleg_lhw[2]/2.0 - lowerleg_lhw[2]/2.0);

    //undo temp translation
    leftLowerLeg.matrix.translate(0.0, lowerleg_lhw[1], 0.0);
    leftLowerLeg.matrix.rotate(g_legsAngles[0][1], 0, 0, 1);
    //temp translation for rotating on the top
    leftLowerLeg.matrix.translate(0.0, -lowerleg_lhw[1], 0.0);

    leftLowerLeg.matrix.scale(lowerleg_lhw[0], lowerleg_lhw[1], lowerleg_lhw[2]);
    leftLowerLeg.render();

    // RIGHT BACK LEG

    var rightUpperLeg = new Cube();
    rightUpperLeg.color = [0.79, 0.53, 0.27, 1.0];
    rightUpperLeg.matrix = new Matrix4(body_matrix);
    rightUpperLeg.matrix.translate(0.0, -upperleg_lhw[1] + adjustment, body_lhw[2] - upperleg_lhw[2]);

    //undo temp translation
    rightUpperLeg.matrix.translate(0.0, upperleg_lhw[1], 0.0)
    rightUpperLeg.matrix.rotate(g_legsAngles[1][0], 0, 0, 1);
    //temp translation for rotating on the top
    rightUpperLeg.matrix.translate(0.0, -upperleg_lhw[1], 0.0)

    var rightUpperLeg_matrix = new Matrix4(rightUpperLeg.matrix);
    rightUpperLeg.matrix.scale(upperleg_lhw[0], upperleg_lhw[1], upperleg_lhw[2]);
    rightUpperLeg.render();

    var rightLowerLeg = new Cube();
    rightLowerLeg.color = [0.79, 0.53, 0.27, 1.0];
    rightLowerLeg.matrix = new Matrix4(rightUpperLeg_matrix);
    rightLowerLeg.matrix.translate(upperleg_lhw[0]/2.0 - lowerleg_lhw[0]/2.0,
                                    -lowerleg_lhw[1] + 0.05,
                                    upperleg_lhw[2]/2.0 - lowerleg_lhw[2]/2.0);
    
    //undo temp translation
    rightLowerLeg.matrix.translate(0.0, lowerleg_lhw[1], 0.0);
    rightLowerLeg.matrix.rotate(g_legsAngles[1][1], 0, 0, 1);
    //temp translation for rotating on the top
    rightLowerLeg.matrix.translate(0.0, -lowerleg_lhw[1], 0.0);

    rightLowerLeg.matrix.scale(lowerleg_lhw[0], lowerleg_lhw[1], lowerleg_lhw[2]);
    rightLowerLeg.render();


    // LEFT FRONT LEG
    var leftFrontUpperLeg = new Cube();
    leftFrontUpperLeg.color = [0.79, 0.53, 0.27, 1.0];
    leftFrontUpperLeg.matrix = new Matrix4(body_matrix);
    leftFrontUpperLeg.matrix.translate(body_lhw[0] - upperleg_lhw[0], -upperleg_lhw[1] + adjustment, 0.0 + body_lhw[2] - upperleg_lhw[2]);
    //undo temp translation
    leftFrontUpperLeg.matrix.translate(0.0, upperleg_lhw[1], 0.0)
    leftFrontUpperLeg.matrix.rotate(g_legsAngles[2][0], 0, 0, 1);
    //temp translation for rotating on the top
    leftFrontUpperLeg.matrix.translate(0.0, -upperleg_lhw[1], 0.0);
    var leftFrontUpperLeg_matrix = new Matrix4(leftFrontUpperLeg.matrix);

    leftFrontUpperLeg.matrix.scale(upperleg_lhw[0], upperleg_lhw[1], upperleg_lhw[2]);
    leftFrontUpperLeg.render();

    var leftFrontLowerLeg = new Cube();
    leftFrontLowerLeg.color = [0.79, 0.53, 0.27, 1.0];
    leftFrontLowerLeg.matrix = new Matrix4(leftFrontUpperLeg_matrix);
    leftFrontLowerLeg.matrix.translate(upperleg_lhw[0]/2.0 - lowerleg_lhw[0]/2.0,
                                    -lowerleg_lhw[1] + 0.05,
                                    upperleg_lhw[2]/2.0 - lowerleg_lhw[2]/2.0);

    //undo temp translation
    leftFrontLowerLeg.matrix.translate(0.0, lowerleg_lhw[1], 0.0);
    leftFrontLowerLeg.matrix.rotate(g_legsAngles[2][1], 0, 0, 1);
    //temp translation for rotating on the top
    leftFrontLowerLeg.matrix.translate(0.0, -lowerleg_lhw[1], 0.0);

    leftFrontLowerLeg.matrix.scale(lowerleg_lhw[0], lowerleg_lhw[1], lowerleg_lhw[2]);
    leftFrontLowerLeg.render();

    // RIGHT FRONT LEG
    var rightFrontUpperLeg = new Cube();
    rightFrontUpperLeg.color = [0.79, 0.53, 0.27, 1.0];
    rightFrontUpperLeg.matrix = new Matrix4(body_matrix);
    rightFrontUpperLeg.matrix.translate(body_lhw[0] - upperleg_lhw[0], -upperleg_lhw[1] + adjustment, 0.0);
    //undo temp translation
    rightFrontUpperLeg.matrix.translate(0.0, upperleg_lhw[1], 0.0)
    rightFrontUpperLeg.matrix.rotate(g_legsAngles[3][0], 0, 0, 1);
    //temp translation for rotating on the top
    rightFrontUpperLeg.matrix.translate(0.0, -upperleg_lhw[1], 0.0);
    var rightFrontUpperLeg_matrix = new Matrix4(rightFrontUpperLeg.matrix);
    rightFrontUpperLeg.matrix.scale(upperleg_lhw[0], upperleg_lhw[1], upperleg_lhw[2]);
    rightFrontUpperLeg.render();

    var rightFrontLowerLeg = new Cube();
    rightFrontLowerLeg.color = [0.79, 0.53, 0.27, 1.0];
    rightFrontLowerLeg.matrix = new Matrix4(rightFrontUpperLeg_matrix);
    rightFrontLowerLeg.matrix.translate(upperleg_lhw[0]/2.0 - lowerleg_lhw[0]/2.0,
                                    -lowerleg_lhw[1] + 0.05,
                                    upperleg_lhw[2]/2.0 - lowerleg_lhw[2]/2.0);

        //undo temp translation
    rightFrontLowerLeg.matrix.translate(0.0, lowerleg_lhw[1], 0.0);
    rightFrontLowerLeg.matrix.rotate(g_legsAngles[3][1], 0, 0, 1);
    //temp translation for rotating on the top
    rightFrontLowerLeg.matrix.translate(0.0, -lowerleg_lhw[1], 0.0);

    rightFrontLowerLeg.matrix.scale(lowerleg_lhw[0], lowerleg_lhw[1], lowerleg_lhw[2]);
    rightFrontLowerLeg.render();

    // neck will be built with 5 cubes each cube will be size 30
    // blocks will start from the front of the body which can be found at body_lwh[0]
    // and will go straight up by cube height 30

    var neck_cube_size = 20;
    var neck_cube_lhw = [neck_cube_size, neck_cube_size, neck_cube_size].map(x => x / 100.0);
    var neck_matrices = [];

    // store neck cube matrices for head positioning later
    // var neck_matrices_rot = [
    //     new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0).rotate(-5, 1, 0, 0).translate(0, 0, -neck_cube_lhw[2]/2.0),
    //     new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0).rotate(-5, 1, 0, 0).translate(0, 0, -neck_cube_lhw[2]/2.0),
    //     new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0).rotate(-5, 1, 0, 0).translate(0, 0, -neck_cube_lhw[2]/2.0),
    //     new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0).rotate(-5, 1, 0, 0).translate(0, 0, -neck_cube_lhw[2]/2.0),
    //     new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0).rotate(-5, 1, 0, 0).translate(0, 0, -neck_cube_lhw[2]/2.0),
    //     new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0).rotate(-5, 1, 0, 0).translate(0, 0, -neck_cube_lhw[2]/2.0),
    //     new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0).rotate(-5, 1, 0, 0).translate(0, 0, -neck_cube_lhw[2]/2.0),
    // ];
    //store the neck matrices rotation programatically and also include user input angles
    var neck_matrices_rot = [];
    for(var i = 0; i < neck_cubes_count; i++) {
        var rot_matrix = new Matrix4().setIdentity().translate(0, 0, neck_cube_lhw[2]/2.0)
            .rotate(g_neckAngles[i][1], 1, 0, 0)
            .rotate(g_neckAngles[i][0], 0, 1, 0)
            .rotate(g_neckAngles[i][2], 0, 0, 1)
            .translate(0, 0, -neck_cube_lhw[2]/2.0);
        neck_matrices_rot.push(rot_matrix);
    }

    var nect_connector_cube = new Cube();
    nect_connector_cube.color = [0.79, 0.53, 0.27, 1.0];
    nect_connector_cube.matrix = new Matrix4(body_matrix);
    nect_connector_cube.matrix.translate(body_lhw[0] - neck_cube_lhw[0]/3.0, body_lhw[1] - neck_cube_lhw[1], body_lhw[2]/2.0 - neck_cube_lhw[2]/2.0);
    var neck_connector_matrix = new Matrix4(nect_connector_cube.matrix);
    nect_connector_cube.matrix.scale(neck_cube_lhw[0] * 2, neck_cube_lhw[1], neck_cube_lhw[2]);
    nect_connector_cube.render();

    // Start from connector position
    var current_neck_position = new Matrix4(neck_connector_matrix).translate(neck_cube_lhw[0], -neck_cube_lhw[1]/2, 0.0);

    for(var i = 0; i < neck_cubes_count; i++) {
        var neck_cube = new Cube();
        neck_cube.color = [0.79, 0.53, 0.27, 1.0];
        
        // Start from the CURRENT position (either connector or previous cube)
        neck_cube.matrix = new Matrix4(current_neck_position);
        
        
        // Move up to create this segment
        neck_cube.matrix.translate(0.0, neck_cube_lhw[1]/1.8, 0.0);

        // Apply rotation BEFORE translation (rotate around the base of this segment)
        neck_cube.matrix.multiply(neck_matrices_rot[i]);
        
        // Save this position for the next cube (BEFORE scaling)
        current_neck_position = new Matrix4(neck_cube.matrix);
        neck_matrices.push(new Matrix4(neck_cube.matrix));
        
        // Scale only for rendering
        neck_cube.matrix.scale(neck_cube_lhw[0], neck_cube_lhw[1], neck_cube_lhw[2]);
        
        neck_cube.render();
    }

    // Use current_neck_position for the head
    var last_neck_cube_matrix = new Matrix4(current_neck_position);
    // head cube
    var head_lhw = [35, 20, 16].map(x => x / 100.0);
    var head_cube = new Cube();
    head_cube.color = [0.79, 0.53, 0.27, 1.0];
    head_cube.matrix = new Matrix4(last_neck_cube_matrix);
    head_cube.matrix.translate(0.0, 0.0, neck_cube_lhw[2]/2.0 - head_lhw[2]/2.0);
    var head_matrix = new Matrix4(head_cube.matrix);
    head_cube.matrix.scale(head_lhw[0], head_lhw[1], head_lhw[2]);
    head_cube.render();

    //eye cubes
    var eye_lhw = [5, 5, 5].map(x => x / 100.0);
    var left_eye = new Cube();
    left_eye.color = [0.0, 0.0, 0.0, 1.0];
    left_eye.matrix = new Matrix4(head_matrix);
    left_eye.matrix.translate(0.01, 2 * head_lhw[1]/4.0, head_lhw[2]/2.0 + eye_lhw[2] + 0.01);
    left_eye.matrix.scale(eye_lhw[0], eye_lhw[1], eye_lhw[2]);
    left_eye.render();

    var right_eye = new Cube();
    right_eye.color = [0.0, 0.0, 0.0, 1.0];
    right_eye.matrix = new Matrix4(head_matrix);
    right_eye.matrix.translate(0.01, 2 *  head_lhw[1]/4.0, head_lhw[2]/2.0 - eye_lhw[2]*2 - 0.01);
    right_eye.matrix.scale(eye_lhw[0], eye_lhw[1], eye_lhw[2]);
    right_eye.render();

    var hump_two = new Sphere();
    hump_two.segments = 24;
    hump_two.color = [0.6, 0.4, 0.2, 1.0];  // Same brown as body
    hump_two.matrix.translate(0.0, 0.2, 0.0);
    hump_two.matrix.scale(0.5, 0.4, 0.3);  // Make it smaller
    if(!show_hump) {
        hump_two.render();
    }

  
//   sendTextToHTML("ms: " + Math.floor(duration), "numdot");
}

function sendTextToHTML(txt, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML.");
    return;
  }
  htmlElm.innerHTML = txt;
}

function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionListeners();
  initBuffers();

  // Set clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Initial render
//   renderAllShapes();

    // Start the animation loop
    requestAnimationFrame(tick);
}
