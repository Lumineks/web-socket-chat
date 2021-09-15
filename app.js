const http = require("http");
const express = require("express");
const validateLoginData = require("./middleware/validateLoginData");
const bcrypt = require("bcrypt");
const UsersDBService = require("./service/UsersDB");
const UsersOnline = require("./service/UsersOnline");
const chatController = require("./controllers/Chat");
const createUserToken = require("./utils/createUserToken");

require("dotenv").config();


const app = express();
const server = http.createServer(app);
const port = process.env.PORT;


chatController(server);


app.use(express.json());


app.post("/login", validateLoginData, async (req, res) => {
  const { username, password, email } = req.body;
  
  if (UsersOnline.includes(username)) {
    return res.status(403).send("Пользователь с таким именем уже в чате");
  }

  
  let user = await UsersDBService.findByLoginData(email, username);

  if(user) {

    if (user.banned) {
      return res.status(403).send("Вы были забанены");
    }
    
    if (user.email!==email || 
        user.username!==username || 
        !await bcrypt.compare(password, user.password)
      ) {
      return res.status(401).send("Неправильно введено имя пользователя, email или пароль");
    }

  }
  else {

    const encryptedPassword = await bcrypt.hash(password, 10);

    user = await UsersDBService.create(username, encryptedPassword, email);

  }



  const token = createUserToken(user.id);

  res.status(200).json({
    token: token,
    name: user.username,
    email: user.email,
    isAdmin: user.admin,
    isMuted: user.muted,
    isBanned: user.banned,
  });

});



server.listen(port, () => console.log(`Server is listening on port: ${port}`));
