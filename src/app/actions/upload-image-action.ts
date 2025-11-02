
'use server';

import { unsignedUpload } from '@/lib/cloudinary';

export async function uploadImageAction(
  base64Image: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!uploadPreset) {
        throw new Error("Cloudinary upload preset is not configured. Please set CLOUDINARY_UPLOAD_PRESET in your environment variables.");
    }
    
    const result = await unsignedUpload(base64Image, uploadPreset);
    
    return { success: true, url: result.secure_url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
