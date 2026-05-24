import fs from "fs";
import express from "express";
import LoginController from "../controller/LoginController.js";

const api = express.Router();

api.post("/send-otp", LoginController.sendOtp);
api.post("/verify-otp", LoginController.verifyOtp);


export default api;