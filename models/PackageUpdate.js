import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const PackageUpdateSchema = new mongoose.Schema(
    {
        subscription_id: {
            type: Schema.Types.ObjectId,
            ref: "Subscription",
            required: true,
        },
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        package: {
            type: Object,
        },
        payment_id: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            unique: true,
        },
        serviceUpdates: {
            type: Array,
            default: []
        },
    },
    {
        timestamps: true,
    }
)

PackageUpdateSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const PackageUpdate = mongoose.model("PackageUpdate", PackageUpdateSchema);

export default PackageUpdate;