const models = require("../models/index");
const { Op } = require("sequelize");

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

  static async findByLoginData(email, username) {
    return await models.User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
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

  static async create(username, encryptedPassword, email) {
    return await models.User.create({
      username: username,
      password: encryptedPassword,
      email: email,
      banned: false,
      admin: false,
      muted: false,
    });
  }
}

module.exports = UsersService;
