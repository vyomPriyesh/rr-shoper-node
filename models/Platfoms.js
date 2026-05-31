import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const PlatfomsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
        },
        index: {
            type: String,
            default: null
        },
        img: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
    }
);

PlatfomsSchema.plugin(MongooseDelete, { deletedAt: true, overrideMethods: 'all' });
const Platfoms = mongoose.model("Platfoms", PlatfomsSchema);

export default Platfoms;