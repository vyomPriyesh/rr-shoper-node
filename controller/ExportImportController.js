import Customer from "../models/Customer.js";
import Lead from "../models/Lead.js";
import LeadForm from "../models/LeadForm.js";
import Platforms from "../models/Platforms.js";
import buildFilters from "../utils/buildFilters.js";
import { catchAsync } from "../utils/catchAsync.js"
import { generateExcel } from "../utils/generateExcel.js";
import forManage, { formInputs } from "../utils/HandleFormValues.js";
import { populateData } from "../utils/populateData.js";
import { sendResponse } from "../utils/response.js";
import { AddCustomer } from "./CustomerController.js";
import { getAdminDropdowns } from "./DropDownController.js";

const getModalData = (name, sample) => {
    switch (name) {
        case 'lead':
            return {
                model: Lead,
                otherColumnModel: {
                    model: LeadForm,
                    query: (id) => { return { leadTitle: id } }
                },
                optionModals: [
                    {
                        name: 'platforms',
                        model: Platforms
                    }
                ],
                sheetName: "Leads",
                columns: [
                    {
                        header: "customer_mobile",
                        key: "customer_mobile",
                        width: 25,
                    },
                    {
                        header: "customer_name",
                        key: "customer_name",
                        width: 25,
                    },
                    {
                        header: "customer_email",
                        key: "customer_email",
                        width: 25,
                    },
                    !sample && {
                        header: "created_by",
                        key: "created_by",
                        width: 25,
                    },
                    !sample && {
                        header: "assign_user",
                        key: "assign_user",
                        width: 25,
                    },
                    !sample && {
                        header: "status",
                        key: "status",
                        width: 25,
                    },
                ].filter(Boolean),
                populateKeys: [
                    { path: 'customer', select: "name mobile" },
                    { path: 'created_by', select: "name" },
                    { path: 'assign_user', select: "name" },
                ]
            }
    }
}

const keyValue = (key) => {
    return key.trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}

const valuesDataWithRow = (data, options) => {
    return data.reduce((acc, item) => {
        const key = keyValue(item.name)
        // .trim()
        // .toLowerCase()
        // .replace(/\s+/g, "_");

        const addManually = item?.extraField?.add_manully;

        // Dynamic option lookup
        if (
            addManually?.value === true &&
            addManually?.dynamicField
        ) {
            const optionList =
                options?.[addManually.dynamicField] || [];

            const values = Array.isArray(item.value)
                ? item.value
                : [item.value];

            acc[key] = values
                .map((value) => {
                    const option = optionList.find(
                        (option) =>
                            String(option.value) === String(value)
                    );

                    return option?.label ?? value;
                })
                .join(", ");
        } else {
            acc[key] = Array.isArray(item.value)
                ? item.value.join(", ")
                : item.value;
        }

        return acc;
    }, {});
};

class ExportImportController {

