import Lead from "../models/Lead.js";
import Payment from "../models/Payment.js";

const getFinancialYearPrefix = (date = new Date()) => {
    const dateParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'numeric',
    }).formatToParts(date);
    const year = Number(dateParts.find(part => part.type === 'year').value);
    const monthNumber = Number(dateParts.find(part => part.type === 'month').value);
    const monthName = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
    }).format(date);
    const startYear = monthNumber >= 4 ? year : year - 1;
    const endYear = String((startYear + 1) % 100).padStart(2, '0');

    return `RRS/${startYear}-${endYear}/${monthName}/`;
};

export const generateLeadId = async (date = new Date()) => {
    const prefix = getFinancialYearPrefix(date);
    const existingLeads = await Lead.collection.find(
        { lead_id: { $regex: `^${prefix}` } },
        { projection: { lead_id: 1 } }
    ).toArray();

    const nextNumber = existingLeads.reduce((highest, lead) => {
        const sequence = Number(lead.lead_id?.slice(prefix.length));
        return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
    }, 0) + 1;

    return `${prefix}${nextNumber}`;
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
    return `${prefix}${nextNumber}`;
};