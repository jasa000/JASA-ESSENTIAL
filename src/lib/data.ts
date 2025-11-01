

import type { Product, Category, Brand, Author, ProductType } from './types';
import imageData from './placeholder-images.json';
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';

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
const authorsCollection = collection(db, 'authors');
const productTypesCollection = collection(db, 'productTypes');


export const getProducts = async (category?: Product['category']): Promise<Product[]> => {
    try {
        let q;
        if (category) {
            q = query(productsCollection, where('category', '==', category), orderBy('createdAt', 'desc'));
        } else {
            q = query(productsCollection, orderBy('createdAt', 'desc'));
        }
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
            } as Product;
        });
        return products;
    } catch (error) {
        console.error("Error getting products: ", error);
        throw new Error("Failed to fetch products.");
    }
}

export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
            } as Product;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting product by ID: ", error);
        throw new Error("Failed to fetch product.");
    }
};

export const getBrands = async (category?: Brand['category']): Promise<Brand[]> => {
    try {
        const q = category 
            ? query(brandsCollection, where('category', '==', category), orderBy('name', 'asc'))
            : query(brandsCollection, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
    } catch (error) {
        console.error("Error getting brands: ", error);
        throw new Error("Failed to fetch brands.");
    }
}

export const getAuthors = async (): Promise<Author[]> => {
    try {
        const q = query(authorsCollection, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
    } catch (error) {
        console.error("Error getting authors: ", error);
        throw new Error("Failed to fetch authors.");
    }
};

export const getProductTypes = async (category?: ProductType['category']): Promise<ProductType[]> => {
    try {
        const q = category 
            ? query(productTypesCollection, where('category', '==', category), orderBy('name', 'asc'))
            : query(productTypesCollection, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType));
    } catch (error) {
        console.error("Error getting product types: ", error);
        throw new Error("Failed to fetch product types.");
    }
};


export const addProduct = async (productData: Omit<Product, 'id' | 'rating' | 'createdAt'>) => {
  const { ...rest } = productData;
  const newProductData = {
    ...rest,
    rating: Math.floor(Math.random() * 3) + 3, // 3 to 5 stars
    createdAt: serverTimestamp(),
    discountPrice: productData.discountPrice || null,
    imageNames: productData.imageNames || [],
  };

  try {
    const docRef = await addDoc(productsCollection, newProductData);
    const fullProduct = {
      ...newProductData,
      id: docRef.id,
    } as Product
    return fullProduct;
  } catch (error) {
    console.error("Error adding product: ", error);
    throw new Error("Failed to add product to database.");
  }
};

export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id' | 'rating' | 'createdAt'>>) => {
    const { ...rest } = productData;
    const updatedProductData = {
        ...rest,
        discountPrice: productData.discountPrice || null,
    };

    try {
        const productDoc = doc(db, 'products', id);
        await updateDoc(productDoc, updatedProductData);
    } catch (error) {
        console.error("Error updating product: ", error);
        throw new Error("Failed to update product in database.");
    }
};

export const deleteProduct = async (id: string) => {
    try {
        const productDoc = doc(db, 'products', id);
        await deleteDoc(productDoc);
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw new Error("Failed to delete product from database.");
    }
}

export const addBrand = async (brandData: Omit<Brand, 'id' | 'createdAt' | 'category'>, category: Brand['category']) => {
    const newBrand = {
        ...brandData,
        category: category,
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

export const addAuthor = async (authorData: Omit<Author, 'id' | 'createdAt'>) => {
    const newAuthor = {
        ...authorData,
        createdAt: serverTimestamp(),
    };
    try {
        const docRef = await addDoc(authorsCollection, newAuthor);
        return { ...newAuthor, id: docRef.id } as Author;
    } catch (error) {
        console.error("Error adding author: ", error);
        throw new Error("Failed to add author to database.");
    }
};

export const addProductType = async (productTypeData: Omit<ProductType, 'id' | 'createdAt' | 'category'>, category: ProductType['category']) => {
    const newProductType = {
        ...productTypeData,
        category: category,
        createdAt: serverTimestamp(),
    }
    try {
        const docRef = await addDoc(productTypesCollection, newProductType);
        return { ...newProductType, id: docRef.id } as ProductType;
    } catch (error) {
        console.error("Error adding product type: ", error);
        throw new Error("Failed to add product type to database.");
    }
};
    