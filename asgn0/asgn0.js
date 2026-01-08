var ctx;
var v1;
var v2;
var scalar;
var oper;

function main() {
    // Retrieve canvas element and its context
    var canvas = document.getElementById("example");
    //err handling
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }
    ctx = canvas.getContext("2d");
    // var g1 = getWebGLContext(canvas);

    // g1.clearColor(0.0, 0.0, 0.0, 1.0);

    // make canvas black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    v1 = new Vector3([0, 0, 0]);
    v2 = new Vector3([0, 0, 0]);
    // drawVector(v1, "red");

}

function drawVector(v, color) {
    scale = 20;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(v.elements[0] * scale + 200, -(v.elements[1] * scale) + 200);
    ctx.stroke();
}

function handleDrawEvent() {
    ctx.clearRect(0, 0, 400, 400);
    // make canvas black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 400);

    v1.elements[0] = parseFloat(document.getElementById("v1-x").value);
    v1.elements[1] = parseFloat(document.getElementById("v1-y").value);

    v2.elements[0] = parseFloat(document.getElementById("v2-x").value);
    v2.elements[1] = parseFloat(document.getElementById("v2-y").value);

    drawVector(v1, "red");
    drawVector(v2, "blue");

    // get operation
    oper = document.getElementById("operation").value;
    scalar = parseFloat(document.getElementById("scalar").value);
    if (oper === "add") {
        drawVector(v1.add(v2), "green");
    } else if (oper === "sub") {
        drawVector(v1.sub(v2), "green");
    } else if (oper === "mul") {
        drawVector(v1.mul(scalar), "green");
        drawVector(v2.mul(scalar), "green");
    } else if (oper === "div") {
        drawVector(v1.div(scalar), "green");
        drawVector(v2.div(scalar), "green");
    } else if (oper === "mag") {
        console.log("Magnitude v1: " + v1.magnitude());
        console.log("Magnitude v2: " + v2.magnitude());
    } else if (oper === "norm") {
        drawVector(v1.normalize(), "green");
        drawVector(v2.normalize(), "green");
    } else if (oper === "angle") {
        let angle = angleBetween(v1, v2);
        console.log("Angle: " + angle);
    } else if (oper === "area") {
        let crossProd = Vector3.cross(v1, v2);
        let area = crossProd.magnitude() / 2;
        console.log("Area of a Triangle: " + area);
    }
}

function angleBetween(v1, v2) {
    let dotProd = Vector3.dot(v1, v2);
    let magV1 = v1.magnitude();
    let magV2 = v2.magnitude();
    let cosTheta = dotProd / (magV1 * magV2);
    let angle = Math.acos(cosTheta) * 180 / Math.PI;
    return angle;
}