class Player {
    constructor(map, objects, startPosition=[0, 2, 5]){
        this.map = map;
        this.mapBlockLength = 5; // hardcoded
        this.objects = objects;
        this.position = new Vector3(startPosition);
        this.collisionRadius = 0.9;

        // Vertical movement state for jump/fall
        this.verticalVelocity = 0;
        this.gravity = -20;
        this.jumpVelocity = 7;
        this.groundY = this.position.elements[1];
        this.isGrounded = true;
        this.wasSpaceDown = false;
    }

    reset(startPosition=[0, 2, 5]) {
        this.position = new Vector3(startPosition);
        this.groundY = startPosition[1];
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.wasSpaceDown = false;
    }

    setPosition(x, y, z, updateGround=true) {
        this.position.elements[0] = x;
        this.position.elements[1] = y;
        this.position.elements[2] = z;
        if (updateGround) {
            this.groundY = y;
            this.verticalVelocity = 0;
            this.isGrounded = true;
        }
    }

    getPosition() {
        return this.position;
    }

    update(movement, deltaTime, panDegrees=0) {
        const moveSpeed = 6.0 * deltaTime;
        if (movement.has(87) && this.checkCollision(this.moveForwardGet(moveSpeed, panDegrees))) { // W
            this.moveForward(moveSpeed, panDegrees);
        }
        if (movement.has(83) && this.checkCollision(this.moveForwardGet(-moveSpeed, panDegrees))) { // S
            this.moveForward(-moveSpeed, panDegrees);
        }
        if (movement.has(65) && this.checkCollision(this.moveRightGet(-moveSpeed, panDegrees))) { // A
            this.moveRight(-moveSpeed, panDegrees);
        }
        if (movement.has(68) && this.checkCollision(this.moveRightGet(moveSpeed, panDegrees))) { // D
            this.moveRight(moveSpeed, panDegrees);
        }

        // Jump on new Space press while grounded
        const spaceDown = movement.has(32);
        if (spaceDown && !this.wasSpaceDown && this.isGrounded) {
            this.verticalVelocity = this.jumpVelocity;
            this.isGrounded = false;
        }
        this.wasSpaceDown = spaceDown;

        // Gravity and floor collision
        this.verticalVelocity += this.gravity * deltaTime;
        this.position.elements[1] += this.verticalVelocity * deltaTime;

        if (this.position.elements[1] <= this.groundY) {
            this.position.elements[1] = this.groundY;
            this.verticalVelocity = 0;
            this.isGrounded = true;
        }
    }

    moveForward(distance, panDegrees) {
        let panRad = panDegrees * Math.PI / 180;
        this.position.elements[0] += Math.sin(panRad) * distance;
        this.position.elements[2] -= Math.cos(panRad) * distance;
    }

    moveForwardGet(distance, panDegrees) {
        let panRad = panDegrees * Math.PI / 180;
        return [
            this.position.elements[0] + Math.sin(panRad) * distance,
            this.position.elements[1],
            this.position.elements[2] - Math.cos(panRad) * distance
        ];
    }

    moveRight(distance, panDegrees) {
        let panRad = panDegrees * Math.PI / 180;
        this.position.elements[0] += Math.cos(panRad) * distance;
        this.position.elements[2] += Math.sin(panRad) * distance;
    }

    moveRightGet(distance, panDegrees) {
        let panRad = panDegrees * Math.PI / 180;
        return [
            this.position.elements[0] + Math.cos(panRad) * distance,
            this.position.elements[1],
            this.position.elements[2] + Math.sin(panRad) * distance
        ];
    }

    checkCollision(nextPosition) {
        return this.checkCollisionMap(nextPosition, this.collisionRadius) &&
               this.checkCollisionObjects(nextPosition, this.collisionRadius);
    }

    checkCollisionMap(nextPosition, playerRadius=1) {
        const length = this.mapBlockLength;
        const mapWidth = this.map.length * length;
        const mapHeight = this.map[0].length * length;
        
        // Check the player's bounding box corners
        var checkPoints = [
            [nextPosition[0] - playerRadius, nextPosition[2] - playerRadius],
            [nextPosition[0] + playerRadius, nextPosition[2] - playerRadius],
            [nextPosition[0] - playerRadius, nextPosition[2] + playerRadius],
            [nextPosition[0] + playerRadius, nextPosition[2] + playerRadius],
        ];
        
        for (let point of checkPoints) {
            // Add 0.5 * length to shift from centered blocks to corner-aligned grid
            const x = Math.floor((point[0] + mapWidth / 2 + length / 2) / length);
            const y = Math.floor((point[1] + mapHeight / 2 + length / 2) / length);
            
            if (x < 0 || x >= this.map.length ||
                y < 0 || y >= this.map[0].length ||
                this.map[x][y] === 1) {
                return false; // Collision
            }
        }
        
        return true; // No collision
    }

    checkCollisionObjects(nextPosition, playerRadius=1) {
        for (let i = 0; i < this.objects.length; i++) {
            const obj = this.objects[i];
            if (!(obj instanceof TexturedCube)) continue;
            if (!obj.position || !obj.scale) continue;
            if (obj.scale[1] < 0.5) continue; // ignore near-flat surfaces
            if (obj.position[1] < 0.25) continue; // ignore ground plane

            const halfX = obj.scale[0] * 0.5;
            const halfZ = obj.scale[2] * 0.5;
            const minX = obj.position[0] - halfX;
            const maxX = obj.position[0] + halfX;
            const minZ = obj.position[2] - halfZ;
            const maxZ = obj.position[2] + halfZ;

            const closestX = Math.max(minX, Math.min(nextPosition[0], maxX));
            const closestZ = Math.max(minZ, Math.min(nextPosition[2], maxZ));

            const dx = nextPosition[0] - closestX;
            const dz = nextPosition[2] - closestZ;

            if ((dx * dx + dz * dz) < playerRadius * playerRadius) {
                return false;
            }
        }
        return true;
    }

}
