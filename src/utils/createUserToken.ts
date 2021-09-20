// const jwt = require("jsonwebtoken");
import * as jwt  from "jsonwebtoken";

const createUserToken = (userId: string): string => {
  const token: string = jwt.sign({ userId: userId }, process.env.JWT_KEY as string, {
    expiresIn: "1h",
  });

  return token;
};

export default createUserToken;
