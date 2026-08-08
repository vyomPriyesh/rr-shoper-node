import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';
import Customer from '../models/Customer.js';

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
      const Modal = decoded?.role == 'customer' ? Customer : User
     
      let user = await Modal.findOne({ _id: decoded.id, 'login_devices.token': token, status: 'active' }).select("-password -login_devices").populate("designation")

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
