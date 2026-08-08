import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import forManage from "../utils/HandleFormValues.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";
import { AddCustomer } from "./CustomerController.js";

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
                mobile: data.mobile,
                role: 'customer'
            }
            user = await AddCustomer(payload)
        } else {
            user = {
                success: true,
                newUser: {
                    _id: data.user,
                }
            }
        }

        if (!user.success) {
            return sendResponse(res, 422, user.message, false);
        }
        const formatedValue = await forManage({ user: user?.newUser?._id, assign_user: data.assign_user, values: data?.values })
        await Lead.create(formatedValue)

        return sendResponse(res, 200, "Lead Create SuccessFully", true);

    })
    static updateLead = catchAsync(async (req, res) => {

        const { id } = req.params || {}
        const data = req.body || {}

        const formatedValue = await forManage({ user: data?.user, status: data?.status, assign_user: data?.assign_user, values: data?.values })
        await Lead.findByIdAndUpdate(id, formatedValue)

        return sendResponse(res, 200, "Lead Update SuccessFully", true);

    })

    static allLeads = catchAsync(async (req, res) => {

        const { role, _id: id } = req.user || {};
        const { page, limit, status } = req.body || {};

        let query = { status };
        if (role !== 'admin') {
            query = {
                ...query,
                assign_user: id
            }
        }

        const populate = [
            { path: 'user', select: 'name' },
            { path: 'assign_user', select: 'name' },
        ]
        const data = await paginate(Lead, query, page, limit, {}, populate);
        delete query.status
        const statusCounts = await Lead.aggregate([
            {
                $match: query,
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        return sendResponse(res, 200, "Leads Found", true, { ...data, statusCounts }, true);

    })

    static fetchLeadById = catchAsync(async (req, res) => {
        const { id } = req.params || {}

        const findLead = await Lead.findById(id).populate("user", "name email mobile").populate("assign_user", "name email mobile")
        if (!findLead) {
            return sendResponse(res, 422, "Lead not found", false);
        }
        return sendResponse(res, 200, "Lead Found", true, findLead, true);

    })

}

export default LeadsController;