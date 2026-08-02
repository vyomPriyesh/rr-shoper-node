import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const TicketsTitleSchema = new mongoose.Schema(
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

TicketsTitleSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const TicketsTitle = mongoose.model("TicketsTitle", TicketsTitleSchema);

export default TicketsTitle;
