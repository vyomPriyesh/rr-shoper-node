import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const TicketsSchema = new mongoose.Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        title: {
            type: Schema.Types.ObjectId,
            ref: "TicketsTitle",
            default: null,
        },
        platform: {
            type: Schema.Types.ObjectId,
            ref: "Platforms"
        },
        status: {
            type: String,
            default: 'not_started',
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

TicketsSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Tickets = mongoose.model("Tickets", TicketsSchema);

export default Tickets;
