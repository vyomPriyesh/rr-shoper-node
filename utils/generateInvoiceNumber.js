import Payment from "../models/Payment.js";

const getFinancialYearPrefix = (date) => {
    const dateParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'numeric',
    }).formatToParts(date);
    const year = Number(dateParts.find(part => part.type === 'year').value);
    const month = Number(dateParts.find(part => part.type === 'month').value);
    const startYear = month >= 4 ? year : year - 1;
    const endYear = String((startYear + 1) % 100).padStart(2, '0');

    return `RRS/${startYear}-${endYear}/`;
};

export const generateInvoiceNumber = async (date = new Date()) => {
    const prefix = getFinancialYearPrefix(date);
    const existingInvoices = await Payment.collection.find(
        { invoice_number: { $regex: `^${prefix}` } },
        { projection: { invoice_number: 1 } }
    ).toArray();
    const nextNumber = existingInvoices.reduce((highest, invoice) => {
        const sequence = Number(invoice.invoice_number?.slice(prefix.length));
        return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
    }, 0) + 1;
    return prefix + nextNumber
};