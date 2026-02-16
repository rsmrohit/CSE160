// camel.js - Block camel ported from asgn2 proportions

class Camel {
  constructor() {
    this.position = [0, 1.0, 0];
    this.scale = [1, 1, 1];
    this.rotation = [0, 0, 0];
    this.modMat = new Matrix4().setIdentity();

    this.bodyColor = [0.79, 0.53, 0.27, 1.0];
    this.humpColor = [0.6, 0.4, 0.2, 1.0];
    this.eyeColor = [0.0, 0.0, 0.0, 1.0];

    this.parts = {
      body: new TexturedCube(),
      hump: new TexturedCube(),
      neckConnector: new TexturedCube(),
      neck0: new TexturedCube(),
      neck1: new TexturedCube(),
      neck2: new TexturedCube(),
      neck3: new TexturedCube(),
      neck4: new TexturedCube(),
      head: new TexturedCube(),
      eyeLeft: new TexturedCube(),
      eyeRight: new TexturedCube(),
      legLBUpper: new TexturedCube(),
      legLBLower: new TexturedCube(),
      legRBUpper: new TexturedCube(),
      legRBLower: new TexturedCube(),
      legLFUpper: new TexturedCube(),
      legLFLower: new TexturedCube(),
      legRFUpper: new TexturedCube(),
      legRFLower: new TexturedCube(),
    };

    const keys = Object.keys(this.parts);
    for (let i = 0; i < keys.length; i++) {
      this.parts[keys[i]].setTexture(null);
    }
  }

  _baseMatrix() {
    const m = new Matrix4().setIdentity();
    m.multiply(this.modMat);
    m.translate(this.position[0], this.position[1], this.position[2]);
    if (this.rotation[1] !== 0) m.rotate(this.rotation[1], 0, 1, 0);
    if (this.rotation[0] !== 0) m.rotate(this.rotation[0], 1, 0, 0);
    if (this.rotation[2] !== 0) m.rotate(this.rotation[2], 0, 0, 1);
    m.scale(this.scale[0], this.scale[1], this.scale[2]);
    return m;
  }

  _place(part, base, position, scale, color) {
    part.modMat = new Matrix4(base);
    part.position = position;
    part.scale = scale;
    part.rotation = [0, 0, 0];
    part.color = color;
  }

  render(gl, camera, textureManager, useTexture) {
    const base = this._baseMatrix();
    const body = [1.0, 0.4, 0.6];
    const hump = [0.4, 0.18, 0.34];
    const upperLeg = [0.17, 0.45, 0.17];
    const lowerLeg = [0.14, 0.43, 0.14];
    const neck = [0.2, 0.2, 0.2];
    const head = [0.35, 0.2, 0.16];
    const eye = [0.05, 0.05, 0.05];

    this._place(this.parts.body, base, [0, 0, 0], body, this.bodyColor);
    this._place(
      this.parts.hump,
      base,
      [0, body[1] * 0.5 + hump[1] * 0.5, 0],
      hump,
      this.humpColor
    );

    const legUpperY = -body[1] * 0.5 - upperLeg[1] * 0.5 + 0.15;
    const legLowerY = legUpperY - upperLeg[1] * 0.5 - lowerLeg[1] * 0.5 + 0.05;
    const xBack = -body[0] * 0.5 + upperLeg[0] * 0.5;
    const xFront = body[0] * 0.5 - upperLeg[0] * 0.5;
    const zLeft = -body[2] * 0.5 + upperLeg[2] * 0.5;
    const zRight = body[2] * 0.5 - upperLeg[2] * 0.5;

    this._place(this.parts.legLBUpper, base, [xBack, legUpperY, zLeft], upperLeg, this.bodyColor);
    this._place(this.parts.legLBLower, base, [xBack, legLowerY, zLeft], lowerLeg, this.bodyColor);
    this._place(this.parts.legRBUpper, base, [xBack, legUpperY, zRight], upperLeg, this.bodyColor);
    this._place(this.parts.legRBLower, base, [xBack, legLowerY, zRight], lowerLeg, this.bodyColor);
    this._place(this.parts.legLFUpper, base, [xFront, legUpperY, zRight], upperLeg, this.bodyColor);
    this._place(this.parts.legLFLower, base, [xFront, legLowerY, zRight], lowerLeg, this.bodyColor);
    this._place(this.parts.legRFUpper, base, [xFront, legUpperY, zLeft], upperLeg, this.bodyColor);
    this._place(this.parts.legRFLower, base, [xFront, legLowerY, zLeft], lowerLeg, this.bodyColor);

    const neckConnectorPos = [body[0] * 0.5 + 0.2, body[1] * 0.5 - neck[1] * 0.5, 0];
    this._place(this.parts.neckConnector, base, neckConnectorPos, [neck[0] * 2, neck[1], neck[2]], this.bodyColor);

    const neckStartX = neckConnectorPos[0] + neck[0] * 0.9;
    const neckStartY = neckConnectorPos[1] - neck[1] * 0.25;
    this._place(this.parts.neck0, base, [neckStartX + 0.00, neckStartY + 0.10, 0], neck, this.bodyColor);
    this._place(this.parts.neck1, base, [neckStartX + 0.08, neckStartY + 0.25, 0], neck, this.bodyColor);
    this._place(this.parts.neck2, base, [neckStartX + 0.16, neckStartY + 0.40, 0], neck, this.bodyColor);
    this._place(this.parts.neck3, base, [neckStartX + 0.24, neckStartY + 0.55, 0], neck, this.bodyColor);
    this._place(this.parts.neck4, base, [neckStartX + 0.32, neckStartY + 0.70, 0], neck, this.bodyColor);

    const headPos = [neckStartX + 0.52, neckStartY + 0.72, 0];
    this._place(this.parts.head, base, headPos, head, this.bodyColor);
    this._place(
      this.parts.eyeLeft,
      base,
      [headPos[0] + head[0] * 0.35, headPos[1] + head[1] * 0.2, headPos[2] + head[2] * 0.35],
      eye,
      this.eyeColor
    );
    this._place(
      this.parts.eyeRight,
      base,
      [headPos[0] + head[0] * 0.35, headPos[1] + head[1] * 0.2, headPos[2] - head[2] * 0.35],
      eye,
      this.eyeColor
    );

    const keys = Object.keys(this.parts);
    for (let i = 0; i < keys.length; i++) {
      this.parts[keys[i]].render(gl, camera, textureManager, useTexture);
    }
  }
}
