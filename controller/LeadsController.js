import Customer from "../models/Customer.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import forManage from "../utils/HandleFormValues.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";
import { AddCustomer } from "./CustomerController.js";

class LeadsController {

    static findCustomer = catchAsync(async (req, res) => {

        const { search } = req.body;

        const customer = await Customer.findOne({
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
        let customer;
        if (!data?.customer) {
            const payload = {
                name: data.name,
                email: data.email,
                mobile: data.mobile,
                role: 'customer'
            }
            customer = await AddCustomer(payload)
        } else {
            customer = {
                success: true,
                newCustomer: {
                    _id: data.customer,
                }
            }
        }

        if (!customer.success) {
            return sendResponse(res, 422, customer.message, false);
        }
        const { id: userId } = req.user || {};
        const formatedValue = await forManage({ customer: customer?.newCustomer?._id, assign_user: data.assign_user, created_by: userId, values: data?.values })

        await Lead.create(formatedValue)

        return sendResponse(res, 200, "Lead Create SuccessFully", true);

    })
    static updateLead = catchAsync(async (req, res) => {

        const { id } = req.params || {}
        const data = req.body || {}

        const formatedValue = await forManage({ customer: data?.customer, status: data?.status, assign_user: data?.assign_user, values: data?.values })
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
                $or: [
                    { assign_user: id },
                    { created_by: id },
                ],
            }
        }

        const populate = [
            { path: 'customer', select: 'name' },
            role === 'admin' && { path: 'created_by', select: 'name' },
            { path: 'assign_user', select: 'name' },
        ].filter(Boolean)
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

        const findLead = await Lead.findById(id).populate("customer", "name email mobile createdAt status otp_status image").populate("assign_user", "name email mobile image").populate("created_by", "name email mobile image")
        if (!findLead) {
            return sendResponse(res, 422, "Lead not found", false);
        }
        return sendResponse(res, 200, "Lead Found", true, findLead, true);

    })

}

export default LeadsController;