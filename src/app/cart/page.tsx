
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/lib/types";

const categories: { value: string, label: string }[] = [
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
]

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const [activeTab, setActiveTab] = useState('stationary');

  const subtotal = items.reduce(
    (acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity,
    0
  );
  const shipping = items.length > 0 ? 5.00 : 0;
  const total = subtotal + shipping;

  const filteredItems = items.filter(item => 
    activeTab === 'all' || item.product.category === activeTab
  );
  
  const currentCategoryItems = items.filter(item => item.product.category === activeTab);


  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="mt-4 font-headline text-3xl font-bold">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild className="mt-6">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Your Cart</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <div className="sticky top-20 z-40 bg-background py-4">
          <TabsList className="grid w-full grid-cols-3">
              {categories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
              ))}
          </TabsList>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                {categories.map(cat => (
                    <TabsContent key={cat.value} value={cat.value}>
                        {currentCategoryItems.length > 0 ? (
                             <div className="flex flex-col gap-4">
                                {currentCategoryItems.map(({ product, quantity }) => (
                                <Card key={product.id} className="flex items-center overflow-hidden">
                                    <div className="relative h-24 w-24 flex-shrink-0 sm:h-32 sm:w-32">
                                    <Image
                                        src={product.images[0].src}
                                        alt={product.images[0].alt}
                                        fill
                                        className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-grow flex-col p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex-grow">
                                        <h2 className="font-headline text-lg font-semibold">{product.name}</h2>
                                        <p className="text-sm text-muted-foreground">₹{(product.discountPrice || product.price).toFixed(2)}</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-4 sm:mt-0">
                                        <Input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => {
                                            const newQuantity = parseInt(e.target.value, 10);
                                            updateQuantity(product.id, isNaN(newQuantity) ? 0 : newQuantity);
                                        }}
                                        className="h-10 w-20 text-center"
                                        aria-label={`Quantity for ${product.name}`}
                                        />
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(product.id)}
                                        aria-label={`Remove ${product.name} from cart`}
                                        >
                                        <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                    </div>
                                </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No items in this category.</p>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </div>

            <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹{shipping.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
                </CardContent>
                <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                </CardFooter>
            </Card>
            </div>
        </div>
      </Tabs>
    </div>
  );
}
