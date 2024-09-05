class CameraController {
	constructor(gl, camera) {
		var box = gl.canvas.getBoundingClientRect();
		this.canvas = gl.canvas;						//Need access to the canvas html element, main to access events
		this.camera = camera;							//Reference to the camera to control

		this.rotateRate = -300;							//How fast to rotate, degrees per dragging delta
		this.panRate = 5;								//How fast to pan, max unit per dragging delta
		this.zoomRate = 200;							//How fast to zoom or can be viewed as forward/backward movement

		this.offsetX = box.left;						//Help calc global x,y mouse cords.
		this.offsetY = box.top;

		this.initX = 0;									//Starting X,Y position on mouse down
		this.initY = 0;
		this.prevX = 0;									//Previous X,Y position on mouse move
		this.prevY = 0;

		this.onUpHandler = (e)=> { this.onMouseUp(e); };		//Cache func reference that gets bound and unbound a lot
		this.onMoveHandler = (e)=> { this.onMouseMove(e); }

		this.canvas.addEventListener("mousedown", (e)=> { this.onMouseDown(e); });		//Initializes the up and move events
		this.canvas.addEventListener("mousewheel", (e)=> { this.onMouseWheel(e); });	//Handles zoom/forward movement
	}

	//Transform mouse x,y cords to something useable by the canvas.
	getMouseVec2(e) { return { x: e.pageX - this.offsetX, y: e.pageY - this.offsetY }; }

	//Begin listening for dragging movement
	onMouseDown(e) {
		this.initX = this.prevX = e.pageX - this.offsetX;
		this.initY = this.prevY = e.pageY - this.offsetY;

		this.canvas.addEventListener("mouseup", this.onUpHandler);
		this.canvas.addEventListener("mousemove", this.onMoveHandler);
	}

	//End listening for dragging movement
	onMouseUp(e) {
		this.canvas.removeEventListener("mouseup", this.onUpHandler);
		this.canvas.removeEventListener("mousemove", this.onMoveHandler);
	}

	onMouseWheel(e) {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))); //Try to map wheel movement to a number between -1 and 1
		this.camera.panZ(delta * (this.zoomRate / this.canvas.height));		//Keep the movement speed the same, no matter the height diff
	}

	onMouseMove(e) {
		var x = e.pageX - this.offsetX,	//Get X,y where the canvas's position is origin.
			y = e.pageY - this.offsetY,
			dx = x - this.prevX,		//Difference since last mouse move
			dy = y - this.prevY;

		//When shift is being helt down, we pan around else we rotate.
		if (!e.shiftKey) {
			this.camera.yaw -= dx * (this.rotateRate / this.canvas.width);
			this.camera.pitch += dy * (this.rotateRate / this.canvas.height);
		} else {
			this.camera.panX(-dx * (this.panRate / this.canvas.width));
			this.camera.panY(dy * (this.panRate / this.canvas.height));
		}

		this.prevX = x;
		this.prevY = y;
	}

    update(){
        this.camera.updateCameraVectors();
    }
}