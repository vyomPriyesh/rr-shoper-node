import express from "express";
import cors from "cors";
import "dotenv/config";
import axios from "axios";
import https from "https";
import connectDB from "./config/db.js";
import { sendResponse } from "./utils/response.js";
import api from "./routes/api.js";

const app = express();
const port = process.env.PORT || "8000";
app.use(cors());
app.use(express.json());
connectDB();

app.use("/api", api);



app.get("/", async (req, res) => res.send('RR Shoper'));

app.use((err, req, res, next) => {
    console.error(err); // log it
    return sendResponse(res, 500, {
        message: 'Something went wrong.',
        error_message: err.message
    }, false);
});

app.listen(port, () => {
    console.log(`server listening at http://localhost:${port}`);
});