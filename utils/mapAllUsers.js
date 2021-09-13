const models = require("../models/index");

const mapAllUsers = async () => {
  let usersFromDb = await models.User.findAll();

  return usersFromDb.map((user) => {
    return {
      name: user.username,
      email: user.email,
      isMuted: user.muted,
      isBanned: user.banned,
    };
  });
};

module.exports = mapAllUsers;
