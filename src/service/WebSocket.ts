import { UsersOnline } from "./UsersOnline";
import WebSocket from "ws";
import { message } from "../types/message";
const UsersDBService = require("./UsersDB");

enum serverEvents {
  message = "message",
  usersOnline = "usersOnline",
  allUsers = "allUsers",
  muteToggled = "muteToggled",
  msgDelay = "msgDelay",
}

export enum clientEvents {
  message = "message",
  toggleMute = "toggleMute",
  toggleBan = "toggleBan",
}

export class WebSocketService {
  WebSocketServer: WebSocket.Server;

  constructor(WSServer: WebSocket.Server) {
    this.WebSocketServer = WSServer;
  }

  async sendAllUsersToAdmin() {
    const onlineRootUser = UsersOnline.getRoot();

    if (onlineRootUser) {
      const usersToSend = await UsersDBService.mapAllUsers();

      onlineRootUser.wsc.send(
        // this.stringifyDataToSend(this.serverEvents.allUsers, usersToSend)
        this.stringifyDataToSend(serverEvents.allUsers, usersToSend)
      );
    }
  }

  sendOnlineUsers(config: "all" | "admin") {
    const usersToSend = UsersOnline.map();

    if (config === "all") {
      const dataToSend = this.stringifyDataToSend(
        serverEvents.usersOnline,
        usersToSend
      );

      this.sendDataToAllUsers(dataToSend);
    } else if (config === "admin") {
      const onlineRootUser = UsersOnline.getRoot();

      if (onlineRootUser) {
        onlineRootUser.wsc.send(
          this.stringifyDataToSend(serverEvents.usersOnline, usersToSend)
        );
      }
    }
  }

  sendMessage(message: message) {
    const dataToSend = this.stringifyDataToSend(
      serverEvents.message,
      message
    );

    this.sendDataToAllUsers(dataToSend);
  }

  notifyMutedUser(username: string) {
    const onlineMutedUser = UsersOnline.getByName(username);

    if (onlineMutedUser) {
      onlineMutedUser.wsc.send(
        this.stringifyDataToSend(
          serverEvents.muteToggled,
          onlineMutedUser.muted
        )
      );
    }
  }

  notifyMsgDelay(username: string) {
    const onlineUser = UsersOnline.getByName(username);

    const dataToSend = this.stringifyDataToSend(serverEvents.msgDelay, {
      text: "Вы можете отправлять сообщение 1 раз в 15 секунд",
    });

    if (onlineUser) {
      onlineUser.wsc.send(dataToSend);
    }
  }

  // Helpers

  sendDataToAllUsers(dataToSend: string) {
    this.WebSocketServer.clients.forEach((client) => client.send(dataToSend));
  }

  stringifyDataToSend(event: serverEvents, data: any) {
    return JSON.stringify({
      event: event,
      data: data,
    });
  }
}
