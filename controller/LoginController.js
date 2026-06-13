import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { generateToken } from "../utils/jwt.js";
import bcryptjs from "bcryptjs";
import { sendResponse } from "../utils/response.js";
import crypto from 'crypto'
import emailotpsending from "../utils/emailotpsending.js";
import "dotenv/config";

class LoginController {

    static findCustomer = catchAsync(async (req, res) => {

        const { email } = req.params

        const customer = await User.findOne({ email });
        if (!customer) {
            return sendResponse(res, 422, "Customer not found", false);
        }
        return sendResponse(res, 200, "Customer Found", true, customer, true);

    })

    static sendOtp = catchAsync(async (req, res) => {
        const { mobile, email } = req.body;
        const name = email?.split("@")[0]

        const testUser = email === 'rrshopertest@gmail.com'
        const existingUser = await User.findOne({ email });
        const otp = testUser ? 123456 : crypto.randomInt(100000, 999999);

        if (existingUser) {
            await User.updateOne({ email }, { otp, otp_send_time: Date.now() });
        } else {
            const newUser = await User.create({ name: name, mobile, email, otp });
        }

        if (!testUser) {
            emailotpsending.sendMail({
                from: `"RR Shoper" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "RR Shoper OTP Verification",
                html: `
                    <div style="
                        font-family: Arial;
                        max-width: 500px;
                        margin: auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 10px;
                    ">
                        <h2>RR Shoper Verification</h2>
    
                        <p>Your OTP code is: <h3 style="
                            letter-spacing: 5px;
                            color: #B06A8D;
                        ">
                            ${otp}
                        </h3>This OTP will expire in 5 minutes.Do not share this OTP with anyone.</p>
                    </div>
                `
            }).catch(err => console.log(err));
        }


        return sendResponse(res, 200, "OTP sent successfully on Email", true);
    })

    static verifyOtp = catchAsync(async (req, res) => {

        const { mobile, otp } = req.body;
        const user = await User.findOne({ mobile });

        if (!user) {
            return sendResponse(res, 422, "User not found", false);
        }
        if (user.otp !== otp) {
            return sendResponse(res, 400, "Invalid OTP", false);
        }
        const currentTime = Date.now();

        const otpTime = new Date(user.otp_send_time).getTime();

        const diff = currentTime - otpTime;

        const fiveMinutes = 5 * 60 * 1000;

        if (diff > fiveMinutes) {
            return sendResponse(res, 400, "OTP expired", false);
        }


        // OTP is valid, you can generate a token here if needed
        const token = generateToken(user);

        const userData = await User.findByIdAndUpdate(
            { _id: user._id },
            {
                otp_status: "verified", status: "active",
                $push: {
                    login_devices: {
                        token,
                        login_time: new Date()
                    }
                }
            },
            { new: true },
        ).select("-login_devices -password");
        const data = {
            user: userData,
            token,
        }

        return sendResponse(res, 200, "OTP verified successfully", true, data);
    })

    static profile = catchAsync(async (req, res) => {

        const userId = req.user.id;

        const profileData = await User.findById(userId).select("-login_devices -otp -password")

        return sendResponse(res, 200, "Profile found successfully", true, profileData);

    })

    static adminLogin = catchAsync(async (req, res) => {

        const { mobile, password } = req.body || {}

        const userData = await User.findOne({ mobile }).select("-login_devices")

        const isMatch = await bcryptjs.compare(password, userData.password);

        if (!isMatch) {
            return sendResponse(res, 422, 'Invalid password', false)
        }

        const token = generateToken(userData);

        const updatedUserData = await User.findByIdAndUpdate(
            { _id: userData._id },
            {
                otp_status: "verified", status: "active",
                $push: {
                    login_devices: {
                        token,
                        login_time: new Date()
                    }
                }
            },
            { new: true },
        ).select("-login_devices -password").lean();

        updatedUserData.token = token

        return sendResponse(res, 200, 'Login successful', true, updatedUserData);

    })

}

export default LoginController;