// const jwt = require("jsonwebtoken");
import * as jwt  from "jsonwebtoken";

export const createUserToken = (userId: string): string => {
  const token = jwt.sign({ userId: userId }, process.env.JWT_KEY as string, {
    expiresIn: "1h",
  });

  return token;
};
