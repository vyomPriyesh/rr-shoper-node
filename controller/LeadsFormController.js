import LeadForm from "../models/LeadForm.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";

class LeadFormsController {

    static allLeadForms = catchAsync(async (req, res) => {
        const { page, limit } = req.body || {};
        const populate = [
            { path: 'leadTitle', select: 'title' }
        ]
        const data = await paginate(LeadForm, {}, page, limit, {}, populate);

        return sendResponse(res, 200, "Lead Form Found", true, data, true);
    });

    static addLeadForm = catchAsync(async (req, res) => {
        const payload = req.body || {};

        if (!payload.leadTitle) {
            return sendResponse(res, 422, "Lead Title Is Required", false);
        }

        const findLeadForm = await LeadForm.findOne({ leadTitle: payload.leadTitle });
        if (findLeadForm) {
            return sendResponse(res, 409, "Lead Form Already Added", false);
        }

        const data = await LeadForm.create(payload);

        return sendResponse(res, 200, "Lead Form Added Successfully", true, data, true);
    });

    static getLeadForm = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findLeadForm = await LeadForm.findById(id);
        if (!findLeadForm) {
            return sendResponse(res, 422, "Lead Form Not Found", false);
        }

        return sendResponse(res, 200, "Lead Form Found Successfully", true, findLeadForm, true);
    });

    static updateLeadForm = catchAsync(async (req, res) => {
        const { id } = req.params;
        const data = req.body || {};

        const findLeadForm = await LeadForm.findById(id);
        if (!findLeadForm) {
            return sendResponse(res, 422, "Lead Form Not Found", false);
        }

        await LeadForm.findByIdAndUpdate(id, data);

        return sendResponse(res, 200, "Lead Form Updated Successfully", true);
    });

    static updateLeadFormStatus = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findLeadForm = await LeadForm.findById(id);
        if (!findLeadForm) {
            return sendResponse(res, 422, "Lead Form Not Found", false);
        }

        await LeadForm.findByIdAndUpdate(id, { status: !findLeadForm.status });

        return sendResponse(res, 200, "Lead Form Status Updated Successfully", true);
    });

    static deleteLeadForm = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findLeadForm = await LeadForm.findById(id);
        if (!findLeadForm) {
            return sendResponse(res, 422, "Lead Form Not Found", false);
        }

        await LeadForm.delete({ _id: id });

        return sendResponse(res, 200, "Lead Form Deleted Successfully", true);
    });

    static getLeadFormByLeadTitle = catchAsync(async (req, res) => {
        const { id } = req.params;

        const findLeadForm = await LeadForm.findOne({ leadTitle: id });
        if (!findLeadForm) {
            return sendResponse(res, 422, "Lead Form Not Found", false);
        }

        return sendResponse(res, 200, "Lead Form Found Successfully", true, findLeadForm, true);
    });

}

export default LeadFormsController;