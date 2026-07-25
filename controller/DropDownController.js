import Designation from "../models/Designation.js"
import Platforms from "../models/Platforms.js"
import TicketsTitle from "../models/TicketsTitle.js"
import User from "../models/User.js"
import { catchAsync } from "../utils/catchAsync.js"
import { sendResponse } from "../utils/response.js"

const getValusName = (data, name, value, subkey) => {
    return data.map(list => ({
        label: list[name],
        value: list[value],
        sub_data: list[subkey],
    })) || []
}

const getOptionsListNames = (data) => {
    return Object.keys(data).map(list => ({
        label: list,
        value: list,
    }))
}

const ticketStatuses = [
    { label: 'Not Started', value: 'not_started' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
]

class DropDownController {

    static async getOptions() {

        const allPlatforms = await Platforms.find({ status: true });
        const allDesignations = await Designation.find({ status: true });
        const allTicketsTitles = await TicketsTitle.find({ status: true });


        return {
            platforms: getValusName(allPlatforms, 'name', '_id'),
            designations: getValusName(allDesignations, 'name', '_id'),
            ticketsTitles: getValusName(allTicketsTitles, 'title', '_id'),
            ticketStatuses
        }
    }

    static allDropDowns = catchAsync(async (req, res) => {

        const data = await DropDownController.getOptions();
        data.testUser = true
        return sendResponse(res, 200, 'All Drop Downs Options', true, data, true)

    })

    static adminAllDropDowns = catchAsync(async (req, res) => {

        const allPlatforms = await Platforms.find();
        const allUsers = await User.find({ status: 'active', role: 'user' });
        const allDesignations = await Designation.find();
        const allTicketsTitles = await TicketsTitle.find();
        const roles = [
            { label: 'User', value: 'user' },
            { label: 'Customer', value: 'customer' },
        ]

        const options = {
            platforms: getValusName(allPlatforms, 'name', '_id'),
            users: getValusName(allUsers, 'name', '_id'),
            designations: getValusName(allDesignations, 'name', '_id'),
            ticketsTitles: getValusName(allTicketsTitles, 'title', '_id'),
            roles,
            ticketStatuses
        }

        const custSideOptions = await DropDownController.getOptions();

        const data = {
            ...options,
            optionsLists: getOptionsListNames(custSideOptions)
        }




        return sendResponse(res, 200, 'All Drop Downs Options', true, data, true)

    })

}

export default DropDownController