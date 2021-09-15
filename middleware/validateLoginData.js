const emailValidator = require("email-validator");
const validateSpecCharacter = require("../utils/validateSpecCharacter");


const validateLoginData = (req, res, next) => {
  
  const { username, password, email } = req.body;

  if (!(username && password && email)) {
    return res.status(400).send("Все поля обязательны для заполнения");
  }
  

  if (!validateSpecCharacter(username)) {
    return res
      .status(400)
      .send("Имя пользователя не должно содержать спец символы ");
  }


  if (username.length < 3) {
    return res
      .status(400)
      .send("Имя пользователя должно состоять минимум из 3х символов");
  } 
  
  
  if (password.length < 4) {
    return res
      .status(400)
      .send("пароль должен состоять минимум из 4х символов");
  }


  if (!emailValidator.validate(email) && email !== "root@root") {
    return res.status(400).send("Неправильно введено имя пользователя, email или пароль");
  }

  
  return next();

};

module.exports = validateLoginData;
