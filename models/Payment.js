import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const PaymentSchema = new mongoose.Schema(
    {
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        package_id: {
            type: Schema.Types.ObjectId,
            ref: "Packages",
            default: null,
        },
        // request_package_id: {
        //     type: Schema.Types.ObjectId,
        //     ref: "Packages",
        //     default: null,
        // },
        all_policies_checked: {
            type: Boolean,
            default: null
        },
        
        payment_status: {
            type: String,
            default: 'PENDING'
        },
        payableCurrency: {
            type: String,
            default: 'INR'
        },
        gst_number: {
            type: String,
            default: null
        },
        amount: {
            type: Number,
            default: 0
        },
        phonepeResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
    },
    {
        timestamps: true,
    }
);

PaymentSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;
