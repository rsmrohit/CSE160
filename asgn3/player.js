class Player {
    constructor(map, objects, camera){
        this.map = map;
        this.mapBlockLength = 5; // hardcoded
        this.objects = objects;
        this.camera = camera;

        // Vertical movement state for jump/fall
        this.verticalVelocity = 0;
        this.gravity = -20;
        this.jumpVelocity = 7;
        this.groundY = this.camera.position.elements[1];
        this.isGrounded = true;
        this.wasSpaceDown = false;
    }

    update(movement, deltaTime, mouseLookEnabled=false) {
        const moveSpeed = 6.0 * deltaTime;
        const rotateSpeed = 120.0 * deltaTime;

        if (movement.has(87) && this.checkCollisionMap(this.camera.moveForwardGet(moveSpeed))) { // W
            this.camera.moveForward(moveSpeed);
        }
        if (movement.has(83) && this.checkCollisionMap(this.camera.moveForwardGet(-moveSpeed))) { // S
            this.camera.moveForward(-moveSpeed);
        }
        if (movement.has(65) && this.checkCollisionMap(this.camera.moveRightGet(-moveSpeed))) { // A
            this.camera.moveRight(-moveSpeed);
        }
        if (movement.has(68) && this.checkCollisionMap(this.camera.moveRightGet(moveSpeed))) { // D
            this.camera.moveRight(moveSpeed);
        }

        // Keyboard look controls are active only when mouse look is disabled
        if (!mouseLookEnabled) {
            if (movement.has(81)) this.camera.pan -= rotateSpeed; // Q
            if (movement.has(69)) this.camera.pan += rotateSpeed; // E
            if (movement.has(38)) this.camera.tilt += rotateSpeed; // Up
            if (movement.has(40)) this.camera.tilt -= rotateSpeed; // Down
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
        this.camera.position.elements[1] += this.verticalVelocity * deltaTime;

        if (this.camera.position.elements[1] <= this.groundY) {
            this.camera.position.elements[1] = this.groundY;
            this.verticalVelocity = 0;
            this.isGrounded = true;
        }
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

}
