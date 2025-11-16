

import type { Product, Category, Brand, Author, ProductType, HomepageContent, XeroxService, XeroxOption, XeroxOptionType } from './types';
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp, setDoc, writeBatch, runTransaction } from 'firebase/firestore';

export const categories: Category[] = [
    {
        id: 'cat-1',
        name: 'STATIONARY PRODUCTS',
        href: '/stationary',
        icon: 'Notebook',
        image: { src: '', alt: '', width: 96, height: 96 },
    },
    {
        id: 'cat-2',
        name: 'BOOK',
        href: '/books',
        icon: 'Book',
        image: { src: '', alt: '', width: 96, height: 96 },
    },
    {
        id: 'cat-3',
        name: 'XEROX',
        href: '/xerox',
        icon: 'Printer',
        image: { src: '', alt: '', width: 96, height: 96 },
    },
    {
        id: 'cat-4',
        name: 'ELECTRONIC KIT',
        href: '/electronics',
        icon: 'CircuitBoard',
        image: { src: '', alt: '', width: 96, height: 96 },
    }
]

const productsCollection = collection(db, 'products');
const brandsCollection = collection(db, 'brands');
const authorsCollection = collection(db, 'authors');
const productTypesCollection = collection(db, 'productTypes');
const homepageContentCollection = collection(db, 'homepageContent');
const xeroxServicesCollection = collection(db, 'xeroxServices');


// --- Xerox Form Option Collections ---
const getXeroxOptionCollection = (type: XeroxOptionType) => {
    switch(type) {
        case 'paperType': return collection(db, 'paperTypes');
        case 'colorOption': return collection(db, 'colorOptions');
        case 'bindingType': return collection(db, 'bindingTypes');
        case 'laminationType': return collection(db, 'laminationTypes');
        case 'formatType': return collection(db, 'formatTypes');
        case 'printRatio': return collection(db, 'printRatios');
        default: throw new Error('Invalid Xerox option type');
    }
};

export const getHomepageContent = async (): Promise<HomepageContent | null> => {
    try {
        const docRef = doc(homepageContentCollection, 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as HomepageContent;
        }
        return null; // No content set yet
    } catch (error) {
        console.error("Error getting homepage content: ", error);
        throw new Error("Failed to fetch homepage content.");
    }
}

export const updateHomepageContent = async (content: HomepageContent): Promise<void> => {
    try {
        const docRef = doc(homepageContentCollection, 'main');
        await setDoc(docRef, content, { merge: true });
    } catch (error) {
        console.error("Error updating homepage content: ", error);
        throw new Error("Failed to update homepage content.");
    }
}


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
            ? query(productTypesCollection, where('category', '==', category))
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

// Update and Delete functions for metadata

export const updateBrand = async (id: string, data: { name: string }): Promise<void> => {
    const brandDoc = doc(db, 'brands', id);
    await updateDoc(brandDoc, data);
};

export const deleteBrand = async (id: string): Promise<void> => {
    const brandDoc = doc(db, 'brands', id);
    await deleteDoc(brandDoc);
};

export const updateAuthor = async (id: string, data: { name: string }): Promise<void> => {
    const authorDoc = doc(db, 'authors', id);
    await updateDoc(authorDoc, data);
};

export const deleteAuthor = async (id: string): Promise<void> => {
    const authorDoc = doc(db, 'authors', id);
    await deleteDoc(authorDoc);
};

export const updateProductType = async (id: string, data: { name: string }): Promise<void> => {
    const productTypeDoc = doc(db, 'productTypes', id);
    await updateDoc(productTypeDoc, data);
};

export const deleteProductType = async (id: string): Promise<void> => {
    const productTypeDoc = doc(db, 'productTypes', id);
    await deleteDoc(productTypeDoc);
};

// Xerox Services Functions
export const getXeroxServices = async (): Promise<XeroxService[]> => {
    try {
        const q = query(xeroxServicesCollection, orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as XeroxService));
    } catch (error) {
        console.error("Error getting Xerox services: ", error);
        throw new Error("Failed to fetch Xerox services.");
    }
};

export const addXeroxService = async (serviceData: Omit<XeroxService, 'id' | 'createdAt'>) => {
  const newServiceData = {
    ...serviceData,
    discountPrice: serviceData.discountPrice || null,
    unit: serviceData.unit || "",
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(xeroxServicesCollection, newServiceData);
    return { ...newServiceData, id: docRef.id } as XeroxService;
  } catch (error) {
    console.error("Error adding Xerox service: ", error);
    throw new Error("Failed to add Xerox service to database.");
  }
};

