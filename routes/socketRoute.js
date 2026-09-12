import Customer from "../models/Customer.js";
import User from "../models/User.js";
import { joinTicket, leaveTicket, addComment, addReplay } from "../socketsController/TicketComments.js";

const socketRoute = (io) => {

    io.on("connection", async (socket) => {
        console.log("=================================");
        console.log("Socket connected");
        console.log("Socket ID:", socket.id);
        console.log("=================================");

        socket.on("disconnect", (reason) => {
            console.log(
                "Socket disconnected:",
                socket.id,
                reason
            );
        });

        // -------- Ticket Comments Socket Events --------

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

export default socketRoute;