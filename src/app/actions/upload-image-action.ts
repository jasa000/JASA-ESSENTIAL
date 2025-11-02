
'use server';

import { unsignedUpload } from '@/lib/cloudinary';

export async function uploadImageAction(
  base64Image: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.");
    }
    
    const result = await unsignedUpload(base64Image, process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    
    return { success: true, url: result.secure_url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
