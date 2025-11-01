
import type { Product, Category, Brand } from './types';
import imageData from './placeholder-images.json';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';

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

const productsCollection = collection(db, 'products');
const brandsCollection = collection(db, 'brands');

export const getProducts = async (category?: Product['category']): Promise<Product[]> => {
    try {
        let q;
        if (category) {
            q = query(productsCollection, where('category', '==', category), orderBy('createdAt', 'desc'));
        } else {
            q = query(productsCollection, orderBy('createdAt', 'desc'));
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
        console.error("Error getting products: ", error);
        throw new Error("Failed to fetch products.");
    }
}

export const getBrands = async (category?: Brand['category']): Promise<Brand[]> => {
    try {
        let q;
        if (category) {
            q = query(brandsCollection, where('category', '==', category), orderBy('name', 'asc'));
        } else {
            q = query(brandsCollection, orderBy('name', 'asc'));
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
    } catch (error) {
        console.error("Error getting brands: ", error);
        throw new Error("Failed to fetch brands.");
    }
}


export const addProduct = async (productData: Omit<Product, 'id' | 'images' | 'rating' | 'createdAt'> & { imageNames: string[] }) => {
  const { imageNames, ...rest } = productData;
  const newProduct: Omit<Product, 'id'> = {
    ...rest,
    images: getProductImages(imageNames, productData.category, productData.description),
    rating: Math.floor(Math.random() * 3) + 3, // 3 to 5 stars
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(productsCollection, newProduct);
    return { ...newProduct, id: docRef.id } as Product;
  } catch (error) {
    console.error("Error adding product: ", error);
    throw new Error("Failed to add product to database.");
  }
};

export const addBrand = async (brandData: Omit<Brand, 'id'>) => {
    const newBrand = {
        ...brandData,
        createdAt: serverTimestamp(),
    }
    try {
        const docRef = await addDoc(brandsCollection, newBrand);
        return { ...newBrand, id: docRef.id } as Brand;
    } catch (error) {
        console.error("Error adding brand: ", error);
        throw new Error("Failed to add brand to database.");
    }
}
