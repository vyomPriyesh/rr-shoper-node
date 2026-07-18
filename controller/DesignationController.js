import Designation from "../models/Designation.js";
import { catchAsync } from "../utils/catchAsync.js"
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";

class DesignationController {

    static allDesignation = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}

        const data = await paginate(Designation, {}, page, limit)

        return sendResponse(res, 200, "Designation Found", true, data, true);

    })

    static addDesignation = catchAsync(async (req, res) => {

        const payload = req.body || {}

        const findDesignation = await Designation.findOne({ name: payload.name })

        if (findDesignation) {
            return sendResponse(res, 409, 'Designation Already Added', false)
        }

        const data = await Designation.create(payload)

        return sendResponse(res, 200, "Designation Added Successfully", true, data, true);

    })

    static updateDesignation = catchAsync(async (req, res) => {

        const { id } = req.params
        const data = req.body || {}


        const findDesignation = await Designation.findById(id)
        if (!findDesignation) {
            return sendResponse(res, 422, 'Designation Not Found', false)
        }
        await Designation.findByIdAndUpdate(id, data)

        return sendResponse(res, 200, 'Designation Update Successfully', true)

    })

    static updateDesignationStatus = catchAsync(async (req, res) => {

        const { id } = req.params

        const findDesignation = await Designation.findById(id)
        if (!findDesignation) {
            return sendResponse(res, 422, 'Designation Not Found', false)
        }
        await Designation.findByIdAndUpdate(id, { status: !findDesignation.status })

        return sendResponse(res, 200, 'Designation Status Update Successfully', true)

    })

    static getDesignation = catchAsync(async (req, res) => {

        const { id } = req.params

        const findDesignation = await Designation.findById(id)
        if (!findDesignation) {
            return sendResponse(res, 422, 'Designation Not Found', false)
        }   

        return sendResponse(res, 200, 'Designation Found Successfully', true, findDesignation, true)

    })

    static deleteDesignation = catchAsync(async (req, res) => {

        const { id } = req.params

        const findDesignation = await Designation.findById(id)
        if (!findDesignation) {
            return sendResponse(res, 422, 'Designation Not Found', false)
        }
        await Designation.delete({ _id: id })

        return sendResponse(res, 200, 'Designation Delete Successfully', true)

    })


}

export default DesignationController