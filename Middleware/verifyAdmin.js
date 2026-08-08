import { sendResponse } from "../utils/response.js";

const verifyAdmin = (req, res, next) => {
    // verifyToken should run before this middleware
    if (!req.user) {
        return sendResponse(
            res,
            401,
            {
                message: "Authentication required",
                error_message: "Unauthorized",
            },
            false
        );
    }

    // Customer can never access admin routes
    if (req.user.role !== "admin") {
        return sendResponse(
            res,
            403,
            "Admin access required",
            false
        );
    }

    next();
};

export default verifyAdmin;
