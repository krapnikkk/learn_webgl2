const YAW = -90.0;	// yaw is initialized to -90.0 degrees since a yaw of 0.0 results in a direction vector pointing to the right so we initially rotate a bit to the left.
const PITCH = 0.0;
const SPEED = 5;
const SENSITIVITY = 0.1;
const ZOOM = 45.0;

class Camera {
    position;
    front = glMatrix.vec3.fromValues(0, 0, -1);
    up = glMatrix.vec3.create();
    right = glMatrix.vec3.create();
    worldUp;
    yaw;
    pitch;
    // camera options
    movementSpeed = SPEED;
    mouseSensitivity = SENSITIVITY;
    zoom = ZOOM;
    constructor(position = glMatrix.vec3.fromValues(0, 0, 0), up = glMatrix.vec3.fromValues(0, 1, 0), yaw = YAW, pitch = PITCH) {
        this.position = position;
        this.worldUp = up;
        this.yaw = yaw;
        this.pitch = pitch;
        this.updateCameraVectors();
    }

    getViewMatrix(){
        let view = glMatrix.mat4.create();
        let cameraTarget = glMatrix.vec3.create();
        glMatrix.vec3.add(cameraTarget, this.position, this.front);
        glMatrix.mat4.lookAt(view, this.position, cameraTarget, this.up);
        return view;
    }

    updateCameraVectors() {
        let front = glMatrix.vec3.fromValues(1,1,1);
        let x = Math.cos(glMatrix.glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.glMatrix.toRadian(this.pitch));
        let y = Math.sin(glMatrix.glMatrix.toRadian(this.pitch));
        let z = Math.sin(glMatrix.glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.glMatrix.toRadian(this.pitch));
        glMatrix.vec3.set(front, x, y, z);
        glMatrix.vec3.normalize(this.front, front);

        // also re-calculate the Right and Up vector
        // normalize the vectors, because their length gets closer to 0 the more you look up or down which results in slower movement.
        let right = glMatrix.vec3.create();
        glMatrix.vec3.cross(right, this.front, this.worldUp);
        glMatrix.vec3.normalize(this.right, right);

        let up = glMatrix.vec3.create();
        glMatrix.vec3.cross(up, this.right, this.front);
        glMatrix.vec3.normalize(this.up, up);

    }

    onMousemove(offsetX, offsetY, constrainPitch = true) {
        offsetX *= SENSITIVITY;
        offsetY *= SENSITIVITY;

        this.yaw += offsetX;
        this.pitch += offsetY;

        // make sure that when pitch is out of bounds, screen doesn't get flipped
        if (this.pitch > 89)
            this.pitch = 89;
        if (this.pitch < -89)
            this.pitch = -89;
        this.updateCameraVectors();
    }

    onMouseScroll(offsetY) {
        this.zoom -= offsetY;
        if (this.zoom < 1)
            this.zoom = 1;
        if (this.zoom > 45)
            this.zoom = 45;
    }

    onKeydown(code,deltaTime){
        let velocity = this.movementSpeed * deltaTime;
        let cameraTarget = glMatrix.vec3.create();
        if (code == "KeyW" || code =="ArrowUp") {
            glMatrix.vec3.scale(cameraTarget, this.front, velocity);
            glMatrix.vec3.add(this.position, this.position, cameraTarget);
        } else if (code == "KeyS" || code == "ArrowUp") {
            glMatrix.vec3.scale(cameraTarget, this.front, velocity);
            glMatrix.vec3.subtract(this.position, this.position, cameraTarget);
        } else if (code == "KeyA" || code == "ArrowLeft") {
            glMatrix.vec3.cross(cameraTarget, this.front, this.worldUp);
            glMatrix.vec3.normalize(cameraTarget, cameraTarget);
            glMatrix.vec3.scale(cameraTarget, cameraTarget, velocity);
            glMatrix.vec3.subtract(this.position, this.position, cameraTarget);
        } else if (code == "KeyD" || code == "ArrowRight") {
            glMatrix.vec3.cross(cameraTarget, this.front, this.worldUp);
            glMatrix.vec3.normalize(cameraTarget, cameraTarget);
            glMatrix.vec3.scale(cameraTarget, cameraTarget, velocity);
            glMatrix.vec3.add(this.position, this.position, cameraTarget);
        }
    }

    panX(v) {
		this.updateCameraVectors();
		this.position[0] += this.right[0] * v;
	}

	panY(v) {
		this.updateCameraVectors();
		this.position[1] += this.up[1] * v;
	}

	panZ(v) {
		this.updateCameraVectors();
        this.position[2] += v; //orbit mode does translate after rotate, so only need to set Z, the rotate will handle the rest.
	}

}