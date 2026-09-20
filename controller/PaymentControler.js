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
import { getConnectedSocket } from "../routes/socketRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const paymentDataUpdate = async (payload, phonepeResponse) => {

    const paymentData = await Payment.findById(payload?.merchantOrderId).select('-phonepeResponse')

    if (paymentData) {
        if (paymentData.payment_status == "PENDING" && payload?.state == 'COMPLETED') {

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

            const currentDate = new Date();
            const currentUnix = Math.floor(currentDate.getTime() / 1000);
            const validity = String(newPackage.validity || '').toLowerCase();
            const expireDateValue = new Date(currentDate);

            if (validity === 'lifetime') {
                expireDateValue.setFullYear(expireDateValue.getFullYear() + 100);
            } else if (validity === 'year') {
                expireDateValue.setFullYear(expireDateValue.getFullYear() + 1);
            } else {
                expireDateValue.setMonth(expireDateValue.getMonth() + 1);
            }

            const expireDate = Math.floor(expireDateValue.getTime() / 1000);

            const newPlatformId = newPackage?.platform?._id?.toString();


            // Find existing package having the same platform
            const existingPackageIndex = customer.package.findIndex((item) => {
                const existingPlatformId =
                    item?.package_id?.platform?._id?.toString();

                return existingPlatformId === newPlatformId;
            });


            if (existingPackageIndex !== -1) {
                const existingPackage = customer.package[existingPackageIndex];

                // Remaining time of existing package
                const remainingTime =
                    Number(existingPackage.package_expire) - currentUnix;

                const newPackageDuration = expireDate - currentUnix;

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


        const redirectUrl =  `${process.env.FRONTEND_URL}/payment/status/${merchantOrderId}`;

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
        const invoiceData = {
            vendor: {
                name: 'R R SHOPER',
                subtext: 'E-COMMERCE SERVICES',
                address: '3rd Floor, Shop No. 334, Times Trade Center, Surat, Gujarat, 395010, India',
                email: 'support@rrshoper.com',
                phone: '+91 98765 43210',
                gstin: '24AAAAA0000A1Z5',
                pan: 'AAAAA0000A',
                city: 'Surat',
                state: 'Gujarat',
                signatoryName: 'PANKAJKUMAR R AGRAVAT',
                signatoryTitle: 'Partner / Authorized Signatory'
            },
            customer: {
                name: 'APEX E-COMMERCE SOLUTIONS',
                address: '102, Business Hub, Ring Road, Surat, Gujarat, 395002, India',
                contactPerson: 'Rajesh Sharma',
                phone: '+91 91234 56789',
                gstin: '24ABCDF1234H1ZP',
                stateCode: '24 (Gujarat)'
            },
            invoice: {
                number: 'RRS/2026-27/0891',
                date: '06 Aug 2026',
                placeOfSupply: '24 - Gujarat',
                paymentTerms: 'Immediate / Prepaid'
            },
            items: [
                {
                    name: 'Starter Package Subscription',
                    description: 'Comprehensive seller onboarding and account management package.',
                    hsnSac: '998314',
                    rate: 1999.00,
                    qty: 1,
                    features: [
                        'New Account Created',
                        'Keyword Listing',
                        'Brand Reg Assistance',
                        '50 SKU Listing & Training',
                        'Customer Support'
                    ]
                }
            ],
            bank: {
                name: 'HDFC Bank Ltd',
                accountName: 'R R SHOPER',
                accountNo: '50200012345678',
                ifsc: 'HDFC0001234',
                branch: 'Ring Road, Surat'
            },
            totals: {
                taxableAmount: 1999.00,
                cgstRate: 9,
                cgstAmount: 179.91,
                sgstRate: 9,
                sgstAmount: 179.91,
                igstRate: 0,
                igstAmount: 0.00,
                grandTotal: 2358.82,
                amountInWords: 'Two Thousand Three Hundred Fifty-Eight Rupees and Eighty-Two Paise Only.'
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
