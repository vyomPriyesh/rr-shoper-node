import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

class LoginController {

    static sendOtp = catchAsync(async (req, res) => {
        const { mobile } = req.body;

        const existingUser = await User.findOne({ mobile });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (existingUser) {

            await User.updateOne({ mobile }, { otp });
            return sendResponse(res, 200, {
                message: "OTP sent successfully",
                data: {
                    mobile,
                    otp
                }
            }, true);

        } else {
            const newUser = User.create({ mobile, otp });
            return sendResponse(res, 200, {
                message: "OTP sent successfully",
                data: {
                    mobile,
                    otp
                }
            }, true);
        }
    })

}

export default LoginController;