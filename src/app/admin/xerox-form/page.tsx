
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { 
    getXeroxOptions, 
    addXeroxOption, 
    updateXeroxOption, 
    deleteXeroxOption,
    setPaperTypeAsDefault
} from "@/lib/data";
import type { XeroxOption } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil, Star, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


const paperTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  priceBw: z.coerce.number().positive("B&W price must be a positive number."),
  priceColor: z.coerce.number().positive("Color price must be a positive number."),
  isDefault: z.boolean().optional(),
});

export default function ManageXeroxFormPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [paperTypes, setPaperTypes] = useState<XeroxOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [editingPaperType, setEditingPaperType] = useState<XeroxOption | null>(null);
    const [deletingPaperType, setDeletingPaperType] = useState<XeroxOption | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const form = useForm<z.infer<typeof paperTypeSchema>>({
        resolver: zodResolver(paperTypeSchema),
        defaultValues: {
            name: "",
            priceBw: 0,
            priceColor: 0,
            isDefault: false,
        },
    });

    const fetchPaperTypes = async () => {
        setIsLoading(true);
        try {
            const types = await getXeroxOptions('paperType');
            setPaperTypes(types);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch paper types." });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.roles.includes("admin")) {
                toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page." });
                router.push("/");
            } else {
                fetchPaperTypes();
            }
        }
    }, [user, authLoading, router, toast]);

    useEffect(() => {
        if (isFormOpen) {
            if (editingPaperType) {
                form.reset({
                    name: editingPaperType.name,
                    priceBw: editingPaperType.priceBw || 0,
                    priceColor: editingPaperType.priceColor || 0,
                    isDefault: editingPaperType.isDefault || false,
                });
            } else {
                form.reset({ name: "", priceBw: 0, priceColor: 0, isDefault: false });
            }
        }
    }, [isFormOpen, editingPaperType, form]);

    const handleFormSubmit = async (values: z.infer<typeof paperTypeSchema>) => {
        setIsSubmitting(true);
        try {
            let savedPaperTypeId: string | null = null;
            if (editingPaperType) {
                await updateXeroxOption('paperType', editingPaperType.id, values);
                savedPaperTypeId = editingPaperType.id;
                toast({ title: "Paper Type Updated", description: `${values.name} has been updated.` });
            } else {
                const newPaperType = await addXeroxOption('paperType', values);
                savedPaperTypeId = newPaperType.id;
                toast({ title: "Paper Type Added", description: `${values.name} has been added.` });
            }

            // If isDefault is true, run the transaction to set it
            if (values.isDefault && savedPaperTypeId) {
                await setPaperTypeAsDefault(savedPaperTypeId);
                toast({ title: "Default Set", description: `${values.name} is now the default paper type.` });
            }

            fetchPaperTypes();
            setIsFormOpen(false);
            setEditingPaperType(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async () => {
        if (!deletingPaperType) return;
        setIsSubmitting(true);
        try {
            await deleteXeroxOption('paperType', deletingPaperType.id);
            toast({ title: "Paper Type Deleted", description: "The paper type has been removed." });
            fetchPaperTypes();
            setDeletingPaperType(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderForm = () => (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Paper Type Name</FormLabel>
                            <FormControl><Input placeholder="e.g., A4 Sheet (75 GSM)" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="priceBw"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>B&W Price</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="priceColor"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color Price</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                        <FormLabel>Set as Default</FormLabel>
                        <p className="text-xs text-muted-foreground">
                            This will be the pre-selected paper type for users.
                        </p>
                        </div>
                        <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Paper Type"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
                        Manage Xerox Paper Types
                    </h1>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setEditingPaperType(null); setIsFormOpen(true); }}>Add Paper Type</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingPaperType ? "Edit Paper Type" : "Add Paper Type"}</DialogTitle>
                            </DialogHeader>
                            {renderForm()}
                        </DialogContent>
                    </Dialog>
                </div>
                <p className="mt-2 text-muted-foreground">Add, edit, and set pricing for paper types used in the Xerox form.</p>
                
                <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Set a paper type as default in the edit menu. This will be the pre-selected option for users.
                    </AlertDescription>
                </Alert>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Paper Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Default</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>B&W Price</TableHead>
                                    <TableHead>Color Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-8 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paperTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">No paper types configured yet.</TableCell>
                                    </TableRow>
                                ) : (
                                    paperTypes.map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell>
                                                {type.isDefault && (
                                                    <div className="flex justify-center">
                                                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{type.name}</TableCell>
                                            <TableCell>Rs {type.priceBw?.toFixed(2)}</TableCell>
                                            <TableCell>Rs {type.priceColor?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingPaperType(type); setIsFormOpen(true); }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeletingPaperType(type)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <AlertDialog open={!!deletingPaperType} onOpenChange={(open) => !open && setDeletingPaperType(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{deletingPaperType?.name}". This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
