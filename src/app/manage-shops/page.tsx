
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { addShop, getShops, updateShop, deleteShop } from "@/lib/shops";
import { getSellers } from "@/lib/users";
import type { Shop, UserProfile } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";


const shopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters."),
  address: z.string().min(5, "Address is required."),
  ownerId: z.string().min(1, "Shop owner is required."),
  notes: z.string().optional(),
});

export default function ManageShopsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [sellers, setSellers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof shopSchema>>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: "",
      address: "",
      ownerId: "",
      notes: "",
    },
  });
  
  const editForm = useForm<z.infer<typeof shopSchema>>({
    resolver: zodResolver(shopSchema),
  });

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
        router.push('/');
      }
    }
  }, [user, loading, router, toast]);

  const fetchShopsAndSellers = async () => {
    setIsLoading(true);
    try {
      const [fetchedShops, fetchedSellers] = await Promise.all([getShops(), getSellers()]);
      const shopsWithOwnerNames = fetchedShops.map(shop => {
        const owner = fetchedSellers.find(seller => seller.uid === shop.ownerId);
        return { ...shop, ownerName: owner?.name || 'N/A' };
      });
      setShops(shopsWithOwnerNames);
      setSellers(fetchedSellers);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchShopsAndSellers();
    }
  }, [user, toast]);

  useEffect(() => {
    if (editingShop) {
      editForm.reset({
          name: editingShop.name,
          address: editingShop.address,
          ownerId: editingShop.ownerId,
          notes: editingShop.notes || "",
      });
    }
  }, [editingShop, editForm]);


  async function onSubmit(values: z.infer<typeof shopSchema>) {
    try {
      await addShop(values);
      toast({ title: "Shop Created", description: "The new shop has been added." });
      form.reset();
      fetchShopsAndSellers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  }

  async function onEditSubmit(values: z.infer<typeof shopSchema>) {
    if (!editingShop) return;
    try {
      await updateShop(editingShop.id, values);
      toast({ title: "Shop Updated", description: "The shop details have been saved." });
      fetchShopsAndSellers();
      setIsEditDialogOpen(false);
      setEditingShop(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error Updating Shop", description: error.message });
    }
  }

  const handleDeleteShop = async (shopId: string) => {
    try {
      await deleteShop(shopId);
      toast({ title: "Shop Deleted", description: "The shop has been successfully deleted." });
      fetchShopsAndSellers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };
  
  if (loading || user?.role !== 'admin') {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Manage Shops</h1>
      <p className="mt-2 text-muted-foreground">Create, view, and edit shops.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create Shop</CardTitle>
              <CardDescription>Add a new shop to the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jasa Books & Stationary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Anytown, USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Owner</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a seller" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {sellers.map(seller => (
                                <SelectItem key={seller.uid} value={seller.uid}>{seller.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any additional notes about the shop..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creating..." : "Create Shop"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Shops</CardTitle>
              <CardDescription>View, edit, and delete shops.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center">Loading shops...</TableCell></TableRow>
                    ) : shops.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center">No shops found.</TableCell></TableRow>
                    ) : (
                      shops.map((shop) => (
                        <TableRow key={shop.id}>
                          <TableCell className="font-medium">{shop.name}</TableCell>
                          <TableCell>{shop.ownerName}</TableCell>
                          <TableCell>{new Date(shop.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                               <Dialog open={isEditDialogOpen && editingShop?.id === shop.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingShop(null);
                                    editForm.reset();
                                  }
                                  setIsEditDialogOpen(open);
                                }}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingShop(shop)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Shop</DialogTitle>
                                        <DialogDescription>
                                            Make changes to the shop details.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...editForm}>
                                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                            <FormField
                                                control={editForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Shop Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={editForm.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                             <FormField
                                                control={editForm.control}
                                                name="ownerId"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Shop Owner</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                            <SelectValue placeholder="Select a seller" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {sellers.map(seller => (
                                                            <SelectItem key={seller.uid} value={seller.uid}>{seller.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                             <FormField
                                                control={editForm.control}
                                                name="notes"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Notes</FormLabel>
                                                    <FormControl>
                                                      <Textarea placeholder="Any additional notes..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                             <DialogFooter>
                                                <DialogClose asChild>
                                                  <Button type="button" variant="secondary">Cancel</Button>
                                                </DialogClose>
                                                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                                                  {editForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                               </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the shop. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteShop(shop.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
