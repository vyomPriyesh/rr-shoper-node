const paginate = async (model, query = {}, page = 1, limit = 10, projection = {}, populate = []) => {
    // Ensure that `page` and `limit` are numbers
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Calculate the `skip` value
    const skip = (page - 1) * limit;

    // Get the total count of the documents matching the query
    const totalCount = await model.countDocuments(query);

    let dbQuery = model.find(query)
        .select(projection)
        .skip(skip)
        .limit(limit)
        .select("-password -login_devices")
        .sort({ created_at: -1 });

    if (populate.length > 0) {
        populate.forEach((item) => {
            dbQuery = dbQuery.populate(item);
        });
    }

    // Fetch the paginated data
    const data = await dbQuery.lean();

    return {
        data,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
        }
    };
};

export default paginate;