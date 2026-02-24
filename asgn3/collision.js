// collision.js - Collision primitives and world collision system

class ColliderFactory {
  static boxFromObject(object, options = {}) {
    const offset = options.offset || [0, 0, 0];
    const size = options.size || null;
    const sizeScale = options.sizeScale || null;

    return {
      type: "aabb",
      object,
      enabled: options.enabled !== false,
      getAABB: function() {
        if (!object.position || !object.scale) return null;

        let sx = size ? size[0] : object.scale[0];
        let sy = size ? size[1] : object.scale[1];
        let sz = size ? size[2] : object.scale[2];

        if (sizeScale) {
          sx *= sizeScale[0];
          sy *= sizeScale[1];
          sz *= sizeScale[2];
        }

        const cx = object.position[0] + offset[0];
        const cy = object.position[1] + offset[1];
        const cz = object.position[2] + offset[2];

        return {
          minX: cx - sx * 0.5,
          maxX: cx + sx * 0.5,
          minY: cy - sy * 0.5,
          maxY: cy + sy * 0.5,
          minZ: cz - sz * 0.5,
          maxZ: cz + sz * 0.5,
        };
      }
    };
  }

  static staticBox(center, size, enabled = true) {
    return {
      type: "aabb",
      enabled,
      getAABB: function() {
        return {
          minX: center[0] - size[0] * 0.5,
          maxX: center[0] + size[0] * 0.5,
          minY: center[1] - size[1] * 0.5,
          maxY: center[1] + size[1] * 0.5,
          minZ: center[2] - size[2] * 0.5,
          maxZ: center[2] + size[2] * 0.5,
        };
      }
    };
  }
}

class CollisionSystem {
  constructor(map, mapBlockLength = 5) {
    this.map = map;
    this.mapBlockLength = mapBlockLength;
    this.colliders = [];
  }

  addCollider(collider) {
    this.colliders.push(collider);
    return collider;
  }

  removeCollider(collider) {
    const index = this.colliders.indexOf(collider);
    if (index > -1) this.colliders.splice(index, 1);
  }

  removeCollidersForObject(object) {
    this.colliders = this.colliders.filter(collider => collider.object !== object);
  }

  canMoveTo(nextPosition, playerRadius = 1, options = null) {
    return this.isMapWalkable(nextPosition, playerRadius) &&
           !this.isBlockedByColliders(nextPosition, playerRadius, options);
  }

  isMapWalkable(nextPosition, playerRadius = 1) {
    const length = this.mapBlockLength;
    const mapRows = this.map.length;
    const mapCols = this.map[0].length;
    const mapWidth = mapCols * length;
    const mapHeight = mapRows * length;

    const checkPoints = [
      [nextPosition[0] - playerRadius, nextPosition[2] - playerRadius],
      [nextPosition[0] + playerRadius, nextPosition[2] - playerRadius],
      [nextPosition[0] - playerRadius, nextPosition[2] + playerRadius],
      [nextPosition[0] + playerRadius, nextPosition[2] + playerRadius],
    ];

    for (let i = 0; i < checkPoints.length; i++) {
      const point = checkPoints[i];
      const col = Math.floor((point[0] + mapWidth / 2 + length / 2) / length);
      const row = Math.floor((point[1] + mapHeight / 2 + length / 2) / length);

      if (col < 0 || col >= mapCols ||
          row < 0 || row >= mapRows ||
          this.map[row][col] === 1) {
        return false;
      }
    }

    return true;
  }

  isBlockedByColliders(nextPosition, playerRadius = 1, options = null) {
    const excludeObject = options && options.excludeObject ? options.excludeObject : null;
    const excludeCollider = options && options.excludeCollider ? options.excludeCollider : null;
    const excludeFn = options && options.excludeFn ? options.excludeFn : null;

    for (let i = 0; i < this.colliders.length; i++) {
      const collider = this.colliders[i];
      if (!collider || collider.enabled === false) continue;
      if (excludeCollider && collider === excludeCollider) continue;
      if (excludeObject && collider.object === excludeObject) continue;
      if (excludeFn && excludeFn(collider)) continue;

      const aabb = collider.getAABB ? collider.getAABB() : null;
      if (!aabb) continue;

      if (CollisionSystem.intersectsCircleAABBXZ(
        nextPosition[0],
        nextPosition[2],
        playerRadius,
        aabb
      )) {
        return true;
      }
    }

    return false;
  }

  static intersectsCircleAABBXZ(circleX, circleZ, circleRadius, aabb) {
    const closestX = Math.max(aabb.minX, Math.min(circleX, aabb.maxX));
    const closestZ = Math.max(aabb.minZ, Math.min(circleZ, aabb.maxZ));

    const dx = circleX - closestX;
    const dz = circleZ - closestZ;
    return (dx * dx + dz * dz) < (circleRadius * circleRadius);
  }
}
