import type { Product } from './types';
import imageData from './placeholder-images.json';

const getProductImage = (id: string) => {
  const image = imageData.placeholderImages.find(img => img.id === id);
  if (!image) {
    // Fallback image
    return { 
      src: "https://picsum.photos/seed/fallback/400/300", 
      alt: "Placeholder image", 
      width: 400, 
      height: 300,
      hint: "stationery"
    };
  }
  return { 
    src: image.imageUrl, 
    alt: image.description,
    width: 400,
    height: 300,
    hint: image.imageHint
  };
};

export const products: Product[] = [
  {
    id: 'prod_1',
    name: 'Classic Hardcover Notebook',
    description: 'A5 size, 240 lined pages. Perfect for notes and journaling.',
    price: 19.99,
    image: getProductImage('product-1'),
  },
  {
    id: 'prod_2',
    name: 'Executive Fountain Pen',
    description: 'Smooth-writing medium nib with a classic black and gold finish.',
    price: 45.0,
    image: getProductImage('product-2'),
  },
  {
    id: 'prod_3',
    name: 'Minimalist Desk Organizer',
    description: 'Keep your workspace tidy with this elegant wooden organizer.',
    price: 29.5,
    image: getProductImage('product-3'),
  },
  {
    id: 'prod_4',
    name: 'Watercolor Paper Pad',
    description: 'A4 cold-press paper, 30 sheets. Ideal for all water-based media.',
    price: 22.0,
    image: getProductImage('product-4'),
  },
  {
    id: 'prod_5',
    name: 'Pastel Sticky Note Set',
    description: 'A set of 6 pastel-colored sticky note pads for reminders.',
    price: 8.99,
    image: getProductImage('product-5'),
  },
  {
    id: 'prod_6',
    name: 'Solid Brass Ruler',
    description: 'A durable and stylish 15cm ruler that will last a lifetime.',
    price: 18.0,
    image: getProductImage('product-6'),
  },
  {
    id: 'prod_7',
    name: 'Wax Seal Stamp Kit',
    description: 'Add a touch of elegance to your letters. Includes stamp and wax beads.',
    price: 35.0,
    image: getProductImage('product-7'),
  },
  {
    id: 'prod_8',
    name: 'Refillable Leather Journal',
    description: 'A beautiful and sustainable journal for your thoughts and sketches.',
    price: 55.0,
    image: getProductImage('product-8'),
  },
];
