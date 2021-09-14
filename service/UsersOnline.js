const usersOnline = [];

class UsersOnline {
  static getAll() {
    return usersOnline;
  }

  static getRoot() {
    return usersOnline.find((u) => u.username === "root");
  }

  static getByName(username) {
    return usersOnline.find((u) => u.username === username);
  }

  static includes(username) {
    return !!usersOnline.find((u) => u.username === username);
  }

  static add(user) {
    usersOnline.push(user);
  }

  static removeById(id) {
    console.log("Before: ", usersOnline);
    const userIdx = usersOnline.findIndex((u) => u.id === id);
    usersOnline.splice(userIdx, 1);
    console.log("After: ", usersOnline);
  }

  static map() {
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
}

module.exports = UsersOnline;