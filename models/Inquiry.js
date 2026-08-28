import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const InquirySchema = new mongoose.Schema(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        name: {
            type: String,
            default: null,
        },
        email: {
            type: String,
            default: null,
        },
        mobile: {
            type: Number,
            default: null,
        },
        message: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

InquirySchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Inquiry = mongoose.model("Inquiry", InquirySchema);

export default Inquiry;