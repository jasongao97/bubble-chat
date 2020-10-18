/* global Fisheye */

class Bubble {
  constructor(video, location) {
    this.video = video;
    this.id = video.id;

    // random start location
    this.top = location.top * (window.innerHeight - 200);
    this.left = location.left * (window.innerWidth - 200);
    this.speedX = 0;
    this.speedY = 0;

    // rotating
    this.rotating = false;
    
    // whole block
    this.div = document.createElement("div");
    this.div.classList.add("bubble");
    document.body.appendChild(this.div);
    
    // canvas for rendering
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    this.div.appendChild(canvas);
    
    const image = new Image();
    image.src = 'https://cdn.glitch.com/61822e8c-6341-4a03-81be-ffc327f2f144%2F02.png?v=1603028815325';
    this.div.appendChild(image);

    // fisheye effect
    this.fisheye = new Fisheye(canvas);
    this.fisheye.setDistortion(-5);

    // animation
    this.animating = false;
  }

  getLocation() {
    return {
      top: this.top / (window.innerHeight - 200),
      left: this.left / (window.innerWidth - 200),
    };
  }

  setLocation(location) {
    this.nextTop = location.top * (window.innerHeight - 200);
    this.nextLeft = location.left * (window.innerWidth - 200);
    this.animating = true;
  }

  draw() {
    if (this.rotating) {
      this.div.classList.add("rotating");
    } else {
      this.div.classList.remove("rotating");
      this.moveX();
      this.moveY();
    }
    this.div.style.left = this.left + "px";
    this.div.style.top = this.top + "px";
    this.fisheye.draw(this.video);

    // moving to the next location smoothly
    if (this.animating) {
      this.top += (this.nextTop - this.top) / 4;
      this.left += (this.nextLeft - this.left) / 4;

      if (Math.abs(this.top - this.nextTop) < 1 && Math.abs(this.left - this.nextLeft) < 1) {
        this.animating = false;
      }
    }
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

  remove() {
    document.body.removeChild(this.div);
    document.body.removeChild(this.video);
  }
}
