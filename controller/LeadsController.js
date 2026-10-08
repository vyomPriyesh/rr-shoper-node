import Customer from "../models/Customer.js";
import Lead from "../models/Lead.js";
import buildFilters from "../utils/buildFilters.js";
import { catchAsync } from "../utils/catchAsync.js";
import { generateLeadId } from "../utils/generateIds.js";
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
                role: 'customer',
                from: 'lead'
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
        const lead_id = await generateLeadId();
        const formatedValue = await forManage({ lead_id, customer: customer?.newCustomer?._id, assign_user: data.assign_user, created_by: userId, values: data?.values })

        await Lead.create(formatedValue)

        return sendResponse(res, 200, "Lead Create SuccessFully", true);

    })
    static updateLead = catchAsync(async (req, res) => {

        const { id } = req.params || {}
        const data = req.body || {}

        const findLead = await Lead.findById(id)
        if (!findLead) {
            return sendResponse(res, 422, "Lead not found", false);
        }

        const formatedValue = await forManage({ customer: data?.customer, status: data?.status, assign_user: data?.assign_user, values: data?.values })
        await Lead.findByIdAndUpdate(id, formatedValue)

        return sendResponse(res, 200, "Lead Update SuccessFully", true);

    })

    static allLeads = catchAsync(async (req, res) => {

        const { role, _id: id } = req.user || {};
        const { page, limit, status, ...allFilters } = req.body || {};

        const customerSearchKeys = ['mobile', 'email', 'gst_number', 'name']
        const customerQuery = await buildFilters(allFilters, customerSearchKeys)
        const customerData = await Customer.find(customerQuery).lean()
        const customersIds = customerData.map(list => list._id)

        const adminOrQuery = { customer: { $in: customersIds } };

        const userOrQuery = {
            $and: [
                {
                    $or: [
                        { assign_user: id },
                        { created_by: id },
                    ],
                },
            ],
            $or: [
                adminOrQuery,
            ]
        }
        const searchKeys = ['lead_id']

        const query = await buildFilters({ ...allFilters, status }, searchKeys, role !== 'admin' ? userOrQuery : adminOrQuery)

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

        const findLead = await Lead.findById(id).populate([{ path: "customer", select: "name email mobile createdAt status otp_status image", populate: [{ path: "image", select: "image" }] }]).populate("assign_user", "name email mobile image").populate("created_by", "name email mobile image")
        if (!findLead) {
            return sendResponse(res, 422, "Lead not found", false);
        }
        return sendResponse(res, 200, "Lead Found", true, findLead, true);

    })

    static deleteLead = catchAsync(async (req, res) => {

        const { id } = req.params || {}

        const findLead = await Lead.findById(id)
        if (!findLead) {
            return sendResponse(res, 422, "Lead not found", false);
        }

        await Lead.delete({ _id: id })

        return sendResponse(res, 200, "Lead Delete SuccessFully", true);

    })

    static getLeadsByCustomer = catchAsync(async (req, res) => {

        const { id } = req.params || {}
        const { page, limit, ...allFilters } = req.body || {};
        const { role } = req.user || {};
        const searchKeys = ['lead_id']


        const orQuery = {
            customer: id
        }
        const query = await buildFilters(allFilters, searchKeys, orQuery)

        const populate = [
            { path: 'customer', select: 'name' },
            role === 'admin' && { path: 'created_by', select: 'name' },
            { path: 'assign_user', select: 'name' },
        ].filter(Boolean)

        const data = await paginate(Lead, query, page, limit, {}, populate, orQuery);

        return sendResponse(res, 200, "Leads Found SuccessFully", true, data);


    })

    // static updatesLeadId = catchAsync(async (req, res) => {

    //     const data = await Lead.find()

    //     for (const list of data) {
    //         const lead_id = await generateLeadId();
    //         await Lead.findByIdAndUpdate(list._id, { lead_id })
    //     }

    // })

}

export default LeadsController;
