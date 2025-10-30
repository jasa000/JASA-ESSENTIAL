
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
      hint: "stationery"
    };
  }
  return { 
    src: image.imageUrl, 
    alt: image.description,
    width: width,
    height: height,
    hint: image.imageHint
  };
};

const getProductImage = (category: Product['category'], imageName: string, alt: string) => {
    return {
        src: `/images/${category}/${imageName}`,
        alt: alt,
        hint: alt.toLowerCase().split(' ').slice(0, 2).join(' ')
    }
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
    description: 'A5 size, 240 lined pages. Perfect for notes and journaling.',
    price: 600,
    category: 'electronics',
    rating: 5,
    image: getProductImage('electronics', 'calculator.jpg', 'A scientific calculator.'),
  },
  {
    id: 'prod_2',
    name: 'Bril ink Bottle',
    brand: 'BRIL',
    description: 'Smooth-writing medium nib with a classic black and gold finish.',
    price: 25,
    category: 'stationary',
    rating: 4,
    image: getProductImage('stationary', 'ink-bottle.jpg', 'A bottle of ink.'),
  },
  {
    id: 'prod_3',
    name: 'Kangaroo Stapler',
    brand: 'KANGARO',
    description: 'Keep your workspace tidy with this elegant wooden organizer.',
    price: 60,
    category: 'stationary',
    rating: 5,
    image: getProductImage('stationary', 'stapler.jpg', 'A stapler.'),
  },
  {
    id: 'prod_4',
    name: 'XO-BALL P',
    brand: 'HAUSHER',
    description: 'A4 cold-press paper, 30 sheets. Ideal for all water-based media.',
    price: 10,
    category: 'stationary',
    rating: 4,
    image: getProductImage('stationary', 'ball-pen.jpg', 'A ball point pen.'),
  },
];


export const addProduct = (product: Omit<Product, 'id' | 'rating' | 'image'> & { imageName: string }) => {
  const newProduct: Product = {
    ...product,
    id: `prod_${Date.now()}`,
    rating: 5, // Default rating
    image: getProductImage(product.category, product.imageName, product.description),
  };
  products.unshift(newProduct); // Add to the beginning of the array
  return newProduct;
};
