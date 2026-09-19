import { sendResponse } from "../utils/response.js";
import crypto from 'crypto'
import "dotenv/config";

const verifyPhonePeWebhook = (req, res, next) => {

    try {
        const authorization = req.headers.authorization;
        console.log("PhonePe webhook received", authorization);
        if (!authorization) {
            return sendResponse(res, 401, "Unauthorized", false);
        }
        const username = process.env.PHONE_PAY_WEBHOOK_USERNAME;
        const password = process.env.PHONE_PAY_WEBHOOK_PASSWORD;

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