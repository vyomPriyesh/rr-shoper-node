import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";
import bcryptjs from "bcryptjs";

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

    static addUserCustomer = catchAsync(async (req, res) => {

        const data = req.body || {}
        const password = data?.name?.toLowerCase() + '@' + data.mobile
        const hashedPassword = await bcryptjs.hash(password, 10);
        const findUser = await User.findOne({ email: data?.email })
        if (findUser) {
            return sendResponse(res, 422, 'Email Already Exist', false)
        }
        const newUser = await User.create({ ...data, password: hashedPassword })
        return sendResponse(res, 200, `${newUser.role == 'user' ? 'User' : 'Customer'} Added Successfully`, true, newUser, true)

    })

    static updateUserCustomer = catchAsync(async (req, res) => {

        const { id } = req.params
        const data = req.body || {}
        const findUser = await User.findById(id)
        if (!findUser) {
            return sendResponse(res, 422, `${findUser.role == 'user' ? 'User' : 'Customer'} Not Found`, false)
        }
        await User.findByIdAndUpdate(id, { ...data })

        return sendResponse(res, 200, `${findUser.role == 'user' ? 'User' : 'Customer'} Update Successfully`, true)

    })

    static deleteUserCustomer = catchAsync(async (req, res) => {

        const { id } = req.params
        const findUser = await User.findById(id)
        if (!findUser) {
            return sendResponse(res, 422, `${findUser.role == 'user' ? 'User' : 'Customer'} Not Found`, false)
        }
        await User.delete({ _id: id })

        return sendResponse(res, 200, `${findUser.role == 'user' ? 'User' : 'Customer'} Delete Successfully`, true)

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