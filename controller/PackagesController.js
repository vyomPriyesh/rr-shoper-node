import Packages from "../models/Packages.js"
import { catchAsync } from "../utils/catchAsync.js"
import paginate from "../utils/pagination.js"
import { sendResponse } from "../utils/response.js"

class PackagesController {

    static addPackage = catchAsync(async (req, res) => {

        const data = req.body || {}

        const packageData = await Packages.create(data)

        return sendResponse(res, 200, 'Package Create Successfully', true, packageData)
    })

    static updatePackage = catchAsync(async (req, res) => {

        const data = req.body || {}
        const { id } = req.params

        const findPackage = await Packages.findById(id)

        if (!findPackage) {
            return sendResponse(res, 422, 'Package not Found', false)
        }

        const packageData = await Packages.findByIdAndUpdate(id, data, { new: true })

        return sendResponse(res, 200, 'Package Update Successfully', true, packageData)
    })

    static updatePackageStatus = catchAsync(async (req, res) => {

        const data = req.body || {}
        const { id } = req.params

        const findPackage = await Packages.findById(id)

        if (!findPackage) {
            return sendResponse(res, 422, 'Package not Found', false)
        }

        const packageData = await Packages.findByIdAndUpdate(id, { status: !findPackage.status }, { new: true })

        return sendResponse(res, 200, 'Package Status Update Successfully', true, packageData)
    })

    static deletePackage = catchAsync(async (req, res) => {

        const { id } = req.params

        const findPackage = await Packages.findById(id)

        if (!findPackage) {
            return sendResponse(res, 422, 'Package not Found', false)
        }

        const packageData = await Packages.delete({ _id: id })

        return sendResponse(res, 200, 'Package Delete Successfully', true,)
    })

    static allPackages = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}
        const populates = [
            { path: 'platform', select: '', populate: 'image' }
        ]
        const allPackagesData = await paginate(Packages, {}, page, limit, {}, populates)

        return sendResponse(res, 200, 'All Packages', true, allPackagesData, true)
    })

    static customerAllPackages = catchAsync(async (req, res) => {

        const { page, limit } = req.body || {}
        const populates = [
            { path: 'platform', select: '', populate: 'image' }
        ]
        const allPackagesData = await paginate(Packages, { status: true }, page, limit, {}, populates)

        return sendResponse(res, 200, 'All Packages', true, allPackagesData, true)
    })

}

export default PackagesController