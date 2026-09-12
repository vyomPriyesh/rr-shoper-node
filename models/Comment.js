import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const CommentSchema = new mongoose.Schema(
    {
        reply_by_customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },

        reply_by_user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        ticketId: {
            type: Schema.Types.ObjectId,
            ref: "Tickets",
            default: null,
        },

        // null = main comment
        // ObjectId = reply to another comment
        parentCommentId: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },

        comment: {
            type: String,
            default: null,
        },

        like: {
            type: Number,
            default: 0,
        },

        dislike: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

CommentSchema.plugin(MongooseDelete, {
    deletedAt: true,
    overrideMethods: "all",
});

const Comment = mongoose.model("Comment", CommentSchema);

export default Comment;