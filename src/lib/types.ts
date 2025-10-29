
export type Product = {
  id: string;
  name: string;
  brand?: string;
  description: string;
  price: number;
  rating?: number;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    hint: string;
  };
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Category = {
    id: string;
    name: string;
    image: {
        src: string;
        alt: string;
        width: number;
        height: number;
        hint: string;
    }
}

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
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
  createdAt: Date;
}
