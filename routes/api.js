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
api.get('/findCustomer/:email', LoginController.findCustomer)
api.post('/login', LoginController.adminLogin)

// .............for customer side..................................
api.post('/customer-all-platforms', PlatformController.customerAllPlatforms)
api.post('/customer-all-packages', PackagesController.customerAllPackages)
api.get('/all-options', DropDownController.allDropDowns)

api.get('/admin-all-options', verifyToken, DropDownController.adminAllDropDowns)

api.post('/allUsers', verifyToken, UserController.allUsers)
api.get('/users/update-role/:id/:role', verifyToken, UserController.updateUserRole)
api.get('/users/update-designation/:id/:designation', verifyToken, UserController.updateUserDesignation)
api.get('/users/update-status/:id', verifyToken, UserController.updateUserStatus)

api.post('/allDesignation', verifyToken, DesignationController.allDesignation)
api.post('/designation/add-designation', verifyToken, DesignationController.addDesignation)
api.post('/designation/update-designation/:id', verifyToken, DesignationController.updateDesignation)
api.get('/designation/:id', verifyToken, DesignationController.getDesignation)
api.get('/designation/update-status/:id', verifyToken, DesignationController.updateDesignationStatus)

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