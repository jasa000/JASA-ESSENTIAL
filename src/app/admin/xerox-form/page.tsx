
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
} from "@/lib/data";
import type { XeroxOption, XeroxOptionType } from "@/lib/types";
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
import { Trash2, Pencil, PlusCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const optionSchema = z.object({
  name: z.string().min(1, "Option name is required."),
  price: z.coerce.number().min(0, "Price must be a non-negative number."),
});

const optionCategories: { type: XeroxOptionType; title: string }[] = [
  { type: "paperType", title: "Paper Types" },
  { type: "colorOption", title: "Color Options" },
  { type: "formatType", title: "Formats" },
  { type: "printRatio", title: "Print Ratios" },
  { type: "bindingType", title: "Binding Types" },
  { type: "laminationType", title: "Lamination Types" },
];

export default function ManageXeroxFormPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [options, setOptions] = useState<Record<XeroxOptionType, XeroxOption[]>>({
    paperType: [],
    colorOption: [],
    formatType: [],
    printRatio: [],
    bindingType: [],
    laminationType: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingOption, setEditingOption] = useState<{ option: XeroxOption; type: XeroxOptionType } | null>(null);
  const [deletingOption, setDeletingOption] = useState<{ option: XeroxOption; type: XeroxOptionType } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof optionSchema>>({
    resolver: zodResolver(optionSchema),
    defaultValues: { name: "", price: 0 },
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("admin")) {
        router.push("/");
      } else {
        fetchAllOptions();
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (editingOption) {
      form.reset({
        name: editingOption.option.name,
        price: editingOption.option.price,
      });
    } else {
      form.reset({ name: "", price: 0 });
    }
  }, [editingOption, form]);

  const fetchAllOptions = async () => {
    setIsLoading(true);
    try {
      const allFetchedOptions = await Promise.all(
        optionCategories.map(cat => getXeroxOptions(cat.type))
      );
      const newOptionsState = { ...options };
      optionCategories.forEach((cat, index) => {
        newOptionsState[cat.type] = allFetchedOptions[index];
      });
      setOptions(newOptionsState);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch form options.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (values: z.infer<typeof optionSchema>) => {
    if (!editingOption) return;
    setIsSubmitting(true);
    try {
      await updateXeroxOption(editingOption.type, editingOption.option.id, values);
      toast({ title: "Option Updated", description: `${values.name} has been updated.` });
      await fetchAllOptions();
      setEditingOption(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddNewSubmit = async (values: z.infer<typeof optionSchema>, type: XeroxOptionType) => {
    setIsSubmitting(true);
    try {
      await addXeroxOption(type, values);
      toast({ title: "Option Added", description: `${values.name} has been added.` });
      await fetchAllOptions();
      return true; // Indicate success for closing dialog
    } catch(error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return false; // Indicate failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOption) return;
    setIsSubmitting(true);
    try {
      await deleteXeroxOption(deletingOption.type, deletingOption.option.id);
      toast({ title: "Option Deleted", description: "The option has been removed." });
      await fetchAllOptions();
      setDeletingOption(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const AddNewOptionDialog = ({ type, title }: { type: XeroxOptionType, title: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const newForm = useForm<z.infer<typeof optionSchema>>({
      resolver: zodResolver(optionSchema),
      defaultValues: { name: "", price: 0 },
    });

    const onNewSubmit = async (values: z.infer<typeof optionSchema>) => {
        const success = await handleAddNewSubmit(values, type);
        if(success) {
          setIsOpen(false);
          newForm.reset();
        }
    }
    
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Add New</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {title}</DialogTitle>
          </DialogHeader>
          <Form {...newForm}>
            <form onSubmit={newForm.handleSubmit(onNewSubmit)} className="space-y-4">
              <FormField control={newForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={newForm.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Add Option"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };
  
  const renderOptionCard = (type: XeroxOptionType, title: string) => {
    const optionList = options[type];
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Manage {title.toLowerCase()} for the order form.</CardDescription>
          </div>
          <AddNewOptionDialog type={type} title={title} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              )) : optionList.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center">No options configured.</TableCell></TableRow>
              ) : (
                optionList.map(option => (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">{option.name}</TableCell>
                    <TableCell>Rs {option.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingOption({ option, type })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingOption({ option, type })}>
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
    );
  };

  if (authLoading || !user) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Manage Xerox Order Form
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure the options and pricing for the user-facing Xerox order form.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {optionCategories.map(cat => (
            <div key={cat.type}>
              {renderOptionCard(cat.type, cat.title)}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editingOption} onOpenChange={() => setEditingOption(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Option</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingOption} onOpenChange={() => setDeletingOption(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deletingOption?.option.name}" option.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
