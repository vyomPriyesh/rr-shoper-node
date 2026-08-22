import fs from "fs";
import express from "express";
import LoginController from "../controller/LoginController.js";
import verifyToken from "../Middleware/AuthMiddleware.js";
import { catchAsync } from "../utils/catchAsync.js";
import uploadFileMiddleware from "../Middleware/upload.js";
import { sendResponse } from "../utils/response.js";
import { folderName } from "../config/config.js";
import PlatformController from "../controller/PlatformController.js";
import Images from "../models/Images.js";
import DropDownController from "../controller/DropDownController.js";
import PackagesController from "../controller/PackagesController.js";
import UserController from "../controller/UserController.js";
import DesignationController from "../controller/DesignationController.js";
import TicketsController from "../controller/TicketsController.js";
import TicketsFormController from "../controller/TicketsFormController.js";
import TicketsTitleController from "../controller/TicketsTitleController.js";
import LeadTitlesController from "../controller/LeadTitlesController.js";
import LeadFormsController from "../controller/LeadsFormController.js";
import LeadsController from "../controller/LeadsController.js";
import CustomerController from "../controller/CustomerController.js";
import verifyAdmin from "../Middleware/verifyAdmin.js";
import verifyPermission from "../Middleware/verifyPermission.js";
import ExportController from "../controller/ExportController.js";

const api = express.Router();

api.post('/images/upload', catchAsync(async (req, res) => {
    await uploadFileMiddleware(req, res);
    if (req?.files?.length === 0) {
        return sendResponse(res, 400, 'Please upload at least one file!', false);
    }
    const filenames = req.files.map(file => file.filename);
    const formattedImages = [];

    for (const filename of filenames) {
        const imagePath = `/${folderName}/${filename}`;

        const image = await Images.create({
            image: imagePath
        });

        formattedImages.push(image);
    }
    return sendResponse(res, 200, 'Files uploaded successfully!', true, formattedImages);
}));

api.post("/send-otp", LoginController.sendOtp);
api.post("/verify-otp", LoginController.verifyOtp);
api.get('/profile', verifyToken, LoginController.profile)
api.get('/findCustomer/:search', LoginController.findCustomer)
api.post('/login', LoginController.adminLogin)

// .............for customer side..................................
api.post('/customer-all-platforms', PlatformController.customerAllPlatforms)
api.post('/customer-all-packages', PackagesController.customerAllPackages)
api.get('/all-options', DropDownController.allDropDowns)

api.post('/export/:name', verifyToken, ExportController.exportExcel)

api.get('/admin-all-options', verifyToken, DropDownController.adminAllDropDowns)

api.post('/allUsers', verifyToken, verifyPermission('Users', 'view'), UserController.allUsers)
api.post('/users/add-user', verifyToken, verifyPermission('Users', 'add'), UserController.addUser)
api.post('/users/update-user/:id', verifyToken, verifyPermission('Users', 'update'), UserController.updateUser)
api.post('/users/update-user-password/:id/:password', verifyToken, verifyAdmin, UserController.updateUserPassword)
api.get('/users/update-role/:id/:role', verifyToken, verifyPermission('Users', 'update'), UserController.updateUserRole)
api.get('/users/update-designation/:id/:designation', verifyToken, verifyPermission('Users', 'update'), UserController.updateUserDesignation)
api.get('/users/update-status/:id', verifyToken, verifyPermission('Users', 'update'), UserController.updateUserStatus)
api.delete('/users/delete-user/:id', verifyToken, verifyPermission('Users', 'delete'), UserController.deleteUser)

api.post('/allCustomers', verifyToken, verifyPermission('Customers', 'view'), CustomerController.allCustomers)
api.post('/customers/add-customer', verifyToken, verifyPermission('Customers', 'add'), CustomerController.addCustomer)
api.post('/customers/update-customer/:id', verifyToken, verifyPermission('Customers', 'update'), CustomerController.updateCustomer)
api.delete('/customers/delete-customer/:id', verifyToken, verifyPermission('Customers', 'delete'), CustomerController.deleteCustomer)
api.get('/customers/update-status/:id', verifyToken, verifyPermission('Customers', 'update'), CustomerController.updateCustomerStatus)

api.post('/allDesignation', verifyToken, verifyPermission('Designation', 'view'), DesignationController.allDesignation)
api.post('/designation/add-designation', verifyToken, verifyPermission('Designation', 'add'), DesignationController.addDesignation)
api.post('/designation/update-designation/:id', verifyToken, verifyPermission('Designation', 'update'), DesignationController.updateDesignation)
api.get('/designation/update-status/:id', verifyToken, verifyPermission('Designation', 'update'), DesignationController.updateDesignationStatus)
api.delete('/designation/delete/:id', verifyToken, verifyPermission('Designation', 'delete'), DesignationController.deleteDesignation)
api.get('/designation/:id', verifyToken, verifyPermission('Designation', 'view'), DesignationController.getDesignation)

api.post('/allTicketsTitle', verifyToken, verifyPermission('Tickets Title', 'view'), TicketsTitleController.allTicketsTitle)
api.post('/tickets-title/add-tickets-title', verifyToken, verifyPermission('Tickets Title', 'add'), TicketsTitleController.addTicketsTitle)
api.post('/tickets-title/update-tickets-title/:id', verifyToken, verifyPermission('Tickets Title', 'update'), TicketsTitleController.updateTicketsTitle)
api.delete('/tickets-title/delete-tickets-title/:id', verifyToken, verifyPermission('Tickets Title', 'delete'), TicketsTitleController.deleteTicketsTitle)
api.get('/tickets-title/update-status/:id', verifyToken, verifyPermission('Tickets Title', 'update'), TicketsTitleController.updateTicketsTitleStatus)

