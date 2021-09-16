const jwt = require("jsonwebtoken");

const createUserToken = (userId) => {
  
  const token = jwt.sign({ userId: userId }, process.env.JWT_KEY, {
    expiresIn: "1h",
  });

  return token;
};

module.exports = createUserToken;
