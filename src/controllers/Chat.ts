const UsersDBService = require("../service/UsersDB");
import http from "http";
import WebSocket from "ws";
import { WebSocketService, clientEvents } from "../service/WebSocket";
import { user } from "../types/user";
const jwt = require("jsonwebtoken");
import { UsersOnline } from "../service/UsersOnline";
const Messages = require("../service/Messages");
import {parse as parseUrl} from 'url';
import {Url} from 'url';

module.exports = (server: http.Server) => {
  const webSocketServer = new WebSocket.Server({ server });
  const webSocketService = new WebSocketService(webSocketServer);

  webSocketServer.on("connection", async (ws: WebSocket, req: http.IncomingMessage) => {
    // const token = req.url.split("=")[1];
    const token = new URL(req.url as string).searchParams.get('token');
    console.log(token);
    let user: any, decodedToken;

    // return;

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

    ws.on("message", async (data: string) => {
      let parsedData: {
        event: string,
        text?: string,
        date?: string,
        color?: string,
        isMuted?: string,
        userToMuteName?: string,
        isBanned?: string,
        userToBanName?: string,
      };

      try {
        parsedData = JSON.parse(data);
      } catch (error) {
        console.log(error);
        return;
      }

      const { event } = parsedData;

      console.log("event", event);

      if (event === clientEvents.message) {
        const { text, date, color } = parsedData;
        
        if(!text || !date || !color) {
          return;
        }

        const onlineUser = UsersOnline.getByName(user.username);
        // Maybe just check user.muted? they're the same
        // should check with console        
        if (onlineUser!.muted) {
          return;
        }

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

        if (Messages.checkDelay(message.name, message.date)) {
          Messages.add(message);

          webSocketService.sendMessage(message);
        } else {
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

          webSocketService.sendOnlineUsers("all");
        }

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
