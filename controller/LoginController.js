import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { generateToken } from "../utils/jwt.js";
import { sendResponse } from "../utils/response.js";

class LoginController {

    static sendOtp = catchAsync(async (req, res) => {
        const { mobile } = req.body;

        const existingUser = await User.findOne({ mobile });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (existingUser) {

            await User.updateOne({ mobile }, { otp });
            return sendResponse(res, 200, "OTP sent successfully", true, {
                mobile,
                otp
            });

        } else {
            const newUser = User.create({ mobile, otp });
            return sendResponse(res, 200, "OTP sent successfully", true, {
                mobile,
                otp
            });
        }
    })

    static verifyOtp = catchAsync(async (req, res) => {
        const { mobile, otp } = req.body;
        const user = await User.findOne({ mobile });

        if (!user) {
            return sendResponse(res, 404, "User not found", false);
        }
        if (user.otp !== otp) {
            return sendResponse(res, 400, "Invalid OTP", false);
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

}

export default LoginController;