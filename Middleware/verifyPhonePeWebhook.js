import { sendResponse } from "../utils/response.js";
import crypto from 'crypto'

const verifyPhonePeWebhook = (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;
        console.log("PhonePe webhook received", authHeader);
        if (!authHeader || !authHeader.startsWith("Basic ")) {
            return sendResponse(res, 401, "Unauthorized", false);
        }
        const username = 'Pankaj';
        const password = 'PankajAgravat302302';

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
};

export default verifyPhonePeWebhook;