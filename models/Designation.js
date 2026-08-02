import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const DesignationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
        },
        status: {
            type: Boolean,
            default: false,
        },
        platform: {
            type: Schema.Types.ObjectId,
            ref: "Platforms"
        },  
        permissions: [
            {
                module_name: { type: String, default: null },
                actions: {
                    view: { type: Boolean, default: false },
                    add: { type: Boolean, default: false },
                    update: { type: Boolean, default: false },
                    delete: { type: Boolean, default: false },
                }
            }
        ]
    },
    {
        timestamps: true,
    }
);

DesignationSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Designation = mongoose.model("Designation", DesignationSchema);

export default Designation;