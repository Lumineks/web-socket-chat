const UsersOnline = require("./UsersOnline");
const UsersDBService = require("./UsersDB");

class WebSocketService {
  constructor(WSServer) {
    this.WebSocketServer = WSServer;
    this.events = {
      message: "message",
      usersOnline: "usersOnline",
      allUsers: "allUsers",
      muteToggled: "muteToggled",
    };
  }

  async sendAllUsersToAdmin() {
    const onlineRootUser = UsersOnline.getRoot();

    if (onlineRootUser) {
      const usersToSend = await UsersDBService.mapAllUsers();

      onlineRootUser.wsc.send(
        this.stringifyDataToSend(this.events.allUsers, usersToSend)
      );
    }
  }

  sendOnlineUsers(config) {
    const usersToSend = UsersOnline.map();

    if (config === "all") {
      const dataToSend = this.stringifyDataToSend(
        this.events.usersOnline,
        usersToSend
      );

      this.sendDataToAllUsers(dataToSend);
    } else if (config === "admin") {
      const onlineRootUser = UsersOnline.getRoot();

      if (onlineRootUser) {
        onlineRootUser.wsc.send(
          this.stringifyDataToSend(this.events.usersOnline, usersToSend)
        );
      }
    }
  }

  sendMessage(message) {
    const dataToSend = this.stringifyDataToSend(this.events.message, message);

    this.sendDataToAllUsers(dataToSend);
  }

  notifyMutedUser(username) {
    const onlineMutedUser = UsersOnline.getByName(username);

    if (onlineMutedUser) {
      onlineMutedUser.muted = isMuted;
      onlineMutedUser.wsc.send(
        this.stringifyDataToSend(this.events.muteToggled, isMuted)
      );
    }
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
