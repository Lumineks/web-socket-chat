const usersOnline = [];

class UsersOnline {
  static getAll() {
    return usersOnline;
  }

  static getRootUser() {
    return usersOnline.find((u) => u.username === "root");
  }

  static getUserByName(username) {
    return usersOnline.find((u) => u.username === username);
  }

  static includes(username) {
    return !!usersOnline.find((u) => u.username === username);
  }

  static addUser(user) {
    usersOnline.push(user);
  }

  static removeUserById(id) {
    const userIdx = usersOnline.findIndex((u) => u.id === id);
    usersOnline.splice(userIdx, 1);
  }

  static mapUsers() {
    const mappedUsers = usersOnline.map((user) => {
      return {
        name: user.username,
        email: user.email,
        isMuted: user.muted,
        isBanned: user.banned,
      };
    });

    return mappedUsers;
  }

  static clear() {
    usersOnline.splice(0, usersOnline.length);
  }
}

module.exports = UsersOnline;
