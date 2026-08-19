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

api.post('/allCustomers', verifyToken, CustomerController.allCustomers)
api.post('/customers/add-customer', verifyToken, CustomerController.addCustomer)
api.post('/customers/update-customer/:id', verifyToken, CustomerController.updateCustomer)
api.delete('/customers/delete-customer/:id', verifyToken, CustomerController.deleteCustomer)
api.get('/customers/update-status/:id', verifyToken, CustomerController.updateCustomerStatus)

api.post('/allDesignation', verifyToken, DesignationController.allDesignation)
api.post('/designation/add-designation', verifyToken, DesignationController.addDesignation)
api.post('/designation/update-designation/:id', verifyToken, DesignationController.updateDesignation)
api.get('/designation/:id', verifyToken, DesignationController.getDesignation)
api.get('/designation/update-status/:id', verifyToken, DesignationController.updateDesignationStatus)

api.post('/allTicketsTitle', verifyToken, TicketsTitleController.allTicketsTitle)
api.post('/tickets-title/add-tickets-title', verifyToken, TicketsTitleController.addTicketsTitle)
api.post('/tickets-title/update-tickets-title/:id', verifyToken, TicketsTitleController.updateTicketsTitle)
api.delete('/tickets-title/delete-tickets-title/:id', verifyToken, TicketsTitleController.deleteTicketsTitle)
api.get('/tickets-title/update-status/:id', verifyToken, TicketsTitleController.updateTicketsTitleStatus)

api.post('/allTicketForm', verifyToken, TicketsFormController.allTicketForm)
api.get('/ticket-form/:id', verifyToken, TicketsFormController.getTicketForm)
api.get('/ticket-form/by-ticket-title/:id', verifyToken, TicketsFormController.getTicketFormByTicketTitle)
api.post('/ticket-form/add-ticket-form', verifyToken, TicketsFormController.addTicketForm)
api.post('/ticket-form/update-ticket-form/:id', verifyToken, TicketsFormController.updateTicketForm)
api.get('/ticket-form/update-status/:id', verifyToken, TicketsFormController.updateTicketFormStatus)
api.delete('/ticket-form/delete-ticket-form/:id', verifyToken, TicketsFormController.deleteTicketForm)

api.post('/allLeadTitles', verifyToken, LeadTitlesController.allLeadTitles)
api.post('/lead-titles/add-lead-title', verifyToken, LeadTitlesController.addLeadTitle)
api.post('/lead-titles/update-lead-title/:id', verifyToken, LeadTitlesController.updateLeadTitle)
api.get('/lead-titles/update-lead-title-status/:id', verifyToken, LeadTitlesController.updateLeadTitleStatus)
api.delete('/lead-titles/delete-lead-title/:id', verifyToken, LeadTitlesController.deleteLeadTitle)


api.post('/allLeadForms', verifyToken, LeadFormsController.allLeadForms)
api.post('/lead-forms/add-lead-form', verifyToken, LeadFormsController.addLeadForm)
api.get('/lead-forms/:id', verifyToken, LeadFormsController.getLeadForm)
api.post('/lead-forms/update-lead-form/:id', verifyToken, LeadFormsController.updateLeadForm)
api.get('/lead-forms/update-lead-form-status/:id', verifyToken, LeadFormsController.updateLeadFormStatus)
api.delete('/lead-forms/delete-lead-form/:id', verifyToken, LeadFormsController.deleteLeadForm)
api.get('/lead-forms/by-lead-title/:id', verifyToken, LeadFormsController.getLeadFormByLeadTitle)

api.post('/leads/findCustomer', verifyToken, LeadsController.findCustomer)
api.post('/leads/add-lead', verifyToken, LeadsController.addLead)
api.post('/allLeads', verifyToken, LeadsController.allLeads)
api.get('/leads/:id', verifyToken, LeadsController.fetchLeadById)
api.post('/leads/update-lead/:id', verifyToken, LeadsController.updateLead)

api.post('/ticket/add-ticket', verifyToken, TicketsController.addTicket)
api.post('/allTicket', verifyToken, TicketsController.fetchUsersTikets)
api.get('/ticket/:id', verifyToken, TicketsController.viewTicket)

api.post('/add-platform', verifyToken, PlatformController.addPlatform)
api.post('/all-platforms', verifyToken, PlatformController.allPlatforms)
api.post('/platforms/update-platform/:id', verifyToken, PlatformController.updatePlatform)
api.get('/platforms/update-status/:id', verifyToken, PlatformController.updateStatus)
api.delete('/platforms/delete-platform/:id', verifyToken, PlatformController.deletePlatform)

api.post('/add-package', verifyToken, PackagesController.addPackage)
api.post('/all-packages', verifyToken, PackagesController.allPackages)
api.post('/packages/update-package/:id', verifyToken, PackagesController.updatePackage)
api.get('/packages/update-status/:id', verifyToken, PackagesController.updatePackageStatus)
api.delete('/packages/delete-package/:id', verifyToken, PackagesController.deletePackage)
api.get('/packages/update-popular-package/:id', verifyToken, PackagesController.updatePopularPackage)



export default api;