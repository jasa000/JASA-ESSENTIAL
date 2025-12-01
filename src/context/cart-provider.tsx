
"use client";

import { createContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import type { Product, CartItem, DBCartItem } from '@/lib/types';
import { useAuth } from './auth-provider';
import { updateUserProfile } from '@/lib/users';
import { getProducts } from '@/lib/data';

type CartState = {
  items: CartItem[];
  selectedItems: string[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_STATE'; payload: CartState }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SELECTED_ITEMS', payload: string[] };


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
       const newItems = state.items.filter((item) => item.product.id !== action.payload.id);
       const newSelectedItems = state.selectedItems.filter(id => id !== action.payload.id);
      return {
        ...state,
        items: newItems,
        selectedItems: newSelectedItems,
      };
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter((item) => item.product.id !== action.payload.id);
        const newSelectedItems = state.selectedItems.filter(id => id !== action.payload.id);
        return {
          ...state,
          items: newItems,
          selectedItems: newSelectedItems,
        };
      }
      const updatedItems = state.items.map((item) =>
        item.product.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        items: updatedItems,
      };
    }
    case 'SET_STATE': {
      return action.payload;
    }
    case 'CLEAR_CART': {
        return { items: [], selectedItems: [] };
    }
    case 'SET_SELECTED_ITEMS': {
        return { ...state, selectedItems: action.payload };
    }
    default:
      return state;
  }
};

type CartContextType = {
  items: CartItem[];
  selectedItems: string[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedItems: (ids: string[]) => void;
};

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [], selectedItems: [] });
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
          const parsedCart = JSON.parse(storedCart);
          // Safely handle both old {items: []} and new [] formats
          if (Array.isArray(parsedCart)) {
              localCart = parsedCart;
          } else if (parsedCart && Array.isArray(parsedCart.items)) {
              localCart = parsedCart.items;
          }
        }
      } catch (error) {
        console.error("Failed to load cart from localStorage", error);
        localCart = []; // Ensure it's an array on error
      }
      
      if (user) {
        const dbCart = user.cart || [];
        if (dbCart.length > 0 || localCart.length > 0) {
          const allProducts = await getProducts();
          const productMap = new Map(allProducts.map(p => [p.id, p]));
          
          const mergedCartMap = new Map<string, CartItem>();

          // Process local cart first
          if(Array.isArray(localCart)) {
            localCart.forEach(item => {
              if(item && item.product && productMap.has(item.product.id)) {
                mergedCartMap.set(item.product.id, {
                    ...item,
                    product: productMap.get(item.product.id)!
                });
              }
            });
          }
          
          // Merge DB cart, overwriting quantities
          dbCart.forEach(dbItem => {
            const product = productMap.get(dbItem.productId);
            if (product) {
               mergedCartMap.set(product.id, { product, quantity: dbItem.quantity });
            }
          });

          const mergedItems = Array.from(mergedCartMap.values());
          // By default, select all items in the cart
          const allItemIds = mergedItems.map(item => item.product.id);
          dispatch({ type: 'SET_STATE', payload: { items: mergedItems, selectedItems: allItemIds } });
          saveCartToDb(mergedItems);
          localStorage.removeItem('cart'); // Clear old local cart after merging into DB
        } else {
          dispatch({ type: 'SET_STATE', payload: { items: [], selectedItems: [] } });
        }
      } else {
        // For guest users, only load from local storage
        const allProducts = await getProducts();
        const productMap = new Map(allProducts.map(p => [p.id, p]));
        const validatedLocalCart = Array.isArray(localCart) ? localCart.map(item => {
          if (!item || !item.product || !item.product.id) return null;
          const product = productMap.get(item.product.id);
          return product ? { product, quantity: item.quantity } : null;
        }).filter((item): item is CartItem => item !== null) : [];
         // By default, select all items in the cart
        const allItemIds = validatedLocalCart.map(item => item.product.id);
        dispatch({ type: 'SET_STATE', payload: { items: validatedLocalCart, selectedItems: allItemIds } });
      }
      setIsInitialized(true);
    };

    initializeCart();
  }, [user, authLoading, saveCartToDb]);
  
  useEffect(() => {
    if (isInitialized && !user) {
        try {
            // Only save items, not selectedItems to localStorage
            localStorage.setItem('cart', JSON.stringify(state.items));
        } catch (error) {
            console.error("Failed to sync cart to localStorage", error);
        }
    } else if (isInitialized && user) {
        saveCartToDb(state.items);
    }
  }, [state.items, isInitialized, user, saveCartToDb]);

  const addItem = (product: Product) => dispatch({ type: 'ADD_ITEM', payload: product });
  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  const updateQuantity = (id: string, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const setSelectedItems = (ids: string[]) => dispatch({ type: 'SET_SELECTED_ITEMS', payload: ids });

  return (
    <CartContext.Provider value={{ items: state.items, selectedItems: state.selectedItems, addItem, removeItem, updateQuantity, clearCart, setSelectedItems }}>
      {children}
    </CartContext.Provider>
  );
};
