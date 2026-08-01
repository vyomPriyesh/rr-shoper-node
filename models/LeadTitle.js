import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const LeadTitleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: null,
        },
        status: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

LeadTitleSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const LeadTitle = mongoose.model("LeadTitle", LeadTitleSchema);

export default LeadTitle;
