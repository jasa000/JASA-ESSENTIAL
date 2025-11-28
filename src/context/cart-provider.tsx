
"use client";

import { createContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import type { Product, CartItem, DBCartItem } from '@/lib/types';
import { useAuth } from './auth-provider';
import { updateUserProfile } from '@/lib/users';
import { getProducts } from '@/lib/data';

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_STATE'; payload: CartState }
  | { type: 'CLEAR_CART' };


const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === action.payload.id
      );
      if (existingItemIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += 1;
        return { ...state, items: updatedItems };
      }
      return { ...state, items: [...state.items, { product: action.payload, quantity: 1 }] };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload.id),
      };
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.product.id !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case 'SET_STATE': {
      return action.payload;
    }
    case 'CLEAR_CART': {
        return { items: [] };
    }
    default:
      return state;
  }
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isInitialized, setIsInitialized] = useState(false);

  const saveCartToDb = useCallback(async (cartItems: CartItem[]) => {
    if (user?.uid) {
      const dbCart: DBCartItem[] = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      try {
        await updateUserProfile(user.uid, { cart: dbCart });
      } catch (error) {
        console.error("Failed to save cart to DB", error);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    if (authLoading) return;

    const initializeCart = async () => {
      let localCart: CartItem[] = [];
      try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          localCart = JSON.parse(storedCart);
        }
      } catch (error) {
        console.error("Failed to load cart from localStorage", error);
      }
      
      if (user) {
        const dbCart = user.cart || [];
        if (dbCart.length > 0 || localCart.length > 0) {
          const allProducts = await getProducts(); // Fetch all products to resolve IDs
          const productMap = new Map(allProducts.map(p => [p.id, p]));
          
          const mergedCartMap = new Map<string, CartItem>();

          // Process local cart first
          localCart.forEach(item => {
            mergedCartMap.set(item.product.id, item);
          });
          
          // Merge DB cart, overwriting quantities
          dbCart.forEach(dbItem => {
            const product = productMap.get(dbItem.productId);
            if (product) {
               mergedCartMap.set(product.id, { product, quantity: dbItem.quantity });
            }
          });

          const mergedItems = Array.from(mergedCartMap.values());
          dispatch({ type: 'SET_STATE', payload: { items: mergedItems } });
          saveCartToDb(mergedItems);
        } else {
          dispatch({ type: 'SET_STATE', payload: { items: [] } });
        }
      } else {
        dispatch({ type: 'SET_STATE', payload: { items: localCart } });
      }
      setIsInitialized(true);
    };

    initializeCart();
  }, [user, authLoading, saveCartToDb]);
  
  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem('cart', JSON.stringify(state));
            if (user) {
                saveCartToDb(state.items);
            }
        } catch (error) {
            console.error("Failed to sync cart", error);
        }
    }
  }, [state, isInitialized, user, saveCartToDb]);

  const addItem = (product: Product) => dispatch({ type: 'ADD_ITEM', payload: product });
  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  const updateQuantity = (id: string, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
