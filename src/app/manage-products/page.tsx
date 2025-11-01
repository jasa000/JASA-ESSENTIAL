
"use client";

import { useState, useEffect } from "react";
import { getProducts, addProduct, getBrands, addBrand, getAuthors, addAuthor } from "@/lib/data";
import ProductCard from "@/components/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product, Brand, Author } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const categories: { value: Product['category'], label: string }[] = [
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
];

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  brandIds: z.array(z.string()).optional(),
  authorIds: z.array(z.string()).optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  imageNames: z.array(z.object({ value: z.string().min(1, "Image filename is required.") })).min(1, "At least one image is required."),
  category: z.enum(['stationary', 'books', 'electronics']),
  price: z.coerce.number().positive("Price must be a positive number."),
  discountPrice: z.coerce.number().optional(),
});

const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters."),
});

const authorSchema = z.object({
  name: z.string().min(2, "Author name must be at least 2 characters."),
});

export default function ManageProductsPage() {
  const [activeTab, setActiveTab] = useState<Product['category']>('stationary');
  const [productList, setProductList] = useState<Product[]>([]);
  const [stationaryBrandList, setStationaryBrandList] = useState<Brand[]>([]);
  const [electronicsBrandList, setElectronicsBrandList] = useState<Brand[]>([]);
  const [authorList, setAuthorList] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brandIds: [],
      authorIds: [],
      description: "",
      imageNames: [{ value: "" }],
      category: activeTab,
      price: 0,
      discountPrice: undefined,
    },
  });

  const brandForm = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "" },
  });

  const authorForm = useForm<z.infer<typeof authorSchema>>({
    resolver: zodResolver(authorSchema),
    defaultValues: { name: "" },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "imageNames",
  });
  
  const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [products, stationaryBrands, electronicsBrands, authors] = await Promise.all([
            getProducts(), 
            getBrands('stationary'),
            getBrands('electronics'),
            getAuthors()
        ]);
        setProductList(products);
        setStationaryBrandList(stationaryBrands);
        setElectronicsBrandList(electronicsBrands);
        setAuthorList(authors);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch data from the database." });
      } finally {
        setIsLoading(false);
      }
  }

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    form.setValue('category', activeTab);
  }, [activeTab, form]);

  const onProductSubmit = async (values: z.infer<typeof productSchema>) => {
    try {
      const imageNames = values.imageNames.map(img => img.value);
      await addProduct({ ...values, imageNames });
      toast({
        title: "Product Created",
        description: `${values.name} has been added successfully.`,
      });
      fetchAllData(); // Refresh list
      form.reset();
      form.setValue('category', activeTab);
      form.setValue('imageNames', [{ value: '' }]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the product.",
      });
    }
  };

  const onBrandSubmit = async (values: z.infer<typeof brandSchema>, category: Brand['category']) => {
    try {
        await addBrand(values, category);
        toast({
            title: "Brand Created",
            description: `${values.name} has been added successfully.`,
        });
        fetchAllData(); // Refresh list
        brandForm.reset();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create the brand.",
        });
    }
  };

  const onAuthorSubmit = async (values: z.infer<typeof authorSchema>) => {
    try {
        await addAuthor(values);
        toast({
            title: "Author Created",
            description: `${values.name} has been added successfully.`,
        });
        fetchAllData(); // Refresh list
        authorForm.reset();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create the author.",
        });
    }
  };
  
  const MultiSelect = ({ form, fieldName, items, placeholder, searchPlaceholder, emptyMessage, label }: { 
    form: any, 
    fieldName: "brandIds" | "authorIds", 
    items: (Brand | Author)[],
    placeholder: string,
    searchPlaceholder: string,
    emptyMessage: string,
    label: string
  }) => {
    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between h-auto", !field.value?.length && "text-muted-foreground")}
                                >
                                    <div className="flex gap-1 flex-wrap">
                                        {field.value?.length > 0 ? (
                                            items
                                                .filter(item => field.value.includes(item.id))
                                                .map(item => (
                                                    <Badge
                                                        variant="secondary"
                                                        key={item.id}
                                                        className="mr-1"
                                                    >
                                                        {item.name}
                                                    </Badge>
                                                ))
                                        ) : (
                                            placeholder
                                        )}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder={searchPlaceholder} />
                                <CommandList>
                                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                                    <CommandGroup>
                                        {items.map((item) => (
                                            <CommandItem
                                                value={item.name}
                                                key={item.id}
                                                onSelect={() => {
                                                    const currentIds = field.value || [];
                                                    const newIds = currentIds.includes(item.id)
                                                        ? currentIds.filter((id: string) => id !== item.id)
                                                        : [...currentIds, item.id];
                                                    form.setValue(fieldName, newIds);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        (field.value || []).includes(item.id)
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                {item.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
  };
  
  const renderCreateBrandForm = (category: Brand['category']) => (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create {category === 'stationary' ? 'Stationary' : 'Electronics'} Brand</CardTitle>
          <CardDescription>Add a new brand for {category} products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit((values) => onBrandSubmit(values, category))} className="space-y-4">
              <FormField control={brandForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={brandForm.formState.isSubmitting}>
                {brandForm.formState.isSubmitting ? "Adding..." : "Add Brand"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );

  const renderCreateAuthorForm = () => (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Author</CardTitle>
          <CardDescription>Add a new author for books.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...authorForm}>
            <form onSubmit={authorForm.handleSubmit(onAuthorSubmit)} className="space-y-4">
              <FormField control={authorForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Author Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={authorForm.formState.isSubmitting}>
                {authorForm.formState.isSubmitting ? "Adding..." : "Add Author"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );


  const renderCreateForm = (category: Product['category']) => (
     <Card className="mb-8">
        <CardHeader>
            <CardTitle>Create {categories.find(c => c.value === category)?.label} Product</CardTitle>
            <CardDescription>Add a new item to your inventory for this category.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onProductSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    {category === 'stationary' && <MultiSelect form={form} fieldName="brandIds" items={stationaryBrandList} label="Brands" placeholder="Select brands" searchPlaceholder="Search brands..." emptyMessage="No brands found." />}
                    {category === 'books' && <MultiSelect form={form} fieldName="authorIds" items={authorList} label="Authors" placeholder="Select authors" searchPlaceholder="Search authors..." emptyMessage="No authors found." />}
                    {category === 'electronics' && <MultiSelect form={form} fieldName="brandIds" items={electronicsBrandList} label="Brands" placeholder="Select brands" searchPlaceholder="Search brands..." emptyMessage="No brands found." />}

                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField control={form.control} name="price" render={({ field }) => (
                          <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="discountPrice" render={({ field }) => (
                          <FormItem><FormLabel>Discount Price (Optional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <div>
                        <FormLabel>Image Filenames</FormLabel>
                        {fields.map((field, index) => (
                            <FormField
                                key={field.id}
                                control={form.control}
                                name={`imageNames.${index}.value`}
                                render={({ field }) => (
                                <FormItem className="mt-2 flex items-center gap-2">
                                    <FormControl>
                                    <Input {...field} placeholder={`Image ${index + 1} filename (e.g., image.jpg)`} />
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        ))}
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Image
                        </Button>
                        <FormMessage>{(form.formState.errors.imageNames as any)?.message}</FormMessage>
                    </div>
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Adding..." : "Add Product"}
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  );

  const renderProductGrid = (category: Product['category']) => {
    const filtered = productList.filter(p => p.category === category);

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-[250px] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.length > 0 ? (
                filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))
            ) : (
                <div className="col-span-full py-12 text-center">
                    <p className="text-muted-foreground">No products found in this category.</p>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Manage Products</h1>
      <p className="mt-2 text-muted-foreground">Add, edit, and manage your products.</p>

      <Tabs value={activeTab} onValueChange={(value) => {
          const newCategory = value as Product['category'];
          setActiveTab(newCategory);
          form.setValue('category', newCategory);
      }} className="mt-8 w-full">
          <div className="sticky top-20 z-10 bg-background py-4">
              <TabsList className="grid w-full grid-cols-3">
                  {categories.map((cat) => (
                      <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                  ))}
              </TabsList>
          </div>
          
          <TabsContent value="stationary" className="mt-8">
              {renderCreateBrandForm('stationary')}
              {renderCreateForm('stationary')}
              {renderProductGrid('stationary')}
          </TabsContent>

          <TabsContent value="books" className="mt-8">
              {renderCreateAuthorForm()}
              {renderCreateForm('books')}
              {renderProductGrid('books')}
          </TabsContent>

          <TabsContent value="electronics" className="mt-8">
              {renderCreateBrandForm('electronics')}
              {renderCreateForm('electronics')}
              {renderProductGrid('electronics')}
          </TabsContent>
      </Tabs>
    </div>
  );
}

    