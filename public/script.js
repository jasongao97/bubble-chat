/* global Bubble, faceapi */

let simplepeers = [];
let bubbles = [];
var socket;
var mystream;

window.addEventListener("load", function () {
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    // faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    // faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]).then(initCapture);
});

function initCapture() {
  console.log("initCapture");

  // The video element on the page to display the webcam
  let video = document.getElementById("myvideo");

  // Constraints - what do we want?
  let constraints = { audio: false, video: true };

  // Prompt the user for permission, get the stream
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      /* Use the stream */

      // Global object
      mystream = stream;

      // Attach to our video object
      video.srcObject = stream;

      // Wait for the stream to load enough to play
      video.onloadedmetadata = function (e) {
        video.play();
        bubbles.push(new Bubble(video));

        // Now setup socket
        setupSocket();
        draw();
        detectFace();
      };
    })
    .catch(function (err) {
      /* Handle the error */
      alert(err);
    });
}

function setupSocket() {
  socket = io.connect();

  socket.on("connect", function () {
    console.log("Socket Connected");
    console.log("My socket id: ", socket.id);

    // Tell the server we want a list of the other users
    socket.emit("list");
  });

  socket.on("disconnect", function (data) {
    console.log("Socket disconnected");
  });

  socket.on("peer_disconnect", function (data) {
    console.log("simplepeer has disconnected " + data);
    for (let i = 0; i < simplepeers.length; i++) {
      if (simplepeers[i].socket_id == data) {
        console.log("Removing simplepeer: " + i);
        simplepeers.splice(i, 1);
      }
    }
    // remove video from page
    for (let i = 0; i < bubbles.length; i++) {
      if (bubbles[i].id == data) {
        bubbles[i].remove();
        bubbles.splice(i, 1);
      }
    }
  });

  // Receive listresults from server
  socket.on("listresults", function (data) {
    console.log(data);
    for (let i = 0; i < data.length; i++) {
      // Make sure it's not us
      if (data[i] != socket.id) {
        // create a new simplepeer and we'll be the "initiator"
        let simplepeer = new SimplePeerWrapper(true, data[i], socket, mystream);

        // Push into our array
        simplepeers.push(simplepeer);
      }
    }
  });

  socket.on("signal", function (to, from, data) {
    console.log("Got a signal from the server: ", to, from, data);

    // to should be us
    if (to != socket.id) {
      console.log("Socket IDs don't match");
    }

    // Look for the right simplepeer in our array
    let found = false;
    for (let i = 0; i < simplepeers.length; i++) {
      if (simplepeers[i].socket_id == from) {
        console.log("Found right object");
        // Give that simplepeer the signal
        simplepeers[i].inputsignal(data);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log("Never found right simplepeer object");
      // Let's create it then, we won't be the "initiator"
      let simplepeer = new SimplePeerWrapper(false, from, socket, mystream);

      // Push into our array
      simplepeers.push(simplepeer);

      // Tell the new simplepeer that signal
      simplepeer.inputsignal(data);
    }
  });
}

function draw() {
  // const people = document.getElementsByTagName("video");

  for (let i = 0; i < bubbles.length; i++) {
    bubbles[i].draw();
  }

  requestAnimationFrame(draw);
}

function detectFace() {
  faceapi
    .detectAllFaces(bubbles[0].video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .then((detections) => {
      if (detections.length > 0) {
        // get face landmarks
        const marks = detections[0].landmarks.positions;

        // nose [30]
        const nose = marks[30];
        const { videoWidth, videoHeight } = bubbles[0].video;
        const offsetX = videoWidth / 2 - nose.x;
        const offsetY = nose.y - videoHeight / 2;
        bubbles[0].speedX = (offsetX / videoWidth) * 10;
        bubbles[0].speedY = (offsetY / videoHeight) * 10;

        // lips [62] [66]
        const upperLip = marks[62];
        const lowerLip = marks[66];
        const ulDistance = Math.sqrt(
          Math.pow(upperLip.x - lowerLip.x, 2) +
            Math.pow(upperLip.y - lowerLip.y, 2)
        );
        const nlDistance = Math.sqrt(
          Math.pow(nose.x - lowerLip.x, 2) +
            Math.pow(nose.y - lowerLip.y, 2)
        );

        // mouth open
        if (ulDistance / nlDistance > 0.3) {
          bubbles[0].rotating = true;
        } else {
          bubbles[0].rotating = false;
        }
      } else {
        bubbles[0].speedX = 0;
        bubbles[0].speedY = 0;
      }
    });

  setTimeout(detectFace, 100);
}

// A wrapper for simplepeer as we need a bit more than it provides
class SimplePeerWrapper {
  constructor(initiator, socket_id, socket, stream) {
    this.simplepeer = new SimplePeer({
      initiator: initiator,
      trickle: false,
    });

    // Their socket id, our unique id for them
    this.socket_id = socket_id;

    // Socket.io Socket
    this.socket = socket;

    // Our video stream - need getters and setters for this
    this.stream = stream;

    // simplepeer generates signals which need to be sent across socket
    this.simplepeer.on("signal", (data) => {
      this.socket.emit("signal", this.socket_id, this.socket.id, data);
    });

    // When we have a connection, send our stream
    this.simplepeer.on("connect", () => {
      console.log("CONNECT");
      console.log(this.simplepeer);
      //p.send('whatever' + Math.random())

      // Let's give them our stream
      this.simplepeer.addStream(stream);
      console.log("Send our stream");
    });

    // Stream coming in to us
    this.simplepeer.on("stream", (stream) => {
      console.log("Incoming Stream");

      // This should really be a callback
      // Create a video object
      let ovideo = document.createElement("video");
      ovideo.id = this.socket_id;
      ovideo.srcObject = stream;
      ovideo.muted = true;
      ovideo.onloadedmetadata = function (e) {
        ovideo.play();
      };

      // new Bubble
      let bubble = new Bubble(ovideo);
      bubbles.push(bubble);
      document.body.appendChild(ovideo);
    });
  }

  inputsignal(sig) {
    this.simplepeer.signal(sig);
  }
}
