
import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import { getDriveClient } from "../../../lib/googleDrive";

// Helper to parse the form data
const parseForm = (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable();
        form.parse(req as any, (err, fields, files) => {
            if (err) reject(err);
            resolve({ fields, files });
        });
    });
};

export async function POST(req: NextRequest) {
    try {
        const { files } = await parseForm(req);
        
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const drive = getDriveClient();

        const folderId = process.env.GOOGLE_FOLDER_ID || undefined;
        const fileMetadata: any = { name: file.originalFilename };
        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const media = {
            mimeType: file.mimetype || "application/octet-stream",
            body: fs.createReadStream(file.filepath),
        };

        const uploadResponse = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: "id, webViewLink, webContentLink",
        });
        
        const fileId = uploadResponse.data.id;
        if (!fileId) {
            throw new Error("File ID not found after upload.");
        }

        // Make file public (anyone with the link can view)
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        return NextResponse.json({
            fileId: uploadResponse.data.id,
            link: uploadResponse.data.webViewLink,
        }, { status: 200 });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: "Upload failed", details: e.message }, { status: 500 });
    }
}
