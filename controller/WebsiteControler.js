import mongoose from "mongoose"
import Website from "../models/Website.js"
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js"

class WebsiteControler {

    static websiteUpdate = catchAsync(async (req, res) => {

        const data = req.body || {}

        // await Website.create(data)
        await Website.findByIdAndUpdate("6aca1005b298c8d1cfb03ec3", data)

        return sendResponse(res, 200, 'Website Update SuccessFully', true)

    })
    
    static getWebsiteData = catchAsync(async(req,res)=>{
        const data = await Website.findById("6aca1005b298c8d1cfb03ec3")

        return sendResponse(res, 200, 'Website Get SuccessFully', true, data)
    })
}

export default WebsiteControler