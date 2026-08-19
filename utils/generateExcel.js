import ExcelJS from "exceljs";

export const generateExcel = async ({
    data = [],
    columns = [],
    sheetName = "Sheet1",
}) => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet(sheetName);

    // Define columns
    worksheet.columns = columns.map((column) => ({
        key: column.key,
        width: column.width || 20,
    }));

    // Header row
    const headerRow = worksheet.addRow(
        columns.map((column) => column.header)
    );

    // Add data rows
    data.forEach((item) => {
        worksheet.addRow(
            columns.map((column) => {
                return item[column.key] ?? "";
            })
        );
    });

    // Header styling
    headerRow.font = {
        bold: true,
        color: {
            argb: "000000",
        },
    };

    // headerRow.fill = {
    //     type: "pattern",
    //     pattern: "solid",
    //     fgColor: {
    //         argb: "5A3A2A",
    //     },
    // };

    headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
    };

    headerRow.height = 25;

    // Header borders
    headerRow.eachCell((cell) => {
        cell.border = {
            top: {
                style: "thin",
            },
            left: {
                style: "thin",
            },
            bottom: {
                style: "thin",
            },
            right: {
                style: "thin",
            },
        };
    });

    // Freeze first row
    worksheet.views = [
        {
            state: "frozen",
            ySplit: 1,
        },
    ];

    // Auto filter
    worksheet.autoFilter = {
        from: {
            row: 1,
            column: 1,
        },
        to: {
            row: 1,
            column: columns.length,
        },
    };

    return await workbook.xlsx.writeBuffer();
};