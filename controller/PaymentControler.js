import { MetaInfo, PrefillUserLoginDetails, StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js";
import { phonepeClient } from "../config/phonepe.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import Packages from "../models/Packages.js";
import paginate from "../utils/pagination.js";
import mongoose from "mongoose";


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

        } else if (paymentData.payment_status !== "COMPLETED" && payload?.state == 'FAILED') {

            await Payment.findByIdAndUpdate(payload?.merchantOrderId, { payment_status: payload?.state, phonepeResponse })
            return Payment.findById(payload?.merchantOrderId).select('-phonepeResponse')

        } else {
            return paymentData
        }

    }
}
class PaymentControler {

    static initiatePhonePePayment = catchAsync(async (req, res) => {

        const { phoneNumber, package_id, gst_number, all_policies_checked } = req.body || 0;
        const { _id: customerId } = req.user || {}

        const packageData = await Packages.findById(package_id)

        const customer = await Customer.findById(customerId)

        if (!customer) {
            return sendResponse(res, 500, 'Customer Not found', false)
        }

        const amountInPaise = Math.round(Number(packageData?.price) * 100);

        const paymentInitiate = await Payment.create({ customer_id: customerId, package_id, amount: packageData?.price, gst_number, all_policies_checked })
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

    static customerOrders = catchAsync(async (req, res) => {

        const { _id: customerId } = req.user || {};
        const { page, limit, payment_status } = req.body || {};

        // const queryAggregate = (status) => {
        //     return {
        //         $match: {
        //             _id: new mongoose.Types.ObjectId(customerId),
        //         },
        //     },
        //     {
        //         $project: {
        //             package: {
        //                 $filter: {
        //                     input: "$package",
        //                     as: "item",
        //                     cond: {
        //                         $eq: ["$$item.package_expire_status", status],
        //                     },
        //                 },
        //             },
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             package_id: {
        //                 $map: {
        //                     input: {
        //                         $filter: {
        //                             input: "$package",
        //                             as: "item",
        //                             cond: {
        //                                 $eq: [
        //                                     "$$item.package_expire_status",
        //                                     status,
        //                                 ],
        //                             },
        //                         },
        //                     },
        //                     as: "item",
        //                     in: "$$item.package_id",
        //                 },
        //             },
        //         },
        //     }
        // }

        let query = { customer_id: customerId }

        // const [activePackages] = await Customer.aggregate([queryAggregate(false)]);
        // const [expiredPackages] = await Customer.aggregate([queryAggregate(true)]);

        // const allCounts = {
        //     active: activePackages?.package_id?.length || 0,
        //     expired: expiredPackages?.package_id?.length || 0,
        // }

        if (payment_status !== 'all') {

            query = { ...query, payment_status: payment_status }

        }

        const populates = [
            { path: 'package_id', select:'platform, name price', populate: { path: 'platform', select: 'name' } },
        ]

        const data = await paginate(Payment, query, page, limit, "-phonepeResponse", populates)

        const [statusCounts] = await Payment.aggregate([
            {
                $match: {
                    customer_id: customerId,
                },
            },
            {
                $group: {
                    _id: "$payment_status",
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    statuses: {
                        $push: {
                            k: {
                                $toLower: "$_id",
                            },
                            v: "$count",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,

                    statusCounts: {
                        $mergeObjects: [
                            {
                                completed: 0,
                                // pending: 0,
                                failed: 0,
                            },
                            {
                                $arrayToObject: "$statuses",
                            },
                        ],
                    },
                },
            },
        ]);

        return sendResponse(res, 200, "Customer orders fetched", true, { ...data, ...statusCounts });
    })

}

export default PaymentControler