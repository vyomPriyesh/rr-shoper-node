import { sendResponse } from "../utils/response.js";

const verifyPermission = (module_name, action) => {
    return (req, res, next) => {
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
            if (!req.user) {
                return sendResponse(
                    res,
                    401,
                    "Unauthorized",
                    false
                );
            }
            if(req.user.role ==='admin') next()
            const permissions = req.user.designation.permissions || [];
            const modulePermission = permissions.find(
                (permission) =>
                    permission.module_name.toLowerCase() ===
                    module_name.toLowerCase()
            );

            if (!modulePermission) {
                return sendResponse(
                    res,
                    403,
                    "Permission denied",
                    false
                );
            }

            const hasPermission =
                modulePermission.actions?.[action] === true;

            if (!hasPermission) {
                return sendResponse(
                    res,
                    403,
                    "Permission denied",
                    false
                );
            }

            next();
        } else {
            return sendResponse(
                res,
                401,
                'Invalid token',
                false
            );
        }
    }
};

export default verifyPermission;
