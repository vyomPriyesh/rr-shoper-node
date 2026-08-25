import Lead from "../models/Lead.js";
import LeadForm from "../models/LeadForm.js";
import buildFilters from "../utils/buildFilters.js";
import { catchAsync } from "../utils/catchAsync.js"
import { generateExcel } from "../utils/generateExcel.js";
import { populateData } from "../utils/populateData.js";
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

class ExportController {

    static exportExcel = catchAsync(async (req, res) => {

        const { name } = req.params

        const dropdowns = await getAdminDropdowns();

        const { sample, lead_form_id, ...allFilters } = req.body || {}

        const { model, otherColumnModel, sheetName, columns, populateKeys } = getModalData(name, sample)


        if (sample) {
            const leadForm = await otherColumnModel?.model.findOne(otherColumnModel?.query(lead_form_id))
            const otherColumns = leadForm?.fields?.filter(item => item.type !== 'upload')?.map(list => {
                return { header: `${keyValue(list.label)}_${list.type}`, key: keyValue(list.label), width: 40 }
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
        console.log(data)
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

}

export default ExportController