api.post('/allTicketForm', verifyToken, verifyPermission('Tickets Forms', 'view'), TicketsFormController.allTicketForm)
api.post('/ticket-form/add-ticket-form', verifyToken, verifyPermission('Tickets Forms', 'add'), TicketsFormController.addTicketForm)
api.post('/ticket-form/update-ticket-form/:id', verifyToken, verifyPermission('Tickets Forms', 'update'), TicketsFormController.updateTicketForm)
api.get('/ticket-form/update-status/:id', verifyToken, verifyPermission('Tickets Forms', 'update'), TicketsFormController.updateTicketFormStatus)
api.delete('/ticket-form/delete-ticket-form/:id', verifyToken, verifyPermission('Tickets Forms', 'delete'), TicketsFormController.deleteTicketForm)
api.get('/ticket-form/by-ticket-title/:id', verifyToken, verifyPermission('Tickets Forms', 'view'), TicketsFormController.getTicketFormByTicketTitle)
api.get('/ticket-form/:id', verifyToken, verifyPermission('Tickets Forms', 'view'), TicketsFormController.getTicketForm)

api.post('/allLeadTitles', verifyToken, verifyPermission('Lead Titles', 'view'), LeadTitlesController.allLeadTitles)
api.post('/lead-titles/add-lead-title', verifyToken, verifyPermission('Lead Titles', 'add'), LeadTitlesController.addLeadTitle)
api.post('/lead-titles/update-lead-title/:id', verifyToken, verifyPermission('Lead Titles', 'update'), LeadTitlesController.updateLeadTitle)
api.get('/lead-titles/update-lead-title-status/:id', verifyToken, verifyPermission('Lead Titles', 'update'), LeadTitlesController.updateLeadTitleStatus)
api.delete('/lead-titles/delete-lead-title/:id', verifyToken, verifyPermission('Lead Titles', 'delete'), LeadTitlesController.deleteLeadTitle)

api.post('/allLeadForms', verifyToken, verifyPermission('Lead Forms', 'view'), LeadFormsController.allLeadForms)
api.post('/lead-forms/add-lead-form', verifyToken, verifyPermission('Lead Forms', 'add'), LeadFormsController.addLeadForm)
api.post('/lead-forms/update-lead-form/:id', verifyToken, verifyPermission('Lead Forms', 'update'), LeadFormsController.updateLeadForm)
api.get('/lead-forms/update-lead-form-status/:id', verifyToken, verifyPermission('Lead Forms', 'update'), LeadFormsController.updateLeadFormStatus)
api.delete('/lead-forms/delete-lead-form/:id', verifyToken, verifyPermission('Lead Forms', 'delete'), LeadFormsController.deleteLeadForm)
api.get('/lead-forms/:id', verifyToken, verifyPermission('Lead Forms', 'view'), LeadFormsController.getLeadForm)
api.get('/lead-forms/by-lead-title/:id', verifyToken, verifyPermission('Lead Forms', 'view'), LeadFormsController.getLeadFormByLeadTitle)

api.post('/allLeads', verifyToken, verifyPermission('Leads', 'view'), LeadsController.allLeads)
api.post('/leads/findCustomer', verifyToken, verifyPermission('Leads', 'view'), LeadsController.findCustomer)
api.post('/leads/add-lead', verifyToken, verifyPermission('Leads', 'add'), LeadsController.addLead)
api.post('/leads/update-lead/:id', verifyToken, verifyPermission('Leads', 'update'), LeadsController.updateLead)
api.delete('/leads/delete-lead/:id', verifyToken, verifyPermission('Leads', 'delete'), LeadsController.deleteLead)
api.get('/leads/:id', verifyToken, verifyPermission('Leads', 'view'), LeadsController.fetchLeadById)

api.post('/allTicket', verifyToken, TicketsController.fetchUsersTikets)
api.post('/ticket/add-ticket', verifyToken, TicketsController.addTicket)
api.get('/ticket/:id', verifyToken, TicketsController.viewTicket)

api.post('/all-platforms', verifyToken, verifyPermission('Platforms', 'view'), PlatformController.allPlatforms)
api.post('/add-platform', verifyToken, verifyPermission('Platforms', 'add'), PlatformController.addPlatform)
api.post('/platforms/update-platform/:id', verifyToken, verifyPermission('Platforms', 'update'), PlatformController.updatePlatform)
api.get('/platforms/update-status/:id', verifyToken, verifyPermission('Platforms', 'update'), PlatformController.updateStatus)
api.delete('/platforms/delete-platform/:id', verifyToken, verifyPermission('Platforms', 'delete'), PlatformController.deletePlatform)

api.post('/all-packages', verifyToken, verifyPermission('Packages', 'view'), PackagesController.allPackages)
api.post('/add-package', verifyToken, verifyPermission('Packages', 'add'), PackagesController.addPackage)
api.post('/packages/update-package/:id', verifyToken, verifyPermission('Packages', 'update'), PackagesController.updatePackage)
api.get('/packages/update-status/:id', verifyToken, verifyPermission('Packages', 'update'), PackagesController.updatePackageStatus)
api.delete('/packages/delete-package/:id', verifyToken, verifyPermission('Packages', 'delete'), PackagesController.deletePackage)
api.get('/packages/update-popular-package/:id', verifyToken, verifyPermission('Packages', 'update'), PackagesController.updatePopularPackage)



export default api;