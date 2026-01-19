// shapes.js
// Contains all shape classes: Point, Triangle, Circle

// Point class
class Point {
    constructor(x, y, color, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
    }

    render() {
        var rgba = this.color;
        var size = this.size;

        gl.vertexAttrib3f(a_Position, this.x, this.y, 0.0);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_Size, size);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}

// Triangle class
class Triangle {
    constructor(x, y, color, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size / 100.0;
    }

    render() {
        var rgba = this.color;
        var s = this.size;

        var vertices = new Float32Array([
            this.x, this.y + s,
            this.x - s, this.y - s,
            this.x + s, this.y - s
        ]);

        var n = 3;
        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create buffer');
            return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}

// Circle class
class Circle {
    constructor(x, y, color, size, segments) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size / 100.0;
        this.segments = segments;
    }

    render() {
        var rgba = this.color;
        var s = this.size;

        var vertices = [this.x, this.y];
        var angleStep = (2 * Math.PI) / this.segments;

        for (var i = 0; i <= this.segments; i++) {
            var angle = i * angleStep;
            var vx = this.x + s * Math.cos(angle);
            var vy = this.y + s * Math.sin(angle);
            vertices.push(vx, vy);
        }

        var verticesArray = new Float32Array(vertices);
        var n = this.segments + 2;

        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create buffer');
            return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }
}