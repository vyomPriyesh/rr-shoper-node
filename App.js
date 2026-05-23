import express from "express";
import cors from "cors";
import "dotenv/config";
import axios from "axios";
import https from "https";

const app = express();
const port = process.env.PORT || "8000";
app.use(cors());
app.use(express.json());

app.use("/", (req, res) => {
    return res.send("Hello worl");
})

// app.post("/send-otp", async (req, res) => {
//     try {
//         const { mobile } = req.body;

//         if (!mobile) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Mobile number required",
//             });
//         }

//         const response = await axios.post(
//             "https://control.msg91.com/api/v5/otp",
//             {
//                 mobile: `91${mobile}`,
//                 otp:"123456",
//                 template_id: process.env.MSG_91_TEMPLATE_KEY,
//             },
//             {
//                 headers: {
//                     authkey: process.env.MSG_91_AUTH_KEY,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );

//         res.json({
//             success: true,
//             data: response.data,
//         });
//     } catch (error) {
//         console.log(error.response?.data || error.message);

//         res.status(500).json({
//             success: false,
//             message: "Failed to send OTP",
//         });
//     }
// });

// app.post("/send-otp", async (req, res) => {
//     try {
//         const { mobile } = req.body;

//         if (!mobile) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Mobile number required",
//             });
//         }

//         const options = {
//             method: "POST",
//             hostname: "control.msg91.com",
//             port: null,
//             path: `/api/v5/otp?otp=455555&mobile=91${mobile}&authkey=${process.env.MSG91_AUTH_KEY}&template_id=${process.env.MSG91_TEMPLATE_ID}`,
//             headers: {
//                 "content-type": "application/json",
//             },
//         };

//         const otpReq = https.request(options, function (otpRes) {
//             const chunks = [];

//             otpRes.on("data", function (chunk) {
//                 chunks.push(chunk);
//             });

//             otpRes.on("end", function () {
//                 const body = Buffer.concat(chunks);

//                 const response = JSON.parse(body.toString());

//                 return res.json({
//                     success: true,
//                     data: response,
//                 });
//             });
//         });

//         otpReq.on("error", (error) => {
//             console.log(error);

//             return res.status(500).json({
//                 success: false,
//                 message: "OTP sending failed",
//             });
//         });

//         /*
//           OPTIONAL TEMPLATE VARIABLES
//         */

//         otpReq.write(
//             JSON.stringify({
//                 Param1: "value1",
//                 Param2: "value2",
//             })
//         );

//         otpReq.end();
//     } catch (error) {
//         console.log(error);

//         res.status(500).json({
//             success: false,
//             message: "Server error",
//         });
//     }
// });

app.listen(port, () => {
    console.log(`server listening at http://localhost:${port}`);
});