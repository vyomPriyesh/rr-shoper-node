import Subscription from "../models/Subscription.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

class SubscriptionController {

    static subscriptionDetails = catchAsync(async (req, res) => {
        const { id } = req.params

        const findSubscription = await Subscription.findById(id).populate("payment_id", "amount").populate([{ path: "package_id", populate: [{ path: "platform", populate: [{ path: "image" }] }] }])
        return sendResponse(res, 200, 'Subscription Found Successfully', true, findSubscription)
    })

}

export default SubscriptionController;