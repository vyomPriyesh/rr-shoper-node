import dotenv from 'dotenv';
import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign({ id: user._id, mobile: user.mobile, }, process.env.JWT_SECRET_KEY, { expiresIn: '356d' });
};