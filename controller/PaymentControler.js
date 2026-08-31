import { MetaInfo, PrefillUserLoginDetails, StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js";
import { phonepeClient } from "../config/phonepe.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import Packages from "../models/Packages.js";
import DownGradePackage from "../models/DownGradePackage.js";


const paymentDataUpdate = async (payload, phonepeResponse) => {

    const paymentData = await Payment.findById(payload?.merchantOrderId).select('-phonepeResponse')

    if (paymentData) {
        if (paymentData.payment_status !== "COMPLETED" && payload?.state == 'COMPLETED') {

            // const expireDate = Math.floor(
            //     (Date.now() + 2 * 60 * 1000) / 1000
            // );
            const expireDate = Math.floor(
                new Date(
                    new Date().setMonth(new Date().getMonth() + 1)
                ).getTime() / 1000
            );

            const customer = await Customer.findById(paymentData?.customer_id)
                .populate([
                    {
                        path: "package.package_id",
                        populate: "platform",
                    },
                ]);

            if (!customer) {
                return sendResponse(res, 500, "Customer Not found", false);
            }

            // Get the newly purchased package
            const newPackage = await Packages.findById(paymentData?.package_id)
                .populate("platform");

            if (!newPackage) {
                return sendResponse(res, 500, "Package Not found", false);
            }

            const newPlatformId = newPackage?.platform?._id?.toString();


            // Find existing package having the same platform
            const existingPackageIndex = customer.package.findIndex((item) => {
                const existingPlatformId =
                    item?.package_id?.platform?._id?.toString();

                return existingPlatformId === newPlatformId;
            });


            if (existingPackageIndex !== -1) {
                const existingPackage = customer.package[existingPackageIndex];

                const currentUnix = Math.floor(Date.now() / 1000);

                // Remaining time of existing package
                const remainingTime =
                    Number(existingPackage.package_expire) - currentUnix;

                // New package duration (your testing expireDate = now + 10 min)
                const newPackageDuration =
                    expireDate - currentUnix;

                // Remaining old time + new package duration
                const newExpireDate =
                    currentUnix +
                    Math.max(remainingTime, 0) +
                    newPackageDuration;

                existingPackage.package_id = paymentData.package_id;
                existingPackage.package_expire = newExpireDate;
                existingPackage.package_expire_status = false;
            } else {

                // Different platform → create a new service

                customer.package.push({
                    package_id: paymentData?.package_id,
                    package_expire: expireDate,
                    package_expire_status: false,
                });
            }

            await customer.save();

            await Payment.findByIdAndUpdate(payload?.merchantOrderId, { payment_status: payload?.state, phonepeResponse })
            return Payment.findById(payload?.merchantOrderId).select('-phonepeResponse')

        } else {
            return paymentData
        }

    }
}
class PaymentControler {

    static initiatePhonePePayment = catchAsync(async (req, res) => {

        const { amount, phoneNumber, package_id, gst_number, all_policies_checked } = req.body || 0;
        const { _id: customerId } = req.user || {}

        if (!amount || amount <= 0) {
            return sendResponse(res, 500, 'Invalid amount', false)
        }

        const customer = await Customer.findById(customerId)

        if (!customer) {
            return sendResponse(res, 500, 'Customer Not found', false)
        }

        const amountInPaise = Math.round(Number(amount) * 100);

        const paymentInitiate = await Payment.create({ customer_id: customerId, package_id, amount, gst_number, all_policies_checked })
        await Customer.findByIdAndUpdate(customerId, { gst_number })

        const merchantOrderId = paymentInitiate?._id;

        const prefillUserLoginDetails =
            PrefillUserLoginDetails.builder()
                .phoneNumber(phoneNumber)
                .build();


        const metaInfo = MetaInfo.builder()
            .udf1(`Customer ID : ${customerId}`)
            .udf2(`Order ID : ${merchantOrderId}`)
            .udf3(`Customer GST : ${gst_number}`)
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
            .message(`Payment for RR Shoper - ${merchantOrderId}`)
            .build();

        const response = await phonepeClient.pay(request);

        return sendResponse(res, 200, '', true, { merchantOrderId, redirectUrl: response.redirectUrl })
    })

    static paymentStatus = catchAsync(async (req, res) => {

        const { id } = req.params;

        const paymentStatusData = await phonepeClient.getOrderStatus(id);
        const paymentData = await paymentDataUpdate({ merchantOrderId: id, state: paymentStatusData?.state }, paymentStatusData);

        return sendResponse(res, 200, "Payment status fetched", true, paymentData);

    })

    static paymentWebhook = catchAsync(async (req, res) => {

        const { payload } = req.body || {}

        const paymentData = await paymentDataUpdate(payload, req.body);

        return sendResponse(res, 200, "Payment status fetched", true, paymentData);
    })

}

export default PaymentControler