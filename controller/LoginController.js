import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { generateToken } from "../utils/jwt.js";
import bcryptjs from "bcryptjs";
import { sendResponse } from "../utils/response.js";
import crypto from 'crypto'
import emailotpsending from "../utils/emailotpsending.js";
import "dotenv/config";
import Customer from "../models/Customer.js";
import Subscription from "../models/Subscription.js";

class LoginController {

    static findCustomer = catchAsync(async (req, res) => {

        const { search } = req.params;

        const customer = await Customer.findOne({
            $or: [
                { email: search },
                { mobile: search }
            ]
        }).select('name email mobile role status otp_status');


        if (!customer) {
            return sendResponse(res, 422, "Customer not found", false);
        }
        return sendResponse(res, 200, "Customer Found", true, customer, true);

    })

    static sendOtp = catchAsync(async (req, res) => {
        const { mobile, email } = req.body;
        const name = email?.split("@")[0]

        const testCustomer = email === 'rrshopertest@gmail.com'
        const existingUser = await Customer.findOne({ email });
        const otp = testCustomer ? 123456 : crypto.randomInt(100000, 999999);

        if (existingUser) {
            await Customer.updateOne({ email }, { otp, otp_send_time: new Date() });
        } else {
            const newUser = await Customer.create({ name: name, mobile, email, otp });
        }

        if (!testCustomer) {
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

        const { mobile, otp, password: loginPassword } = req.body;
        const customer = await Customer.findOne({ mobile });
        const name = customer?.email?.split("@")[0];

        if (!customer) {
            return sendResponse(res, 422, "customer not found", false);
        }

        if (customer?.otp_status == 'verified') {

            const isMatch = await bcryptjs.compare(loginPassword, customer.password);

            if (!isMatch) {
                return sendResponse(res, 403, 'Invalid password', false)
            }

        } else {

            if (customer.otp !== otp) {
                return sendResponse(res, 400, "Invalid OTP", false);
            }
            const currentTime = Date.now();

            const otpTime = new Date(customer.otp_send_time).getTime();

            const diff = currentTime - otpTime;

            const fiveMinutes = 5 * 60 * 1000;

            if (diff > fiveMinutes) {
                return sendResponse(res, 400, "OTP expired", false, { currentTime, otpTime });
            }

            const password = name?.toLowerCase() + '@' + mobile
            const hashedPassword = await bcryptjs.hash(password, 10);

            emailotpsending.sendMail({
                from: `"RR Shoper" <${process.env.EMAIL_USER}>`,
                to: customer?.email,
                subject: "RR Shoper Account Password",
                html: `
                        <div style="
                            font-family: Arial;
                            max-width: 500px;
                            margin: auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 10px;
                        ">
                            <h2>RR Shoper Password</h2>
        
                           <p>
        Your account has been created successfully.
        <br /><br />
        Your temporary password is:
        <h3 style="
            letter-spacing: 2px;
            color: #B06A8D;
        ">
            ${password}
        </h3>
        Please use this password to log in to your account.
        <br />
        For security, we recommend changing your password after your first login.
        <br /><br />
        If you did not request this account, please contact our support team immediately.
    </p>
                        </div>
                    `
            }).catch(err => console.log(err));

            await Customer.findByIdAndUpdate({ _id: customer._id }, { otp_status: "verified", status: "active", password: hashedPassword })
        }



        // OTP is valid, you can generate a token here if needed
        const token = generateToken(customer);

        const customerData = await Customer.findByIdAndUpdate(
            { _id: customer._id },
            {
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
            user: customerData,
            token,
        }

        return sendResponse(res, 200, `${loginPassword ? 'Login successfully' : 'OTP verified successfully'} `, true, data);
    })

    static updateCustomerPassword = catchAsync(async (req, res) => {

        const { password } = req.params
        const { _id: id } = req.user || {}
        const hashedPassword = await bcryptjs.hash(password, 10);
        const findUser = await Customer.findById(id)
        if (!findUser) {
            return sendResponse(res, 422, `Customer Not Found`, false)
        }
        await Customer.findByIdAndUpdate(id, { password: hashedPassword, password_update: 0 })

        return sendResponse(res, 200, `Password Update Successfully`, true)

    })

    static profile = catchAsync(async (req, res) => {

        const { id: userId, role } = req.user || {};

        if (role == "customer") {

            const customerData = await Customer.findById(userId).lean()

            if (!customerData) {
                return sendResponse(res, 500, 'Customer not found', false)
            }

            const now = new Date();
            const expiredSubscriptions = await Subscription.find({
                customer_id: userId,
                status: 'active',
                expires_at: { $ne: null, $lt: now },
            });

            for (const subscription of expiredSubscriptions) {
                subscription.status = 'expired';
                await subscription.save();
            }

        }

        const Modal = role === "customer" ? Customer : User;

        let query = Modal.findById(userId)
            .select("-login_devices -otp -password");

        if (role !== "customer") {
            query = query.populate("designation");
        }

        const profileData = await query.populate("image").lean();

        if (role == "customer") {
            const subscriptions = await Subscription.find({ customer_id: userId }).populate("payment_id", "amount").populate([{ path: "package_id", populate: "platform" }])
            profileData.subscriptions = subscriptions

        }
        return sendResponse(res, 200, "Profile found successfully", true, profileData);

    })

    static updateProfile = catchAsync(async (req, res) => {

        const data = req.body || {};
        const { role, _id: id } = req.user || {}
        const Modal = role === "customer" ? Customer : User;
        await Modal.findByIdAndUpdate(id, data)
        return sendResponse(res, 200, "Profile Update successfully", true);

    })

    static adminLogin = catchAsync(async (req, res) => {

        const { mobile, password } = req.body || {}

        const userData = await User.findOne({ mobile }).select("-login_devices")

        if (userData.status == 'unactive') {
            return sendResponse(res, 403, 'User Status is Unactive', false)
        }

        const isMatch = await bcryptjs.compare(password, userData.password);

        if (!isMatch) {
            return sendResponse(res, 403, 'Invalid password', false)
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
