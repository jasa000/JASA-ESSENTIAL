
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/context/auth-provider';
import { updateUserProfile } from '@/lib/users';
import { getShops } from '@/lib/shops';
import { getOrderSettings, createOrder } from '@/lib/data';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Store, Info, MapPin, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import type { UserProfile, Shop, OrderSettings, Product, ShopService } from '@/lib/types';


const addressSchema = z.object({
  type: z.enum(['Home', 'Work']),
  line1: z.string().min(1, "Address Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal Code is required"),
});

const mobileSchema = z.object({
    mobile: z.string().min(10, "A valid 10-digit mobile number is required.").max(10),
    altMobiles: z.array(z.object({ value: z.string() })).optional(),
});

const checkoutFormSchema = z.object({
  selectedAddress: z.string().min(1, "Please select a shipping address."),
});

type CategoryKey = 'stationary' | 'books' | 'electronics' | 'xerox';

export default function CheckoutPage() {
  const { selectedItems, items, removeItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [orderSettings, setOrderSettings] = useState<OrderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const cartItems = useMemo(() => items.filter(item => selectedItems.includes(item.product.id)), [items, selectedItems]);
  
  const itemsByCategory = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const category: CategoryKey = item.product.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<CategoryKey, { product: Product; quantity: number }[]>);
  }, [cartItems]);
  
  const presentCategories = Object.keys(itemsByCategory) as CategoryKey[];

  const checkoutForm = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      selectedAddress: "",
      ...Object.fromEntries(presentCategories.map(cat => [cat, ""]))
    },
  });
  
  const mobileForm = useForm<z.infer<typeof mobileSchema>>({
    resolver: zodResolver(mobileSchema),
    defaultValues: {
        mobile: user?.mobile || '',
        altMobiles: user?.altMobiles || [],
    }
  });

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: { type: 'Home', line1: '', line2: '', city: '', state: '', postalCode: '' }
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user?.addresses && user.addresses.length > 0 && !checkoutForm.getValues('selectedAddress')) {
        checkoutForm.setValue('selectedAddress', `address-0`);
    }
    if (user) {
        mobileForm.reset({
            mobile: user.mobile || '',
            altMobiles: user.altMobiles || [],
        });
    }
    
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [shops, settings] = await Promise.all([getShops(), getOrderSettings()]);
            setAllShops(shops);
            setOrderSettings(settings);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch checkout data." });
        } finally {
            setLoading(false);
        }
    };
    fetchInitialData();
  }, [user, authLoading, router, checkoutForm, toast, mobileForm]);

  const selectedSellers = checkoutForm.watch();

  const combinedItemSubtotal = useMemo(() => {
    return (itemsByCategory.stationary || []).concat(itemsByCategory.books || []).concat(itemsByCategory.electronics || [])
        .reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0);
  }, [itemsByCategory]);
  
  const { total, itemsSubtotal, xeroxSubtotal, itemDeliveryCharge, xeroxDeliveryCharge, savings } = useMemo(() => {
    const itemsSubtotal = (itemsByCategory.stationary || []).concat(itemsByCategory.books || []).concat(itemsByCategory.electronics || [])
        .reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0);
    const xeroxSubtotal = itemsByCategory.xerox?.reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0) || 0;
    
    const originalItemsTotal = (itemsByCategory.stationary || []).concat(itemsByCategory.books || []).concat(itemsByCategory.electronics || [])
        .reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const originalXeroxTotal = itemsByCategory.xerox?.reduce((acc, item) => acc + item.product.price * item.quantity, 0) || 0;

    let itemDeliveryCharge = 0;
    if (orderSettings && itemsSubtotal > 0 && itemsSubtotal < orderSettings.minItemOrderPrice) {
        itemDeliveryCharge = orderSettings.itemDeliveryCharge;
    }
    
    let xeroxDeliveryCharge = 0;
    if (orderSettings && xeroxSubtotal > 0 && xeroxSubtotal < orderSettings.minXeroxOrderPrice) {
        xeroxDeliveryCharge = orderSettings.xeroxDeliveryCharge;
    }

    const currentSubtotal = itemsSubtotal + xeroxSubtotal;
    const total = currentSubtotal + itemDeliveryCharge + xeroxDeliveryCharge;
    const savings = (originalItemsTotal + originalXeroxTotal) - currentSubtotal;

    return { total, itemsSubtotal, xeroxSubtotal, itemDeliveryCharge, xeroxDeliveryCharge, savings };
  }, [itemsByCategory, orderSettings]);

  async function onAddressSubmit(values: z.infer<typeof addressSchema>) {
    if (!user) return;
    try {
      const newAddresses = [...(user.addresses || []), values];
      await updateUserProfile(user.uid, { addresses: newAddresses });
      toast({ title: "Address Saved", description: "Your new address has been added." });
      addressForm.reset({ type: 'Home', line1: '', line2: '', city: '', state: '', postalCode: '' });
      setIsAddressDialogOpen(false);
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: "Failed to save address. " + error.message });
    }
  }

  async function handlePlaceOrder() {
    const values = checkoutForm.getValues();
    if (!user || !user.addresses) return;
    setIsPlacingOrder(true);
    
    const addressIndex = parseInt(values.selectedAddress.replace('address-', ''));
    const shippingAddress = user.addresses[addressIndex];
    const mobileNumbers = mobileForm.getValues();
    
    const orderCreationPromises = [];

    for (const category of presentCategories) {
        const sellerId = values[category as keyof typeof values];
        if (!sellerId) {
            toast({ variant: "destructive", title: "Error", description: `Please select a seller for ${category}.` });
            setIsPlacingOrder(false);
            return;
        }

        const itemsToOrder = itemsByCategory[category as CategoryKey] || [];
        for (const cartItem of itemsToOrder) {
            orderCreationPromises.push(
                createOrder({
                    userId: user.uid,
                    productId: cartItem.product.id,
                    productName: cartItem.product.name,
                    productImage: cartItem.product.imageNames?.[0] || null,
                    quantity: cartItem.quantity,
                    price: cartItem.product.discountPrice ?? cartItem.product.price,
                    sellerId: sellerId,
                    shippingAddress: shippingAddress,
                    mobile: mobileNumbers.mobile,
                    altMobiles: mobileNumbers.altMobiles,
                    status: 'Pending Confirmation',
                    category: cartItem.product.category,
                })
            );
        }
    }

    try {
      await Promise.all(orderCreationPromises);
      cartItems.forEach(item => removeItem(item.product.id));
      setOrderPlaced(true);
      setTimeout(() => { router.push('/orders'); }, 2000);
    } catch (error: any) {
        toast({ variant: "destructive", title: 'Order Failed', description: `An error occurred while placing your order: ${error.message}` });
        setIsPlacingOrder(false);
    }
  }
  
  async function onMobileSubmit(values: z.infer<typeof mobileSchema>) {
    if (!user) return;
    try {
        await updateUserProfile(user.uid, { mobile: values.mobile, altMobiles: values.altMobiles });
        toast({ title: "Mobile Number Saved" });
        setIsMobileDialogOpen(false);
        await handlePlaceOrder();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to save mobile number. " + error.message });
    }
  }

  async function onCheckoutSubmit() {
    if (!user) return;
    
    if (!user.mobile) {
        setIsMobileDialogOpen(true);
    } else {
        await handlePlaceOrder();
    }
  }
  
  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (cartItems.length === 0) {
    return (
       <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl font-bold">Your have no items selected for checkout.</h1>
        <p className="mt-2 text-muted-foreground">Please select items from your cart to proceed.</p>
        <Button asChild className="mt-6">
          <Link href="/cart">Return to Cart</Link>
        </Button>
      </div>
    )
  }
  
  const selectedAddress = checkoutForm.watch('selectedAddress');

  const renderAddressSelection = () => {
    if (!user?.addresses || user.addresses.length === 0) {
      return (
        <Card className="text-center">
            <CardHeader><CardTitle className="font-headline">Add Shipping Address</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">You have no saved addresses. Please add one to continue.</p>
                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add Address</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Add a new address</DialogTitle></DialogHeader>{renderAddressForm()}</DialogContent>
                </Dialog>
            </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader><CardTitle className="font-headline">1. Select Shipping Address</CardTitle></CardHeader>
        <CardContent>
            <FormField
              control={checkoutForm.control}
              name="selectedAddress"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                      {user.addresses.map((address, index) => (
                        <FormItem key={index} className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><RadioGroupItem value={`address-${index}`} /></FormControl>
                            <FormLabel className="font-normal">
                                <p className="font-bold">{address.type} Address</p>
                                <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                                <p>{address.city}, {address.state} {address.postalCode}</p>
                            </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-4">
                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Another Address</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Add a new address</DialogTitle></DialogHeader>{renderAddressForm()}</DialogContent>
                </Dialog>
            </div>
        </CardContent>
      </Card>
    );
  }
  
  const renderSellerSelection = (category: CategoryKey) => {
    if (!selectedAddress) return null;

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    
    const availableShops = allShops.filter(shop => shop.services.includes(category as ShopService));

    if (availableShops.length === 0) {
        return <p className="text-muted-foreground">Sorry, no sellers provide services for {categoryName}. Please adjust your cart.</p>
    }

    return (
        <FormField
          control={checkoutForm.control}
          name={category}
          rules={{ required: `Please select a seller for ${categoryName}.`}}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="font-bold text-lg">{categoryName}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                  {availableShops.map((shop) => (
                    <FormItem key={shop.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><RadioGroupItem value={shop.id} className="mt-1" /></FormControl>
                        <FormLabel className="font-normal w-full">
                            <p className="font-bold flex items-center gap-2"><Store className="h-4 w-4" /> {shop.name}</p>
                            <p className="text-sm text-muted-foreground">{shop.address}</p>
                            {shop.notes && <p className="text-sm mt-2 pt-2 border-t">{shop.notes}</p>}
                             {shop.locations && shop.locations.length > 0 && (
                                <div className="text-sm mt-2 pt-2 border-t">
                                    <p className="font-medium flex items-center gap-1"><MapPin className="h-4 w-4" /> Available in:</p>
                                    <ul className="list-disc pl-5 text-muted-foreground">
                                        {shop.locations.map((loc, i) => <li key={i}>{loc}</li>)}
                                    </ul>
                                </div>
                            )}
                        </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
    )
  }

  const renderAddressForm = () => (
    <Form {...addressForm}>
        <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
            <FormField control={addressForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Address Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select address type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Home">Home</SelectItem><SelectItem value="Work">Work</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={addressForm.control} name="line1" render={({ field }) => (<FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} placeholder="123 Main St" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={addressForm.control} name="line2" render={({ field }) => (<FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input {...field} placeholder="Apartment, suite, etc." /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField control={addressForm.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={addressForm.control} name="state" render={({ field }) => (<FormItem><FormLabel>State / Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={addressForm.control} name="postalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit" disabled={addressForm.formState.isSubmitting}>{addressForm.formState.isSubmitting ? "Saving..." : "Save Address"}</Button></DialogFooter>
        </form>
    </Form>
  )

  const isCheckoutDisabled = isPlacingOrder || !checkoutForm.formState.isValid || !selectedAddress || presentCategories.some(cat => !selectedSellers[cat]);

  return (
    <>
    <Dialog open={orderPlaced}>
        <DialogContent hideCloseButton>
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold">Order Placed!</h2>
                <p className="text-muted-foreground mt-2">You will be redirected to your order history shortly.</p>
            </div>
        </DialogContent>
    </Dialog>
    
     <Dialog open={isMobileDialogOpen} onOpenChange={setIsMobileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
            <CardDescription>Please provide your mobile number to complete the order.</CardDescription>
          </DialogHeader>
          <Form {...mobileForm}>
            <form onSubmit={mobileForm.handleSubmit(onMobileSubmit)} className="space-y-4">
              <FormField
                control={mobileForm.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Mobile Number</FormLabel>
                    <FormControl><Input {...field} type="tel" placeholder="10-digit mobile number" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mobileForm.control}
                name="altMobiles.0.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Mobile Number (Optional)</FormLabel>
                    <FormControl><Input {...field} type="tel" placeholder="Another 10-digit number" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={mobileForm.formState.isSubmitting}>
                  {mobileForm.formState.isSubmitting ? 'Saving...' : 'Save and Continue'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Checkout</h1>
        <Button variant="outline" asChild>
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>
      <Form {...checkoutForm}>
      <form onSubmit={checkoutForm.handleSubmit(onCheckoutSubmit)} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            {renderAddressSelection()}
             {selectedAddress && (
              <Card>
                <CardHeader><CardTitle className="font-headline">2. Select Sellers</CardTitle><CardDescription>Choose a seller for each category of items in your cart.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    {presentCategories.map(cat => (
                        <div key={cat}>
                            {renderSellerSelection(cat)}
                        </div>
                    ))}
                </CardContent>
              </Card>
            )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="font-headline">Your Order</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {presentCategories.map((category) => (
                    <div key={category}>
                        <h4 className="font-medium capitalize mb-2">{category}</h4>
                        {itemsByCategory[category]?.map(({ product, quantity }) => (
                           <div key={product.id} className="flex items-center justify-between text-sm ml-2">
                            <div className="flex gap-2 min-w-0">
                               <div className="relative h-12 w-12 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                                  {product.imageNames?.[0] ? (<Image src={product.imageNames[0]} alt={product.name} fill className="object-cover" />) : (<div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">JASA</div>)}
                               </div>
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                                </div>
                            </div>
                            <p className="flex-shrink-0 pl-2">Rs {((product.discountPrice || product.price) * quantity).toFixed(2)}</p>
                          </div>
                        ))}
                    </div>
                ))}
                <Separator />
                 <div className="space-y-2">
                    {itemsSubtotal > 0 && <div className="flex justify-between text-sm"><span>Items Subtotal</span><span>Rs {itemsSubtotal.toFixed(2)}</span></div>}
                    {xeroxSubtotal > 0 && <div className="flex justify-between text-sm"><span>Xerox Subtotal</span><span>Rs {xeroxSubtotal.toFixed(2)}</span></div>}
                    {itemDeliveryCharge > 0 && <div className="flex justify-between text-sm text-destructive"><span>Item Delivery</span><span>Rs {itemDeliveryCharge.toFixed(2)}</span></div>}
                    {xeroxDeliveryCharge > 0 && <div className="flex justify-between text-sm text-destructive"><span>Xerox Delivery</span><span>Rs {xeroxDeliveryCharge.toFixed(2)}</span></div>}
                    {savings > 0 && <div className="flex justify-between text-sm text-green-600"><span>You Save</span><span>Rs {savings.toFixed(2)}</span></div>}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>Rs {total.toFixed(2)}</span></div>
                </div>
                 {(itemDeliveryCharge > 0 || xeroxDeliveryCharge > 0) && orderSettings && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Delivery Charges Applied</AlertTitle>
                    <AlertDescription>
                      {itemDeliveryCharge > 0 && `Add items worth Rs ${(orderSettings.minItemOrderPrice - itemsSubtotal).toFixed(2)} more for free delivery on items. `}
                      {xeroxDeliveryCharge > 0 && `Add Xerox worth Rs ${(orderSettings.minXeroxOrderPrice - xeroxSubtotal).toFixed(2)} more for free delivery.`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={isCheckoutDisabled}>
                    {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isPlacingOrder ? "Placing Order..." : "Place Order"}
                </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
      </Form>
    </div>
    </>
  );
}
