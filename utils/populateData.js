export const populateData = async (data, Model, populateFields = []) => {
  if (!data) return data;

  let populatedData;
  if (Array.isArray(data)) {
    populatedData = await Model.populate(data, populateFields);
  } else {
    populatedData = await data.populate(populateFields);
    // Convert to plain JS object for key manipulation
    populatedData = populatedData.toObject ? populatedData.toObject() : populatedData;
  }

  // Helper to rename keys on a single object
  const renameFields = (obj) => {
    populateFields.forEach(({ path, rename }) => {
      if (rename && obj[path] !== undefined) {
        obj[rename] = obj[path];
        delete obj[path];
      }
    });
  };

  if (Array.isArray(populatedData)) {
    populatedData.forEach(item => renameFields(item));
  } else if (populatedData && typeof populatedData === 'object') {
    renameFields(populatedData);
  }

  return populatedData;
};
