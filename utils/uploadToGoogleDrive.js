// import { Readable } from "stream";
// import { drive } from "../config/googleDrive.js";
// import "dotenv/config";


// export const uploadToGoogleDrive = async (file) => {
//     const response = await drive.files.create({
//         requestBody: {
//             name: file.originalname,
//             parents: [
//                 process.env.GOOGLE_DRIVE_FOLDER_ID,
//             ],
//         },

//         media: {
//             mimeType: file.mimetype,
//             body: Readable.from(file.buffer),
//         },

//         fields: "id, name, mimeType, size, createdTime",
//     });

//     const fileId = response.data.id;

//     // 2. Make file publicly accessible
//     await drive.permissions.create({
//         fileId,
//         requestBody: {
//             role: "reader",
//             type: "anyone",
//         },
//     });

//     const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

//     return {
//         fileId: response.data.id,
//         name: response.data.name,
//         mimeType: response.data.mimeType,
//         size: response.data.size,
//         createdTime: response.data.createdTime,
//         publicUrl
//     };
// };

import { Readable } from "stream";
import { drive } from "../config/googleDrive.js";
import "dotenv/config";

export const uploadToGoogleDrive = async (file) => {
    // Upload file
    const response = await drive.files.create({
        requestBody: {
            name: file.originalname,
            parents: [
                process.env.GOOGLE_DRIVE_FOLDER_ID,
            ],
        },

        media: {
            mimeType: file.mimetype,
            body: Readable.from(file.buffer),
        },

        fields: "id,name,mimeType,size,createdTime",
    });

    const fileId = response.data.id;

    // Make file public
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    // Get file details and Google Drive links
    const fileData = await drive.files.get({
        fileId,
        fields: "id,name,mimeType,size,createdTime,webViewLink,webContentLink",
    });

    const data = fileData.data;

    const isImage = data.mimeType?.startsWith("image/");

    return {
        fileId: data.id,
        name: data.name,
        mimeType: data.mimeType,
        size: data.size,
        createdTime: data.createdTime,

        // Open file in Google Drive preview
        viewUrl: data.webViewLink,

        // Download file
        downloadUrl: data.webContentLink,

        // For <img>
        imageUrl: isImage
            ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`
            : null,

        // Main URL depending on file type
        url: isImage
            ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`
            : data.webViewLink,
    };
};