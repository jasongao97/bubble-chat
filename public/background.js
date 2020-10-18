/* global p5 */

let start = 0;
let inc = 0.0015;
let xoff = 0;

const s = function(p) {
  p.setup = function() {
    p.createCanvas(window.innerWidth, window.innerHeight);
    p.frameRate(5);
  };

  p.draw = function() {
    p.background(255, 0.5);
    p.stroke(255, 80);
    p.fill(30, 140, 200, 15);
    p.translate(0, p.mouseY);
    p.beginShape();
    p.vertex(0, p.height);
    xoff = start;
    for (var x = 0; x < p.width; x++) {
      var y = p.noise(xoff) * (p.height - 100);
      p.vertex(x, y);
      xoff += inc;
    }
    p.vertex(p.width, p.height);
    p.endShape();

    start += 0.01;
  };
};

const background = new p5(s);
