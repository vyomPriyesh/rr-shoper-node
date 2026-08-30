import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const DownGradePackageSchema = new mongoose.Schema(
    {
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        current_package_id: {
            type: Schema.Types.ObjectId,
            ref: "Packages",
            default: null,
        },
        requested_package_id: {
            type: Schema.Types.ObjectId,
            ref: "Packages",
            default: null,
        },
        status:{
            type:String,
            default:'pending'
        }
    },
    {
        timestamps: true,
    }
);

DownGradePackageSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const DownGradePackage = mongoose.model("DownGradePackage", DownGradePackageSchema);

export default DownGradePackage;
