// human.js - OBJ-backed Human renderer

class Human {
  constructor() {
    this.position = [0, 1.0, 0];
    this.scale = [1, 1, 1];
    this.rotation = [0, 0, 0];
    this.modMat = new Matrix4().setIdentity();

    this.color = [0.73, 0.73, 0.73, 1.0];
    this.useLighting = true;
    this.lightDirection = [0.6, 1.0, 0.4];
    this.lightColor = [1.0, 1.0, 1.0];
    this.ambientColor = [0.2, 0.2, 0.2];
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

  static normalizeDirectionXZ(dirX, dirZ) {
    const len = Math.hypot(dirX, dirZ);
    if (len < 1e-6) return [1, 0];
    return [dirX / len, dirZ / len];
  }

  static directionToYawDeg(dirX, dirZ, yawOffsetDeg = 0) {
    const dir = Human.normalizeDirectionXZ(dirX, dirZ);
    // Human mesh forward axis aligns with +X in model space.
    return Math.atan2(dir[1], dir[0]) * 180 / Math.PI + yawOffsetDeg;
  }

  static stepForward(position, dirX, dirZ, distance) {
    const dir = Human.normalizeDirectionXZ(dirX, dirZ);
    return [
      position[0] + dir[0] * distance,
      position[1],
      position[2] + dir[1] * distance,
    ];
  }

  static stepRight(position, dirX, dirZ, distance, side = 1) {
    const dir = Human.normalizeDirectionXZ(dirX, dirZ);
    const rightX = dir[1] * side;
    const rightZ = -dir[0] * side;
    return [
      position[0] + rightX * distance,
      position[1],
      position[2] + rightZ * distance,
    ];
  }

  static _parseObj(objText) {
    const positions = [[0, 0, 0]];
    const texcoords = [[0, 0]];
    const normals = [[0, 1, 0]];

    const outPositions = [];
    const outUVs = [];
    const outNormals = [];

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

      if (line.startsWith('vn ')) {
        const n = line.split(/\s+/);
        normals.push([
          parseFloat(n[1]),
          parseFloat(n[2]),
          parseFloat(n[3]),
        ]);
        continue;
      }

      if (line.startsWith('f ')) {
        const refs = line.split(/\s+/).slice(1);
        if (refs.length < 3) continue;

        for (let j = 1; j < refs.length - 1; j++) {
          const p0 = Human._resolvePosition(refs[0], positions);
          const p1 = Human._resolvePosition(refs[j], positions);
          const p2 = Human._resolvePosition(refs[j + 1], positions);
          const faceNormal = Human._computeFaceNormal(p0, p1, p2);

          Human._appendFaceVertex(refs[0], positions, texcoords, normals, outPositions, outUVs, outNormals, faceNormal);
          Human._appendFaceVertex(refs[j], positions, texcoords, normals, outPositions, outUVs, outNormals, faceNormal);
          Human._appendFaceVertex(refs[j + 1], positions, texcoords, normals, outPositions, outUVs, outNormals, faceNormal);
        }
      }
    }

    Human._normalizePositions(outPositions);

    return {
      vertices: new Float32Array(outPositions),
      uvs: new Float32Array(outUVs),
      normals: new Float32Array(outNormals),
      vertexCount: outPositions.length / 3,
    };
  }

  static _appendFaceVertex(ref, positions, texcoords, normals, outPositions, outUVs, outNormals, fallbackNormal) {
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

    let normal = fallbackNormal || [0, 1, 0];
    if (parts.length > 2 && parts[2] !== '') {
      let ni = parseInt(parts[2], 10);
      if (ni < 0) ni = normals.length + ni;
      normal = normals[ni] || normal;
    }

    outPositions.push(p[0], p[1], p[2]);
    outUVs.push(uv[0], uv[1]);
    outNormals.push(normal[0], normal[1], normal[2]);
  }

  static _resolvePosition(ref, positions) {
    const parts = ref.split('/');
    let pi = parseInt(parts[0], 10);
    if (pi < 0) pi = positions.length + pi;
    return positions[pi] || [0, 0, 0];
  }

  static _computeFaceNormal(p0, p1, p2) {
    const ux = p1[0] - p0[0];
    const uy = p1[1] - p0[1];
    const uz = p1[2] - p0[2];
    const vx = p2[0] - p0[0];
    const vy = p2[1] - p0[1];
    const vz = p2[2] - p0[2];

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;

    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-8) return [0, 1, 0];

    nx /= len;
    ny /= len;
    nz /= len;
    return [nx, ny, nz];
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

    const normalBuffer = gl.createBuffer();
    if (!normalBuffer) return false;
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);

    Human._buffers.set(gl, {
      vertexBuffer,
      uvBuffer,
      normalBuffer,
      vertexCount: mesh.vertexCount,
    });

    return true;
  }

  render(gl, camera, textureManager, useTexture, lighting=null) {
    if (!Human._mesh) return;
    if (!Human._initBuffers(gl)) return;

    const gpu = Human._buffers.get(gl);
    if (!gpu) return;

    this.updateMatrix();

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.getViewMatrix().elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.getProjectionMatrix().elements);
    const normalMatrix = new Matrix4().setInverseOf(this.modelMatrix).transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.uniform4fv(u_Color, this.color);
    gl.uniform1i(u_UseTexture, 0);
    gl.uniform1i(u_UseLighting, this.useLighting ? 1 : 0);
    if (this.useLighting) {
      const lightDirection = (lighting && lighting.direction) ? lighting.direction : this.lightDirection;
      const lightColor = (lighting && lighting.color) ? lighting.color : this.lightColor;
      const ambientColor = (lighting && lighting.ambient) ? lighting.ambient : this.ambientColor;

      gl.uniform3fv(u_LightDirection, lightDirection);
      gl.uniform3fv(u_LightColor, lightColor);
      gl.uniform3fv(u_AmbientColor, ambientColor);
    }

    gl.drawArrays(gl.TRIANGLES, 0, gpu.vertexCount);
  }
}

Human._meshPromise = null;
Human._mesh = null;
Human._buffers = null;
