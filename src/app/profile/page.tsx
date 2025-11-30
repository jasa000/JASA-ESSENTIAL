
"use client"

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Address, UserProfile } from "@/lib/types";
import { updateUserProfile } from "@/lib/users";

const addressSchema = z.object({
  type: z.enum(['Home', 'Work']),
  line1: z.string().min(1, "Address Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal Code is required"),
});

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  mobile: z.string().optional(),
  altMobiles: z.array(z.object({ value: z.string() })).optional(),
  altEmails: z.array(z.object({ value: z.string().email("Invalid email address") })).optional(),
  addresses: z.array(addressSchema).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isAddAddressDialogOpen, setIsAddAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<{ address: Address, index: number } | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      altMobiles: [],
      altEmails: [],
      addresses: [],
    },
  });

  const addressForm = useForm<Address>({
    resolver: zodResolver(addressSchema),
  });

  const { fields: altMobiles, append: appendAltMobile, remove: removeAltMobile } = useFieldArray({
    control: form.control,
    name: "altMobiles",
  });

  const { fields: altEmails, append: appendAltEmail, remove: removeAltEmail } = useFieldArray({
    control: form.control,
    name: "altEmails",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      form.reset({
        name: user.displayName || user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        altMobiles: user.altMobiles || [],
        altEmails: user.altEmails || [],
        addresses: user.addresses || [],
      });
    }
  }, [user, loading, router, form]);

  useEffect(() => {
    if (editingAddress) {
      addressForm.reset(editingAddress.address);
    } else {
      addressForm.reset({ type: 'Home', line1: '', city: '', state: '', postalCode: '' });
    }
  }, [editingAddress, addressForm]);

  async function onProfileSubmit(values: ProfileFormData) {
    if (!user) return;
    try {
      const { addresses, ...profileData } = values;
      await updateUserProfile(user.uid, profileData);
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. " + error.message,
      });
    }
  }

  async function onAddressSubmit(values: Address) {
    if (!user) return;
    const currentAddresses = form.getValues('addresses') || [];
    let newAddresses: Address[];

    if (editingAddress !== null) {
      // Update existing address
      newAddresses = [...currentAddresses];
      newAddresses[editingAddress.index] = values;
    } else {
      // Add new address
      newAddresses = [...currentAddresses, values];
    }
    
    try {
      await updateUserProfile(user.uid, { addresses: newAddresses });
      form.setValue('addresses', newAddresses);
      toast({ title: editingAddress ? "Address Updated" : "Address Added" });
      setIsAddAddressDialogOpen(false);
      setEditingAddress(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to save address: ${error.message}` });
    }
  }

  async function handleRemoveAddress(indexToRemove: number) {
    if (!user) return;
    const currentAddresses = form.getValues('addresses') || [];
    const newAddresses = currentAddresses.filter((_, index) => index !== indexToRemove);
    try {
      await updateUserProfile(user.uid, { addresses: newAddresses });
      form.setValue('addresses', newAddresses);
      toast({ title: "Address Removed" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to remove address: ${error.message}` });
    }
  }

  if (loading || !user) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="mb-8 h-12 w-48" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <Skeleton className="mt-4 h-6 w-32" />
                            <Skeleton className="mt-2 h-4 w-48" />
                        </CardHeader>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="mt-2 h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const renderAddressForm = () => (
    <Form {...addressForm}>
      <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
        <FormField control={addressForm.control} name="type" render={({ field }) => (
          <FormItem><FormLabel>Address Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select address type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Home">Home</SelectItem><SelectItem value="Work">Work</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={addressForm.control} name="line1" render={({ field }) => (
          <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} placeholder="123 Main St" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={addressForm.control} name="line2" render={({ field }) => (
          <FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input {...field} placeholder="Apartment, suite, etc." /></FormControl><FormMessage /></FormItem>
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
          <Button type="submit" disabled={addressForm.formState.isSubmitting}>{addressForm.formState.isSubmitting ? "Saving..." : "Save Address"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <>
      <Dialog open={isAddAddressDialogOpen} onOpenChange={(open) => {
        setIsAddAddressDialogOpen(open);
        if (!open) setEditingAddress(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          {renderAddressForm()}
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">My Profile</h1>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                  <AvatarFallback>{getInitials(user.displayName || user.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline pt-4">{user.displayName || user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Personal & Contact Info</CardTitle>
                    <CardDescription>Update your personal information. Addresses are managed separately below.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Primary Email</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="mobile" render={({ field }) => (
                        <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div>
                      <FormLabel>Alternative Mobile Numbers</FormLabel>
                      {altMobiles.map((field, index) => (
                         <FormField key={field.id} control={form.control} name={`altMobiles.${index}.value`} render={({ field }) => (
                          <FormItem className="mt-2 flex items-center gap-2">
                            <FormControl><Input {...field} placeholder={`Alt. Mobile ${index + 1}`} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAltMobile(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            <FormMessage />
                          </FormItem>
                         )} />
                      ))}
                      {altMobiles.length < 2 && (
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAltMobile({ value: "" })}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Mobile
                        </Button>
                      )}
                    </div>
                    <div>
                      <FormLabel>Alternative Email Addresses</FormLabel>
                      {altEmails.map((field, index) => (
                         <FormField key={field.id} control={form.control} name={`altEmails.${index}.value`} render={({ field }) => (
                          <FormItem className="mt-2 flex items-center gap-2">
                            <FormControl><Input {...field} placeholder={`Alt. Email ${index + 1}`} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAltEmail(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            <FormMessage />
                          </FormItem>
                         )} />
                      ))}
                       {altEmails.length < 1 && (
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAltEmail({ value: "" })}>
                              <PlusCircle className="mr-2 h-4 w-4" /> Add Email
                          </Button>
                       )}
                    </div>
                    <Button type="submit" className="w-full">Save Personal Info</Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
            
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Manage Addresses</CardTitle>
                <CardDescription>View, edit, or remove your saved addresses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.watch('addresses')?.map((address, index) => (
                  <Card key={index} className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-semibold">Address {index + 1} ({address.type})</h4>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => { setEditingAddress({ address, index }); setIsAddAddressDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAddress(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="grid grid-cols-[80px_1fr]"><span className="font-medium text-foreground">Line 1:</span><p>{address.line1}</p></div>
                        {address.line2 && <div className="grid grid-cols-[80px_1fr]"><span className="font-medium text-foreground">Line 2:</span><p>{address.line2}</p></div>}
                        <div className="grid grid-cols-[80px_1fr]"><span className="font-medium text-foreground">City:</span><p>{address.city}</p></div>
                        <div className="grid grid-cols-[80px_1fr]"><span className="font-medium text-foreground">State:</span><p>{address.state}</p></div>
                        <div className="grid grid-cols-[80px_1fr]"><span className="font-medium text-foreground">Pincode:</span><p>{address.postalCode}</p></div>
                    </div>
                  </Card>
                ))}
                
                {(form.getValues('addresses')?.length || 0) < 2 && (
                  <Button type="button" variant="outline" className="w-full" onClick={() => { setEditingAddress(null); setIsAddAddressDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
