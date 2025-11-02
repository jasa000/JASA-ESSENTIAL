
'use server';
import { v2 as cloudinary } from 'cloudinary';
import { getProducts } from './data';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function getCloudinaryUsage() {
  try {
    const result = await cloudinary.api.usage();
    return result;
  } catch (error) {
    console.error('Error fetching Cloudinary usage:', error);
    throw new Error('Could not fetch Cloudinary usage data.');
  }
}

export async function getAllCloudinaryImages() {
  try {
    const { resources } = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute();

    const allProducts = await getProducts();
    const usedUrls = new Set(allProducts.flatMap(p => p.imageNames || []));

    const images = resources.map((resource: any) => ({
      id: resource.public_id,
      url: resource.secure_url,
      createdAt: resource.created_at,
      isUsed: usedUrls.has(resource.secure_url),
    }));

    return images;
  } catch (error) {
    console.error('Error fetching Cloudinary images:', error);
    throw new Error('Could not fetch images from Cloudinary.');
  }
}


export async function deleteCloudinaryImage(publicId: string) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting Cloudinary image:', error);
        throw new Error('Could not delete image from Cloudinary.');
    }
}

export async function unsignedUpload(file: string, preset: string) {
    try {
        const result = await cloudinary.uploader.upload(file, {
            upload_preset: preset,
        });
        return result;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Image upload failed.');
    }
}
