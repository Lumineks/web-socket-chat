const UsersOnline = require("./UsersOnline");
const UsersDBService = require("./UsersDB");

class WebSocketService {
  constructor(WSServer) {
    this.WebSocketServer = WSServer;

    this.serverEvents = {
      message: "message",
      usersOnline: "usersOnline",
      allUsers: "allUsers",
      muteToggled: "muteToggled",
      msgDelay: "msgDelay",
    };

    this.clientEvents = {
      message: "message",
      toggleMute: "toggleMute",
      toggleBan: "toggleBan",
    };
  }

  async sendAllUsersToAdmin() {
    const onlineRootUser = UsersOnline.getRoot();

    if (onlineRootUser) {
      const usersToSend = await UsersDBService.mapAllUsers();

      onlineRootUser.wsc.send(
        this.stringifyDataToSend(this.serverEvents.allUsers, usersToSend)
      );
    }
  }

  sendOnlineUsers(config) {
    const usersToSend = UsersOnline.map();

    if (config === "all") {
      const dataToSend = this.stringifyDataToSend(
        this.serverEvents.usersOnline,
        usersToSend
      );

      this.sendDataToAllUsers(dataToSend);

    } else if (config === "admin") {

      const onlineRootUser = UsersOnline.getRoot();

      if (onlineRootUser) {
        onlineRootUser.wsc.send(
          this.stringifyDataToSend(this.serverEvents.usersOnline, usersToSend)
        );
      }

    }
  }

  sendMessage(message) {
    const dataToSend = this.stringifyDataToSend(
      this.serverEvents.message,
      message
    );

    this.sendDataToAllUsers(dataToSend);
  }

  notifyMutedUser(username) {
    const onlineMutedUser = UsersOnline.getByName(username);

    if (onlineMutedUser) {

      onlineMutedUser.wsc.send(
        this.stringifyDataToSend(
          this.serverEvents.muteToggled,
          onlineMutedUser.muted
        )
      );
      
    }
  }

  notifyMsgDelay(username) {
    const onlineUser = UsersOnline.getByName(username);

    const dataToSend = this.stringifyDataToSend(this.serverEvents.msgDelay, {
      text: "Вы можете отправлять сообщение 1 раз в 15 секунд",
    });

    onlineUser.wsc.send(dataToSend);
  }

  // Helpers

  sendDataToAllUsers(dataToSend) {
    this.WebSocketServer.clients.forEach((client) => client.send(dataToSend));
  }

  stringifyDataToSend(event, data) {
    return JSON.stringify({
      event: event,
      data: data,
    });
  }
}

module.exports = WebSocketService;
