import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";
import { AddUser } from "./UserController.js";

class LeadsController {

    static findUser = catchAsync(async (req, res) => {

        const { search } = req.body;

        const customer = await User.findOne({
            $or: [
                { email: search },
                { mobile: search }
            ]
        }).select('name email mobile role status');


        if (!customer) {
            return sendResponse(res, 422, "Customer not found", false);
        }
        return sendResponse(res, 200, "Customer Found", true, customer, true);

    })

    static addLead = catchAsync(async (req, res) => {

        const data = req.body || {}
        let user;
        if (!data?.user) {
            const payload = {
                name: data.name,
                email: data.email,
                mobile: data.mobileNumber,
                role: 'user'
            }
            user = await AddUser(payload)
        } else {
            user = {
                success: true,
                newUser: {
                    _id: data.user
                }
            }
        }

        if (!user.success) {
            return sendResponse(res, 422, user.message, false);
        }

        const newLead = await Lead.create({ user: user?.newUser?._id, values: data?.values })

        return sendResponse(res, 200, "Lead Create SuccessFully", true, newLead);

    })

}

export default LeadsController;