
'use server';
import { v2 as cloudinary } from 'cloudinary';
import { getProducts, getHomepageContent } from './data';
import 'dotenv/config';

// Configuration must be at the top, before any other cloudinary calls
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

    // Fetch all data sources that use images
    const [allProducts, homepageContent] = await Promise.all([
      getProducts(),
      getHomepageContent()
    ]);

    // Create a set of all used image URLs
    const usedUrls = new Set<string>();

    // Add product images
    allProducts.forEach(p => {
      if (p.imageNames) {
        p.imageNames.forEach(url => usedUrls.add(url));
      }
    });

    // Add homepage images
    if (homepageContent) {
      // Add category images
      Object.values(homepageContent.categoryImages).forEach(url => {
        if (url) usedUrls.add(url);
      });
      // Add banner images
      homepageContent.banners.forEach(banner => {
        if (banner.imageUrl) usedUrls.add(banner.imageUrl);
      });
    }

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

export async function deleteCloudinaryImages(publicIds: string[]) {
    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Error deleting multiple Cloudinary images:', error);
        throw new Error('Could not delete images from Cloudinary.');
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
