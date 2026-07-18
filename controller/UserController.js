import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";

class UserController {

    static allUsers = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}

        const populates = [
            { path: 'designation', select: 'name' },
            { path: 'image' },
        ]
        const data = await paginate(User, { role: 'user' }, page, limit, {}, populates)

        return sendResponse(res, 200, "User Found Successfully", true, data, true);

    })

    static updateUserRole = catchAsync(async (req, res) => {

        const { id, role } = req.params

        const findUser = await User.findById(id)
        if (!findUser) {
            return sendResponse(res, 422, 'User Not Found', false)
        }
        if (findUser.status == 'unactive') {
            return sendResponse(res, 403, 'User Status is Unactive', false)
        }
        await User.findByIdAndUpdate(id, { role })

        return sendResponse(res, 200, 'User Role Update Successfully', true)

    })

    static updateUserDesignation = catchAsync(async (req, res) => {

        const { id, designation } = req.params

        const findUser = await User.findById(id)
        if (!findUser) {
            return sendResponse(res, 422, 'User Not Found', false)
        }
        if (findUser.status == 'unactive') {
            return sendResponse(res, 403, 'User Status is Unactive', false)
        }
        await User.findByIdAndUpdate(id, { designation })

        return sendResponse(res, 200, 'User Designation Update Successfully', true)

    })

    static updateUserStatus = catchAsync(async (req, res) => {

        const { id } = req.params

        const findUser = await User.findById(id)
        if (!findUser) {
            return sendResponse(res, 422, 'User Not Found', false)
        }
        await User.findByIdAndUpdate(id, { status: findUser?.status == 'active' ? 'unactive' : 'active' })

        return sendResponse(res, 200, 'User Status Update Successfully', true)

    })

}

export default UserController