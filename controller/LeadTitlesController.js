import LeadTitle from "../models/LeadTitle.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";

class LeadTitlesController {

    static allLeadTitles = catchAsync(async (req, res) => {
        const { page, limit } = req.body || {};
        const data = await paginate(LeadTitle, {}, page, limit);

        return sendResponse(res, 200, "Lead Titles Found", true, data, true);
    });

    static addLeadTitle = catchAsync(async (req, res) => {
        const payload = req.body || {};

        const findLeadTitle = await LeadTitle.findOne({ title: payload.title });

        if (findLeadTitle) {
            return sendResponse(res, 409, "Lead Title Already Added", false);
        }

        const data = await LeadTitle.create(payload);

        return sendResponse(res, 200, "Lead Title Added Successfully", true, data, true);
    });

    static updateLeadTitle = catchAsync(async (req, res) => {
        const { id } = req.params;
        const data = req.body || {};

        const findLeadTitles = await LeadTitle.findById(id);
        if (!findLeadTitles) {
            return sendResponse(res, 422, "Lead Title Not Found", false);
        }

        await LeadTitle.findByIdAndUpdate(id, data);

        return sendResponse(res, 200, "Lead Title Updated Successfully", true);
    });

     static updateLeadTitleStatus = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findLeadTitle = await LeadTitle.findById(id);
        if (!findLeadTitle) {
            return sendResponse(res, 422, "Lead Title Not Found", false);
        }

        await LeadTitle.findByIdAndUpdate(id, { status: !findLeadTitle.status });

        return sendResponse(res, 200, "Lead Title Status Updated Successfully", true);
    });

    static deleteLeadTitle = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findLeadTitle = await LeadTitle.findById(id);
        if (!findLeadTitle) {
            return sendResponse(res, 422, "Lead Title Not Found", false);
        }

        await LeadTitle.delete({ _id: id });

        return sendResponse(res, 200, "Lead Title Deleted Successfully", true);
    });

}

export default LeadTitlesController;