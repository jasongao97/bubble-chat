/* global Fisheye */

class Bubble {
  constructor(video) {
    this.video = video;

    // random start location
    this.top = Math.random() * (window.innerHeight - 200);
    this.left = Math.random() * (window.innerWidth - 200);
    this.speedX = 0;
    this.speedY = 0;

    // rotating
    this.rotating = false;

    // canvas for rendering
    this.canvas = document.createElement("canvas");
    this.canvas.width = 200;
    this.canvas.height = 200;
    document.body.appendChild(this.canvas);

    // fisheye effect
    this.fisheye = new Fisheye(this.canvas);
    this.fisheye.setDistortion(10);
  }

  draw() {
    if (this.rotating) {
      this.canvas.className = "rotating";
    } else {
      this.canvas.className = "";
      this.moveX();
      this.moveY();
    }
    this.canvas.style.left = this.left + "px";
    this.canvas.style.top = this.top + "px";
    this.fisheye.draw(this.video);
  }

  moveX() {
    // setting the boundary
    if (this.left < 0 && this.speedX < 0) {
      return;
    }
    if (this.left > window.innerWidth - 200 && this.speedX > 0) {
      return;
    }
    // move
    this.left += this.speedX;
  }

  moveY() {
    // setting the boundary
    if (this.top < 0 && this.speedY < 0) {
      return;
    }
    if (this.top > window.innerHeight - 200 && this.speedY > 0) {
      return;
    }
    // move
    this.top += this.speedY;
  }
}
