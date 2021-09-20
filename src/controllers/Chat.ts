import UsersDBService from "../service/UsersDB";
import http from "http";
import WebSocket from "ws";
import { WebSocketService, clientEvents } from "../service/WebSocket";
import * as jwt from "jsonwebtoken";
import { URL } from "url";
import UsersOnline from "../service/UsersOnline";
import Messages from "../service/Messages";
import wsdata from "../types/wsdata";
import message from "../types/message";
import User from "../models/user";

module.exports = (server: http.Server) => {
  const webSocketServer = new WebSocket.Server({ server });
  const webSocketService = new WebSocketService(webSocketServer);

  webSocketServer.on(
    "connection",
    async (ws: WebSocket, req: http.IncomingMessage) => {
      const url = new URL(req.url as string, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        return ws.close();
      }

      let user: User | null = null;
      let decodedToken: { userId: number };

      try {
        decodedToken = jwt.verify(token, process.env.JWT_KEY as string) as {
          userId: number;
        };
        user = await UsersDBService.findById(decodedToken.userId);
      } catch (err) {
        console.log(err);
        ws.send("invalid token");
      }

      if (!user) {
        return ws.close();
      }

      UsersOnline.add({ ...user.get({ plain: true }), wsc: ws });

      webSocketService.sendOnlineUsers("all");
      webSocketService.sendAllUsersToAdmin();

      console.log("connected");

      ws.on("message", async (data: string) => {
        if (!user) {
          return ws.close();
        }

        let parsedData: wsdata;

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

          if (!text || !date || !color) {
            return;
          }

          const onlineUser = UsersOnline.getByName(user.username);
          if (onlineUser!.muted) {
            return;
          }

          if (text.trim().length === 0 || text.trim().length > 200) {
            return;
          }

          const message: message = {
            text: text,
            date: date,
            color: color,
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

        if (event === clientEvents.toggleMute) {
          const { userToMuteName, isMuted } = parsedData;

          if (!userToMuteName || typeof isMuted === "undefined") {
            return;
          }

          if (!user.admin) return;

          await UsersDBService.updateByName(userToMuteName, { muted: isMuted });

          UsersOnline.toggleMuteByName(userToMuteName, isMuted);

          webSocketService.notifyMutedUser(userToMuteName);

          webSocketService.sendOnlineUsers("admin");

          webSocketService.sendAllUsersToAdmin();

          return;
        }

        if (event === clientEvents.toggleBan) {
          const { userToBanName, isBanned } = parsedData;

          if (!userToBanName || typeof isBanned === "undefined") {
            return;
          }

          if (!user.admin) return;

          await UsersDBService.updateByName(userToBanName, {
            banned: isBanned,
          });

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
        UsersOnline.removeById(user!.id);

        webSocketService.sendOnlineUsers("all");
      });
    }
  );
};
