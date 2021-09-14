const models = require("../models/index");

class UsersService {
  static async mapAllUsers() {
    let usersFromDb = await models.User.findAll();

    return usersFromDb.map((user) => {
      return {
        name: user.username,
        email: user.email,
        isMuted: user.muted,
        isBanned: user.banned,
      };
    });
  }

  static async findById(userId) {
    return await models.User.findByPk(userId);
  }

  static async updateByName(name, value) {
    try {
      await models.User.update(value, {
        where: {
          username: name,
        },
      });
    } catch (e) {
      console.log("UpdateByName error: ", e);
    }
  }
}

module.exports = UsersService;
