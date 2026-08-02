import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const LeadSchema = new mongoose.Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
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
