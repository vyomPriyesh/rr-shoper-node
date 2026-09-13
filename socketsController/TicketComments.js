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

    const auth_id = socket.authData?._id;
    const role = socket.authData?.role;

    const commentData = {
        ticketId,
        comment,
    }

    if (role == 'customer') {
        commentData.reply_by_customer = auth_id
    } else {
        commentData.reply_by_user = auth_id
    }

    await Comment.create(commentData)

    io.to(`ticket:${ticketId}`).emit("ticket:comment-added", commentData);

};

export const addReplay = async (io, socket, data) => {

    const { ticketId, parentId, comment } = data;

    if (!ticketId || !comment) {
        return;
    }

    const auth_id = socket.authData?._id;
    const role = socket.authData?.role;

    const commentData = {
        ticketId,
        comment,
        parentCommentId: parentId
    }

    if (role == 'customer') {
        commentData.reply_by_customer = auth_id
    } else {
        commentData.reply_by_user = auth_id
    }

    await Comment.create(commentData)

    io.to(`ticket:${ticketId}`).emit("ticket:comment-added", commentData);

};