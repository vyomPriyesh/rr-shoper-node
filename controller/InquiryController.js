import Inquiry from "../models/Inquiry.js"
import { catchAsync } from "../utils/catchAsync.js"
import emailotpsending from "../utils/emailotpsending.js";
import { sendResponse } from "../utils/response.js"

class InquiryController {

    static raiseIInquiry = catchAsync(async (req, res) => {

        const data = req.body || {};
        const { _id: customerId } = req.user || {};

        const inquiryData = await Inquiry.create({ ...data, customer: customerId });
        emailotpsending.sendMail({
            from: `"RR Shoper" <${process.env.EMAIL_USER}>`,
            to: data?.email,
            subject: "Thank You for Your Inquiry | RR Shoper",
            html: `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: auto;
            padding: 30px;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            color: #333;
        ">
            <h2 style="
                margin-top: 0;
                color: #B06A8D;
            ">
                Thank You for Contacting Us!
            </h2>

            <p>Hi ${data?.name || 'Customer'},</p>

            <p>
                Thank you for reaching out to RR Shoper. We have successfully
                received your inquiry.
            </p>

            <p>
                Our team will review your request and get back to you as soon
                as possible.
            </p>

            <div style="
                margin: 25px 0;
                padding: 15px;
                background-color: #fdf6f9;
                border-radius: 8px;
                border-left: 4px solid #B06A8D;
            ">
                <strong>Your Message:</strong>
                <p style="margin-bottom: 0;">
                    ${data?.message || 'Your inquiry has been received successfully.'}
                </p>
            </div>

            <p>
                We appreciate your interest in RR Shoper.
            </p>

            <p style="margin-bottom: 0;">
                Best Regards,<br />
                <strong>RR Shoper Team</strong>
            </p>
        </div>
    `
        }).catch(err => console.log(err));

        return sendResponse(res, 200, `Thank You for Your Inquiry! We'll Get Back to You Soon.`, true, inquiryData, true);

    })
}

export default InquiryController