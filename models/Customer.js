import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const PackageSchema = new mongoose.Schema(
    {
        package_id: {
            type: Schema.Types.ObjectId,
            ref: "Packages",
            default: null,
        },

        package_expire: {
            type: Number,
            default: null,
        },

        package_expire_status: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const CustomerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
        },
        image: {
            type: Schema.Types.ObjectId,
            ref: "Images"
        },
        password: {
            type: String,
            default: null
        },
        package: {
            type: [PackageSchema],
            default: [],
        },
        email: {
            type: String,
            default: null,
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
        },

        role: {
            type: String,
            default: "customer",
        },

        otp: {
            type: String,
            default: null,
        },

        otp_send_time: {
            type: Date,
            default: Date
        },

        otp_status: {
            type: String,
            default: "not-verified",
        },

        status: {
            type: String,
            default: "unactive",
        },

        login_devices: [
            {
                token: String,
                ip: String,
                Customer_agent: String,
                device_name: String,
                login_time: Date
            }
        ],
    },
    {
        timestamps: true,
    }
);

CustomerSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Customer = mongoose.model("Customer", CustomerSchema);

export default Customer;