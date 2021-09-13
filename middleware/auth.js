const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const loginResponse = require("../utils/loginResponse");
const emailValidator = require("email-validator");
const { Op } = require("sequelize");
const UsersOnline = require("../utils/UsersOnline");
const models = require("../models/index");

const auth = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    if (!(username && password && email)) {
      return res.status(400).send("Все поля обязательны для заполнения");
    }

    // Special characters regexp
    if (/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(username)) {
      return res
        .status(400)
        .send("Имя пользователя не должно содержать спец символы ");
    }

    if (username.length < 3) {
      return res
        .status(400)
        .send("Имя пользователя должно состоять минимум из 3х символов");
    }

    if (UsersOnline.includes(username)) {
      return res.status(400).send("Пользователь с таким именем уже в чате");
    }

    if (!emailValidator.validate(email) && email !== "root@root") {
      return res.status(400).send("Некорректный email адрес");
    }

    const existingUser = await models.User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      if (existingUser.banned) {
        res.status(403).send("Вы были забанены");
      }

      if (await bcrypt.compare(password, existingUser.password)) {
        const token = jwt.sign({ userId: existingUser.id }, "secret", {
          expiresIn: "1h",
        });

        req.verifiedUser = loginResponse(existingUser.dataValues, token);
      } else {
        res.status(401).send("Неправильный пароль");
      }
    } else {
      const encryptedPassword = await bcrypt.hash(password, 10);

      const user = await models.User.create({
        username: username,
        password: encryptedPassword,
        email: email,
        banned: false,
        admin: false,
        muted: false,
      });
      const token = jwt.sign({ userId: user.id }, "secret", {
        expiresIn: "1h",
      });

      req.verifiedUser = loginResponse(user.dataValues, token);
    }
  } catch (error) {
    console.log(error);
  }

  return next();
};

module.exports = auth;
