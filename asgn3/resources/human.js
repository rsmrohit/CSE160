// human.js - OBJ-backed Human renderer

class Human {
  constructor() {
    this.position = [0, 1.0, 0];
    this.scale = [1, 1, 1];
    this.rotation = [0, 0, 0];
    this.modMat = new Matrix4().setIdentity();

    this.color = [0.95, 0.8, 0.7, 1.0];
    this.modelMatrix = new Matrix4();

    if (!Human._meshPromise) {
      Human._meshPromise = Human._loadObjMesh('resources/man_custom/man_custom.obj')
        .then((mesh) => {
          Human._mesh = mesh;
          return mesh;
        })
        .catch((err) => {
          console.error('Failed to load Human OBJ:', err);
          Human._mesh = null;
          return null;
        });
    }
  }

  static async _loadObjMesh(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' while loading ' + url);
    }
    const objText = await response.text();
    return Human._parseObj(objText);
  }

  static _parseObj(objText) {
    const positions = [[0, 0, 0]];
    const texcoords = [[0, 0]];

    const outPositions = [];
    const outUVs = [];

    const lines = objText.split('\n');

    for (let i = 0, n = lines.length; i < n; i++) {
      const line = lines[i].trim();
      if (!line || line[0] === '#') continue;

      if (line.startsWith('v ')) {
        const p = line.split(/\s+/);
        positions.push([
          parseFloat(p[1]),
          parseFloat(p[2]),
          parseFloat(p[3]),
        ]);
        continue;
      }

      if (line.startsWith('vt ')) {
        const t = line.split(/\s+/);
        texcoords.push([
          parseFloat(t[1]),
          parseFloat(t[2]),
        ]);
        continue;
      }

      if (line.startsWith('f ')) {
        const refs = line.split(/\s+/).slice(1);
        if (refs.length < 3) continue;

        for (let j = 1; j < refs.length - 1; j++) {
          Human._appendFaceVertex(refs[0], positions, texcoords, outPositions, outUVs);
          Human._appendFaceVertex(refs[j], positions, texcoords, outPositions, outUVs);
          Human._appendFaceVertex(refs[j + 1], positions, texcoords, outPositions, outUVs);
        }
      }
    }

    Human._normalizePositions(outPositions);

    return {
      vertices: new Float32Array(outPositions),
      uvs: new Float32Array(outUVs),
      vertexCount: outPositions.length / 3,
    };
  }

  static _appendFaceVertex(ref, positions, texcoords, outPositions, outUVs) {
    const parts = ref.split('/');

    let pi = parseInt(parts[0], 10);
    if (pi < 0) pi = positions.length + pi;
    const p = positions[pi] || [0, 0, 0];

    let uv = [0, 0];
    if (parts.length > 1 && parts[1] !== '') {
      let ti = parseInt(parts[1], 10);
      if (ti < 0) ti = texcoords.length + ti;
      uv = texcoords[ti] || uv;
    }

    outPositions.push(p[0], p[1], p[2]);
    outUVs.push(uv[0], uv[1]);
  }

  static _normalizePositions(flatPositions) {
    if (flatPositions.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < flatPositions.length; i += 3) {
      const x = flatPositions[i];
      const y = flatPositions[i + 1];
      const z = flatPositions[i + 2];

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    const cz = (minZ + maxZ) * 0.5;

    const sx = maxX - minX;
    const sy = maxY - minY;
    const sz = maxZ - minZ;
    const maxExtent = Math.max(sx, sy, sz) || 1;
    const invScale = 1.0 / maxExtent;

    for (let i = 0; i < flatPositions.length; i += 3) {
      flatPositions[i] = (flatPositions[i] - cx) * invScale;
      flatPositions[i + 1] = (flatPositions[i + 1] - cy) * invScale;
      flatPositions[i + 2] = (flatPositions[i + 2] - cz) * invScale;
    }
  }

  updateMatrix() {
    this.modelMatrix.setIdentity();
    this.modelMatrix.multiply(this.modMat);
    this.modelMatrix.translate(this.position[0], this.position[1], this.position[2]);

    if (this.rotation[1] !== 0) this.modelMatrix.rotate(this.rotation[1], 0, 1, 0);
    if (this.rotation[0] !== 0) this.modelMatrix.rotate(this.rotation[0], 1, 0, 0);
    if (this.rotation[2] !== 0) this.modelMatrix.rotate(this.rotation[2], 0, 0, 1);

    this.modelMatrix.scale(this.scale[0], this.scale[1], this.scale[2]);
  }

  static _initBuffers(gl) {
    const mesh = Human._mesh;
    if (!mesh) return false;

    if (!Human._buffers) {
      Human._buffers = new WeakMap();
    }

    if (Human._buffers.has(gl)) {
      return true;
    }

    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) return false;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer();
    if (!uvBuffer) return false;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);

    Human._buffers.set(gl, {
      vertexBuffer,
      uvBuffer,
      vertexCount: mesh.vertexCount,
    });

    return true;
  }

  render(gl, camera, textureManager, useTexture) {
    if (!Human._mesh) return;
    if (!Human._initBuffers(gl)) return;

    const gpu = Human._buffers.get(gl);
    if (!gpu) return;

    this.updateMatrix();

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.getViewMatrix().elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.getProjectionMatrix().elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.uniform4fv(u_Color, this.color);
    gl.uniform1i(u_UseTexture, 0);

    gl.drawArrays(gl.TRIANGLES, 0, gpu.vertexCount);
  }
}

Human._meshPromise = null;
Human._mesh = null;
Human._buffers = null;
