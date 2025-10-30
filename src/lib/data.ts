
import type { Product, Category } from './types';
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
  };
};

const getProductImage = (imageName: string, category: Product['category'], alt: string) => {
    return {
        src: `/images/${category}/${imageName}`,
        alt: alt,
    };
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

export let products: Product[] = [
  {
    id: 'prod_1',
    name: 'CX-Scientific calculator',
    brand: 'CALTRIX',
    description: 'A scientific calculator.',
    price: 600,
    category: 'electronics',
    rating: 5,
    image: { src: '/images/electronics/calculator.jpg', alt: 'A scientific calculator.' },
  },
  {
    id: 'prod_2',
    name: 'Bril ink Bottle',
    brand: 'BRIL',
    description: 'A bottle of ink.',
    price: 25,
    category: 'stationary',
    rating: 4,
    image: { src: '/images/stationary/ink-bottle.jpg', alt: 'A bottle of ink.' },
  },
  {
    id: 'prod_3',
    name: 'Kangaroo Stapler',
    brand: 'KANGARO',
    description: 'A stapler.',
    price: 60,
    category: 'stationary',
    rating: 5,
    image: { src: '/images/stationary/stapler.jpg', alt: 'A stapler.'},
  },
  {
    id: 'prod_4',
    name: 'XO-BALL P',
    brand: 'HAUSHER',
    description: 'A ball point pen.',
    price: 10,
    category: 'stationary',
    rating: 4,
    image: { src: '/images/stationary/ball-pen.jpg', alt: 'A ball point pen.'},
  },
];


export const addProduct = (product: Omit<Product, 'id' | 'rating' | 'image'> & { imageName: string }) => {
  const newId = `prod_${Date.now()}`;
  const newProduct: Product = {
    ...product,
    id: newId,
    rating: 5, // Default rating
    image: getProductImage(product.imageName, product.category, product.description),
  };
  products.unshift(newProduct); // Add to the beginning of the array
  return newProduct;
};
