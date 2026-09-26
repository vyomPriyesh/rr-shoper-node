import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const PackagesSchema = new mongoose.Schema(
    {
        platform: {
            type: Schema.Types.ObjectId,
            ref: "Platforms"
        },
        name: {
            type: String,
            default: null
        },
        rank: {
            type: Number,
            default: 1,
        },
        month_price: {
            type: Number,
            default: null,
        },
        year_price: {
            type: Number,
            default: null,
        },
        onetime_price: {
            type: Number,
            default: null
        },
        services: {
            type: Array,
            default: []
        },
        status: {
            type: Boolean,
            default: false,
        },
        popular: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

PackagesSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Packages = mongoose.model("Packages", PackagesSchema);

export default Packages;