import TicketsTitle from "../models/TicketsTitle.js";
import TicketForm from "../models/TicketForm.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";

class TicketsController {

    static allTicketsTitle = catchAsync(async (req, res) => {
        const { page, limit } = req.body || {};
        const data = await paginate(TicketsTitle, {}, page, limit);

        return sendResponse(res, 200, "Tickets Title Found", true, data, true);
    });

    static addTicketsTitle = catchAsync(async (req, res) => {
        const payload = req.body || {};

        const findTicketsTitle = await TicketsTitle.findOne({ title: payload.title });

        if (findTicketsTitle) {
            return sendResponse(res, 409, "Tickets Title Already Added", false);
        }

        const data = await TicketsTitle.create(payload);

        return sendResponse(res, 200, "Tickets Title Added Successfully", true, data, true);
    });

    static updateTicketsTitle = catchAsync(async (req, res) => {
        const { id } = req.params;
        const data = req.body || {};

        const findTicketsTitle = await TicketsTitle.findById(id);
        if (!findTicketsTitle) {
            return sendResponse(res, 422, "Tickets Title Not Found", false);
        }

        await TicketsTitle.findByIdAndUpdate(id, data);

        return sendResponse(res, 200, "Tickets Title Updated Successfully", true);
    });

    static updateTicketsTitleStatus = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findTicketsTitle = await TicketsTitle.findById(id);
        if (!findTicketsTitle) {
            return sendResponse(res, 422, "Tickets Title Not Found", false);
        }

        await TicketsTitle.findByIdAndUpdate(id, { status: !findTicketsTitle.status });

        return sendResponse(res, 200, "Tickets Title Status Updated Successfully", true);
    });

    static deleteTicketsTitle = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findTicketsTitle = await TicketsTitle.findById(id);
        if (!findTicketsTitle) {
            return sendResponse(res, 422, "Tickets Title Not Found", false);
        }

        await TicketsTitle.delete({ _id: id });

        return sendResponse(res, 200, "Tickets Title Deleted Successfully", true);
    });

    static allTicketForm = catchAsync(async (req, res) => {
        const { page, limit } = req.body || {};
        const populate = [
            { path: 'ticketTitle', select: 'title' }
        ]
        const data = await paginate(TicketForm, {}, page, limit, {}, populate);

        return sendResponse(res, 200, "Ticket Form Found", true, data, true);
    });

    static getTicketForm = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findTicketForm = await TicketForm.findById(id);
        if (!findTicketForm) {
            return sendResponse(res, 422, "Ticket Form Not Found", false);
        }

        return sendResponse(res, 200, "Ticket Form Found Successfully", true, findTicketForm, true);
    });

    static getTicketFormByTicketTitle = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findTicketForm = await TicketForm.findOne({ ticketTitle: id });
        if (!findTicketForm) {
            return sendResponse(res, 422, "Ticket Form Not Found", false);
        }

        return sendResponse(res, 200, "Ticket Form Found Successfully", true, findTicketForm, true);
    });

    static addTicketForm = catchAsync(async (req, res) => {
        const payload = req.body || {};

        if (!payload.ticketTitle) {
            return sendResponse(res, 422, "Ticket Title Is Required", false);
        }

        const findTicketForm = await TicketForm.findOne({ ticketTitle: payload.ticketTitle });
        if (findTicketForm) {
            return sendResponse(res, 409, "Ticket Form Already Added", false);
        }

        const data = await TicketForm.create(payload);

        return sendResponse(res, 200, "Ticket Form Added Successfully", true, data, true);
    });

    static updateTicketForm = catchAsync(async (req, res) => {
        const { id } = req.params;
        const data = req.body || {};

        const findTicketForm = await TicketForm.findById(id);
        if (!findTicketForm) {
            return sendResponse(res, 422, "Ticket Form Not Found", false);
        }

        await TicketForm.findByIdAndUpdate(id, data);

        return sendResponse(res, 200, "Ticket Form Updated Successfully", true);
    });

    static updateTicketFormStatus = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findTicketForm = await TicketForm.findById(id);
        if (!findTicketForm) {
            return sendResponse(res, 422, "Ticket Form Not Found", false);
        }

        await TicketForm.findByIdAndUpdate(id, { status: !findTicketForm.status });

        return sendResponse(res, 200, "Ticket Form Status Updated Successfully", true);
    });

    static deleteTicketForm = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findTicketForm = await TicketForm.findById(id);
        if (!findTicketForm) {
            return sendResponse(res, 422, "Ticket Form Not Found", false);
        }

        await TicketForm.delete({ _id: id });

        return sendResponse(res, 200, "Ticket Form Deleted Successfully", true);
    });
}

export default TicketsController;
