
import type { Product, Category, Brand } from './types';
import imageData from './placeholder-images.json';

const getCategoryImage = (id: string, width = 400, height = 400) => {
  const image = imageData.placeholderImages.find(img => img.id === id);
  if (!image) {
    // Fallback image
    return { 
      src: `https://picsum.photos/seed/${id}/${width}/${height}`, 
      alt: "Placeholder image", 
      width: width, 
      height: height,
    };
  }
  return { 
    src: image.imageUrl, 
    alt: image.description,
    width: width,
    height: height,
    hint: image.imageHint,
  };
};

const getProductImages = (imageNames: string[], category: Product['category'], alt: string) => {
    return imageNames.map(name => ({
        src: `/images/${category}/${name}`,
        alt: alt,
    }));
};


export const categories: Category[] = [
    {
        id: 'cat-1',
        name: 'STATIONARY PRODUCTS',
        href: '/stationary',
        icon: 'Notebook',
        image: getCategoryImage('category-1', 96, 96),
    },
    {
        id: 'cat-2',
        name: 'BOOK',
        href: '/books',
        icon: 'Book',
        image: getCategoryImage('category-2', 96, 96),
    },
    {
        id: 'cat-3',
        name: 'XEROX',
        href: '/xerox',
        icon: 'Printer',
        image: getCategoryImage('category-3', 96, 96),
    },
    {
        id: 'cat-4',
        name: 'ELECTRONIC KIT',
        href: '/electronics',
        icon: 'CircuitBoard',
        image: getCategoryImage('category-4', 96, 96),
    }
]

export let products: Product[] = [];

export let brands: Brand[] = [];

export const addProduct = (product: Omit<Product, 'id' | 'images' | 'rating'> & { imageNames: string[] }) => {
  const newId = `prod_${Date.now()}`;
  const newProduct: Product = {
    ...product,
    id: newId,
    images: getProductImages(product.imageNames, product.category, product.description),
    rating: Math.floor(Math.random() * 3) + 3, // 3 to 5 stars
  };
  products.unshift(newProduct); 
  return newProduct;
};

export const addBrand = (brand: Omit<Brand, 'id'>) => {
    const newId = `brand_${brand.name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`;
    const newBrand: Brand = {
        ...brand,
        id: newId,
    };
    brands.unshift(newBrand);
    return newBrand;
}
