export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
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
