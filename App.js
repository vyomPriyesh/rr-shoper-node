import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import { sendResponse } from "./utils/response.js";
import api from "./routes/api.js";

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("RR Shoper");
});

// error handler
app.use((err, req, res, next) => {
    console.error(err);
    return sendResponse(
        res,
        500,
        {
            message: "Something went wrong.",
            error_message: err.message,
        },
        false
    );
});

const startServer = async () => {
    try {
        await connectDB();

        // ✅ ONLY after DB connected
        app.use("/api", api);

        app.listen(port, () => {
            console.log(`server running on ${port}`);
        });

    } catch (error) {
        console.log("DB connection failed:", error);
        process.exit(1);
    }
};

startServer();