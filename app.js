const http = require("http");
const express = require("express");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

const webSocketServer = new WebSocket({ server });

webSocketServer.on("connection", (ws) => {
  ws.on("message", (m) => {
    webSocketServer.clients.forEach((client) => client.send(m));
  });

  ws.on("error", (e) => ws.send(e));

  ws.send("Hi there, I am a WebSocket server");
});


// app.use(express.urlencoded({ extended: true }));

app.get("/chat", (req, res) => {
  res.render("chat");
});

app.get("/", (req, res) => {
  res.render("login");
});

app.post("/authorization", (req, res) => {
  const userData = req.body;
  console.log(userData);

  res.redirect("/chat");
});

app.use("/", (req, res) => {
  res.render("404");
});

server.listen(5000);

// const connection = require('./utils/db');

// connection.connect(error=>{
//   if(error) console.log(error);
//   else console.log('success');
// })
