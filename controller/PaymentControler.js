import { MetaInfo, PrefillUserLoginDetails, StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js";
import { phonepeClient } from "../config/phonepe.js";
import Payment from "../models/Payment.js";

class PaymentControler {

    static initiatePhonePePayment = catchAsync(async (req, res) => {

        const { amount, phoneNumber, package_id } = req.body || 0;
        const { _id: customerId } = req.user || {}

        if (!amount || amount <= 0) {
            return sendResponse(res, 500, 'Invalid amount', false)
        }

        const amountInPaise = Math.round(Number(amount) * 100);

        const paymentInitiate = await Payment.create({ customer_id: customerId, package_id })

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
            .message("RR Shoper payment")
            .build();

        const response = await phonepeClient.pay(request);

        return sendResponse(res, 200, '', true, { merchantOrderId, redirectUrl: response.redirectUrl })
    })

    static paymentStatus = catchAsync(async (req, res) => {

        const { id } = req.params;

        const paymentStatus = await phonepeClient.getOrderStatus(id);

        return sendResponse(res, 200, "Payment status fetched", true,
            {
                id,
                paymentStatus:
                    paymentStatus
            }
        );

    })

    static paymentWebhook = catchAsync(async (req, res) => {

        await Payment.create({ phonepeResponse: req.body })
        return sendResponse(res, 200, "Payment status fetched", true, req.body);
    })

}

export default PaymentControler