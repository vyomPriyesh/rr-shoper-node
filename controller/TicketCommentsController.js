import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import { catchAsync } from "../utils/catchAsync.js"
import paginate from "../utils/pagination.js";
import { sendResponse } from "../utils/response.js";

class TicketCommentsController {

    // static allComments = catchAsync(async (req, res) => {
    //     const { page, limit, } = req.body || {};
    //     const { ticketId } = req.params;

    //     const populate = [
    //         { path: "reply_by_customer", select: "name" }
    //     ]
    //     const data = await paginate(Comment, { ticketId }, page, limit, {}, populate)

    //     return sendResponse(res, 200, 'Comments found', true, data)
    // })

    static allComments = catchAsync(async (req, res) => {
        const { page = 1, limit = 10 } = req.body || {};
        const { ticketId } = req.params;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;

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

            {
                $skip: skip,
            },

            {
                $limit: limitNumber,
            },

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
                                    $ifNull: [
                                        {
                                            $arrayElemAt: ["$imageData.image", 0],
                                        },
                                        null,
                                    ],
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
                                    $ifNull: [
                                        {
                                            $arrayElemAt: ["$imageData.image", 0],
                                        },
                                        null,
                                    ],
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
                                    $ifNull: [
                                        {
                                            $arrayElemAt: ["$imageData", 0],
                                        },
                                        null,
                                    ],
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