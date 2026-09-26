import { MetaInfo, PrefillUserLoginDetails, StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js";
import { phonepeClient } from "../config/phonepe.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import Packages from "../models/Packages.js";
import paginate from "../utils/pagination.js";
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'html-pdf';
import { createSubscription, getSamePlatformActiveSubscriptions, upgradeSubscription } from "../utils/subscription.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";
import { displayDate } from "../utils/dateFormat.js";
import { packageOrders } from "./DropDownController.js";
import Subscription from "../models/Subscription.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const paymentDataUpdate = async (payload, phonepeResponse) => {

    const paymentData = await Payment.findById(payload?.merchantOrderId).select('-phonepeResponse')

    if (paymentData) {
        if (paymentData.payment_status == "PENDING" && payload?.state == 'COMPLETED') {

            const customer = await Customer.findById(paymentData?.customer_id)
            // .populate([
            //     {
            //         path: "package.package_id",
            //         populate: "platform",
            //     },
            // ]);

            if (!customer) {
                return sendResponse(res, 500, "Customer Not found", false);
            }

            // Get the newly purchased package
            const newPackage = await Packages.findById(paymentData?.package_id)
                .populate("platform");

            if (!newPackage) {
                return sendResponse(res, 500, "Package Not found", false);
            }

            const activeSubscriptions = await getSamePlatformActiveSubscriptions(paymentData?.customer_id, newPackage.platform._id)

            if (activeSubscriptions) {

                await upgradeSubscription({
                    customerId: paymentData.customer_id,
                    platform: newPackage.platform._id,
                    packageData: newPackage,
                    paymentId: paymentData._id,
                    billingPeriod: paymentData.billing_period,
                })

            } else {
                const subscription = await createSubscription({
                    customerId: paymentData.customer_id,
                    packageData: newPackage,
                    paymentId: paymentData._id,
                    billingPeriod: paymentData.billing_period,
                });
            }





            // Keep the old customer.package response field synchronized for existing clients.
            // customer.package.push({
            //     package_id: paymentData.package_id,
            //     package_expire: subscription.expires_at
            //         ? Math.floor(subscription.expires_at.getTime() / 1000)
            //         : null,
            //     package_expire_status: false,
            // });

            // await customer.save();

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

        const { phoneNumber, package_id, billing_period = 'month', gst_number, all_policies_checked } = req.body || 0;
        const { _id: customerId } = req.user || {}

        const packageData = await Packages.findById(package_id)

        if (!packageData) {
            return sendResponse(res, 422, 'Package not found', false)
        }

        const priceField = `${billing_period}_price`;
        const selectedPrice = packageData[priceField];

        if (!['month', 'year', 'onetime'].includes(billing_period) || selectedPrice == null) {
            return sendResponse(res, 422, 'Selected billing period is not available for this package', false)
        }

        const customer = await Customer.findById(customerId)

        if (!customer) {
            return sendResponse(res, 500, 'Customer Not found', false)
        }

        const amountInPaise = Math.round(Number(selectedPrice) * 100);
        const invoice_number = await generateInvoiceNumber()
        const paymentInitiate = await Payment.create({ customer_id: customerId, package_id, billing_period, amount: selectedPrice, gst_number, all_policies_checked, invoice_number })
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


        const redirectUrl = `${process.env.FRONTEND_URL}/payment/status/${merchantOrderId}`;

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

        return sendResponse(res, 200, '', true, { redirectUrl: response.redirectUrl })
    })

    static paymentStatus = catchAsync(async (req, res) => {

        const { id } = req.params;

        const paymentStatusData = await phonepeClient.getOrderStatus(id);
        const paymentData = await paymentDataUpdate({ merchantOrderId: id, state: paymentStatusData?.state }, paymentStatusData)

        return sendResponse(res, 200, "Payment status fetched", true, paymentData);

    })

    static paymentWebhook = catchAsync(async (req, res) => {

        const { payload } = req.body || {}

        const paymentData = await paymentDataUpdate(payload, req.body);
        // const socket = getConnectedSocket(paymentData?.customer_id);

        // if (socket) {
        //     console.log('object paymentStatus')
        //     socket.emit("paymentStatus", paymentData);
        // }

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

        let query = { customer_id: customerId, payment_status: { $ne: 'PENDING' } }

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
            { path: 'package_id', select: 'platform, name price', populate: { path: 'platform', select: 'name' } },
        ]

        const data = await paginate(Payment, query, page, limit, "-phonepeResponse", populates)


        return sendResponse(res, 200, "Customer orders fetched", true, data);
    })

    static customerOrderCounts = catchAsync(async (req, res) => {
        const { _id: customerId } = req.user || {};

        const [statusCounts] = await Payment.aggregate([
            {
                $match: {
                    customer_id: customerId,

                    payment_status: {
                        $in: ["COMPLETED", "FAILED"],
                    },
                },
            },
            {
                $group: {
                    _id: null,

                    completed: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment_status", "COMPLETED"] },
                                1,
                                0,
                            ],
                        },
                    },

                    failed: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment_status", "FAILED"] },
                                1,
                                0,
                            ],
                        },
                    },

                    total: {
                        $sum: 1,
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    completed: 1,
                    failed: 1,
                    total: 1,
                },
            },
        ]);

        return sendResponse(res, 200, "Customer order counts fetched", true, statusCounts);
    });

    static paymentInvoice = catchAsync(async (req, res) => {

        const { _id: customerId } = req.user || {};
        const { invoice } = req.params || {}
        const data = await Customer.findById(customerId)
        const paymentData = await Payment.findById(invoice)
        const subscriptionData = await Subscription.findOne({ payment_id: paymentData?._id })
        const packageData = await Packages.findById(paymentData.package_id).populate("platform")

        const totalPaise = Math.round(paymentData.amount * 100);
        const taxablePaise = Math.round(totalPaise / 1.18);
        const totalGstPaise = totalPaise - taxablePaise;
        const cgstPaise = Math.round(totalGstPaise / 2);
        const sgstPaise = totalGstPaise - cgstPaise;

        const invoiceData = {
            vendor: {
                name: 'RR SHOPER',
                subtext: 'E-COMMERCE SERVICES',
                address: '3rd Floor, Shop No. 334, Times Trade Center, Surat, Gujarat, 395010, India',
                email: 'sellersupport@rrshoper.in',
                phone: '+91 9499839239',
                gstin: ' 24ABIFR7655K1ZN',
            },
            customer: {
                name: data.name,
                address: '102, Business Hub, Ring Road, Surat, Gujarat, 395002, India',
                phone: data.mobile,
                gstin: data.gst_number,
            },
            invoice: {
                number: paymentData.invoice_number,
                date: displayDate(paymentData.createdAt),
            },
            items: [
                {
                    name: packageData?.platform?.name + ' ' + packageOrders.find(list => list.value == packageData.name)?.label + ' Package Subscription',
                    rate: paymentData.amount,
                    startDate: displayDate(subscriptionData.starts_at),
                    expiryDate: displayDate(subscriptionData.expires_at),
                    features: packageData.services
                }
            ],
            totals: {
                taxableAmount: taxablePaise / 100,
                cgstRate: 9,
                cgstAmount: cgstPaise / 100,
                sgstRate: 9,
                sgstAmount: sgstPaise / 100,
                igstRate: 0,
                igstAmount: 0,
                grandTotal: totalPaise / 100,
            }
        };

        // 1. Render EJS template to HTML string
        const templatePath = path.join(__dirname, '../views/invoice.ejs');
        const html = await ejs.renderFile(templatePath, invoiceData);

        // 2. Configure html-pdf options
        const options = {
            format: 'A4',
            orientation: 'portrait',
            border: {
                top: '8mm',
                right: '10mm',
                bottom: '8mm',
                left: '10mm'
            },
            footer: {
                height: '38mm' // Increased from 28mm to prevent clipping
            },
            type: 'pdf'
        };
        // 3. Create PDF buffer using Promisify to keep async/await flow intact
        const pdfBuffer = await new Promise((resolve, reject) => {
            pdf.create(html, options).toBuffer((err, buffer) => {
                if (err) return reject(err);
                resolve(buffer);
            });
        });

        // 4. Send PDF Buffer back to the client
        // BEFORE (opens in browser preview):
        // 'Content-Disposition': 'inline; filename=tax-invoice.pdf',

        // AFTER (triggers direct download):
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="tax-invoice.pdf"',
            'Content-Length': pdfBuffer.length
        });

        return res.send(pdfBuffer);
    });

}

export default PaymentControler
