import mongoose from "mongoose";

function parseMMDDYYYY(dateStr) {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split('/').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

const buildFilters = async (params, searchFields) => {
    const {
        search, status
    } = params;

    const query = { deleted_at: { $in: [null, undefined] } };

    // Text search
    if (search && searchFields && searchFields.length) {
        query.$or = searchFields.map((field) => ({
            [field]: { $regex: search, $options: "i" },
        }));
    }

    function addArrayOrSingle(key, value) {
        if (Array.isArray(value)) {
            if (value.length) query[key] = { $in: value };
        } else if (value !== undefined && value !== null && value !== "") {
            query[key] = value;
        }
    }

    addArrayOrSingle("status", status);

    return query;
};

export default buildFilters;
