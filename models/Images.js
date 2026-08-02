import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const ImagesSchema = new mongoose.Schema(
    {
        image: {
            type: String,
            default: null,
        },
        in_use: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true,
    }
);
ImagesSchema.plugin(MongooseDelete,{ deletedAt: true, overrideMethods: 'all' });
const Images = mongoose.model("Images", ImagesSchema);

export default Images;