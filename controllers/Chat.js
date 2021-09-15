const UsersDBService = require("../service/UsersDB");
const WebSocket = require("ws");
const WebSocketService = require("../service/WebSocket");
const jwt = require("jsonwebtoken");
const UsersOnline = require("../service/UsersOnline");
const Messages = require("../service/Messages");

module.exports = (server) => {
  const webSocketServer = new WebSocket.Server({ server });
  const webSocketService = new WebSocketService(webSocketServer);

  webSocketServer.on("connection", async (ws, req) => {
    const token = req.url.split("=")[1];
    let user, decodedToken;

    try {
      decodedToken = jwt.verify(token, process.env.JWT_KEY);
      user = await UsersDBService.findById(decodedToken.userId);
    } catch (err) {
      console.log(err);
      ws.send("invalid token");
    }

    if (!token || !user) {
      return ws.close();
    }

    UsersOnline.add({ ...user.dataValues, wsc: ws });

    webSocketService.sendOnlineUsers("all");
    webSocketService.sendAllUsersToAdmin();

    console.log("connected");

    ws.on("message", async (data) => {
      let parsedData;

      try {
        parsedData = JSON.parse(data);
      } catch (error) {
        console.log(error);
        return;
      }

      const { event } = parsedData;

      if (event === webSocketService.clientEvents.message) {

        if (
          parsedData.text.trim().length === 0 ||
          parsedData.text.trim().length > 200
        ) {
          return;
        }

        const message = {
          text: parsedData.text,
          date: parsedData.date,
          color: parsedData.color,
          name: user.username,
        };

        if(Messages.checkDelay(message.name, message.date)) {

          Messages.add(message);

          webSocketService.sendMessage(message);
          
        }
        else {
          webSocketService.notifyMsgDelay(user.username);
        }

        return;
      }

      if (event === webSocketService.clientEvents.toggleMute) {
        const { userToMuteName, isMuted } = parsedData;

        if (!user.admin) return;

        await UsersDBService.updateByName(userToMuteName, { muted: isMuted });
                
        UsersOnline.toggleMuteByName(userToMuteName, isMuted);
        
        webSocketService.notifyMutedUser(userToMuteName);

        webSocketService.sendOnlineUsers("admin");

        webSocketService.sendAllUsersToAdmin();

        return;
      }

      if (event === webSocketService.clientEvents.toggleBan) {
        const { userToBanName, isBanned } = parsedData;

        if (!user.admin) return;

        await UsersDBService.updateByName(userToBanName, { banned: isBanned });

        
        const onlineUser = UsersOnline.getByName(userToBanName);
        
        if (isBanned && onlineUser) {
          onlineUser.wsc.close();
        }

        
        webSocketService.sendOnlineUsers("all");
        webSocketService.sendAllUsersToAdmin();

        return;
      }
    });

    ws.on("error", (e) => {
      console.log("websocket error: ", e);
      ws.close();
    });

    ws.on("close", () => {
      UsersOnline.removeById(user.id);

      webSocketService.sendOnlineUsers("all");
    });
  });
};
