
"use client";

import { useState } from "react";
import { products } from "@/lib/data";
import ProductCard from "@/components/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/lib/types";

const categories: { value: Product['category'] | 'all', label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
];

export default function ManageProductsPage() {
  const [activeTab, setActiveTab] = useState<Product['category'] | 'all'>('all');

  const filteredProducts = products.filter(product => 
    activeTab === 'all' || product.category === activeTab
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Manage Products</h1>
      <p className="mt-2 text-muted-foreground">Add, edit, and manage your products.</p>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-8">
        <div className="sticky top-20 z-40 bg-background py-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              {categories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
              ))}
          </TabsList>
        </div>
        
        <TabsContent value={activeTab}>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center">
                        <p className="text-muted-foreground">No products found in this category.</p>
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
