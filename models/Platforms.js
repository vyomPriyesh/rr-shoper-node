import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const PlatformsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
        },
        index: {
            type: String,
            default: null
        },
        status: {
            type: Boolean,
            default: false,
        },
        image: {
            type:  Schema.Types.ObjectId,
            ref: "Images"
        }
    },
    {
        timestamps: true,
    }
);

PlatformsSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Platforms = mongoose.model("Platforms", PlatformsSchema);

export default Platforms;