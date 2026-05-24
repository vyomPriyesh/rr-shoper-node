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
            unique: true,
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
        },

        otp: {
            type: String,
            default: null,
        },

        otp_status: {
            type: String,
            default: "not-verified",
        },

        status :{
            type: String,
            default: "unactive",
        }
    },
    {
        timestamps: true,
    }
);

userSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const User = mongoose.model("User", userSchema);

export default User;