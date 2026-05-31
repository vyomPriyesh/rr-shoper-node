import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';

dotenv.config();

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: false,
        error: {
          error_message: 'Access denied',
          message: 'Something went wrong...'
        }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      let user = await User.findById({ _id: decoded.id, 'login_devices.token': token }).select("-password -login_devices")
      

      if (!user) {
        return sendResponse(res, 401, {
          message: "Device session has been removed.",
          error_message: "Session expired"
        }, false);
      }
      req.user = user; // Contains payload like user ID, roles, etc.
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({
        status: false,
        error: {
          error_message: 'Invalid token',
          message: 'Something went wrong...'
        }
      });
    }

  } else {
    return res.status(401).json({
      status: false,
      error: {
        error_message: 'Invalid token',
        message: 'Something went wrong...'
      }
    });
  }
};

export default verifyToken;
