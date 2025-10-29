
"use client"

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().optional(),
  altMobiles: z.array(z.object({ value: z.string() })).optional(),
  altEmails: z.array(z.object({ value: z.string().email("Invalid email address") })).optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
});

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      mobile: "",
      altMobiles: [],
      altEmails: [],
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
      },
    },
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
        name: user.displayName || "",
        // Pre-fill other fields from your DB here if available
      });
    }
  }, [user, loading, router, form]);

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

  function onSubmit(values: z.infer<typeof profileSchema>) {
    console.log("Updating profile:", values);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">My Profile</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline pt-4">{user.displayName || "User"}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Edit Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    
                     <div>
                        <FormLabel>Alternative Mobile Numbers</FormLabel>
                        {altMobiles.map((field, index) => (
                           <FormField
                              key={field.id}
                              control={form.control}
                              name={`altMobiles.${index}.value`}
                              render={({ field }) => (
                                <FormItem className="mt-2 flex items-center gap-2">
                                  <FormControl>
                                    <Input {...field} placeholder={`Alt. Mobile ${index + 1}`} />
                                  </FormControl>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAltMobile(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
                           <FormField
                              key={field.id}
                              control={form.control}
                              name={`altEmails.${index}.value`}
                              render={({ field }) => (
                                <FormItem className="mt-2 flex items-center gap-2">
                                  <FormControl>
                                    <Input {...field} placeholder={`Alt. Email ${index + 1}`} />
                                  </FormControl>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAltEmail(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        ))}
                         {altEmails.length < 1 && (
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAltEmail({ value: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Email
                            </Button>
                         )}
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-medium">Primary Address</h3>
                        <FormField
                            control={form.control}
                            name="address.line1"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address Line 1</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address.line2"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address Line 2</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="address.city"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address.state"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State / Province</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address.postalCode"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Postal Code</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    </div>


                    <Button type="submit" className="w-full">Save Changes</Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
        </div>
      </div>
    </div>
  );
}

    