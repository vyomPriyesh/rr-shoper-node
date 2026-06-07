import Images from "../models/Images.js"
import Platfoms from "../models/Platfoms.js"
import { catchAsync } from "../utils/catchAsync.js"
import paginate from "../utils/pagination.js"
import { sendResponse } from "../utils/response.js"

class PlatformController {

    static addPlatform = catchAsync(async (req, res) => {

        const image = req.body?.images.uid
        const name = req.body?.name

        const payload = {
            image,
            name
        }

        const platforData = await Platfoms.create(payload)
        await Images.findByIdAndUpdate(image, { in_use: true }, { new: true })

        return sendResponse(res, 200, 'Platform Create Successfully', true, platforData)

    })

    static allPlatforms = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}
        const populates = [
            'image'
        ]
        const allPlatformsData = await paginate(Platfoms, {}, page, limit, {}, populates)

        return sendResponse(res, 200, 'All Platforms', true, allPlatformsData, true)
    })

    static customerAllPlatforms = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}
        const populates = [
            'image'
        ]
        const allPlatformsData = await paginate(Platfoms, { status: true }, page, limit, {}, populates)

        return sendResponse(res, 200, 'All Platforms', true, allPlatformsData, true)
    })

    static updatePlatform = catchAsync(async (req, res) => {

        const { id } = req.params
        const data = req.body || {}
        const findPlatform = await Platfoms.findById(id)
        if (!findPlatform) {
            return sendResponse(res, 422, 'Platform Not Found', false)
        }
        await Platfoms.findByIdAndUpdate(id, data)

        return sendResponse(res, 200, 'Platfom Update Successfully', true)
    })

    static updateStatus = catchAsync(async (req, res) => {

        const { id } = req.params

        const findPlatform = await Platfoms.findById(id)
        if (!findPlatform) {
            return sendResponse(res, 422, 'Platform Not Found', false)
        }
        await Platfoms.findByIdAndUpdate(id, { status: !findPlatform.status })

        return sendResponse(res, 200, 'Status Update Successfully', true)
    })

    static deletePlatform = catchAsync(async (req, res) => {

        const { id } = req.params
        
        const findPlatform = await Platfoms.findById(id)

        if (!findPlatform) {
            return sendResponse(res, 422, 'Platform Not Found', false)
        }

        await Platfoms.delete({ _id: id })

        return sendResponse(res, 200, 'Platform Delete Successfully', true)
    })
}

export default PlatformController