var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform float u_Size;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  gl_PointSize = u_Size;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' +
    '}\n';

// Global variables
var gl;
var canvas;
var a_Position;
var u_FragColor;
var u_Size;
var shapesList = [];
var currentColor = [1.0, 0.0, 0.0, 1.0];
var currentSize = 10.0;
var currentShape = 'point';
var currentSegments = 10;
var g_symmetryMode = 'none';

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    setupEventHandlers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}

function setupEventHandlers() {
    canvas.onmousedown = click;
    canvas.onmousemove = click;

    document.getElementById('redSlider').oninput = function () {
        currentColor[0] = this.value / 100;
    };
    document.getElementById('greenSlider').oninput = function () {
        currentColor[1] = this.value / 100;
    };
    document.getElementById('blueSlider').oninput = function () {
        currentColor[2] = this.value / 100;
    };

    document.getElementById('sizeSlider').oninput = function () {
        currentSize = parseFloat(this.value);
    };

    document.getElementById('segmentsSlider').oninput = function () {
        currentSegments = parseInt(this.value);
    };

    document.getElementById('pointBtn').onclick = function () {
        currentShape = 'point';
    };
    document.getElementById('triangleBtn').onclick = function () {
        currentShape = 'triangle';
    };
    document.getElementById('circleBtn').onclick = function () {
        currentShape = 'circle';
    };

    document.getElementById('clearBtn').onclick = function () {
        shapesList = [];
        renderAllShapes();
    };

    document.getElementById('drawPictureBtn').onclick = drawMyPicture;

    document.getElementById('symmetryOffBtn').onclick = function () { g_symmetryMode = 'none'; };
    document.getElementById('symmetryLrBtn').onclick = function () { g_symmetryMode = 'mirror_lr'; };
    document.getElementById('symmetry4Btn').onclick = function () { g_symmetryMode = 'radial_4'; };
    document.getElementById('symmetry6Btn').onclick = function () { g_symmetryMode = 'radial_6'; };
}

function click(ev) {
    if (ev.buttons !== 1) {
        return;
    }

    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    if (g_symmetryMode === 'none') {
        addNewShape(x, y);
    } else if (g_symmetryMode === 'mirror_lr') {
        addNewShape(x, y);
        addNewShape(-x, y);
    } else if (g_symmetryMode === 'radial_4') {
        addNewShape(x, y);
        addNewShape(y, -x);
        addNewShape(-x, -y);
        addNewShape(-y, x);
    } else if (g_symmetryMode === 'radial_6') {
        addNewShape(x, y);
        for (let i = 1; i < 6; i++) {
            let theta = (Math.PI / 3) * i;
            let rx = x * Math.cos(theta) - y * Math.sin(theta);
            let ry = x * Math.sin(theta) + y * Math.cos(theta);
            addNewShape(rx, ry);
        }
    }

    renderAllShapes();
}

function addNewShape(x, y) {
    var shape;
    var color = [currentColor[0], currentColor[1], currentColor[2], currentColor[3]];

    if (currentShape === 'point') {
        shape = new Point(x, y, color, currentSize);
    } else if (currentShape === 'triangle') {
        shape = new Triangle(x, y, color, currentSize);
    } else if (currentShape === 'circle') {
        shape = new Circle(x, y, color, currentSize, currentSegments);
    }

    shapesList.push(shape);
}

function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < shapesList.length; i++) {
        shapesList[i].render();
    }
}

function drawMyPicture() {
    shapesList = [];

    // --- Trees ---
    // Tree 1 (Left)
    shapesList.push(new Triangle(-0.7, -0.2, [0.4, 0.2, 0.1, 1.0], 15)); // Trunk
    shapesList.push(new Triangle(-0.7, 0.0, [0.1, 0.6, 0.1, 1.0], 40));  // Leaves Bottom
    shapesList.push(new Triangle(-0.7, 0.2, [0.1, 0.6, 0.1, 1.0], 35));  // Leaves Mid
    shapesList.push(new Triangle(-0.7, 0.4, [0.1, 0.6, 0.1, 1.0], 30));  // Leaves Top

    // Tree 2 (Right)
    shapesList.push(new Triangle(0.7, -0.2, [0.4, 0.2, 0.1, 1.0], 15)); // Trunk
    shapesList.push(new Triangle(0.7, 0.0, [0.1, 0.6, 0.1, 1.0], 40));  // Leaves Bottom
    shapesList.push(new Triangle(0.7, 0.2, [0.1, 0.6, 0.1, 1.0], 35));  // Leaves Mid
    shapesList.push(new Triangle(0.7, 0.4, [0.1, 0.6, 0.1, 1.0], 30));  // Leaves Top

    // --- Initials "RSM" with Circles (Pen Style) ---
    let penColor = [1.0, 0.0, 1.0, 1.0]; // Magenta/Pink Pen
    let penSize = 5;
    let segments = 8;

    // Helper to draw a line of circles
    function drawLine(x1, y1, x2, y2, steps) {
        for (let i = 0; i <= steps; i++) {
            let t = i / steps;
            let x = x1 + (x2 - x1) * t;
            let y = y1 + (y2 - y1) * t;
            shapesList.push(new Circle(x, y, penColor, penSize, segments));
        }
    }

    // Helper to draw a curve (quadratic bezier)
    function drawCurve(x1, y1, cx, cy, x2, y2, steps) {
        for (let i = 0; i <= steps; i++) {
            let t = i / steps;
            let invT = 1 - t;
            let x = invT * invT * x1 + 2 * invT * t * cx + t * t * x2;
            let y = invT * invT * y1 + 2 * invT * t * cy + t * t * y2;
            shapesList.push(new Circle(x, y, penColor, penSize, segments));
        }
    }

    // Letter R (Center: -0.3 to -0.1)
    drawLine(-0.4, -0.2, -0.4, 0.2, 10); // Vertical bar
    drawCurve(-0.4, 0.2, -0.2, 0.25, -0.4, 0.0, 10); // Loop
    drawLine(-0.4, 0.0, -0.25, -0.2, 8); // Leg

    // Letter S (Center: -0.1 to 0.1)
    // S curve: Top curve Left->Right, then diagonal down-left, then bottom curve Left->Right
    // Or simplified Bezier S: Top half, Bottom half
    drawCurve(0.05, 0.2, 0.05, 0.3, -0.05, 0.2, 8); // Top hook
    drawCurve(-0.05, 0.2, -0.15, 0.1, 0.0, 0.0, 8);  // Top curve to center
    drawCurve(0.0, 0.0, 0.15, -0.1, -0.05, -0.2, 8); // Bottom curve

    // Letter M (Center: 0.2 to 0.4)
    drawLine(0.2, -0.2, 0.2, 0.2, 10); // Left Up
    drawLine(0.2, 0.2, 0.3, 0.0, 8); // Down Middle
    drawLine(0.3, 0.0, 0.4, 0.2, 8); // Up Middle
    drawLine(0.4, 0.2, 0.4, -0.2, 10); // Right Down

    renderAllShapes();
}