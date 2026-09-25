import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const SubscriptionSchema = new mongoose.Schema(
    {
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        package_id: {
            type: Schema.Types.ObjectId,
            ref: "Packages",
            required: true,
        },
        billing_period: {
            type: String,
            enum: ['month', 'year', 'lifetime'],
            required: true,
        },
        payment_id: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            unique: true,
        },
        starts_at: {
            type: Date,
            required: true,
        },
        expires_at: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

SubscriptionSchema.index({ customer_id: 1, status: 1, expires_at: 1 });
SubscriptionSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

export default Subscription;