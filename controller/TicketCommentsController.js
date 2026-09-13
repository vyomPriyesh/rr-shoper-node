import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import { catchAsync } from "../utils/catchAsync.js"
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";

class TicketCommentsController {

    static allComments = catchAsync(async (req, res) => {
        const { page = 1, limit = 10 } = req.body || {};
        const { ticketId } = req.params;

        if (!mongoose.isValidObjectId(ticketId)) {
            return sendResponse(res, 400, "Invalid ticket ID", false);
        }

        // const pageNumber = Math.max(Number(page) || 1, 1);
        // const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
        // const skip = (pageNumber - 1) * limitNumber;

        const data = await Comment.aggregate([
            // ============================================================
            // MAIN COMMENTS
            // ============================================================
            {
                $match: {
                    ticketId: new mongoose.Types.ObjectId(ticketId),
                    parentCommentId: null,
                },
            },

            // ============================================================
            // PAGINATION
            // ============================================================
            {
                $sort: {
                    createdAt: -1,
                },
            },

            // {
            //     $skip: skip,
            // },

            // {
            //     $limit: limitNumber,
            // },

            // ============================================================
            // GET ALL NESTED REPLIES
            // ============================================================
            {
                $graphLookup: {
                    from: "comments",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parentCommentId",
                    as: "allReplies",
                    depthField: "depth",
                },
            },

            // ============================================================
            // SORT ALL REPLIES
            // ============================================================
            {
                $set: {
                    allReplies: {
                        $sortArray: {
                            input: "$allReplies",
                            sortBy: {
                                createdAt: -1,
                            },
                        },
                    },
                },
            },

            // ============================================================
            // MAIN COMMENT CUSTOMER
            // ============================================================
            {
                $lookup: {
                    from: "customers",
                    localField: "reply_by_customer",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $lookup: {
                                from: "images",
                                localField: "image",
                                foreignField: "_id",
                                as: "imageData",
                            },
                        },

                        {
                            $set: {
                                image: {
                                    $let: {
                                        vars: {
                                            imageDocument: {
                                                $arrayElemAt: ["$imageData", 0],
                                            },
                                        },
                                        in: {
                                            $ifNull: ["$$imageDocument.image", null],
                                        },
                                    },
                                },
                            },
                        },

                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: "customer",
                },
            },

            {
                $set: {
                    reply_by_customer: {
                        $ifNull: [
                            {
                                $arrayElemAt: ["$customer", 0],
                            },
                            null,
                        ],
                    },
                },
            },

            // ============================================================
            // MAIN COMMENT USER
            // ============================================================
            {
                $lookup: {
                    from: "users",
                    localField: "reply_by_user",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $lookup: {
                                from: "images",
                                localField: "image",
                                foreignField: "_id",
                                as: "imageData",
                            },
                        },

                        {
                            $set: {
                                image: {
                                    $let: {
                                        vars: {
                                            imageDocument: {
                                                $arrayElemAt: ["$imageData", 0],
                                            },
                                        },
                                        in: {
                                            $ifNull: ["$$imageDocument.image", null],
                                        },
                                    },
                                },
                            },
                        },

                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: "user",
                },
            },

            {
                $set: {
                    reply_by_user: {
                        $ifNull: [
                            {
                                $arrayElemAt: ["$user", 0],
                            },
                            null,
                        ],
                    },
                },
            },

            // ============================================================
            // REPLY CUSTOMERS
            // ============================================================
            {
                $lookup: {
                    from: "customers",
                    let: {
                        customerIds: "$allReplies.reply_by_customer",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: [
                                        "$_id",
                                        {
                                            $ifNull: [
                                                "$$customerIds",
                                                [],
                                            ],
                                        },
                                    ],
                                },
                            },
                        },

                        {
                            $lookup: {
                                from: "images",
                                localField: "image",
                                foreignField: "_id",
                                as: "imageData",
                            },
                        },

                        {
                            $set: {
                                image: {
                                    $let: {
                                        vars: {
                                            imageDocument: {
                                                $arrayElemAt: ["$imageData", 0],
                                            },
                                        },
                                        in: {
                                            $ifNull: ["$$imageDocument.image", null],
                                        },
                                    },
                                },
                            },
                        },

                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: "replyCustomers",
                },
            },

            // ============================================================
            // REPLY USERS
            // ============================================================
            {
                $lookup: {
                    from: "users",
                    let: {
                        userIds: "$allReplies.reply_by_user",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: [
                                        "$_id",
                                        {
                                            $ifNull: [
                                                "$$userIds",
                                                [],
                                            ],
                                        },
                                    ],
                                },
                            },
                        },

                        {
                            $lookup: {
                                from: "images",
                                localField: "image",
                                foreignField: "_id",
                                as: "imageData",
                            },
                        },

