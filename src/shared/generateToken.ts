import jwt from "jsonwebtoken";
import config from "../config/config";

type UserPayload = {
  user_id: string;
  role: string;
};

export const generateToken = (payload: UserPayload) => {
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: "1d",
  });

  return token;
};