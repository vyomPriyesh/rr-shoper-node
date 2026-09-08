import { sendResponse } from "../utils/response.js";

const verifyPhonePeWebhook = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return sendResponse(res, 401, "Unauthorized", false);
    }

    const base64Credentials = authHeader.split(" ")[1];

    let credentials;

    try {
        credentials = Buffer
            .from(base64Credentials, "base64")
            .toString("utf8");
    } catch (error) {
        console.log(error)
        return sendResponse(res, 401, "Invalid authorization", false);
    }
    
    console.log(credentials)
    const [username, password] = credentials.split(":");

    if (
        username !== 'Pankaj' ||
        password !== 'Pankaj302'
    ) {
        return sendResponse(res, 401, "Invalid credentials", false);
    }

    next();
};

export default verifyPhonePeWebhook;