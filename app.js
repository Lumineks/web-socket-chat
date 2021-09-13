const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const models = require("./models/index");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

const webSocketServer = new WebSocket.Server({ server });

const UsersOnline = require("./utils/UsersOnline");
const mapAllUsers = require("./utils/mapAllUsers");

webSocketServer.on("connection", (ws) => {
  ws.on("message", async (data) => {

    let parsedData;

    try {
      parsedData = JSON.parse(data);
    }
    catch(error) {
      console.log(error);
      return;
    }

    const { event, token } = parsedData;
    let decodedToken;
    let user;

    if (!token) {
      return ws.close();
    }

    try {
      decodedToken = jwt.verify(token, "secret");
      user = await models.User.findByPk(decodedToken.userId);
    } catch (err) {
      console.log(err);
      ws.send("invalid token");
    }

    if (!user) {
      return ws.close();
    }

    if (event === "login") {
      UsersOnline.addUser({ ...user.dataValues, wsc: ws });
      const usersToSend = UsersOnline.mapUsers();

      webSocketServer.clients.forEach((client) =>
        client.send(
          JSON.stringify({ event: "usersOnline", users: usersToSend })
        )
      );

      const onlineRootUser = UsersOnline.getRootUser();
      if (onlineRootUser) {
        const usersToSend = await mapAllUsers();

        onlineRootUser.wsc.send(
          JSON.stringify({ event: "allUsers", users: usersToSend })
        );
      }

      return;
    }

    if (event === "logout") {
      UsersOnline.removeUserById(user.id);

      const usersToSend = UsersOnline.mapUsers();

      webSocketServer.clients.forEach((client) =>
        client.send(
          JSON.stringify({ event: "usersOnline", users: usersToSend })
        )
      );

      return;
    }

    if (event === "message") {
      if (parsedData.text.length > 200) return;

      const message = {
        text: parsedData.text,
        date: parsedData.date,
        color: parsedData.color,
        name: user.username,
      };

      webSocketServer.clients.forEach((client) =>
        client.send(
          JSON.stringify({
            event: "message",
            message: message,
          })
        )
      );

      return;
    }

    if (event === "toggleMute") {
      const { userToMuteName, isMuted } = parsedData;

      if(!user.admin) return;

      try {
        await models.User.update(
          { muted: isMuted },
          {
            where: {
              username: userToMuteName,
            },
          }
        );
      } catch (e) {
        console.log(e);
      }

      const onlineMutedUser = UsersOnline.getUserByName(userToMuteName);
      if (onlineMutedUser) {
        onlineMutedUser.muted = isMuted;
        onlineMutedUser.wsc.send(
          JSON.stringify({ event: "muteToggled", isMuted })
        );
      }

      const onlineRootUser = UsersOnline.getRootUser();
      if (onlineRootUser) {
        let usersToSend = UsersOnline.mapUsers();

        onlineRootUser.wsc.send(
          JSON.stringify({ event: "usersOnline", users: usersToSend })
        );

        usersToSend = await mapAllUsers();
        onlineRootUser.wsc.send(
          JSON.stringify({ event: "allUsers", users: usersToSend })
        );
      }

      return;
    }

    if (event === "toggleBan") {
      const { userToBanName, isBanned } = parsedData;

      if(!user.admin) return;

      try {
        await models.User.update(
          { banned: isBanned },
          {
            where: {
              username: userToBanName,
            },
          }
        );
      } catch (e) {
        console.log(e);
      }

      const onlineUser = UsersOnline.getUserByName(userToBanName);
      if (isBanned && onlineUser) {
        onlineUser.wsc.close();

        UsersOnline.removeUserById(onlineUser.id);
      }

      const onlineRootUser = UsersOnline.getRootUser();
      if (onlineRootUser) {
        let usersToSend = UsersOnline.mapUsers();

        onlineRootUser.wsc.send(
          JSON.stringify({ event: "usersOnline", users: usersToSend })
        );

        usersToSend = await mapAllUsers();
        onlineRootUser.wsc.send(
          JSON.stringify({ event: "allUsers", users: usersToSend })
        );
      }
      return;
    }
  });

  ws.on("error", (e) => ws.send(e));

  ws.on("close", (statusCode) => {
    if (statusCode === 1000 || statusCode === 1005) {
      console.log("closed connection");
    } else {
      console.log("Lost connection");
      UsersOnline.clear();

      webSocketServer.clients.forEach((client) =>
        client.send(JSON.stringify({ event: "refreshOnlineUsers" }))
      );
    }
  });

  console.log("connected");
});

const auth = require("./middleware/auth");

app.use(express.json());

app.post("/login", auth, (req, res) => {
  res.status(200).json(req.verifiedUser);
});

server.listen(port, () => console.log(`Server is listening on port: ${port}`));
