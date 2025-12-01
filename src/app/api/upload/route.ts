
import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/googleDrive";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
    let tempFilePath: string | undefined;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Create a temporary file path
        tempFilePath = path.join(os.tmpdir(), file.name);

        // Write the file to the temporary location
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(tempFilePath, fileBuffer);

        const drive = getDriveClient();
        const folderId = process.env.GOOGLE_FOLDER_ID || undefined;
        
        const fileMetadata: any = { name: file.name };
        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const media = {
            mimeType: file.type,
            body: require('fs').createReadStream(tempFilePath),
        };

        const uploadResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id",
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

        // Use the direct download URL format
        const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        return NextResponse.json({
            success: true,
            fileId: fileId,
            url: publicUrl,
        }, { status: 200 });

    } catch (e: any) {
        console.error('Error in POST /api/upload:', e);
        return NextResponse.json({ error: "Upload failed", details: e.message }, { status: 500 });
    } finally {
        // Clean up the temporary file
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
            } catch (unlinkError) {
                console.error("Failed to delete temporary file:", tempFilePath, unlinkError);
            }
        }
    }
}
