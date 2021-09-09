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
const webSocketServer = new WebSocket.Server({ server });

const usersOnline = [];

const mapOnlineUsers = () => {
  const mappedUsers = [];
  for (user of usersOnline) {
    mappedUsers.push({
      name: user.username,
      email: user.email,
      isMuted: user.muted,
      isBanned: user.banned,
    });
  }

  return mappedUsers;
};

const mapAllUsers = async () => {
  let usersFromDb = await models.User.findAll();

  return usersFromDb.map((user) => {
    return {
      name: user.username,
      email: user.email,
      isMuted: user.muted,
      isBanned: user.banned,
    };
  });
};

webSocketServer.on("connection", (ws) => {
  ws.on("message", async (data) => {
    const parsedData = JSON.parse(data);
    const { event, token } = parsedData;
    let decodedToken;
    let user;

    if (!token) {
      ws.close();
    }

    try {
      decodedToken = jwt.verify(token, "secret");
      user = await models.User.findByPk(decodedToken.userId);
    } catch (err) {
      console.log(err);
      ws.send("invalid token");
    }

    console.log(user);

    switch (event) {
      case "message": {
        console.log("value check", user.admin);
        break;
      }
      case "getAllUsers": {
        if (user.admin) {
          console.log("get all users");

          // ws.send(JSON.stringify(usersToSend));
        } else {
        }
        break;
      }
      case "login": {
        console.log("inlogin");
        usersOnline.push({ ...user.dataValues, wsc: ws });
        console.log("usersOnline: ", usersOnline);
        // const usersFromCache = usersOnline.mget(usersOnline.keys());
        const usersToSend = mapOnlineUsers();

        webSocketServer.clients.forEach((client) =>
          client.send(
            JSON.stringify({ event: "usersOnline", users: usersToSend })
          )
        );

        const onlineRootUser = usersOnline.find((u) => u.id === user.id);
        if (onlineRootUser) {
          const usersToSend = await mapAllUsers();

          onlineRootUser.wsc.send(
            JSON.stringify({ event: "allUsers", users: usersToSend })
          );
        }

        break;
      }
      case "logout": {
        console.log("logout event");
        const userIdx = usersOnline.findIndex((u) => u.id === user.id);
        usersOnline.splice(userIdx, 1);

        const usersToSend = mapOnlineUsers();

        webSocketServer.clients.forEach((client) =>
          client.send(
            JSON.stringify({ event: "usersOnline", users: usersToSend })
          )
        );
        break;
      }
      case "toggleMute": {
        const { userToMuteName, isMuted } = parsedData;
        const userToToggle = await models.User.findOne({
          where: { username: userToMuteName },
        });
        // console.log(userToMute);

        userToToggle.muted = isMuted;
        await userToToggle.save();

        const onlineMutedUser = usersOnline.find(
          (u) => u.id === userToToggle.id
        );
        if (onlineMutedUser) {
          onlineMutedUser.muted = isMuted;
          onlineMutedUser.wsc.send(
            JSON.stringify({ event: "muteToggled", isMuted })
          );
        }

        const onlineRootUser = usersOnline.find((u) => u.id === user.id);
        if (onlineRootUser) {
          let usersToSend = mapOnlineUsers();

          onlineRootUser.wsc.send(
            JSON.stringify({ event: "usersOnline", users: usersToSend })
          );

          usersToSend = await mapAllUsers();
          onlineRootUser.wsc.send(
            JSON.stringify({ event: "allUsers", users: usersToSend })
          );
        }

        break;
      }
      case "toggleBan": {
        const { userToBanName, isBanned } = parsedData;
        let userToToggle;
        try {
          userToToggle = await models.User.findOne({
            where: { username: userToBanName },
          });
        } catch (error) {
          console.log(error);
        }
        console.log("found user to ban", isBanned);
        userToToggle.banned = isBanned;
        await userToToggle.save();

        const onlineUser = usersOnline.find((u) => u.id === userToToggle.id);
        if (isBanned && onlineUser) {
          const bannedUserIdx = usersOnline.findIndex(
            (u) => u.id === onlineUser.id
          );
          usersOnline.splice(bannedUserIdx, 1);
          onlineUser.wsc.send(JSON.stringify({ event: "banned", isMuted }));
        }

        const onlineRootUser = usersOnline.find((u) => u.id === user.id);
        if (onlineRootUser) {
          const usersToSend = await mapAllUsers();

          onlineRootUser.wsc.send(
            JSON.stringify({ event: "allUsers", users: usersToSend })
          );
        }

        break;
      }

      default:
        ws.close();
        break;
    }
  });

  ws.on("error", (e) => ws.send(e));

  ws.on("close", () => {
    // За
    console.log("closed connection");
  });

  console.log("connected");
});

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

    for (user of usersOnline) {
      if (user.username === username) {
        return res.status(400).send("Already in chat");
      }
    }

    const existingUser = await models.User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      if (existingUser.banned) {
        res.status(403).send("Вы были забанены");
      }

      if (await bcrypt.compare(password, existingUser.password)) {
        const token = jwt.sign({ userId: existingUser.id, email }, "secret", {
          expiresIn: "1h",
        });

        res.status(200).json(loginResponse(existingUser.dataValues, token));
      } else {
        res.status(401).send("Неправильный пароль, имя или email");
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
      const token = jwt.sign({ userId: user.id }, "secret", {
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

server.listen(port, () => console.log(`Server is listening on port: ${port}`));