export const updateXeroxService = async (id: string, serviceData: Partial<Omit<XeroxService, 'id' | 'createdAt'>>) => {
    const updatedServiceData = {
        ...serviceData,
        discountPrice: serviceData.discountPrice || null,
        unit: serviceData.unit || "",
    };
    try {
        const serviceDoc = doc(db, 'xeroxServices', id);
        await updateDoc(serviceDoc, updatedServiceData);
    } catch (error) {
        console.error("Error updating Xerox service: ", error);
        throw new Error("Failed to update Xerox service in database.");
    }
};

export const deleteXeroxService = async (id: string) => {
    try {
        const serviceDoc = doc(db, 'xeroxServices', id);
        await deleteDoc(serviceDoc);
    } catch (error) {
        console.error("Error deleting Xerox service: ", error);
        throw new Error("Failed to delete Xerox service from database.");
    }
};

export const updateXeroxServiceOrder = async (updates: {id: string, order: number}[]) => {
    const batch = writeBatch(db);
    updates.forEach(update => {
        const docRef = doc(db, 'xeroxServices', update.id);
        batch.update(docRef, { order: update.order });
    });
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error updating xerox service order: ", error);
        throw new Error("Failed to update service order.");
    }
}


// --- Xerox Form Option Functions ---

export const getXeroxOptions = async (type: XeroxOptionType): Promise<XeroxOption[]> => {
    try {
        const collectionRef = getXeroxOptionCollection(type);
        const q = query(collectionRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as XeroxOption));
    } catch (error) {
        console.error(`Error getting Xerox options for ${type}: `, error);
        throw new Error(`Failed to fetch Xerox options for ${type}.`);
    }
};

export const addXeroxOption = async (type: XeroxOptionType, optionData: Partial<Omit<XeroxOption, 'id' | 'createdAt'>>): Promise<XeroxOption> => {
  const newOptionData = {
    name: optionData.name || '',
    priceBw: optionData.priceBw || 0,
    priceColor: optionData.priceColor || 0,
    isDefault: false, // Always add as not default
    createdAt: serverTimestamp(),
  };

  try {
    const collectionRef = getXeroxOptionCollection(type);
    const docRef = await addDoc(collectionRef, newOptionData);
    return { ...newOptionData, id: docRef.id } as XeroxOption;
  } catch (error) {
    console.error(`Error adding Xerox option to ${type}: `, error);
    throw new Error(`Failed to add Xerox option to ${type}.`);
  }
};

export const updateXeroxOption = async (type: XeroxOptionType, id: string, optionData: Partial<Omit<XeroxOption, 'id' | 'createdAt'>>): Promise<void> => {
    try {
        const collectionRef = getXeroxOptionCollection(type);
        const optionDoc = doc(collectionRef, id);
        const updateData: { [key: string]: any } = { ...optionData };
        
        if (type !== 'paperType') {
            delete updateData.priceBw;
            delete updateData.priceColor;
            delete updateData.isDefault;
        }

        await updateDoc(optionDoc, updateData);
    } catch (error) {
        console.error(`Error updating Xerox option in ${type}: `, error);
        throw new Error(`Failed to update Xerox option in ${type}.`);
    }
};

export const setPaperTypeAsDefault = async (paperTypeId: string) => {
    const paperTypesRef = getXeroxOptionCollection('paperType');
    await runTransaction(db, async (transaction) => {
        // First, find and unset the current default
        const q = query(paperTypesRef, where("isDefault", "==", true));
        const currentDefaultDocs = await transaction.get(q);
        currentDefaultDocs.forEach((docSnapshot) => {
            transaction.update(docSnapshot.ref, { isDefault: false });
        });

        // Now, set the new default
        const newDefaultRef = doc(paperTypesRef, paperTypeId);
        transaction.update(newDefaultRef, { isDefault: true });
    });
};


export const deleteXeroxOption = async (type: XeroxOptionType, id: string): Promise<void> => {
    try {
        const collectionRef = getXeroxOptionCollection(type);
        const optionDoc = doc(collectionRef, id);
        await deleteDoc(optionDoc);
    } catch (error) {
        console.error(`Error deleting Xerox option from ${type}: `, error);
        throw new Error(`Failed to delete Xerox option from ${type}.`);
    }
};

