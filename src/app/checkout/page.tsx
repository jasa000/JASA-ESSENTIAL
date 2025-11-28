
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/context/auth-provider';
import { updateUserProfile } from '@/lib/users';
import { getShops } from '@/lib/shops';
import { getOrderSettings } from '@/lib/data';
import { useState, useEffect, useMemo } from 'react';

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
import { PlusCircle, Store, Info } from 'lucide-react';
import type { UserProfile, Shop, ShopService, OrderSettings } from '@/lib/types';


const addressSchema = z.object({
  type: z.enum(['Home', 'Work']),
  line1: z.string().min(1, "Address Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal Code is required"),
});

const checkoutFormSchema = z.object({
  selectedAddress: z.string().min(1, "Please select a shipping address."),
  selectedShop: z.string().min(1, "Please select a seller."),
});

export default function CheckoutPage() {
  const { items } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [orderSettings, setOrderSettings] = useState<OrderSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Separate items by category type
  const itemProducts = useMemo(() => items.filter(item => item.product.category !== 'xerox'), [items]);
  const xeroxProducts = useMemo(() => items.filter(item => item.product.category === 'xerox'), [items]);

  // Calculate subtotals
  const itemsSubtotal = useMemo(() => itemProducts.reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0), [itemProducts]);
  const xeroxSubtotal = useMemo(() => xeroxProducts.reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0), [xeroxProducts]);

  // Determine delivery charges
  const itemDeliveryCharge = useMemo(() => {
    if (!orderSettings || itemProducts.length === 0) return 0;
    return itemsSubtotal < orderSettings.minItemOrderPrice ? orderSettings.itemDeliveryCharge : 0;
  }, [itemsSubtotal, orderSettings, itemProducts.length]);

  const xeroxDeliveryCharge = useMemo(() => {
    if (!orderSettings || xeroxProducts.length === 0) return 0;
    return xeroxSubtotal < orderSettings.minXeroxOrderPrice ? orderSettings.xeroxDeliveryCharge : 0;
  }, [xeroxSubtotal, orderSettings, xeroxProducts.length]);
  
  const total = itemsSubtotal + xeroxSubtotal + itemDeliveryCharge + xeroxDeliveryCharge;


  const checkoutForm = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      selectedAddress: "",
      selectedShop: "",
    },
  });

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'Home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user?.addresses && user.addresses.length > 0 && !checkoutForm.getValues('selectedAddress')) {
        checkoutForm.setValue('selectedAddress', `address-0`);
    }
    
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [shops, settings] = await Promise.all([
                getShops(),
                getOrderSettings(),
            ]);
            setAllShops(shops);
            setOrderSettings(settings);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch checkout data." });
        } finally {
            setLoading(false);
        }
    };
    fetchInitialData();
  }, [user, authLoading, router, checkoutForm, toast]);

  const requiredServices = useMemo(() => {
    const services = new Set<ShopService>();
    items.forEach(item => {
        if (item.product.category === 'electronics' || item.product.category === 'stationary' || item.product.category === 'books') {
            services.add(item.product.category);
        } else if (item.product.category === 'xerox') {
             services.add('xerox');
        }
    });
    return Array.from(services);
  }, [items]);

  const availableShops = useMemo(() => {
    if (requiredServices.length === 0) return [];
    return allShops.filter(shop => {
        return requiredServices.every(service => shop.services.includes(service));
    });
  }, [allShops, requiredServices]);

  async function onAddressSubmit(values: z.infer<typeof addressSchema>) {
    if (!user) return;
    try {
      const newAddresses = [...(user.addresses || []), values];
      await updateUserProfile(user.uid, { addresses: newAddresses });
      toast({
        title: "Address Saved",
        description: "Your new address has been added to your profile.",
      });
      addressForm.reset();
      setIsAddressDialogOpen(false);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save address. " + error.message,
      });
    }
  }

  function onCheckoutSubmit(values: z.infer<typeof checkoutFormSchema>) {
    const selectedShop = allShops.find(shop => shop.id === values.selectedShop);
    console.log('Order placed with address:', values.selectedAddress, 'and seller:', selectedShop?.name);
    toast({
      title: 'Order Placed!',
      description: `Thank you for your purchase. Your order has been sent to ${selectedShop?.name}.`,
    });
    router.push('/profile');
  }

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (items.length === 0) {
    return (
       <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl font-bold">Your cart is empty.</h1>
        <p className="mt-2 text-muted-foreground">Add items to your cart to proceed to checkout.</p>
        <Button asChild className="mt-6">
          <Link href="/">Return to Shop</Link>
        </Button>
      </div>
    )
  }
  
  const selectedAddress = checkoutForm.watch('selectedAddress');

  const renderAddressSelection = () => {
    if (!user?.addresses || user.addresses.length === 0) {
      return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle className="font-headline">Add Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">You have no saved addresses. Please add one to continue.</p>
                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Address
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add a new address</DialogTitle>
                        </DialogHeader>
                        {renderAddressForm()}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">1. Select Shipping Address</CardTitle>
        </CardHeader>
        <CardContent>
            <FormField
              control={checkoutForm.control}
              name="selectedAddress"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {user.addresses.map((address, index) => (
                        <FormItem key={index} className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <RadioGroupItem value={`address-${index}`} />
                            </FormControl>
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
                  <DialogTrigger asChild>
                      <Button variant="outline">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Another Address
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Add a new address</DialogTitle>
                      </DialogHeader>
                      {renderAddressForm()}
                  </DialogContent>
                </Dialog>
            </div>
        </CardContent>
      </Card>
    );
  }

  const renderSellerSelection = () => {
    if (!selectedAddress) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">2. Select a Seller</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please select a shipping address first.</p>
                </CardContent>
            </Card>
        )
    }

    if (availableShops.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">2. Select a Seller</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Sorry, no single seller provides all the services for the items in your cart. Please adjust your cart items.</p>
                    <p className="text-sm text-muted-foreground mt-2">Required services: {requiredServices.join(', ')}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">2. Select a Seller</CardTitle>
                <CardDescription>Choose a shop to fulfill your order.</CardDescription>
            </CardHeader>
            <CardContent>
                 <FormField
                  control={checkoutForm.control}
                  name="selectedShop"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {availableShops.map((shop) => (
                            <FormItem key={shop.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <RadioGroupItem value={shop.id} className="mt-1" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    <p className="font-bold flex items-center gap-2"><Store className="h-4 w-4" /> {shop.name}</p>
                                    <p className="text-sm text-muted-foreground">{shop.address}</p>
                                    {shop.notes && <p className="text-sm mt-2 pt-2 border-t">{shop.notes}</p>}
                                </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
        </Card>
    );
  }


  const renderAddressForm = () => (
    <Form {...addressForm}>
        <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
            <FormField
                control={addressForm.control}
                name="type"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Address Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select address type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField control={addressForm.control} name="line1" render={({ field }) => (
            <FormItem>
                <FormLabel>Address Line 1</FormLabel>
                <FormControl><Input {...field} placeholder="123 Main St" /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField control={addressForm.control} name="line2" render={({ field }) => (
            <FormItem>
                <FormLabel>Address Line 2 (Optional)</FormLabel>
                <FormControl><Input {...field} placeholder="Apartment, suite, etc." /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField control={addressForm.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={addressForm.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={addressForm.control} name="postalCode" render={({ field }) => (
                <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={addressForm.formState.isSubmitting}>
                  {addressForm.formState.isSubmitting ? "Saving..." : "Save Address"}
                </Button>
            </DialogFooter>
        </form>
    </Form>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Checkout</h1>
      <Form {...checkoutForm}>
      <form onSubmit={checkoutForm.handleSubmit(onCheckoutSubmit)} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {renderAddressSelection()}
          {renderSellerSelection()}
           {(itemDeliveryCharge > 0 || xeroxDeliveryCharge > 0) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Delivery Charges Applied</AlertTitle>
              <AlertDescription>
                {itemDeliveryCharge > 0 && `Add items worth Rs ${(orderSettings!.minItemOrderPrice - itemsSubtotal).toFixed(2)} more to get free delivery on items.`}
                {xeroxDeliveryCharge > 0 && `Add Xerox services worth Rs ${(orderSettings!.minXeroxOrderPrice - xeroxSubtotal).toFixed(2)} more to get free delivery on Xerox.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Your Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemProducts.length > 0 && (
                    <>
                        <h4 className="font-medium">Items</h4>
                        {itemProducts.map(({ product, quantity }) => (
                            <div key={product.id} className="flex items-center justify-between text-sm">
                                <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">Quantity: {quantity}</p>
                                </div>
                                <p>Rs {((product.discountPrice || product.price) * quantity).toFixed(2)}</p>
                            </div>
                        ))}
                         <div className="flex justify-between text-sm">
                            <span>Items Subtotal</span>
                            <span>Rs {itemsSubtotal.toFixed(2)}</span>
                        </div>
                        {itemDeliveryCharge > 0 && (
                            <div className="flex justify-between text-sm text-destructive">
                                <span>Delivery Charge</span>
                                <span>Rs {itemDeliveryCharge.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator />
                    </>
                )}
                 {xeroxProducts.length > 0 && (
                    <>
                        <h4 className="font-medium">Xerox</h4>
                        {xeroxProducts.map(({ product, quantity }) => (
                            <div key={product.id} className="flex items-center justify-between text-sm">
                                <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">Quantity: {quantity}</p>
                                </div>
                                <p>Rs {((product.discountPrice || product.price) * quantity).toFixed(2)}</p>
                            </div>
                        ))}
                        <div className="flex justify-between text-sm">
                            <span>Xerox Subtotal</span>
                            <span>Rs {xeroxSubtotal.toFixed(2)}</span>
                        </div>
                        {xeroxDeliveryCharge > 0 && (
                            <div className="flex justify-between text-sm text-destructive">
                                <span>Delivery Charge</span>
                                <span>Rs {xeroxDeliveryCharge.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator />
                    </>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={!checkoutForm.formState.isValid}>
                    Place Order
                </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
      </Form>
    </div>
  );
}
