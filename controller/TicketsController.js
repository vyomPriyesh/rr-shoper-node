import TicketsTitle from "../models/TicketsTitle.js";
import TicketForm from "../models/TicketForm.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";
import Tickets from "../models/Tickets.js";
import mongoose from "mongoose";
import forManage from "../utils/HandleFormValues.js";
import Designation from "../models/Designation.js";
import User from "../models/User.js";

class TicketsController {

    static addTicket = catchAsync(async (req, res) => {
        const payload = req.body || {}
        payload.customer = req.user._id

        const formatedValue = await forManage({ title: payload.title, platform: payload.platform, customer: payload.customer, values: payload?.values });
        const designation = await Designation.findOne({ platform: payload.platform });

        const designationUsers = await User.find({
            designation: { $in: designation }, status: 'active'
        }).select("_id");

        if (!designationUsers.length) {
            throw new Error("No users found for this designation");
        }

        const userIds = designationUsers.map(user => user._id);

        // Get ticket count for each user
        const ticketCounts = await Tickets.aggregate([
            {
                $match: {
                    assign_user: { $in: userIds }
                }
            },
            {
                $group: {
                    _id: "$assign_user",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create count map
        const countMap = new Map(
            ticketCounts.map(item => [
                item._id.toString(),
                item.count
            ])
        );

        // Make sure users with 0 tickets are also included
        const usersWithCount = designationUsers.map(user => ({
            userId: user._id,
            count: countMap.get(user._id.toString()) || 0
        }));

        // Find minimum ticket count
        const minCount = Math.min(
            ...usersWithCount.map(user => user.count)
        );

        // Users having the lowest ticket count
        const availableUsers = usersWithCount.filter(
            user => user.count === minCount
        );

        // Pick random user among lowest-count users
        const randomIndex = Math.floor(
            Math.random() * availableUsers.length
        );

        const selectedUser = availableUsers[randomIndex];

        formatedValue.assign_user = selectedUser.userId;

        await Tickets.create(formatedValue);

        return sendResponse(res, 200, 'Ticket Submit Successfully', true)

    })

    static fetchCustomerTikets = catchAsync(async (req, res) => {

        const { page, limit, status } = req.body || {}

        const customerId = req.user._id

        const populates = [
            { path: 'customer', select: 'image name', populate: [{ path: 'image', select: 'image' }] },
            { path: 'title', select: 'title' },
            { path: 'platform', select: 'name' },
        ]
        const data = await paginate(Tickets, { customer: customerId, status }, page, limit, {}, populates)


        const statusCounts = await Tickets.aggregate([
            {
                $match: {
                    customer: new mongoose.Types.ObjectId(customerId),
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        return sendResponse(res, 200, 'Tickets Found', true, { ...data, statusCounts })

    })

    static viewTicket = catchAsync(async (req, res) => {

        const { id } = req.params

        const data = await Tickets.findById(id).populate({ path: "customer", select: "image name mobile email", populate: { path: "image" } }).populate({ path: "assign_user", select: "image name mobile email", populate: { path: "image" } }).populate("title", "title").populate("platform", "name")

        if (!data) {
            return sendResponse(res, 422, 'Ticket not Found', false)
        }

        return sendResponse(res, 200, 'Ticket Found', true, data)

    })

    static fetchUsersTikets = catchAsync(async (req, res) => {

        const { _id: userId, role } = req.user || {}
        const { page, limit, status } = req.body || {}

        const populates = [
            { path: 'customer', select: 'image name' },
            { path: 'title', select: 'title' },
            { path: 'platform', select: 'name' },
        ]
        let query
        if (role !== 'admin') {
            query = { assign_user: { $in: userId }, status }
        } else {
            query = { status }
        }

        const data = await paginate(Tickets, query, page, limit, {}, populates)

        const statusCounts = await Tickets.aggregate([
            {
                $match: {
                    assign_user: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        return sendResponse(res, 200, 'Tickets Found', true, { ...data, statusCounts }, true)

    })


    static updateStatus = catchAsync(async (req, res) => {

        const { status, id } = req.params || {}

        await Tickets.findByIdAndUpdate(id, { status })

        return sendResponse(res, 200, 'Ticket Status Update Successfully', true)

    })

}

export default TicketsController;
