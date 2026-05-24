import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
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

        role:{
            type: String,
            default: "user",
        },

        otp: {
            type: String,
            default: null,
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
                user_agent: String,
                device_name: String,
                login_time: Date
            }
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const User = mongoose.model("User", userSchema);

export default User;