import {
    StandardCheckoutClient,
    Env
} from "@phonepe-pg/pg-sdk-node";

const env =
    process.env.PHONEPE_ENV === "PRODUCTION"
        ? Env.PRODUCTION
        : Env.SANDBOX;

export const phonepeClient =
    StandardCheckoutClient.getInstance(
        process.env.PHONEPE_CLIENT_ID,
        process.env.PHONEPE_CLIENT_SECRET,
        Number(process.env.PHONEPE_CLIENT_VERSION),
        env
    );