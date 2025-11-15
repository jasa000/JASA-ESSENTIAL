
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import {
  addXeroxOption,
  deleteXeroxOption,
  getXeroxOptions,
  updateXeroxOption,
} from "@/lib/data";
import type { XeroxOption } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Loader2, FileUp, XCircle, FileText, ClipboardList, Trash2, Cog, Pencil } from "lucide-react";
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
  color: z.string().min(1, "Please select a color option."),
  format: z.string().min(1, "Please select a format."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const paperTypeSchema = z.object({
  name: z.string().min(1, "Paper type name is required."),
  price: z.coerce.number().positive("Price must be a positive number."),
});

export default function XeroxOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [paperTypes, setPaperTypes] = useState<XeroxOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isManagePaperTypesOpen, setIsManagePaperTypesOpen] = useState(false);
  const [editingPaperType, setEditingPaperType] = useState<XeroxOption | null>(null);
  const [deletingPaperType, setDeletingPaperType] = useState<XeroxOption | null>(null);
  const [isSubmittingPaperType, setIsSubmittingPaperType] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileDetails, setFileDetails] = useState<{name: string; type: string; pages?: number; preview?: string;} | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const orderForm = useForm<z.infer<typeof xeroxOrderSchema>>({
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
    if (editingPaperType) {
        paperTypeForm.reset({ name: editingPaperType.name, price: editingPaperType.price });
    } else {
        paperTypeForm.reset({ name: "", price: 0 });
    }
  }, [editingPaperType, paperTypeForm]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    fetchPaperTypes();
  }, [user, authLoading, router]);

  const fetchPaperTypes = async () => {
     setIsLoading(true);
     try {
        const fetchedPaperTypes = await getXeroxOptions('paperType');
        setPaperTypes(fetchedPaperTypes);
     } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to refresh paper types." });
     } finally {
        setIsLoading(false);
     }
  };
  
  const handleAddOrUpdatePaperType = async (values: z.infer<typeof paperTypeSchema>) => {
    setIsSubmittingPaperType(true);
    try {
        if(editingPaperType) {
            await updateXeroxOption('paperType', editingPaperType.id, values);
            toast({ title: "Paper Type Updated" });
        } else {
            await addXeroxOption('paperType', values);
            toast({ title: "Paper Type Added" });
        }
      paperTypeForm.reset();
      setEditingPaperType(null);
      fetchPaperTypes(); // Refresh list
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsSubmittingPaperType(false);
    }
  };

  const handleDeletePaperType = async () => {
    if (!deletingPaperType) return;
    try {
      await deleteXeroxOption('paperType', deletingPaperType.id);
      toast({ title: "Paper Type Deleted" });
      setDeletingPaperType(null);
      fetchPaperTypes(); // Refresh list
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
              // Mammoth gives word count, not page count. Estimate pages.
              const result = await mammoth.extractRawText({ arrayBuffer });
              const wordCount = result.value.split(/\s+/).length;
              return Math.ceil(wordCount / 250); // Rough estimation
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
          orderForm.setValue('file', file, { shouldValidate: true });
      }
  }, [toast, orderForm]);

  const handleClearFile = () => {
      setFileDetails(null);
      orderForm.setValue('file', null, { shouldValidate: true });
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

    const selectedPaper = paperTypes.find(p => p.id === values.paperType);
    if (!selectedPaper || selectedPaper.price === undefined) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected paper type not found or has no price.' });
        return;
    }

    const isFrontAndBack = values.format.toLowerCase().includes('back');
    
    let pagesToCharge = fileDetails.pages;
    if (isFrontAndBack) {
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
                        <DialogTitle>{editingPaperType ? 'Edit Paper Type' : 'Manage Paper Types'}</DialogTitle>
                        <DialogDescription>{editingPaperType ? 'Update the paper type details.' : 'Add or remove paper types and their prices.'}</DialogDescription>
                      </DialogHeader>
                      
                      <Form {...paperTypeForm}>
                        <form onSubmit={paperTypeForm.handleSubmit(handleAddOrUpdatePaperType)} className="grid grid-cols-3 gap-4 items-start pt-4">
                            <FormField control={paperTypeForm.control} name="name" render={({ field }) => (
                                <FormItem className="col-span-3 sm:col-span-1"><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="e.g., A4" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={paperTypeForm.control} name="price" render={({ field }) => (
                                <FormItem className="col-span-3 sm:col-span-1"><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="flex gap-2 self-end col-span-3 sm:col-span-1">
                                {editingPaperType && <Button type="button" variant="secondary" onClick={() => setEditingPaperType(null)}>Cancel Edit</Button>}
                                <Button type="submit" disabled={isSubmittingPaperType}>{isSubmittingPaperType ? 'Saving...' : (editingPaperType ? 'Update' : 'Add')}</Button>
                            </div>
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
                                            <Button variant="ghost" size="icon" onClick={() => setEditingPaperType(pt)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
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
                <Form {...orderForm}>
                    <form onSubmit={orderForm.handleSubmit(onSubmit)} className="space-y-8">
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
                        <FormField control={orderForm.control} name="file" render={({ field }) => <FormItem><FormMessage /></FormItem>} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:grid-cols-4">
                           <FormField control={orderForm.control} name="paperType" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Paper Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select paper" /></SelectTrigger></FormControl>
                                    <SelectContent>{paperTypes.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name} (Rs {opt.price?.toFixed(2)})</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={orderForm.control} name="color" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Color</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Black and White">Black and White</SelectItem>
                                        <SelectItem value="Colour">Colour</SelectItem>
                                        <SelectItem value="Gradient">Gradient</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={orderForm.control} name="format" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Format</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Front Only">Front Only</SelectItem>
                                        <SelectItem value="Front & Back">Front & Back</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={orderForm.control} name="quantity" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl><Input type="number" min="1" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <Button type="submit" disabled={isLoading || orderForm.formState.isSubmitting} className="w-full">
                            {(isLoading || orderForm.formState.isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

    