// particles.js - Simple floating black diamond particle system

class BlackDiamondParticleSystem {
  constructor(map, mapBlockLength = 5, count = 120) {
    this.map = map;
    this.mapBlockLength = mapBlockLength;
    this.count = count;
    this.particles = [];
    this.time = 0;

    this.yMin = 0.35;
    this.yMax = 4.25;

    this.mapRows = this.map.length;
    this.mapCols = this.map[0].length;
    this.offsetX = -this.mapBlockLength * this.mapCols / 2;
    this.offsetZ = -this.mapBlockLength * this.mapRows / 2;

    this.mesh = new TexturedCube();
    this.mesh.setTexture(null);
    this.mesh.useLighting = false;
    this.mesh.color = [0.03, 0.03, 0.03, 1.0];

    this.init();
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(this.makeParticle());
    }
  }

  randomOpenCellPosition() {
    for (let attempt = 0; attempt < 80; attempt++) {
      const row = Math.floor(Math.random() * this.mapRows);
      const col = Math.floor(Math.random() * this.mapCols);
      if (this.map[row][col] !== 0) continue;

      const x = col * this.mapBlockLength + this.offsetX + (Math.random() - 0.5) * this.mapBlockLength * 0.8;
      const z = row * this.mapBlockLength + this.offsetZ + (Math.random() - 0.5) * this.mapBlockLength * 0.8;
      return [x, z];
    }

    return [0, 0];
  }

  makeParticle() {
    const xz = this.randomOpenCellPosition();
    const size = 0.08 + Math.random() * 0.08;
    return {
      x: xz[0],
      y: this.yMin + Math.random() * (this.yMax - this.yMin),
      z: xz[1],
      vx: (Math.random() - 0.5) * 0.45,
      vy: 0.08 + Math.random() * 0.18,
      vz: (Math.random() - 0.5) * 0.45,
      size,
      rotY: Math.random() * 360,
      rotZ: Math.random() * 360,
      spinY: 20 + Math.random() * 40,
      spinZ: 20 + Math.random() * 45,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.7 + Math.random() * 1.3,
      swayAmp: 0.03 + Math.random() * 0.07,
    };
  }

  resetParticle(particle) {
    const xz = this.randomOpenCellPosition();
    particle.x = xz[0];
    particle.y = this.yMin + Math.random() * 0.6;
    particle.z = xz[1];
    particle.vx = (Math.random() - 0.5) * 0.45;
    particle.vy = 0.08 + Math.random() * 0.18;
    particle.vz = (Math.random() - 0.5) * 0.45;
    particle.rotY = Math.random() * 360;
    particle.rotZ = Math.random() * 360;
  }

  update(deltaTime) {
    this.time += deltaTime;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.z += p.vz * deltaTime;

      p.rotY += p.spinY * deltaTime;
      p.rotZ += p.spinZ * deltaTime;

      p.x += Math.sin(this.time * p.swaySpeed + p.swayPhase) * p.swayAmp * deltaTime * 8;
      p.z += Math.cos(this.time * p.swaySpeed + p.swayPhase) * p.swayAmp * deltaTime * 8;

      const col = Math.floor((p.x - this.offsetX + this.mapBlockLength * 0.5) / this.mapBlockLength);
      const row = Math.floor((p.z - this.offsetZ + this.mapBlockLength * 0.5) / this.mapBlockLength);
      const outOfBounds =
        col < 0 || col >= this.mapCols ||
        row < 0 || row >= this.mapRows;
      const insideWall = !outOfBounds && this.map[row][col] === 1;

      if (p.y > this.yMax || outOfBounds || insideWall) {
        this.resetParticle(p);
      }
    }
  }

  render(gl, camera, textureManager) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.mesh.position = [p.x, p.y, p.z];
      this.mesh.scale = [p.size, p.size, p.size];
      // Rotated square-ish silhouette reads as a tiny floating diamond.
      this.mesh.rotation = [0, p.rotY, 45 + p.rotZ];
      this.mesh.render(gl, camera, textureManager, false);
    }
  }
}
