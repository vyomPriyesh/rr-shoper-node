import express from "express";

import {
    oauth2Client,
} from "../config/googleDrive.js";

const router = express.Router();

const SCOPES = [
    "https://www.googleapis.com/auth/drive",
];

router.get("/google-drive/oauth", (req, res) => {
    console.log("REDIRECT URI FROM ENV:");
    console.log(process.env.GOOGLE_REDIRECT_URI);

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent select_account",
        scope: SCOPES,
    });

    console.log("GOOGLE AUTH URL:");
    console.log(authUrl);

    return res.redirect(authUrl);
});

router.get("/google-drive/oauth/callback", async (req, res) => {

    try {

        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Authorization code not found",
            });
        }

        const { tokens } =
            await oauth2Client.getToken(code);

        console.log("GOOGLE TOKENS:");

        console.log(tokens);

        return res.json({
            success: true,
            message: "Google Drive connected successfully",

            refreshToken:
                tokens.refresh_token,
        });

    } catch (error) {

        console.error(
            "Google OAuth Error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
);

export default router;