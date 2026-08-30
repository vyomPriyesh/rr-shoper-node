import DownGradePackage from "../models/DownGradePackage.js"
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js"

class DownGradePackageController {

    static addRequest = catchAsync(async (req, res) => {

        const { _id: customerId } = req.user || {}
        const data = req.body || {}

        const requestData = await DownGradePackage.create({ ...data, customer_id: customerId })

        return sendResponse(res, 200, 'Downgrade request submitted successfully', true, requestData)

    })

}

export default DownGradePackageController