                        {
                            $set: {
                                image: {
                                    $let: {
                                        vars: {
                                            imageDocument: {
                                                $arrayElemAt: ["$imageData", 0],
                                            },
                                        },
                                        in: {
                                            $ifNull: ["$$imageDocument.image", null],
                                        },
                                    },
                                },
                            },
                        },

                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: "replyUsers",
                },
            },

            // ============================================================
            // POPULATE EACH REPLY
            // ============================================================
            {
                $set: {
                    allReplies: {
                        $map: {
                            input: "$allReplies",
                            as: "reply",

                            in: {
                                $mergeObjects: [
                                    "$$reply",

                                    {
                                        // ================================================
                                        // REPLY CUSTOMER
                                        // ================================================
                                        reply_by_customer: {
                                            $ifNull: [
                                                {
                                                    $arrayElemAt: [
                                                        {
                                                            $filter: {
                                                                input: "$replyCustomers",
                                                                as: "customer",

                                                                cond: {
                                                                    $eq: [
                                                                        "$$customer._id",
                                                                        "$$reply.reply_by_customer",
                                                                    ],
                                                                },
                                                            },
                                                        },
                                                        0,
                                                    ],
                                                },
                                                null,
                                            ],
                                        },

                                        // ================================================
                                        // REPLY USER
                                        // ================================================
                                        reply_by_user: {
                                            $ifNull: [
                                                {
                                                    $arrayElemAt: [
                                                        {
                                                            $filter: {
                                                                input: "$replyUsers",
                                                                as: "user",

                                                                cond: {
                                                                    $eq: [
                                                                        "$$user._id",
                                                                        "$$reply.reply_by_user",
                                                                    ],
                                                                },
                                                            },
                                                        },
                                                        0,
                                                    ],
                                                },
                                                null,
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },

            // ============================================================
            // REMOVE TEMPORARY FIELDS
            // ============================================================
            {
                $unset: [
                    "customer",
                    "user",
                    "replyCustomers",
                    "replyUsers",
                ],
            },
        ]);

        // Normalize image references from both main comments and nested replies.
        // This also handles records created before image population was added.
        const imageIds = new Set();
        const addImageReference = (author) => {
            if (!author?.image) return;

            const imageId = author.image?._id || author.image;
            if (mongoose.isValidObjectId(imageId)) {
                imageIds.add(imageId.toString());
            }
        };

        data.forEach((comment) => {
            addImageReference(comment.reply_by_customer);
            addImageReference(comment.reply_by_user);

            comment.allReplies.forEach((reply) => {
                addImageReference(reply.reply_by_customer);
                addImageReference(reply.reply_by_user);
            });
        });

        if (imageIds.size > 0) {
            const images = await Images.find({
                _id: { $in: [...imageIds] },
            })
                .select("image")
                .lean();

            const imageMap = new Map(
                images.map((image) => [image._id.toString(), image.image])
            );

            const replaceImageReference = (author) => {
                if (!author?.image) return;

                const imageId = (author.image?._id || author.image).toString();
                if (imageMap.has(imageId)) {
                    author.image = imageMap.get(imageId);
                }
            };

            data.forEach((comment) => {
                replaceImageReference(comment.reply_by_customer);
                replaceImageReference(comment.reply_by_user);

                comment.allReplies.forEach((reply) => {
                    replaceImageReference(reply.reply_by_customer);
                    replaceImageReference(reply.reply_by_user);
                });
            });
        }

        // ================================================================
        // BUILD NESTED REPLY TREE
        // ================================================================
        const formattedData = data.map((comment) => {
            const replyMap = new Map();

            // ============================================================
            // CREATE REPLY MAP
            // ============================================================
            comment.allReplies.forEach((reply) => {
                replyMap.set(reply._id.toString(), {
                    ...reply,
                    replies: [],
                });
            });

            const replies = [];

            // ============================================================
            // BUILD HIERARCHY
            // ============================================================
            comment.allReplies.forEach((reply) => {
                const current = replyMap.get(
                    reply._id.toString()
                );

                const parentId =
                    reply.parentCommentId?.toString();

                // ========================================================
                // DIRECT REPLY
                // ========================================================
                if (
                    parentId === comment._id.toString()
                ) {
                    replies.push(current);
                }

                // ========================================================
                // NESTED REPLY
                // ========================================================
                else {
                    const parent = replyMap.get(parentId);

                    if (parent) {
                        parent.replies.push(current);
                    }
                }
            });

            return {
                ...comment,
                replies,
                allReplies: undefined,
            };
        });

        // ================================================================
        // RESPONSE
        // ================================================================
        return sendResponse(
            res,
            200,
            "Comments found",
            true,
            {
                data: formattedData,
            }
        );
    });

}

export default TicketCommentsController