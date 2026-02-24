class Player {
    constructor(collisionSystem, startPosition=[0, 2, 5]){
        this.collisionSystem = collisionSystem;
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
        if (!this.collisionSystem) return true;
        return this.collisionSystem.canMoveTo(nextPosition, this.collisionRadius, {
            excludeFn: function(collider) {
                return (
                    collider &&
                    collider.object &&
                    typeof Human !== "undefined" &&
                    collider.object instanceof Human
                );
            },
        });
    }

}
