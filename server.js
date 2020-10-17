// Express is a node module for building HTTP servers
var express = require("express");
var app = express();

// Tell Express to look in the "public" folder for any files first
app.use(express.static("public"));

// If the user just goes to the "route" / then run this function
app.get("/", function (req, res) {
  res.send("Hello World!");
});

// Here is the actual HTTP server
var http = require("http");
// We pass in the Express object
var httpServer = http.createServer(app);
// Listen on port 80
httpServer.listen(8080);

/* 
This server simply keeps track of the peers all in one big "room"
and relays signal messages back and forth.
*/

let peers = [];

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require("socket.io").listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on(
  "connection",

  // We are given a websocket object in our function
  function (socket) {
    const location = {
      top: Math.random(),
      left: Math.random(),
    };

    socket.emit("init", location);

    peers.push({ socket, location });
    console.log(
      "We have a new client: " + socket.id + " peers length: " + peers.length
    );

    socket.on("list", function () {
      let ids = [];
      for (let i = 0; i < peers.length; i++) {
        ids.push({
          id: peers[i].socket.id,
          location: peers[i].location
        });
      }
      console.log("ids length: " + ids.length);
      socket.emit("listresults", ids);
    });

    // Relay signals back and forth
    socket.on("signal", (to, from, data) => {
      console.log("SIGNAL", to, data);
      let found = false;
      for (let i = 0; i < peers.length; i++) {
        console.log(peers[i].socket.id, to);
        if (peers[i].socket.id == to) {
          console.log("Found Peer, sending signal");
          peers[i].socket.emit("signal", to, from, data);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log("never found peer");
      }
    });

    // Update state of bubble: location, rotate
    socket.on("updateState", (data) => {
      for (let i = 0; i < peers.length; i++) {
        if (peers[i].socket.id === socket.id && data.location) {
          peers[i].location = data.location
        }
      }
      socket.broadcast.emit("updateState", { id: socket.id, data })
    })

    //	socket.on("call-user", data => {
    //    socket.to(data.to).emit("call-made", {
    //      offer: data.offer,
    //      socket: socket.id
    //    });
    //  });

    socket.on("disconnect", function () {
      console.log("Client has disconnected " + socket.id);
      for (let i = 0; i < peers.length; i++) {
        if (peers[i].socket.id == socket.id) {
          peers.splice(i, 1);
        } else {
          peers[i].socket.emit("peer_disconnect", socket.id);
        }
      }
    });
  }
);
