
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getXeroxOptions, addXeroxOption, deleteXeroxOption } from "@/lib/data";
import type { XeroxOption, XeroxOptionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileUp, XCircle, FileText, ClipboardList, Trash2, Cog } from "lucide-react";
import Image from "next/image";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up worker for pdf.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const xeroxOrderSchema = z.object({
  file: z.any().refine(file => file, "Please upload a document."),
  paperType: z.string().min(1, "Please select a paper type."),
  colorOption: z.string().min(1, "Please select a color option."),
  formatType: z.string().min(1, "Please select a format."),
  printRatio: z.string().min(1, "Please select a print ratio."),
  bindingType: z.string().min(1, "Please select a binding type."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const paperTypeSchema = z.object({
  name: z.string().min(3, "Paper type name is required."),
  price: z.coerce.number().positive("Price must be a positive number."),
});


export default function XeroxOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [paperTypes, setPaperTypes] = useState<XeroxOption[]>([]);
  const [bindingTypes, setBindingTypes] = useState<XeroxOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deletingPaperType, setDeletingPaperType] = useState<XeroxOption | null>(null);
  const [isManagePaperTypesOpen, setIsManagePaperTypesOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileDetails, setFileDetails] = useState<{name: string; type: string; pages?: number; preview?: string;} | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const form = useForm<z.infer<typeof xeroxOrderSchema>>({
    resolver: zodResolver(xeroxOrderSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const paperTypeForm = useForm<z.infer<typeof paperTypeSchema>>({
    resolver: zodResolver(paperTypeSchema),
    defaultValues: { name: "", price: 0 },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    fetchAllOptions();
  }, [user, authLoading, router]);

  const fetchPaperTypes = async () => {
     try {
        const fetchedPaperTypes = await getXeroxOptions('paperType');
        setPaperTypes(fetchedPaperTypes);
     } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to refresh paper types." });
     }
  };

  const fetchAllOptions = async () => {
    setIsLoading(true);
    try {
      const [fetchedPaperTypes, fetchedBindingTypes] = await Promise.all([
        getXeroxOptions('paperType'),
        getXeroxOptions('bindingType'),
      ]);
      setPaperTypes(fetchedPaperTypes);
      setBindingTypes(fetchedBindingTypes);
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

  const handleAddPaperType = async (values: z.infer<typeof paperTypeSchema>) => {
    try {
      await addXeroxOption('paperType', values);
      toast({ title: "Paper Type Added" });
      paperTypeForm.reset();
      fetchPaperTypes();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDeletePaperType = async () => {
    if (!deletingPaperType) return;
    try {
      await deleteXeroxOption('paperType', deletingPaperType.id);
      toast({ title: "Paper Type Deleted" });
      setDeletingPaperType(null);
      fetchPaperTypes();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const getPageCount = async (file: File) => {
      setIsParsing(true);
      try {
          const arrayBuffer = await file.arrayBuffer();
          if (file.type === 'application/pdf') {
              const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
              return pdf.numPages;
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              // This is an estimation for docx, as it doesn't have a fixed page concept
              // like PDF. A more accurate server-side conversion would be needed for precision.
              const result = await mammoth.extractRawText({ arrayBuffer });
              // Simple estimation: 250 words per page.
              const wordCount = result.value.split(/\s+/).length;
              return Math.ceil(wordCount / 250);
          }
      } catch (error) {
          console.error("Error getting page count:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not parse document page count.' });
      } finally {
          setIsParsing(false);
      }
      return undefined;
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const pages = await getPageCount(file);
          const isImage = file.type.startsWith('image/');
          setFileDetails({
              name: file.name,
              type: file.type,
              pages: isImage ? 1 : pages, // Assume an image is 1 page
              preview: isImage ? URL.createObjectURL(file) : undefined,
          });
          form.setValue('file', file, { shouldValidate: true });
      }
  }, [toast, form]);

  const handleClearFile = () => {
      setFileDetails(null);
      form.setValue('file', null, { shouldValidate: true });
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  function onSubmit(values: z.infer<typeof xeroxOrderSchema>) {
    if (!fileDetails?.pages) {
      toast({
        variant: 'destructive',
        title: 'Cannot Calculate',
        description: 'Page count for the uploaded document could not be determined.',
      });
      return;
    }

    const selectedPaper = paperTypes.find(opt => opt.id === values.paperType);
    if (!selectedPaper?.price) {
      toast({
        variant: 'destructive',
        title: 'Cannot Calculate',
        description: 'The selected paper type does not have a price associated with it.',
      });
      return;
    }

    const selectedRatio = values.printRatio;
    
    let pagesToCharge = fileDetails.pages;
    if (selectedRatio === '1:2') {
      pagesToCharge = Math.ceil(fileDetails.pages / 2);
    }
    
    const totalCost = pagesToCharge * selectedPaper.price * values.quantity;

    toast({
      title: "Order Calculated",
      description: `The estimated total cost for your order is Rs ${totalCost.toFixed(2)}.`,
      duration: 9000,
    });
  }

  if (authLoading || !user) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <>
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
                    Xerox Order Form
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Upload your document and select your printing options.
                </p>
            </div>
            {user.roles.includes('admin') && (
                 <Dialog open={isManagePaperTypesOpen} onOpenChange={setIsManagePaperTypesOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><Cog className="mr-2 h-4 w-4" /> Manage Paper Types</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Manage Paper Types</DialogTitle>
                        <DialogDescription>Add or remove paper types available for selection.</DialogDescription>
                      </DialogHeader>
                      
                      <Form {...paperTypeForm}>
                        <form onSubmit={paperTypeForm.handleSubmit(handleAddPaperType)} className="grid grid-cols-3 gap-4 items-start">
                            <FormField control={paperTypeForm.control} name="name" render={({ field }) => (
                                <FormItem className="col-span-3 sm:col-span-1"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={paperTypeForm.control} name="price" render={({ field }) => (
                                <FormItem className="col-span-3 sm:col-span-1"><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" className="self-end col-span-3 sm:col-span-1" disabled={paperTypeForm.formState.isSubmitting}>Add Paper Type</Button>
                        </form>
                      </Form>

                      <div className="mt-4 border rounded-md max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {paperTypes.map(pt => (
                                    <TableRow key={pt.id}>
                                        <TableCell>{pt.name}</TableCell>
                                        <TableCell>Rs {pt.price?.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingPaperType(pt)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>


        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList /> New Order</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {!fileDetails ? (
                        <div
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileUp className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm font-medium text-muted-foreground">Upload your document</p>
                            <p className="text-xs text-muted-foreground">PDF, DOCX, or Image</p>
                            <Input 
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                            />
                        </div>
                        ) : (
                        <Card className="p-4 relative">
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleClearFile}>
                                <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                            </Button>
                            <div className="flex items-start gap-4">
                                {fileDetails.preview ? (
                                    <div className="relative h-24 w-24 flex-shrink-0">
                                        <Image src={fileDetails.preview} alt="File preview" fill className="rounded-md object-cover" />
                                    </div>
                                ) : (
                                    <div className="h-24 w-24 flex-shrink-0 flex items-center justify-center bg-muted rounded-md">
                                        <FileText className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <p className="font-semibold truncate">{fileDetails.name}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{fileDetails.type.split('/')[1]}</p>
                                    {isParsing ? (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Loader2 className="h-4 w-4 animate-spin"/> Checking pages...</p>
                                    ) : fileDetails.pages !== undefined && (
                                        <p className="text-sm text-muted-foreground">Pages: {fileDetails.pages}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                        )}
                        <FormField control={form.control} name="file" render={({ field }) => <FormItem><FormMessage /></FormItem>} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="paperType"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Paper Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a paper type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {paperTypes.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name} (Rs {opt.price?.toFixed(2)})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="colorOption"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a color option" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="black-and-white">Black and White</SelectItem>
                                            <SelectItem value="colour">Colour</SelectItem>
                                            <SelectItem value="gradient">Gradient</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="formatType"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Format</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a format" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="front-only">Front Only</SelectItem>
                                            <SelectItem value="front-back">Front & Back</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="printRatio"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Print Ratio</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a print ratio" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1:1">1:1 (Single Side)</SelectItem>
                                            <SelectItem value="1:2">1:2 (Double Side)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="bindingType"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Binding Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a binding type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {bindingTypes.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={isLoading || form.formState.isSubmitting} className="w-full">
                            {(isLoading || form.formState.isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Calculate
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>

    <AlertDialog open={!!deletingPaperType} onOpenChange={(open) => !open && setDeletingPaperType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deletingPaperType?.name}" paper type. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePaperType}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
