import PackageUpdate from "../models/PackageUpdate.js";
import Subscription from "../models/Subscription.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

class SubscriptionController {

    static subscriptionDetails = catchAsync(async (req, res) => {
        const { id } = req.params

        const packageUpdateData = await PackageUpdate.findOne({ subscription_id: id }).populate("subscription_id", "")
        const findSubscription = await Subscription.findById(id).populate("payment_id", "amount").populate([{ path: "package_id", populate: [{ path: "platform", populate: [{ path: "image" }] }] }])

        const platform = {
            name: findSubscription?.package_id?.platform?.name,
            image: findSubscription?.package_id?.platform?.image,
        }

        const response = {
            package_id: { ...packageUpdateData?.package, platform },
            payment_id: findSubscription?.payment_id,
            serviceUpdates: packageUpdateData?.serviceUpdates
        }

        return sendResponse(res, 200, 'Subscription Found Successfully', true, response)
    })

    static servicesUpdates = catchAsync(async (req, res) => {

        const { id } = req.params
        const data = req.body

        await PackageUpdate.findOneAndUpdate({ subscription_id: id }, { serviceUpdates: data })

        return sendResponse(res, 200, 'Services Updated Successfully', true)

    })
}

export default SubscriptionController;