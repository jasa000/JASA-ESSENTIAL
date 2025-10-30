
"use client";

import { createContext, useReducer, ReactNode, useEffect, useState } from 'react';
import type { Product, CartItem } from '@/lib/types';

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_STATE'; payload: CartState };

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
    default:
      return state;
  }
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
};

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  
  useEffect(() => {
    setIsClient(true);
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        dispatch({ type: 'SET_STATE', payload: JSON.parse(storedCart) });
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('cart', JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }
  }, [state, isClient]);

  const addItem = (product: Product) => dispatch({ type: 'ADD_ITEM', payload: product });
  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  const updateQuantity = (id: string, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};
