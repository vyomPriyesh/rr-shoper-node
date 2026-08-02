import TicketsTitle from "../models/TicketsTitle.js";
import TicketForm from "../models/TicketForm.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";
import Tickets from "../models/Tickets.js";
import mongoose from "mongoose";

class TicketsController {

    static addTicket = catchAsync(async (req, res) => {
        const payload = req.body || {}
        payload.user = req.user._id

        const data = await Tickets.create(payload)

        return sendResponse(res, 200, 'Ticket Submit Successfully', true, data)

    })

    static fetchUsersTikets = catchAsync(async (req, res) => {

        const { page, limit, status } = req.body || {}

        const userId = req.user._id

        const populates = [
            { path: 'user', select: 'image name' },
            { path: 'title', select: 'title' },
            { path: 'platform', select: 'name' },
        ]
        const data = await paginate(Tickets, { user: userId, status }, page, limit, {}, populates)


        const statusCounts = await Tickets.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
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

        const data = await Tickets.findById(id).populate("user", "image name").populate("title", "title").populate("platform", "name")

        if (!data) {
            return sendResponse(res, 422, 'Ticket not Found', false)
        }

        return sendResponse(res, 200, 'Ticket Found', true, data)

    })

}

export default TicketsController;
