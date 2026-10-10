import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const PoliciesSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: null,
        },

        subtitle: {
            type: String,
            default: null,
        },

        points: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const WebsiteSchema = new mongoose.Schema(
    {
        privacyPolicy: {
            type: [PoliciesSchema],
            default: null,
        },
        termsCondition: {
            type: [PoliciesSchema],
            default: null,
        },
        refundPolicy: {
            type: [PoliciesSchema],
            default: null,
        },
        
    },
    {
        timestamps: true,
    }
);

WebsiteSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: "all" });

const Website = mongoose.model("Website", WebsiteSchema);

export default Website;
