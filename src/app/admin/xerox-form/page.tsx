
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const optionSchema = z.object({
  name: z.string().min(1, "Option name is required."),
});

const paperTypeSchema = z.object({
  name: z.string().min(1, "Paper type name is required."),
  price: z.coerce.number().min(0, "Price must be a non-negative number."),
  colorOptionIds: z.array(z.string()).optional(),
  formatTypeIds: z.array(z.string()).optional(),
  printRatioIds: z.array(z.string()).optional(),
  bindingTypeIds: z.array(z.string()).optional(),
  laminationTypeIds: z.array(z.string()).optional(),
});


const optionCategories: { type: XeroxOptionType; title: string; }[] = [
  { type: "paperType", title: "Paper Types" },
  { type: "colorOption", title: "Color Options" },
  { type: "formatType", title: "Formats" },
  { type: "printRatio", title: "Print Ratios" },
  { type: "bindingType", title: "Binding Types" },
  { type: "laminationType", title: "Lamination Types" },
];

const OptionCheckboxList = ({ control, name, label, items }: { control: any, name: any, label: string, items: XeroxOption[] }) => (
    <div>
      <FormLabel>{label}</FormLabel>
      <ScrollArea className="h-40 rounded-md border p-4 mt-2">
        {items.map((item) => (
          <FormField
            key={item.id}
            control={control}
            name={name}
            render={({ field }) => {
              return (
                <FormItem
                  key={item.id}
                  className="flex flex-row items-start space-x-3 space-y-0 mb-4"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(item.id)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), item.id])
                          : field.onChange(
                              (field.value || []).filter(
                                (value: string) => value !== item.id
                              )
                            );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal w-full">
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                      {item.price !== undefined && <span>Rs {item.price?.toFixed(2)}</span>}
                    </div>
                  </FormLabel>
                </FormItem>
              );
            }}
          />
        ))}
      </ScrollArea>
    </div>
  );

