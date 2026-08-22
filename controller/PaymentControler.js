import { MetaInfo, PrefillUserLoginDetails, StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js";
import { phonepeClient } from "../config/phonepe.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

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

        const paymentStatus = await phonepeClient.getOrderStatus(id);
        const paymentData = await Payment.findByIdAndUpdate(id, { payment_status: paymentStatus?.state }).select('-phonepeResponse')
        if (paymentStatus?.state === 'COMPLETED') {
            const createdAt = new Date(paymentData?.createdAt);

            const expireDate = new Date(createdAt);
            expireDate.setMonth(expireDate.getMonth() + 1);

            await Customer.findByIdAndUpdate(paymentData?.customer_id, { package_id: paymentData?.package_id, package_expire: expireDate })
        }

        return sendResponse(res, 200, "Payment status fetched", true, paymentData);

    })

    static paymentWebhook = catchAsync(async (req, res) => {

        const { payload } = req.body || {}

        const paymentData = await Payment.findByIdAndUpdate(payload?.merchantOrderId, { payment_status: payload?.state, phonepeResponse: req.body }).select('-phonepeResponse')
        if (payload?.state === 'COMPLETED') {
            await Customer.findByIdAndUpdate(paymentData?.customer_id, { package_id: paymentData?.package_id })
        }

        return sendResponse(res, 200, "Payment status fetched", true, paymentData);
    })

}

export default PaymentControler