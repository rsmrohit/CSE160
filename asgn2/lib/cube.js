class Cube {
    constructor() {
        this.type = "cube";
        // this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        // this.size = 5.0;
        // this.segments = 10;
        this.matrix = new Matrix4();
    }

    render() {
        // var xy = this.position;
        var rgba = this.color;
        // var size = this.size;
    
        // Pass the position of a point to a_Position variable
        // gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
        // gl.uniform1f(u_Size, size);
    
        // Draw
        // gl.drawArrays(gl.POINTS, 0, 1);
        // let delta = this.size/200.0;
        // drawTriangle([xy[0], xy[1], xy[0] - delta/2, xy[1] - delta*Math.sqrt(3)/2, xy[0] + delta/2, xy[1] - delta*Math.sqrt(3)/2]);

        // let angle_step = 360.0/this.segments;

        // for(var angle = 0; angle < 360; angle+=angle_step) {
        //     let centerPT = [xy[0], xy[1]];
        //     let angle1 = angle;
        //     let angle2 = angle + angle_step;
        //     let vec1 = [delta * Math.cos(angle1*Math.PI/180)/2, delta * Math.sin(angle1*Math.PI/180)/2];
        //     let vec2 = [delta * Math.cos(angle2*Math.PI/180)/2, delta * Math.sin(angle2*Math.PI/180)/2];
        //     let pt1 = [centerPT[0] + vec1[0], centerPT[1] + vec1[1]];
        //     let pt2 = [centerPT[0] + vec2[0], centerPT[1] + vec2[1]];

        //     drawTriangle([xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
        // }

        // Front of cube
        draw3DTriangle([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0])
        draw3DTriangle([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0])

        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
        // Top of cube
        draw3DTriangle([0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0])
        draw3DTriangle([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0])

        gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
        // Right of cube
        draw3DTriangle([1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0])
        draw3DTriangle([1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0])
        
        gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
        // Back of cube
        draw3DTriangle([0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0])
        draw3DTriangle([0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0])

        gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
        // Left of cube
        draw3DTriangle([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0])
        draw3DTriangle([0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0])

        gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
        // Bottom of cube
        draw3DTriangle([0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0])
        draw3DTriangle([0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0])


    }

    renderStrip() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Additional transformations can be applied here
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        // Draw the cube using triangle strips
        draw3DTriangleStrip([
            // Front face
            0.0, 0.0, 0.0,  // 0
            0.0, 1.0, 0.0,  // 1
            1.0, 0.0, 0.0,  // 2
            1.0, 1.0, 0.0,  // 3
            
            // Right face (connects from front)
            1.0, 1.0, 1.0,  // 4
            1.0, 0.0, 0.0,  // 2 (repeat)
            1.0, 0.0, 1.0,  // 5
            
            // Back face
            0.0, 0.0, 1.0,  // 6
            1.0, 1.0, 1.0,  // 4 (repeat)
            0.0, 1.0, 1.0,  // 7
            
            // Left face  
            0.0, 1.0, 0.0,  // 1 (repeat)
            0.0, 0.0, 1.0,  // 6 (repeat)
            0.0, 0.0, 0.0,  // 0 (repeat)
            
            // Bottom face
            1.0, 0.0, 0.0,  // 2 (repeat)
            0.0, 0.0, 1.0,  // 6 (repeat)
            1.0, 0.0, 1.0,  // 5 (repeat)
            
            // Top face
            0.0, 1.0, 0.0,  // 1 (repeat)
            1.0, 1.0, 0.0,  // 3 (repeat)
            0.0, 1.0, 1.0,  // 7 (repeat)
            1.0, 1.0, 1.0   // 4 (repeat)
        ]);

    }
}