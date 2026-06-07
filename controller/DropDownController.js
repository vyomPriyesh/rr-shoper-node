import Platfoms from "../models/Platfoms.js"
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js"

const getValusName = (data, name, value, subkey) => {
    return data.map(list => ({
        label: list[name],
        value: list[value],
        sub_data: list[subkey],
    })) || []
}

class DropDownController {

    static allDropDowns = catchAsync(async (req, res) => {

        const allPlatforms = await Platfoms.find({ status: true });

        const data = {
            platforms: getValusName(allPlatforms, 'name', '_id'),
        }

        return sendResponse(res, 200, 'All Drop Downs Options', true, data,true)

    })

}

export default DropDownController