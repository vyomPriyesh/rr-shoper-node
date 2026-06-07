import express from "express";
import "dotenv/config";
import cors from "cors";
import path from "path";
import api from "./routes/api.js";
import { assetsUrl } from "./config/config.js";
import { sendResponse } from "./utils/response.js";
import connectDB from "./config/db.js";

connectDB();
const app = express();
const port = process.env.PORT || "8000";
global.__basedir = path.resolve();

const allowedOrigins = [
    "http://192.168.1.6:5173",
    "http://192.168.1.6:5174",
    "https://rrshoper.in",
    "https://admin.rrshoper.in",
];

const corsOptions = {
    origin: function (origin, callback) {
        // allow Postman, mobile apps, curl
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // IMPORTANT: do NOT throw error, just block silently
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());


app.get("/", async (req, res) => res.send('RR Shoper'));
app.use("/assets", express.static(assetsUrl));
app.use("/api", api);


app.use((err, req, res, next) => {
    console.error(err); // log it
    return sendResponse(res, 500, {
        message: 'Something went wrong.',
        error_message: err.message
    }, false);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`server listening at http://localhost:${port}`);
});