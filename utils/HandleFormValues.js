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

        const fieldData = {
            name,
            value: values[key],
            ...(Array.isArray(values[key]) && { multiple: true }),
        };

        // Find extra fields for this particular field
        const extraField = {};

        const multipleKey = `add_mutiple_${name}_for_manage`;
        const manuallyKey = `add_manully_${name}_for_manage`;

        if (multipleKey in values) {
            extraField.add_mutiple = values[multipleKey];
        }

        if (manuallyKey in values) {
            extraField.add_manully = values[manuallyKey];
        }

        if (Object.keys(extraField).length) {
            fieldData.extraField = extraField;
        }

        acc[field.type].push(fieldData);

        return acc;
    }, {});

    return {
        ...rest,
        values: manageValues,
    };
    //   });
};

export default forManage