import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const LeadFormSchema = new mongoose.Schema(
    {
        leadTitle: {
            type: Schema.Types.ObjectId,
            ref: "LeadTitle",
            default: null,
        },
        status: {
            type: Boolean,
            default: false,
        },
        fields: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

LeadFormSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const LeadForm = mongoose.model("LeadForm", LeadFormSchema);

export default LeadForm;
