// human-basic.js - Simple blocky human scaffold using TexturedCube parts

class HumanBasic {
  constructor() {
    this.position = [0, 1.0, 0];
    this.scale = [1, 1, 1];
    this.rotation = [0, 0, 0];
    this.modMat = new Matrix4().setIdentity();

    this.colorHead = [0.95, 0.8, 0.7, 1.0];
    this.colorTorso = [0.2, 0.4, 0.9, 1.0];
    this.colorLimb = [0.15, 0.2, 0.7, 1.0];

    // Optional pose controls (degrees). Edit these while building your custom human.
    this.leftArmAngle = 0;
    this.rightArmAngle = 0;
    this.leftLegAngle = 0;
    this.rightLegAngle = 0;
    this.headYaw = 0;

    this.parts = {
      head: new TexturedCube(),
      torso: new TexturedCube(),
      leftArm: new TexturedCube(),
      rightArm: new TexturedCube(),
      leftLeg: new TexturedCube(),
      rightLeg: new TexturedCube(),
    };

    // Default to solid colors so shape reads clearly.
    const partKeys = Object.keys(this.parts);
    for (let i = 0; i < partKeys.length; i++) {
      this.parts[partKeys[i]].setTexture(null);
    }
  }

  _setPartTransform(part, baseMatrix, localPosition, localScale, localRotation, color) {
    part.modMat = new Matrix4(baseMatrix);
    part.position = localPosition;
    part.scale = localScale;
    part.rotation = localRotation;
    part.color = color;
  }

  _getBaseMatrix() {
    const base = new Matrix4().setIdentity();
    base.multiply(this.modMat);
    base.translate(this.position[0], this.position[1], this.position[2]);
    if (this.rotation[1] !== 0) base.rotate(this.rotation[1], 0, 1, 0);
    if (this.rotation[0] !== 0) base.rotate(this.rotation[0], 1, 0, 0);
    if (this.rotation[2] !== 0) base.rotate(this.rotation[2], 0, 0, 1);
    base.scale(this.scale[0], this.scale[1], this.scale[2]);
    return base;
  }

  render(gl, camera, textureManager, useTexture) {
    const base = this._getBaseMatrix();

    // Torso
    this._setPartTransform(
      this.parts.torso,
      base,
      [0, 0.0, 0],
      [0.75, 1.0, 0.4],
      [0, 0, 0],
      this.colorTorso
    );

    // Head
    this._setPartTransform(
      this.parts.head,
      base,
      [0, 0.95, 0],
      [0.45, 0.45, 0.45],
      [0, this.headYaw, 0],
      this.colorHead
    );

    // Arms
    this._setPartTransform(
      this.parts.leftArm,
      base,
      [-0.65, 0.15, 0],
      [0.22, 0.85, 0.22],
      [this.leftArmAngle, 0, 0],
      this.colorLimb
    );
    this._setPartTransform(
      this.parts.rightArm,
      base,
      [0.65, 0.15, 0],
      [0.22, 0.85, 0.22],
      [this.rightArmAngle, 0, 0],
      this.colorLimb
    );

    // Legs
    this._setPartTransform(
      this.parts.leftLeg,
      base,
      [-0.22, -1.05, 0],
      [0.26, 1.0, 0.26],
      [this.leftLegAngle, 0, 0],
      this.colorLimb
    );
    this._setPartTransform(
      this.parts.rightLeg,
      base,
      [0.22, -1.05, 0],
      [0.26, 1.0, 0.26],
      [this.rightLegAngle, 0, 0],
      this.colorLimb
    );

    // Draw all parts
    const partKeys = Object.keys(this.parts);
    for (let i = 0; i < partKeys.length; i++) {
      this.parts[partKeys[i]].render(gl, camera, textureManager, useTexture);
    }
  }
}
