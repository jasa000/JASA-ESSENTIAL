

export type Product = {
  id: string;
  name: string;
  brandIds?: string[];
  description: string;
  category: 'stationary' | 'books' | 'electronics';
  images: {
    src: string;
    alt: string;
  }[];
};

export type CartItem = {
  product: Product & { price: number }; // Price is now part of the item in cart, not the base product
  quantity: number;
};

export type Category = {
    id: string;
    name: string;
    href: string;
    icon: string;
    image: {
        src: string;
        alt: string;
        width: number;
        height: number;
        hint?: string;
    }
}

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'seller' | 'delivery';
  mobile?: string;
  altMobiles?: string[];
  altEmails?: string[];
  addresses?: {
    type: 'Home' | 'Work';
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }[];
  createdAt: any; // Firestore timestamp can be complex, using 'any' for simplicity
}

export type Post = {
  id: string;
  content: string;
  authorId: string;
  isActive: boolean;
  createdAt: number; // Using number for timestamp (milliseconds)
};

export type Shop = {
  id:string;
  name: string;
  address: string;
  ownerIds: string[];
  ownerNames?: string[];
  notes?: string;
  createdAt: any;
};
    
export type Brand = {
  id: string;
  name: string;
  category: 'stationary' | 'books' | 'electronics';
};
    
