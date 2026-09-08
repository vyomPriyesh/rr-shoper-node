import { sendResponse } from "../utils/response.js";

const verifyPhonePeWebhook = (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Basic ")) {
            return sendResponse(res, 401, "Unauthorized", false);
        }
        const username = 'Pankaj';
        const password = 'PankajAgravat302302';
        console.log("PhonePe webhook received", authHeader);

        const expectedAuthorization = crypto
            .createHash("sha256")
            .update(`${username}:${password}`)
            .digest("hex");

        console.log("Expected authorization:", expectedAuthorization);

        if (authorization !== expectedAuthorization) {
            console.log("Invalid PhonePe webhook authorization");

            return sendResponse(res, 401, "Invalid authorization", false);
        }

        console.log("PhonePe webhook verified");

        next();

    } catch (error) {
        console.log(error)
        return sendResponse(res, 401, "Invalid authorization", false);
    }

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