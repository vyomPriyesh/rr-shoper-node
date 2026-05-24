import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { sendResponse } from "./utils/response.js";
import api from "./routes/api.js";

const app = express();
const port = process.env.PORT || 8000;

// ✅ CORS (clean & correct)
const corsOptions = {
    origin: [
        "http://192.168.1.8:5174",
        "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
app.use(express.json());

// ✅ DB connection (IMPORTANT FIX)
const startServer = async () => {
    try {
        await connectDB();

        app.use("/api", api);

        app.get("/", (req, res) => {
            res.send("RR Shoper");
        });

        // error handler should be LAST
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

        app.listen(port, () => {
            console.log(`server running on ${port}`);
        });

    } catch (error) {
        console.log("DB connection failed:", error);
        process.exit(1);
    }
};

startServer();