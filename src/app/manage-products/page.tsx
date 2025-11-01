
"use client";

import { useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct, getBrands, addBrand, getAuthors, addAuthor } from "@/lib/data";
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
import { PlusCircle, Trash2, Check, ChevronsUpDown, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  primaryImageIndex: z.coerce.number().min(0, "A primary image must be selected."),
  category: z.enum(['stationary', 'books', 'electronics']),
  price: z.coerce.number().positive("Price must be a positive number."),
  discountPrice: z.coerce.number().optional().or(z.literal('')),
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
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brandIds: [],
      authorIds: [],
      description: "",
      imageNames: [{ value: "" }],
      primaryImageIndex: 0,
      category: activeTab,
      price: 0,
      discountPrice: '',
    },
  });

  const editForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
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
  
  const { fields: editFields, append: editAppend, remove: editRemove } = useFieldArray({
      control: editForm.control,
      name: "imageNames"
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
  
  useEffect(() => {
    if (editingProduct) {
      editForm.reset({
        name: editingProduct.name,
        brandIds: editingProduct.brandIds || [],
        authorIds: editingProduct.authorIds || [],
        description: editingProduct.description,
        imageNames: editingProduct.images.map(img => {
            const parts = img.src.split('/');
            const fileNameWithQuery = parts[parts.length -1];
            return { value: fileNameWithQuery.split('?')[0] }; // Remove potential query params
        }),
        primaryImageIndex: 0, // Primary is always first
        category: editingProduct.category,
        price: editingProduct.price,
        discountPrice: editingProduct.discountPrice || '',
      });
      setIsEditDialogOpen(true);
    } else {
        setIsEditDialogOpen(false);
    }
  }, [editingProduct, editForm]);


  const onProductSubmit = async (values: z.infer<typeof productSchema>) => {
    try {
      await addProduct(values);
      toast({
        title: "Product Created",
        description: `${values.name} has been added successfully.`,
      });
      fetchAllData(); // Refresh list
      form.reset({
        name: "",
        brandIds: [],
        authorIds: [],
        description: "",
        imageNames: [{ value: "" }],
        primaryImageIndex: 0,
        category: activeTab,
        price: 0,
        discountPrice: '',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the product.",
      });
    }
  };

  const onEditSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!editingProduct) return;
    try {
        await updateProduct(editingProduct.id, values);
        toast({ title: "Product Updated", description: "The product has been updated." });
        fetchAllData();
        setEditingProduct(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update product." });
    }
  }

  const handleDelete = async () => {
    if (!deletingProductId) return;
    try {
        await deleteProduct(deletingProductId);
        toast({ title: "Product Deleted", description: "The product has been successfully removed." });
        fetchAllData();
        setDeletingProductId(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete product." });
    }
  }

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

  const ImageInputs = ({ currentForm, currentFields, appendFn, removeFn }: {
    currentForm: typeof form | typeof editForm;
    currentFields: any[];
    appendFn: (val: { value: string; }) => void;
    removeFn: (index: number) => void;
  }) => (
    <FormField
        control={currentForm.control}
        name="primaryImageIndex"
        render={({ field }) => (
            <FormItem className="space-y-3">
                <FormLabel>Image Filenames (select one as primary)</FormLabel>
                <FormControl>
                    <RadioGroup
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value?.toString()}
                        className="flex flex-col space-y-2"
                    >
                        {currentFields.map((item, index) => (
                            <FormField
                                key={item.id}
                                control={currentForm.control}
                                name={`imageNames.${index}.value`}
                                render={({ field: imageField }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value={index.toString()} id={`${imageField.name}-radio`} />
                                        </FormControl>
                                        <FormControl className="flex-grow">
                                            <Input {...imageField} placeholder={`Image ${index + 1} filename (e.g., image.jpg)`} />
                                        </FormControl>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFn(index)} disabled={currentFields.length <= 1}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendFn({ value: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Image
                </Button>
                <FormMessage>{(currentForm.formState.errors.imageNames as any)?.message}</FormMessage>
                <FormMessage>{currentForm.formState.errors.primaryImageIndex?.message}</FormMessage>
            </FormItem>
        )}
    />
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

                    <ImageInputs currentForm={form} currentFields={fields} appendFn={append} removeFn={remove} />

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
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        showAdminControls
                        onEdit={() => setEditingProduct(product)}
                        onDelete={() => setDeletingProductId(product.id)}
                    />
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
      
       <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setEditingProduct(null); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Make changes to your product here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                     <FormField control={editForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    {editingProduct?.category === 'stationary' && <MultiSelect form={editForm} fieldName="brandIds" items={stationaryBrandList} label="Brands" placeholder="Select brands" searchPlaceholder="Search brands..." emptyMessage="No brands found." />}
                    {editingProduct?.category === 'books' && <MultiSelect form={editForm} fieldName="authorIds" items={authorList} label="Authors" placeholder="Select authors" searchPlaceholder="Search authors..." emptyMessage="No authors found." />}
                    {editingProduct?.category === 'electronics' && <MultiSelect form={editForm} fieldName="brandIds" items={electronicsBrandList} label="Brands" placeholder="Select brands" searchPlaceholder="Search brands..." emptyMessage="No brands found." />}

                    <FormField control={editForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField control={editForm.control} name="price" render={({ field }) => (
                          <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={editForm.control} name="discountPrice" render={({ field }) => (
                          <FormItem><FormLabel>Discount Price (Optional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <ImageInputs currentForm={editForm} currentFields={editFields} appendFn={editAppend} removeFn={editRemove} />

                    <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary" onClick={() => setEditingProduct(null)}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={editForm.formState.isSubmitting}>
                          {editForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
       </Dialog>
       
       <AlertDialog open={!!deletingProductId} onOpenChange={(open) => { if (!open) setDeletingProductId(null); }}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the product from your database.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeletingProductId(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}

    