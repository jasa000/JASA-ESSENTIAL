
import { NextRequest, NextResponse } from "next/server";
import formidable, { File } from "formidable";
import fs from "fs";
import { getDriveClient } from "@/lib/googleDrive";

// Disable the default body parser for this route
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper function to parse the form data from a NextRequest
const parseForm = async (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise(async (resolve, reject) => {
        const chunks: any[] = [];
        const reader = req.body!.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);
        const form = formidable({});

        form.parse(buffer, (err, fields, files) => {
            if (err) {
                return reject(err);
            }
            resolve({ fields, files });
        });
    });
};


export async function POST(req: NextRequest) {
    let tempFilePath: string | undefined;

    try {
        const { files } = await parseForm(req);
        
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        
        tempFilePath = file.filepath;

        const drive = getDriveClient();

        const folderId = process.env.GOOGLE_FOLDER_ID || undefined;
        const fileMetadata: any = { name: file.originalFilename || 'Untitled' };
        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const media = {
            mimeType: file.mimetype || "application/octet-stream",
            body: fs.createReadStream(tempFilePath),
        };

        const uploadResponse = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: "id", // Only need the ID
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

        // Construct the public download URL
        const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        return NextResponse.json({
            success: true,
            fileId: fileId,
            url: publicUrl, // Use the direct download URL
        }, { status: 200 });

    } catch (e: any) {
        console.error('Error in POST /api/upload:', e);
        return NextResponse.json({ error: "Upload failed", details: e.message }, { status: 500 });
    } finally {
        // Clean up the temporary file from the server
        if (tempFilePath) {
            fs.unlink(tempFilePath, (err) => {
                if (err) console.error("Failed to delete temporary file:", tempFilePath, err);
            });
        }
    }
}
