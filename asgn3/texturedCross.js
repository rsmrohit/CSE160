// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// texturedCross.js - Textured cross geometry

class TexturedCross {
  constructor() {
    this.position = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.rotation = [0, 0, 0]; // [x, y, z] Euler angles in degrees
    this.modMat = new Matrix4().setIdentity();
    
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.textureName = null;
    
    this.modelMatrix = new Matrix4();
    
    // Two intersecting vertical quads (X-cross), centered at origin
    this.vertices = new Float32Array([
      // Quad A: diagonal from (-,-) to (+,+) in XZ
      -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
      -0.5, -0.5, -0.5,   0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,

      // Quad B: diagonal from (+,-) to (-,+) in XZ
       0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
       0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    ]);
    
    // UV coordinates for texture mapping
    this.uvs = new Float32Array([
      // Quad A
      0, 0,  1, 0,  1, 1,
      0, 0,  1, 1,  0, 1,

      // Quad B
      0, 0,  1, 0,  1, 1,
      0, 0,  1, 1,  0, 1,
    ]);
    
    this.vertexBuffer = null;
    this.uvBuffer = null;
  }
  
  /**
   * Set the texture to use for this cube
   */
  setTexture(textureName) {
    this.textureName = textureName;
  }
  
  /**
   * Update the model matrix based on position, rotation, and scale
   */
  updateMatrix() {
    this.modelMatrix.setIdentity();

    // Apply custom transformation
    this.modelMatrix.multiply(this.modMat);
    
    // Apply transformations in order: translate -> rotate -> scale
    this.modelMatrix.translate(this.position[0], this.position[1], this.position[2]);
    
    // Apply rotations (order: Y -> X -> Z)
    if (this.rotation[1] !== 0) {
      this.modelMatrix.rotate(this.rotation[1], 0, 1, 0);
    }
    if (this.rotation[0] !== 0) {
      this.modelMatrix.rotate(this.rotation[0], 1, 0, 0);
    }
    if (this.rotation[2] !== 0) {
      this.modelMatrix.rotate(this.rotation[2], 0, 0, 1);
    }
    
    this.modelMatrix.scale(this.scale[0], this.scale[1], this.scale[2]);
    
  }
  
  /**
   * Initialize buffers for this cube
   */
  initBuffers(gl) {
    // Create vertex buffer
    this.vertexBuffer = gl.createBuffer();
    if (!this.vertexBuffer) {
      console.log('Failed to create vertex buffer');
      return false;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    
    // Create UV buffer
    this.uvBuffer = gl.createBuffer();
    if (!this.uvBuffer) {
      console.log('Failed to create UV buffer');
      return false;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
    
    return true;
  }
  
  /**
   * Render this cube
   */
  render(gl, camera, textureManager, useTexture) {
    // Initialize buffers if not already done
    if (!this.vertexBuffer) {
      this.initBuffers(gl);
    }
    
    // Update model matrix
    this.updateMatrix();
    
    // Set matrices
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.getViewMatrix().elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.getProjectionMatrix().elements);
    
    // Bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    // Bind UV buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    // Set color
    gl.uniform4fv(u_Color, this.color);
    
    // Set texture or color mode
    if (useTexture && this.textureName && textureManager.bindTexture(this.textureName, 0)) {
      gl.uniform1i(u_Sampler, 0);
      gl.uniform1i(u_UseTexture, 1);
    } else {
      gl.uniform1i(u_UseTexture, 0);
    }
    
    // Draw the cross (4 triangles total)
    gl.drawArrays(gl.TRIANGLES, 0, 12);
  }
}
