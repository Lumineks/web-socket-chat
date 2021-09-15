const http = require("http");
const express = require("express");
const auth = require("./middleware/auth");
const chatController = require('./controllers/Chat');

require("dotenv").config();


const app = express();
const server = http.createServer(app);
const port = process.env.PORT;


chatController(server);


app.use(express.json());


app.post("/login", auth, (req, res) => {
  res.status(200).json(req.verifiedUser);
});


server.listen(port, () => console.log(`Server is listening on port: ${port}`));
