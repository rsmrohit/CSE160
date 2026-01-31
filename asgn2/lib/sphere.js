class Sphere {
    constructor() {
        this.type = "sphere";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 16;  // Higher = smoother (try 16, 24, or 32)
    }

    render() {
        var rgba = this.color;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        var latitudeBands = this.segments;
        var longitudeBands = this.segments;
        
        // Generate sphere using latitude/longitude approach
        for (var lat = 0; lat < latitudeBands; lat++) {
            var theta1 = lat * Math.PI / latitudeBands;
            var theta2 = (lat + 1) * Math.PI / latitudeBands;
            
            for (var lon = 0; lon < longitudeBands; lon++) {
                var phi1 = lon * 2 * Math.PI / longitudeBands;
                var phi2 = (lon + 1) * 2 * Math.PI / longitudeBands;
                
                // Calculate 4 vertices for this quad
                var v1 = sphereVertex(theta1, phi1);
                var v2 = sphereVertex(theta2, phi1);
                var v3 = sphereVertex(theta2, phi2);
                var v4 = sphereVertex(theta1, phi2);
                
                // Simple shading based on y-coordinate (height)
                // Higher points are brighter
                var shade1 = 0.7 + 0.3 * v1[1];  // Maps -1..1 to 0..1
                var shade2 = 0.7 + 0.3 * v2[1];
                
                // Draw two triangles for this quad
                gl.uniform4f(u_FragColor, rgba[0]*shade1, rgba[1]*shade1, rgba[2]*shade1, rgba[3]);
                draw3DTriangle([v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2]]);
                
                gl.uniform4f(u_FragColor, rgba[0]*shade2, rgba[1]*shade2, rgba[2]*shade2, rgba[3]);
                draw3DTriangle([v1[0], v1[1], v1[2], v3[0], v3[1], v3[2], v4[0], v4[1], v4[2]]);
            }
        }
    }
}

// Helper function to calculate vertex position on unit sphere
function sphereVertex(theta, phi) {
    var x = Math.sin(theta) * Math.cos(phi);
    var y = Math.cos(theta);
    var z = Math.sin(theta) * Math.sin(phi);
    return [x, y, z];
}
