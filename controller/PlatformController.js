import Images from "../models/Images.js"
import Platforms from "../models/Platforms.js"
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

        const platforData = await Platforms.create(payload)
        await Images.findByIdAndUpdate(image, { in_use: true }, { new: true })

        return sendResponse(res, 200, 'Platform Create Successfully', true, platforData)

    })

    static allPlatforms = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}
        const populates = [
            'image'
        ]
        const allPlatformsData = await paginate(Platforms, {}, page, limit, {}, populates)

        return sendResponse(res, 200, 'All Platforms', true, allPlatformsData, true)
    })

    static customerAllPlatforms = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}
        const populates = [
            'image'
        ]
        const allPlatformsData = await paginate(Platforms, { status: true }, page, limit, {}, populates)

        return sendResponse(res, 200, 'All Platforms', true, allPlatformsData, true)
    })

    static updatePlatform = catchAsync(async (req, res) => {

        const { id } = req.params
        const data = req.body || {}
        const findPlatform = await Platforms.findById(id)
        if (!findPlatform) {
            return sendResponse(res, 422, 'Platform Not Found', false)
        }
        await Platforms.findByIdAndUpdate(id, { ...data, image: data.images.uid })

        return sendResponse(res, 200, 'Platform Update Successfully', true)
    })

    static updateStatus = catchAsync(async (req, res) => {

        const { id } = req.params

        const findPlatform = await Platforms.findById(id)
        if (!findPlatform) {
            return sendResponse(res, 422, 'Platform Not Found', false)
        }
        await Platforms.findByIdAndUpdate(id, { status: !findPlatform.status })

        return sendResponse(res, 200, 'Status Update Successfully', true)
    })

    static deletePlatform = catchAsync(async (req, res) => {

        const { id } = req.params

        const findPlatform = await Platforms.findById(id)

        if (!findPlatform) {
            return sendResponse(res, 422, 'Platform Not Found', false)
        }

        await Platforms.delete({ _id: id })

        return sendResponse(res, 200, 'Platform Delete Successfully', true)
    })

    static indexUpdate = catchAsync(async (req, res) => {
    const data = req.body || []; // Expecting array: [{ id: "...", index: 0 }, ...]

    if (!Array.isArray(data) || data.length === 0) {
        return sendResponse(res, 400, 'Invalid or empty payload', false);
    }

    // Build bulk operations array
    const bulkOps = data.map((item) => ({
        updateOne: {
            filter: { _id: item.id },
            update: { $set: { index: item.index } }
        }
    }));

    // Perform bulk write in a single DB round-trip
    await Platforms.bulkWrite(bulkOps);

    return sendResponse(res, 200, 'Platform Order Updated Successfully', true);
});

}

export default PlatformController
