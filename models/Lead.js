import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const LeadSchema = new mongoose.Schema(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        created_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        assign_user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            default: 'not_started'
        },
        values: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

LeadSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;
