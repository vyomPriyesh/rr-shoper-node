import { joinTicket, leaveTicket, addComment, addReplay } from "../socketsController/TicketComments.js";

const connectedSockets = new Map();

const socketRoute = (io) => {

    io.on("connection", async (socket) => {
        console.log("=================================");
        console.log("Socket connected");
        console.log("Socket ID:", socket.id);
        console.log("=================================");

        if (socket.authData?._id) {
            connectedSockets.set(
                socket.authData._id.toString(),
                socket
            );
        }

        socket.on("disconnect", (reason) => {
            console.log(
                "Socket disconnected:",
                socket.id,
                reason
            );

            if (socket.authData?._id) {
                connectedSockets.delete(
                    socket.authData._id.toString()
                );
            }
        });

        socket.on("ticket:join", (data) => {
            joinTicket(io, socket, data);
        });

        socket.on("ticket:leave", (data) => {
            leaveTicket(io, socket, data);
        });

        socket.on("ticket:add-comment", async (data) => {
            await addComment(io, socket, data);
        });

        socket.on("ticket:add-reply", async (data) => {
            await addReplay(io, socket, data);
        });
    });
};

const getConnectedSocket = (userId) => {
    return connectedSockets.get(userId?.toString());
};

export { getConnectedSocket };

export default socketRoute;