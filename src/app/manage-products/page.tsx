
"use client";

import { useState } from "react";
import { products, addProduct } from "@/lib/data";
import ProductCard from "@/components/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const categories: { value: Product['category'], label: string }[] = [
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
];

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  brand: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  imageName: z.string().min(1, "Image filename is required."),
  category: z.enum(['stationary', 'books', 'electronics']),
});


export default function ManageProductsPage() {
  const [activeTab, setActiveTab] = useState<Product['category']>('stationary');
  const [productList, setProductList] = useState<Product[]>(products);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      description: "",
      price: 0,
      imageName: "",
      category: activeTab,
    },
  });
  
  // Update form's category when tab changes
  useState(() => {
    form.setValue('category', activeTab);
  });


  const onSubmit = (values: z.infer<typeof productSchema>) => {
    try {
      const newProduct = addProduct(values);
      setProductList([newProduct, ...productList]); // Update local state to re-render
      toast({
        title: "Product Created",
        description: `${values.name} has been added successfully.`,
      });
      form.reset();
      form.setValue('category', activeTab); // Reset category to the active one
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the product.",
      });
    }
  };
  
  const filteredProducts = productList.filter(product => 
    product.category === activeTab
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Manage Products</h1>
      <p className="mt-2 text-muted-foreground">Add, edit, and manage your products.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Product</CardTitle>
                        <CardDescription>Add a new item to your inventory.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="brand" render={({ field }) => (
                                    <FormItem><FormLabel>Brand</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="imageName" render={({ field }) => (
                                    <FormItem><FormLabel>Image Filename</FormLabel><FormControl><Input placeholder="e.g., product.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" className="w-full">Add Product</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={(value) => {
                    const newCategory = value as Product['category'];
                    setActiveTab(newCategory);
                    form.setValue('category', newCategory);
                }} className="w-full">
                    <div className="sticky top-20 z-10 bg-background py-4">
                        <TabsList className="grid w-full grid-cols-3">
                            {categories.map((cat) => (
                                <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                    
                    <TabsContent value={activeTab} className="mt-8">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
    </div>
  );
}