const PaperTypeFormFields = ({ formControl, options }: { formControl: any, options: Record<XeroxOptionType, XeroxOption[]>}) => (
    <>
       <div className="grid grid-cols-2 gap-4">
        <FormField control={formControl} name="name" render={({ field }) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={formControl} name="price" render={({ field }) => (
          <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionCheckboxList control={formControl} name="colorOptionIds" label="Available Color Options" items={options.colorOption} />
        <OptionCheckboxList control={formControl} name="formatTypeIds" label="Available Formats" items={options.formatType} />
        <OptionCheckboxList control={formControl} name="printRatioIds" label="Available Print Ratios" items={options.printRatio} />
        <OptionCheckboxList control={formControl} name="bindingTypeIds" label="Available Binding Types" items={options.bindingType} />
        <OptionCheckboxList control={formControl} name="laminationTypeIds" label="Available Lamination Types" items={options.laminationType} />
      </div>
    </>
  );

const AddNewDialog = ({
    type,
    title,
    options,
    isPaperType,
    handleAddNewSubmit,
    isSubmitting,
  }: {
    type: XeroxOptionType,
    title: string,
    options: Record<XeroxOptionType, XeroxOption[]>,
    isPaperType: boolean,
    handleAddNewSubmit: (values: any, type: XeroxOptionType) => Promise<boolean>,
    isSubmitting: boolean
  }) => {
      const [isOpen, setIsOpen] = useState(false);
      
      const form = useForm({
        resolver: zodResolver(isPaperType ? paperTypeSchema : optionSchema),
        defaultValues: isPaperType
          ? { name: "", price: 0, colorOptionIds: [], formatTypeIds: [], printRatioIds: [], bindingTypeIds: [], laminationTypeIds: [] }
          : { name: "" },
      });

      const onNewSubmit = async (values: any) => {
          const success = await handleAddNewSubmit(values, type);
          if(success) {
            setIsOpen(false);
            form.reset();
          }
      }
      
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Add New {title}</Button>
          </DialogTrigger>
          <DialogContent className={isPaperType ? "max-w-3xl" : ""}>
            <DialogHeader>
              <DialogTitle>Add New {title}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onNewSubmit)} className="space-y-4">
                {isPaperType ? (
                  <PaperTypeFormFields formControl={form.control} options={options} />
                ) : (
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
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
    defaultValues: { name: "" },
  });

  const paperTypeForm = useForm<z.infer<typeof paperTypeSchema>>({
    resolver: zodResolver(paperTypeSchema),
    defaultValues: {
      name: "",
      price: 0,
      colorOptionIds: [],
      formatTypeIds: [],
      printRatioIds: [],
      bindingTypeIds: [],
      laminationTypeIds: [],
    },
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
      if (editingOption.type === 'paperType') {
        paperTypeForm.reset({
          name: editingOption.option.name,
          price: editingOption.option.price,
          colorOptionIds: editingOption.option.colorOptionIds || [],
          formatTypeIds: editingOption.option.formatTypeIds || [],
          printRatioIds: editingOption.option.printRatioIds || [],
          bindingTypeIds: editingOption.option.bindingTypeIds || [],
          laminationTypeIds: editingOption.option.laminationTypeIds || [],
        });
      } else {
        form.reset({
          name: editingOption.option.name,
        });
      }
    } else {
      form.reset({ name: "" });
      paperTypeForm.reset({
        name: "", price: 0, colorOptionIds: [], formatTypeIds: [], printRatioIds: [], bindingTypeIds: [], laminationTypeIds: [],
      });
    }
  }, [editingOption, form, paperTypeForm]);

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
  
  const handleFormSubmit = async (values: z.infer<typeof optionSchema> | z.infer<typeof paperTypeSchema>) => {
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
  
  const handleAddNewSubmit = async (values: z.infer<typeof optionSchema> | z.infer<typeof paperTypeSchema>, type: XeroxOptionType) => {
    setIsSubmitting(true);
    try {
      const payload = type === 'paperType' ? values : { ...values, price: 0 };
      await addXeroxOption(type, payload);
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

  const renderOptionTable = (type: XeroxOptionType, title: string) => {
    const optionList = options[type];
    const isPaperType = type === 'paperType';

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>Manage {title.toLowerCase()} for the order form.</CardDescription>
            </div>
            <AddNewDialog
              type={type}
              title={title}
              options={options}
              isPaperType={isPaperType}
              handleAddNewSubmit={handleAddNewSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option Name</TableHead>
                {isPaperType && <TableHead>Price</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  {isPaperType && <TableCell><Skeleton className="h-6 w-16" /></TableCell>}
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              )) : optionList.length === 0 ? (
                <TableRow><TableCell colSpan={isPaperType ? 3 : 2} className="text-center">No options configured.</TableCell></TableRow>
              ) : (
                optionList.map(option => (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">{option.name}</TableCell>
                    {isPaperType && <TableCell>Rs {option.price?.toFixed(2)}</TableCell>}
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
        
        <Tabs defaultValue="paperType" className="mt-8">
            <div className="relative w-full overflow-x-auto no-scrollbar">
              <TabsList className="inline-flex">
                {optionCategories.map(cat => (
                  <TabsTrigger key={cat.type} value={cat.type} className="whitespace-nowrap">
                    {cat.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {optionCategories.map(cat => (
              <TabsContent key={cat.type} value={cat.type} className="mt-4">
                {renderOptionTable(cat.type, cat.title)}
              </TabsContent>
            ))}
        </Tabs>

      </div>

      <Dialog open={!!editingOption} onOpenChange={() => setEditingOption(null)}>
        <DialogContent className={editingOption?.type === 'paperType' ? 'max-w-3xl' : ''}>
          <DialogHeader>
            <DialogTitle>Edit Option</DialogTitle>
          </DialogHeader>
           {editingOption?.type === 'paperType' ? (
            <Form {...paperTypeForm}>
                <form onSubmit={paperTypeForm.handleSubmit(handleFormSubmit)} className="space-y-4">
                  <PaperTypeFormFields formControl={paperTypeForm.control} options={options} />
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                  </DialogFooter>
                </form>
            </Form>
           ) : (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                   <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                  </DialogFooter>
                </form>
            </Form>
           )}
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

    