    static exportExcel = catchAsync(async (req, res) => {

        const { name } = req.params

        const dropdowns = await getAdminDropdowns();

        const { sample, lead_form_id, ...allFilters } = req.body || {}

        const { model, otherColumnModel, sheetName, columns, populateKeys } = getModalData(name, sample)


        if (sample) {
            const leadForm = await otherColumnModel?.model.findOne(otherColumnModel?.query(lead_form_id))

            const otherColumns = leadForm?.fields?.filter(item => item.type !== 'upload')?.map(list => {
                return {
                    header: `${keyValue(list.label)}_${list.type === "select" ? `_${list.multipleSelect ? "multiple" : "single"}` : ""}_${list.type}`,
                    key: keyValue(list.label),
                    width: 40
                };
            })

            const buffer = await generateExcel({
                data: [],
                columns: [...columns, ...otherColumns],
                sheetName,
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${sheetName}_sample.xlsx"`
            );

            res.setHeader(
                "Content-Length",
                buffer.length
            );

            return res.send(buffer);
        }

        const searchKeys = ['status']

        const query = await buildFilters(allFilters, searchKeys)

        const data = await model.find(query).lean()

        const populatedData = await populateData(data, model, populateKeys);

        let valuesColumns;

        const fileData = populatedData.map((list, i) => {
            const { customer, created_by, assign_user, values, ...rest } = list
            delete values.upload
            const valuesData = valuesDataWithRow(Object.values(values).flat(), dropdowns)
            if (i == 0) {
                valuesColumns = valuesData
            }
            return {
                ...(customer && { customer_mobile: customer?.mobile }),
                ...(customer && { customer_name: customer?.name }),
                ...(created_by && { created_by: created_by?.name }),
                ...(assign_user && { assign_user: assign_user?.name }),
                ...valuesData,
                ...rest
            }
        })

        const buffer = await generateExcel({
            data: fileData,
            columns: [...columns, ...Object.keys(valuesColumns || {}).map(list => ({ header: list, key: list }))],
            sheetName,
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${sheetName}.xlsx"`
        );

        res.setHeader(
            "Content-Length",
            buffer.length
        );

        return res.send(buffer);
    })

    static importExcel = catchAsync(async (req, res) => {

        const { data } = req.body || {}
        const { name } = req.params
        const { id: userId } = req.user || {};
        const { optionModals, model } = getModalData(name)

        const formattedData = data.map((row) => {
            const values = {};
            const result = {};

            Object.keys(row).forEach((key) => {
                const lastValue = key.split("_").pop();

                if (formInputs.some((item) => item.type === lastValue)) {
                    const fieldName = key.slice(0, -(lastValue.length + 1));
                    const formattedFieldName = fieldName
                        .split("_")
                        .filter((word) => word !== "single" && word !== "multiple")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");

                    values[`${lastValue}_${formattedFieldName}_for_manage`] = row[key];
                } else {
                    result[key] = row[key];
                }
            });

            return {
                ...result,
                values
            };
        });

        for (const item of formattedData) {
            let customer;
            const customerData = await Customer.findOne({ mobile: item?.customer_mobile })
            if (!customerData) {
                const payload = {
                    name: item.customer_name,
                    email: item.customer_email,
                    mobile: item.customer_mobile,
                    role: 'customer'
                }
                customer = await AddCustomer(payload)
            } else {
                customer = {
                    success: true,
                    newCustomer: {
                        _id: customerData._id,
                    }
                }
            }
            const { values, created_by, customer: cusotmerValue } = await forManage({ customer: customer?.newCustomer?._id, created_by: userId, values: item.values });
            delete item.customer_name
            delete item.customer_email
            delete item.customer_mobile
            delete item.values

            const { fields } = await LeadForm.findById("6a6d7d33074fa8b351dfe038")
            const selectFields = fields?.filter(list => list.type == 'select')

            for (const list of selectFields) {
                const existingField = values.select.find(row => row.name == list.label)

                const multiValue = existingField.value.split(",")
                const normalize = (value) => value?.trim().toLowerCase();

                if (existingField) {
                    if (list.dynamic && list.manully) {

                        const dynamicOptionsModal = optionModals.find(option => option.name == list.dynamic)?.model
                        const dynamicOptionsData = await dynamicOptionsModal.find()

                        const valuesToAdd = list.multipleSelect ? multiValue : [multiValue[0]];

                        const existingValues = new Set(dynamicOptionsData.map((option) => normalize(option.name)));

                        const missingValues = valuesToAdd.filter(
                            (value) => !existingValues.has(normalize(value))
                        );

                        if (missingValues.length) {
                            for (const list of missingValues) {
                                const addedOption = await dynamicOptionsModal.create({ name: normalize(list), status: true })
                                for (const select of values.select) {
                                    if (select.value == addedOption.name) {
                                        select.value = addedOption._id
                                    }
                                }
                            }
                        } else {
                            for (const list of valuesToAdd) {
                                const existedOption = await dynamicOptionsModal.findOne({ name: normalize(list), status: true })
                                for (const select of values.select) {
                                    if (select.value == existedOption.name) {
                                        select.value = existedOption._id
                                    }
                                }
                            }
                        }

                    } else {
                        const hasDependency = list.depend_on_parent_field && list.depend_parent_field;
                        const dependencyValue = hasDependency ? values.select.find((value) => value.name === list.depend_parent_field)?.value : null;
                        const dependencyMatched = !hasDependency || normalize(list.depend_parent_field_value) === normalize(dependencyValue);

                        if (dependencyMatched) {
                            if (list.multipleSelect) {
                                const missingValues = multiValue.filter(
                                    (value) =>
                                        !list.options.some(
                                            (option) => option.toLowerCase() === value.toLowerCase()
                                        )
                                );
                                list.options.push(...missingValues);
                            } else {
                                const value = multiValue[0];

                                const exists = list.options.some(
                                    (option) => option.toLowerCase() === value.toLowerCase()
                                );

                                if (!exists) {
                                    list.options.push(value);
                                }
                            }
                        }
                    }
                }
            }

            item.created_by = created_by
            item.customer = cusotmerValue
            item.values = values
        }

        for (const leadData of formattedData) {
            await model.create(leadData)
        }

        return sendResponse(res, 200, `${name} Import SuccessFully`, true);
    })

}

export default ExportImportController