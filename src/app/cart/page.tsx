
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/lib/types";
import { useAuth } from "@/context/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AuthForm from "@/components/auth-form";

const categories: { value: string, label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
]

export default function CartPage() {
  const { user } = useAuth();
  const { items, removeItem, updateQuantity } = useCart();
  const [activeTab, setActiveTab] = useState('all');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const getCategoryItems = (category: string) => {
    if (category === 'all') return items;
    return items.filter(item => item.product.category === category);
  }
  
  const subtotal = items.reduce(
      (acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity,
      0
    );
  const shipping = 5.00; // Assuming a flat shipping rate for the whole cart
  const total = subtotal + shipping;

  const renderOrderSummary = () => {
    if (items.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Total Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>Rs {shipping.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>Rs {total.toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/checkout`}>Proceed to Checkout</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <div className="container mx-auto px-4 py-8 text-center">
          <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground" />
          <h1 className="mt-4 font-headline text-3xl font-bold">Your Cart is Empty</h1>
          {user ? (
            <>
              <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
              <Button asChild className="mt-6">
                <Link href="/">Start Shopping</Link>
              </Button>
            </>
          ) : (
             <>
              <p className="mt-2 text-muted-foreground">Please log in to add items to your cart.</p>
                <DialogTrigger asChild>
                  <Button className="mt-6">Login to Shop</Button>
                </DialogTrigger>
             </>
          )}
        </div>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">Authentication</DialogTitle>
          </DialogHeader>
          <AuthForm onSuccess={() => setIsAuthDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  const categoryItems = getCategoryItems(activeTab);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Your Cart</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <div className="sticky top-20 z-40 bg-background py-4">
          <TabsList className="grid w-full grid-cols-4">
              {categories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
              ))}
          </TabsList>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                {categoryItems.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {categoryItems.map(({ product, quantity }) => {
                          const mainImage = product.imageNames && product.imageNames.length > 0 ? product.imageNames[0] : null;
                          return (
                            <Card key={product.id} className="flex items-center overflow-hidden">
                                <div className="relative h-24 w-24 flex-shrink-0 sm:h-32 sm:w-32 bg-muted">
                                  {mainImage ? (
                                      <Image
                                        src={mainImage}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                      />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-bold text-xl">
                                      JASA
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-grow flex-col p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-grow">
                                    <h2 className="font-headline text-lg font-semibold">{product.name}</h2>
                                    <p className="text-sm text-muted-foreground">Rs {(product.discountPrice || product.price).toFixed(2)}</p>
                                </div>
                                <div className="mt-4 flex items-center gap-2 sm:mt-0">
                                    <div className="flex items-center gap-1 rounded-md border">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={() => updateQuantity(product.id, quantity - 1)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => {
                                                const newQuantity = parseInt(e.target.value, 10);
                                                updateQuantity(product.id, isNaN(newQuantity) ? 0 : newQuantity);
                                            }}
                                            className="h-9 w-12 border-0 text-center text-base font-medium focus-visible:ring-0"
                                            aria-label={`Quantity for ${product.name}`}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={() => updateQuantity(product.id, quantity + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => removeItem(product.id)}
                                        aria-label={`Remove ${product.name} from cart`}
                                    >
                                        <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                                </div>
                            </Card>
                          )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 lg:col-span-3">
                        <p className="text-muted-foreground">No items in this category.</p>
                    </div>
                )}
            </div>
            <div className="lg:col-span-1">
                {renderOrderSummary()}
            </div>
        </div>
      </Tabs>
    </div>
  );
}
