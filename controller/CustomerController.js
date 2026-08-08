import Customer from "../models/Customer.js";
import User from "../models/Customer.js";
import { catchAsync } from "../utils/catchAsync.js";
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";
import bcryptjs from "bcryptjs";

export const AddCustomer = async (data) => {
    const password = data?.name?.toLowerCase() + '@' + data.mobile
    const hashedPassword = await bcryptjs.hash(password, 10);
    const findCustomer = await Customer.findOne({ email: data?.email })
    if (findCustomer) {
        return {
            success: false,
            message: 'Email Already Exist'
        }
    }
    const newUser = await Customer.create({ ...data, password: hashedPassword })
    delete newCustomer.password
    delete newCustomer.otp
    delete newCustomer.otp_status
    delete newCustomer.login_devices
    return {
        success: true,
        newUser,
    };
}
class CustomerController {

    static allCustomers = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}

        const populates = [
            { path: 'designation', select: 'name' },
            { path: 'image' },
        ]
        const data = await paginate(Customer, {}, page, limit, {}, populates)

        return sendResponse(res, 200, "Customer Found Successfully", true, data, true);

    })

    static addCustomer = catchAsync(async (req, res) => {

        const data = req.body || {}
        // const password = data?.name?.toLowerCase() + '@' + data.mobile
        // const hashedPassword = await bcryptjs.hash(password, 10);
        // const findCustomer = await Customer.findOne({ email: data?.email })
        // if (findCustomer) {
        //     return sendResponse(res, 422, 'Email Already Exist', false)
        // }
        // const newCustomer = await Customer.create({ ...data, password: hashedPassword })

        const result = await AddCustomer(data);

        if (!result.success) {
            return sendResponse(res, 422, result.message, false);
        }

        return sendResponse(res, 200, `Customer Added Successfully`, true, result, true)

    })

    static updateCustomer = catchAsync(async (req, res) => {

        const { id } = req.params
        const data = req.body || {}
        const findCustomer = await Customer.findById(id)
        if (!findCustomer) {
            return sendResponse(res, 422, `Customer Not Found`, false)
        }
        await Customer.findByIdAndUpdate(id, { ...data })

        return sendResponse(res, 200, `Customer Update Successfully`, true)

    })

    static deleteCustomer = catchAsync(async (req, res) => {

        const { id } = req.params
        const findCustomer = await Customer.findById(id)
        if (!findCustomer) {
            return sendResponse(res, 422, `Customer Not Found`, false)
        }
        await Customer.delete({ _id: id })

        return sendResponse(res, 200, `Customer Delete Successfully`, true)

    })

    static updateCustomerStatus = catchAsync(async (req, res) => {

        const { id } = req.params

        const findCustomer = await Customer.findById(id)
        if (!findCustomer) {
            return sendResponse(res, 422, 'Customer Not Found', false)
        }
        await Customer.findByIdAndUpdate(id, { status: findCustomer?.status == 'active' ? 'unactive' : 'active' })

        return sendResponse(res, 200, 'Customer Status Update Successfully', true)

    })

}

export default CustomerController