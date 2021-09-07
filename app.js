const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const loginResponse = require("./utils/loginResponse");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const { Op } = require("sequelize");
// const webSocketServer = new WebSocket({ server });

// webSocketServer.on("connection", (ws) => {
//   ws.on("message", (m) => {
//     webSocketServer.clients.forEach((client) => client.send(m));
//   });

//   ws.on("error", (e) => ws.send(e));

//   ws.send("Hi there, I am a WebSocket server");
// });

const models = require("./models/index");

app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/chat", (req, res) => {
  res.render("chat");
});

app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!(username && password && email)) {
      res.status(400).send("All input is required");
    }

    const existingUser = await models.User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });


    if (existingUser) {
      console.log("user exists");

      console.log(await bcrypt.compare(password, existingUser.password));
      if(await bcrypt.compare(password, existingUser.password)) {
        const token = jwt.sign({ userId: existingUser.id, email }, "secret", {
          expiresIn: "1h",
        });
  
        res.status(200).json(loginResponse(existingUser.dataValues, token));
      }else {
        res.status(401).send("Invalid password");
      }
    } else {
      const encryptedPassword = await bcrypt.hash(password, 10);

      const user = await models.User.create({
        username: username,
        password: encryptedPassword,
        email: email,
        banned: false,
        admin: false,
        muted: false,
      });
      const token = jwt.sign({ userId: user.id, email }, "secret", {
        expiresIn: "1h",
      });
      res.status(200).json(loginResponse(user.dataValues, token));
    }
  } catch (error) {
    console.log(error);
  }
});

app.use("/", (req, res) => {
  res.render("404");
});

server.listen(port);
// const connection = require('./utils/db');

// connection.connect(error=>{
//   if(error) console.log(error);
//   else console.log('success');
// })
