

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

export let products: (Product & { price: number, rating: number })[] = [
  {
    id: 'prod_1',
    name: 'CX-Scientific calculator',
    brandIds: ['brand_caltrix'],
    description: 'A scientific calculator.',
    price: 600,
    category: 'electronics',
    rating: 5,
    images: [{ src: '/images/electronics/calculator.jpg', alt: 'A scientific calculator.' }],
  },
  {
    id: 'prod_2',
    name: 'Bril ink Bottle',
    brandIds: ['brand_bril'],
    description: 'A bottle of ink.',
    price: 25,
    category: 'stationary',
    rating: 4,
    images: [{ src: '/images/stationary/ink-bottle.jpg', alt: 'A bottle of ink.' }],
  },
  {
    id: 'prod_3',
    name: 'Kangaroo Stapler',
    brandIds: ['brand_kangaro'],
    description: 'A stapler.',
    price: 60,
    category: 'stationary',
    rating: 5,
    images: [{ src: '/images/stationary/stapler.jpg', alt: 'A stapler.'}],
  },
  {
    id: 'prod_4',
    name: 'XO-BALL P',
    brandIds: ['brand_hausher'],
    description: 'A ball point pen.',
    price: 10,
    category: 'stationary',
    rating: 4,
    images: [{ src: '/images/stationary/ball-pen.jpg', alt: 'A ball point pen.'}],
  },
];

export let brands: Brand[] = [
    { id: 'brand_bril', name: 'BRIL', category: 'stationary' },
    { id: 'brand_kangaro', name: 'KANGARO', category: 'stationary' },
    { id: 'brand_hausher', name: 'HAUSHER', category: 'stationary' },
    { id: 'brand_caltrix', name: 'CALTRIX', category: 'electronics' },
];

export const addProduct = (product: Omit<Product, 'id' | 'images'> & { imageNames: string[] }) => {
  const newId = `prod_${Date.now()}`;
  const newProduct: Product = {
    ...product,
    id: newId,
    images: getProductImages(product.imageNames, product.category, product.description),
  };
  const productForDisplay: any = { ...newProduct, price: 0, rating: 0, brand: product.brandIds && product.brandIds.length > 0 ? brands.find(b => b.id === product.brandIds![0])?.name : '' };
  products.unshift(productForDisplay); 
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
