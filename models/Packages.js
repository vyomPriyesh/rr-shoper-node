import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const PackagesSchema = new mongoose.Schema(
    {
        platform: {
            type: Schema.Types.ObjectId,
            ref: "Platfoms"
        },
        name: {
            type: String,
            default: null
        },
        price: {
            type: String,
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