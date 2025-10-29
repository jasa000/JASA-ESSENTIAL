
import type { Product, Category } from './types';
import imageData from './placeholder-images.json';

const getProductImage = (id: string, width = 400, height = 400) => {
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

export const categories: Category[] = [
    {
        id: 'cat-1',
        name: 'STATIONARY PRODUCTS',
        href: '/stationary',
        icon: 'Notebook',
        image: getProductImage('category-1', 96, 96),
    },
    {
        id: 'cat-2',
        name: 'BOOK',
        href: '/books',
        icon: 'Book',
        image: getProductImage('category-2', 96, 96),
    },
    {
        id: 'cat-3',
        name: 'XEROX',
        href: '/xerox',
        icon: 'Printer',
        image: getProductImage('category-3', 96, 96),
    },
    {
        id: 'cat-4',
        name: 'ELECTRONIC KIT',
        href: '/electronics',
        icon: 'CircuitBoard',
        image: getProductImage('category-4', 96, 96),
    }
]

export const products: Product[] = [
  {
    id: 'prod_1',
    name: 'CX-Scientific calculator',
    brand: 'CALTRIX',
    description: 'A5 size, 240 lined pages. Perfect for notes and journaling.',
    price: 600,
    category: 'electronics',
    rating: 5,
    image: getProductImage('product-1'),
  },
  {
    id: 'prod_2',
    name: 'Bril ink Bottle',
    brand: 'BRIL',
    description: 'Smooth-writing medium nib with a classic black and gold finish.',
    price: 25,
    category: 'stationary',
    rating: 4,
    image: getProductImage('product-2'),
  },
  {
    id: 'prod_3',
    name: 'CX-Scientific calculator',
    brand: 'KANGARO',
    description: 'Keep your workspace tidy with this elegant wooden organizer.',
    price: 60,
    category: 'stationary',
    rating: 5,
    image: getProductImage('product-3'),
  },
  {
    id: 'prod_4',
    name: 'XO-BALL P',
    brand: 'HAUSHER',
    description: 'A4 cold-press paper, 30 sheets. Ideal for all water-based media.',
    price: 10,
    category: 'stationary',
    rating: 4,
    image: getProductImage('product-4'),
  },
];
