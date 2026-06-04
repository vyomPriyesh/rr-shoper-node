import fs from "fs";
import express from "express";
import LoginController from "../controller/LoginController.js";
import verifyToken from "../Middleware/AuthMiddleware.js";
import { catchAsync } from "../utils/catchAsync.js";
import uploadFileMiddleware from "../Middleware/upload.js";
import { sendResponse } from "../utils/response.js";
import { folderName } from "../config/config.js";

const api = express.Router();

api.post('/images/upload', catchAsync(async (req, res) => {
    await uploadFileMiddleware(req, res);
    if (req?.files?.length === 0) {
        return sendResponse(res, 400, 'Please upload at least one file!', false);
    }
    const filenames = req.files.map(file => file.filename);
    const formattedImages = filenames.map(filename => `/${folderName}/${filename}`);
    return sendResponse(res, 200, 'Files uploaded successfully!', true, formattedImages);
}));

api.post("/send-otp", LoginController.sendOtp);
api.post("/verify-otp", LoginController.verifyOtp);
api.get('/profile', verifyToken, LoginController.profile)
api.post('/login', LoginController.adminLogin)


export default api;