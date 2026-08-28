import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { sendResponse } from '../utils/response.js';

dotenv.config();

const optionalVerifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // No token → continue as guest user
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    // Invalid Authorization header
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        const Model =
            decoded?.role === 'customer'
                ? Customer
                : User;

        let query = Model.findOne({
            _id: decoded.id,
            'login_devices.token': token,
            status: 'active',
        }).select('-login_devices -otp -password');

        if (decoded?.role !== 'customer') {
            query = query.populate('designation');
        }

        const user = await query;

        // Token exists but session is removed
        if (!user) {
            return sendResponse(
                res,
                401,
                {
                    message: 'Device session has been removed.',
                    error_message: 'Session expired',
                },
                false
            );
        }

        // Authenticated user
        req.user = user;

        return next();

    } catch (error) {
        console.error('JWT verification error:', error);

        // Token was provided but invalid
        return res.status(401).json({
            status: false,
            error: {
                error_message: 'Invalid token',
                message: 'Something went wrong...',
            },
        });
    }
};

export default optionalVerifyToken;