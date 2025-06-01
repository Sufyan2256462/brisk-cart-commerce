
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    title: string;
    price: number;
    image_url: string;
    stock: number;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          title,
          price,
          image_url,
          stock
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching cart items:', error);
    } else {
      setCartItems(data || []);
    }
    setLoading(false);
  };

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to add items to your cart."
      });
      return;
    }

    // Check if item already exists in cart
    const existingItem = cartItems.find(item => item.product_id === productId);
    
    if (existingItem) {
      await updateQuantity(productId, existingItem.quantity + quantity);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .insert([
        {
          user_id: user.id,
          product_id: productId,
          quantity
        }
      ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add item to cart."
      });
    } else {
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart."
      });
      fetchCartItems();
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update cart item."
      });
    } else {
      fetchCartItems();
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item from cart."
      });
    } else {
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart."
      });
      fetchCartItems();
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear cart."
      });
    } else {
      setCartItems([]);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => 
      total + (item.products.price * item.quantity), 0
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
