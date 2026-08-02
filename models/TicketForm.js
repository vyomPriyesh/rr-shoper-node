import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const TicketFormSchema = new mongoose.Schema(
    {
        ticketTitle: {
            type: Schema.Types.ObjectId,
            ref: "TicketsTitle",
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

TicketFormSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const TicketForm = mongoose.model("TicketForm", TicketFormSchema);

export default TicketForm;
