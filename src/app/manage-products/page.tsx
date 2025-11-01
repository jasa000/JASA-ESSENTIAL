

"use client";

import { useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct, getBrands, addBrand, getAuthors, addAuthor, getProductTypes, addProductType } from "@/lib/data";
import ProductCard from "@/components/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product, Brand, Author, ProductType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown, Pencil, Trash2, PlusCircle, ChevronUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useLoading } from "@/hooks/use-loading";

const categories: { value: Product['category'], label: string }[] = [
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
];

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  brandIds: z.array(z.string()).optional(),
  authorIds: z.array(z.string()).optional(),
  productTypeIds: z.array(z.string()).optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.enum(['stationary', 'books', 'electronics']),
  price: z.coerce.number().positive("Price must be a positive number."),
  discountPrice: z.coerce.number().optional().or(z.literal('')),
  imageNames: z.array(z.object({ value: z.string().min(1, "Filename cannot be empty.") })).optional(),
  primaryImageIndex: z.string().optional(),
});

const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters."),
});

const authorSchema = z.object({
  name: z.string().min(2, "Author name must be at least 2 characters."),
});

const productTypeSchema = z.object({
  name: z.string().min(2, "Product type name must be at least 2 characters."),
});

export default function ManageProductsPage() {
  const [activeTab, setActiveTab] = useState<Product['category']>('stationary');
  const [productList, setProductList] = useState<Product[]>([]);
  const [stationaryBrandList, setStationaryBrandList] = useState<Brand[]>([]);
  const [electronicsBrandList, setElectronicsBrandList] = useState<Brand[]>([]);
  const [authorList, setAuthorList] = useState<Author[]>([]);
  const [productTypeList, setProductTypeList] = useState<ProductType[]>([]);
  const { isLoading, setIsLoading } = useLoading();
  const { toast } = useToast();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
  const [isAuthorFormOpen, setIsAuthorFormOpen] = useState(false);
  const [isProductTypeFormOpen, setIsProductTypeFormOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);


  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brandIds: [],
      authorIds: [],
      productTypeIds: [],
      description: "",
      category: activeTab,
      price: 0,
      discountPrice: '',
      imageNames: [],
      primaryImageIndex: "0",
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
  
  const productTypeForm = useForm<z.infer<typeof productTypeSchema>>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: { name: "" },
  });

  const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [products, stationaryBrands, electronicsBrands, authors, productTypes] = await Promise.all([
            getProducts(), 
            getBrands('stationary'),
            getBrands('electronics'),
            getAuthors(),
            getProductTypes(),
        ]);
        setProductList(products);
        setStationaryBrandList(stationaryBrands);
        setElectronicsBrandList(electronicsBrands);
        setAuthorList(authors);
        setProductTypeList(productTypes);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch data from the database." });
      } finally {
        setIsLoading(false);
      }
  }

  useEffect(() => {
    fetchAllData();
  }, [toast, setIsLoading]);

  useEffect(() => {
    form.setValue('category', activeTab);
  }, [activeTab, form]);
  
  useEffect(() => {
    if (editingProduct) {
      const primaryImageIndex = 0; // The main image is always the first one
      editForm.reset({
        name: editingProduct.name,
        brandIds: editingProduct.brandIds || [],
        authorIds: editingProduct.authorIds || [],
        productTypeIds: editingProduct.productTypeIds || [],
        description: editingProduct.description,
        category: editingProduct.category,
        price: editingProduct.price,
        discountPrice: editingProduct.discountPrice || '',
        imageNames: editingProduct.imageNames?.map(name => ({ value: name })) || [],
        primaryImageIndex: primaryImageIndex.toString(),
      });
      setIsEditDialogOpen(true);
    } else {
        setIsEditDialogOpen(false);
    }
  }, [editingProduct, editForm]);

  const processAndSubmit = async (
    values: z.infer<typeof productSchema>, 
    action: (productData: any) => Promise<any>,
    successMessage: string,
    errorMessage: string,
    formToReset?: any
  ) => {
    try {
        const imageFileNames = values.imageNames?.map(img => img.value) || [];
        const primaryIndex = parseInt(values.primaryImageIndex || "0", 10);
        
        let orderedImageNames: string[] = [];
        if (imageFileNames.length > 0 && primaryIndex < imageFileNames.length) {
            const primaryImage = imageFileNames[primaryIndex];
            const otherImages = imageFileNames.filter((_, index) => index !== primaryIndex);
            orderedImageNames = [primaryImage, ...otherImages];
        }

        const productData = {
            ...values,
            imageNames: orderedImageNames,
        };
        delete productData.primaryImageIndex;

        await action(productData);

        toast({
            title: "Success",
            description: successMessage,
        });

        fetchAllData();
        if (formToReset) {
            formToReset.reset({
                name: "",
                brandIds: [],
                authorIds: [],
                productTypeIds: [],
                description: "",
                category: activeTab,
                price: 0,
                discountPrice: '',
                imageNames: [],
                primaryImageIndex: "0",
            });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
        });
    }
  }


  const onProductSubmit = async (values: z.infer<typeof productSchema>) => {
    await processAndSubmit(
        values,
        (data) => addProduct(data),
        `${values.name} has been added successfully.`,
        "Failed to create the product.",
        form
    );
  };

  const onEditSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!editingProduct) return;
    await processAndSubmit(
        values,
        (data) => updateProduct(editingProduct.id, data),
        "The product has been updated.",
        "Failed to update product."
    );
    setEditingProduct(null);
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
  
  const onProductTypeSubmit = async (values: z.infer<typeof productTypeSchema>, category: ProductType['category']) => {
    try {
        await addProductType(values, category);
        toast({
            title: "Product Type Created",
            description: `${values.name} has been added successfully.`,
        });
        fetchAllData(); // Refresh list
        productTypeForm.reset();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create the product type.",
        });
    }
  };
  
  const MultiSelect = ({ form, fieldName, items, placeholder, searchPlaceholder, emptyMessage, label }: { 
    form: any, 
    fieldName: "brandIds" | "authorIds" | "productTypeIds", 
    items: (Brand | Author | ProductType)[],
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

  const ImageFields = ({ form }: { form: any }) => {
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "imageNames"
    });
  
    return (
      <FormField
        control={form.control}
        name="primaryImageIndex"
        render={({ field: radioField }) => (
          <FormItem className="space-y-3">
            <FormLabel>Product Images</FormLabel>
            <RadioGroup
              onValueChange={radioField.onChange}
              value={radioField.value}
              className="space-y-1"
            >
              {fields.map((item, index) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name={`imageNames.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                         <RadioGroupItem value={index.toString()} id={`image-radio-${index}`} />
                         <FormLabel htmlFor={`image-radio-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Main
                         </FormLabel>
                        <FormControl>
                          <Input {...inputField} placeholder={`Image filename ${index + 1} (e.g., image.png)`} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </RadioGroup>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: "" })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Image
            </Button>
          </FormItem>
        )}
      />
    );
  };
  
  const renderCreateBrandForm = (category: Brand['category'], isOpen: boolean, onOpenChange: (open: boolean) => void) => (
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Create {category === 'stationary' ? 'Stationary' : 'Electronics'} Brand</CardTitle>
                    <CardDescription>Add a new brand for {category} products.</CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronUp className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
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
            </CollapsibleContent>
        </Card>
      </Collapsible>
    );

  const renderCreateAuthorForm = (isOpen: boolean, onOpenChange: (open: boolean) => void) => (
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Create Author</CardTitle>
                    <CardDescription>Add a new author for books.</CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronUp className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
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
            </CollapsibleContent>
        </Card>
      </Collapsible>
    );

  const renderCreateProductTypeForm = (category: ProductType['category'], isOpen: boolean, onOpenChange: (open: boolean) => void) => (
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Create Product Type</CardTitle>
                    <CardDescription>Add a new product type for the {category} category (e.g., Pen, Notebook).</CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronUp className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
                <CardContent>
                <Form {...productTypeForm}>
                    <form onSubmit={productTypeForm.handleSubmit((values) => onProductTypeSubmit(values, category))} className="space-y-4">
                    <FormField control={productTypeForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Product Type Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={productTypeForm.formState.isSubmitting}>
                        {productTypeForm.formState.isSubmitting ? "Adding..." : "Add Product Type"}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </CollapsibleContent>
        </Card>
      </Collapsible>
    );

  const renderCreateForm = (category: Product['category'], currentForm: any, isOpen: boolean, onOpenChange: (open: boolean) => void) => (
     <Collapsible open={isOpen} onOpenChange={onOpenChange} className="mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Create {categories.find(c => c.value === category)?.label} Product</CardTitle>
                    <CardDescription>Add a new item to your inventory for this category.</CardDescription>
                </div>
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronUp className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
                <CardContent>
                    <Form {...currentForm}>
                        <form onSubmit={currentForm.handleSubmit(onProductSubmit)} className="space-y-4">
                            <FormField control={currentForm.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                            {category === 'stationary' && <MultiSelect form={currentForm} fieldName="brandIds" items={stationaryBrandList} label="Brands" placeholder="Select brands" searchPlaceholder="Search brands..." emptyMessage="No brands found." />}
                            {category === 'books' && <MultiSelect form={currentForm} fieldName="authorIds" items={authorList} label="Authors" placeholder="Select authors" searchPlaceholder="Search authors..." emptyMessage="No authors found." />}
                            {category === 'electronics' && <MultiSelect form={currentForm} fieldName="brandIds" items={electronicsBrandList} label="Brands" placeholder="Select brands" searchPlaceholder="Search brands..." emptyMessage="No brands found." />}
                            
                            <MultiSelect form={currentForm} fieldName="productTypeIds" items={productTypeList.filter(pt => pt.category === category)} label="Product Types" placeholder="Select product types" searchPlaceholder="Search product types..." emptyMessage="No product types found." />

                            <FormField control={currentForm.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />

                            <ImageFields form={currentForm} />
                            
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField control={currentForm.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={currentForm.control} name="discountPrice" render={({ field }) => (
                                <FormItem><FormLabel>Discount Price (Optional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            </div>

                            <Button type="submit" className="w-full" disabled={currentForm.formState.isSubmitting}>
                                {currentForm.formState.isSubmitting ? "Adding..." : "Add Product"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </CollapsibleContent>
        </Card>
     </Collapsible>
  );

  const renderProductGrid = (category: Product['category']) => {
    const filtered = productList.filter(p => p.category === category);

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
        <>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Existing {categories.find(c => c.value === category)?.label} Products</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
        </>
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
          setIsBrandFormOpen(false);
          setIsAuthorFormOpen(false);
          setIsProductTypeFormOpen(false);
          setIsProductFormOpen(false);
      }} className="mt-8 w-full">
          <div className="sticky top-20 z-10 bg-background py-4">
              <TabsList className="grid w-full grid-cols-3">
                  {categories.map((cat) => (
                      <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                  ))}
              </TabsList>
          </div>
          
          <TabsContent value="stationary" className="mt-8">
              {renderCreateBrandForm('stationary', isBrandFormOpen, setIsBrandFormOpen)}
              {renderCreateProductTypeForm('stationary', isProductTypeFormOpen, setIsProductTypeFormOpen)}
              {renderCreateForm('stationary', form, isProductFormOpen, setIsProductFormOpen)}
              {renderProductGrid('stationary')}
          </TabsContent>

          <TabsContent value="books" className="mt-8">
              {renderCreateAuthorForm(isAuthorFormOpen, setIsAuthorFormOpen)}
              {renderCreateProductTypeForm('books', isProductTypeFormOpen, setIsProductTypeFormOpen)}
              {renderCreateForm('books', form, isProductFormOpen, setIsProductFormOpen)}
              {renderProductGrid('books')}
          </TabsContent>

          <TabsContent value="electronics" className="mt-8">
              {renderCreateBrandForm('electronics', isBrandFormOpen, setIsBrandFormOpen)}
              {renderCreateProductTypeForm('electronics', isProductTypeFormOpen, setIsProductTypeFormOpen)}
              {renderCreateForm('electronics', form, isProductFormOpen, setIsProductFormOpen)}
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

                    <MultiSelect form={editForm} fieldName="productTypeIds" items={productTypeList.filter(pt => pt.category === editingProduct?.category)} label="Product Types" placeholder="Select product types" searchPlaceholder="Search product types..." emptyMessage="No product types found." />

                    <FormField control={editForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <ImageFields form={editForm} />
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField control={editForm.control} name="price" render={({ field }) => (
                          <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={editForm.control} name="discountPrice" render={({ field }) => (
                          <FormItem><FormLabel>Discount Price (Optional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

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
