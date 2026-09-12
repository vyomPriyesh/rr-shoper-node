import Comment from "../models/Comment.js";

export const joinTicket = (io, socket, data) => {
    const { ticketId } = data;

    if (!ticketId) {
        console.log("ticketId is required");
        return;
    }

    socket.join(`ticket:${ticketId}`);
};

export const leaveTicket = (io, socket, data) => {
    const { ticketId } = data;

    if (!ticketId) {
        return;
    }

    socket.leave(`ticket:${ticketId}`);
};

export const addComment = async (io, socket, data) => {

    const { ticketId, comment } = data;

    if (!ticketId || !comment) {
        return;
    }

    const customerID = socket.authData?._id;

    const commentData = {
        ticketId,
        comment,
        reply_by_customer: customerID
    }

    await Comment.create(commentData)

    io.to(`ticket:${ticketId}`).emit("ticket:comment-added", commentData);

};

export const addReplay = async (io, socket, data) => {

    const { ticketId, parentId, comment } = data;

    if (!ticketId || !comment) {
        return;
    }

    const customerID = socket.authData?._id;

    const commentData = {
        ticketId,
        comment,
        reply_by_customer: customerID,
        parentCommentId: parentId
    }

    await Comment.create(commentData)

    io.to(`ticket:${ticketId}`).emit("ticket:comment-added", commentData);

};