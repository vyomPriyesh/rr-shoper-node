const formInputs = [
    { type: 'input', label: 'Text' },
    { type: 'number', label: 'Number' },
    { type: 'date', label: 'Date' },
    { type: 'textarea', label: 'Textarea' },
    { type: 'select', label: 'Select' },
    { type: 'upload', label: 'Upload' },
];

const forManage = async (data) => {
    //   return data.map((item) => {
    const { values, ...rest } = data;

    const manageValues = Object.keys(values || {}).reduce((acc, key) => {
        if (!key.includes("_for_manage")) return acc;

        const cleanKey = key.replace("_for_manage", "");

        const field = formInputs.find(({ type }) =>
            cleanKey.startsWith(`${type}_`)
        );

        if (!field) return acc;

        const name = cleanKey.replace(`${field.type}_`, "");

        if (!acc[field.type]) {
            acc[field.type] = [];
        }

        acc[field.type].push({
            name,
            value: values[key],
            ...(Array.isArray(values[key]) && { multiple: true }),
        });

        return acc;
    }, {});

    return {
        ...rest,
        values: manageValues,
    };
    //   });
};

export default forManage