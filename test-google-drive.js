import "dotenv/config";
import { drive } from "./config/googleDrive.js";

const testGoogleDrive = async () => {
    try {
        const response = await drive.files.list({
            pageSize: 10,
            fields: "files(id, name)",
        });

        console.log("Google Drive Connected!");
        console.log(response.data.files);

    } catch (error) {
        console.error(
            "Google Drive Error:",
            error.response?.data || error.message
        );
    }
};

testGoogleDrive();