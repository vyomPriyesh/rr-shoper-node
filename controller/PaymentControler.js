import { MetaInfo, PrefillUserLoginDetails, StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js";
import { phonepeClient } from "../config/phonepe.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

const expireDate = Math.floor(
    (Date.now() + 3 * 60 * 1000) / 1000
);
// const expireDate = Math.floor(
//     new Date(
//         new Date().setMonth(new Date().getMonth() + 1)
//     ).getTime() / 1000
// );

const paymentDataUpdate = async (payload, phonepeResponse) => {

    const paymentData = await Payment.findById(payload?.merchantOrderId).select('-phonepeResponse')

    if (paymentData) {
        if (paymentData.payment_status !== "COMPLETED" && payload?.state == 'COMPLETED') {

            const customer = await Customer.findById(paymentData?.customer_id)

            if (!customer) {
                return sendResponse(res, 500, 'Customer Not found', false)
            }
            const expiredPackageIndex = customer.package.findIndex(
                (item) => item.package_expire_status === true
            );
            console.log(customer.package)
            console.log(expiredPackageIndex)

            if (expiredPackageIndex !== -1) {

                // Existing expired package → renew it
                customer.package[expiredPackageIndex].package_id =
                    paymentData?.package_id;

                customer.package[expiredPackageIndex].package_expire =
                    expireDate;

                customer.package[expiredPackageIndex].package_expire_status =
                    false;

            } else {

                // No expired package → create new package
                customer.package.push({
                    package_id: paymentData?.package_id,
                    package_expire: expireDate,
                    package_expire_status: false,
                });
            }

            await customer.save();

            return await Payment.findByIdAndUpdate(payload?.merchantOrderId, { payment_status: payload?.state, phonepeResponse }, { new: true })

        }
        return paymentData
    }
}
class PaymentControler {

    static initiatePhonePePayment = catchAsync(async (req, res) => {

        const { amount, phoneNumber, package_id } = req.body || 0;
        const { _id: customerId } = req.user || {}

        if (!amount || amount <= 0) {
            return sendResponse(res, 500, 'Invalid amount', false)
        }

        const customer = await Customer.findById(customerId)

        if (!customer) {
            return sendResponse(res, 500, 'Customer Not found', false)
        }

        const amountInPaise = Math.round(Number(amount) * 100);

        const paymentInitiate = await Payment.create({ customer_id: customerId, package_id, amount })

        const merchantOrderId = paymentInitiate?._id;

        const prefillUserLoginDetails =
            PrefillUserLoginDetails.builder()
                .phoneNumber(phoneNumber)
                .build();


        const metaInfo = MetaInfo.builder()
            .udf1(String(customerId))
            .udf2(merchantOrderId)
            .build();


        const redirectUrl =
            `${process.env.FRONTEND_URL}/payment/status/${merchantOrderId}`;

        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amountInPaise)
            .prefillUserLoginDetails(prefillUserLoginDetails)
            .metaInfo(metaInfo)
            .redirectUrl(redirectUrl)
            .expireAfter(3600)
            .message("RR Shoper")
            .build();

        const response = await phonepeClient.pay(request);

        return sendResponse(res, 200, '', true, { merchantOrderId, redirectUrl: response.redirectUrl })
    })

    static paymentStatus = catchAsync(async (req, res) => {

        const { id } = req.params;

        const paymentStatusData = await phonepeClient.getOrderStatus(id);
        const paymentData = await paymentDataUpdate({ merchantOrderId: id, state: paymentStatusData?.state }, null);

        return sendResponse(res, 200, "Payment status fetched", true, paymentData);

    })

    static paymentWebhook = catchAsync(async (req, res) => {

        const { payload } = req.body || {}

        const paymentData = await paymentDataUpdate(payload, req.body);

        return sendResponse(res, 200, "Payment status fetched", true, paymentData);
    })

}

export default PaymentControler