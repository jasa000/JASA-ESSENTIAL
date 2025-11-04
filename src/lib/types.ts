

export type Product = {
  id: string;
  name: string;
  brandIds?: string[];
  authorIds?: string[];
  productTypeIds?: string[];
  description: string;
  category: 'stationary' | 'books' | 'electronics';
  price: number;
  discountPrice?: number;
  rating?: number;
  createdAt: any;
  imageNames?: string[];
};

export type CartItem = {
  product: Product;
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
  shortId: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'seller' | 'delivery';
  mobile?: string;
  altMobiles?: { value: string }[];
  altEmails?: { value: string }[];
  addresses?: {
    type: 'Home' | 'Work';
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
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

export const SHOP_SERVICES = ['stationary', 'books', 'electronics', 'xerox'] as const;
export type ShopService = typeof SHOP_SERVICES[number];

export type Shop = {
  id:string;
  name: string;
  address: string;
  ownerIds: string[];
  ownerNames?: string[];
  services: ShopService[];
  notes?: string;
  createdAt: any;
};
    
export type Brand = {
  id: string;
  name: string;
  category: 'stationary' | 'electronics';
  createdAt: any;
};

export type Author = {
  id: string;
  name: string;
  createdAt: any;
};

export type ProductType = {
  id: string;
  name: string;
  category: 'stationary' | 'books' | 'electronics';
  createdAt: any;
};

export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  category: "stationary" | "books" | "electronics" | "xerox";
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  seller: string;
  tracking: {
    ordered: string;
    confirmed?: string;
    shipped?: string;
    delivered?: string;
    expectedDelivery?: string;
  };
  cancellationReason?: string;
};

export type Banner = {
  id: string;
  title: string;
  cta: string;
  href: string;
  imageUrl: string;
  isVisible: boolean;
};

export type HomepageContent = {
    isWelcomeVisible: boolean;
    welcomeImageUrl?: string;
    categoryImages: {
        stationary?: string;
        books?: string;
        xerox?: string;
        electronics?: string;
    },
    banners: Banner[];
};

    

    
