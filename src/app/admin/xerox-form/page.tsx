
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import {
  addXeroxService,
  deleteXeroxService,
  getXeroxServices,
  updateXeroxService,
} from "@/lib/data";
import type { XeroxService } from "@/lib/types";

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
  serviceId: z.string().min(1, "Please select a service."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const serviceSchema = z.object({
  name: z.string().min(3, "Service name is required."),
  price: z.coerce.number().positive("Price must be a positive number."),
});


export default function XeroxOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [services, setServices] = useState<XeroxService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);
  const [editingService, setEditingService] = useState<XeroxService | null>(null);
  const [deletingService, setDeletingService] = useState<XeroxService | null>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileDetails, setFileDetails] = useState<{name: string; type: string; pages?: number; preview?: string;} | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const orderForm = useForm<z.infer<typeof xeroxOrderSchema>>({
    resolver: zodResolver(xeroxOrderSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const serviceForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", price: 0 },
  });
  
  useEffect(() => {
    if (editingService) {
        serviceForm.reset({ name: editingService.name, price: editingService.price });
    } else {
        serviceForm.reset({ name: "", price: 0 });
    }
  }, [editingService, serviceForm]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    fetchServices();
  }, [user, authLoading, router]);

  const fetchServices = async () => {
     setIsLoading(true);
     try {
        const fetchedServices = await getXeroxServices();
        setServices(fetchedServices);
     } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to refresh services." });
     } finally {
        setIsLoading(false);
     }
  };

  const handleAddOrUpdateService = async (values: z.infer<typeof serviceSchema>) => {
    setIsSubmittingService(true);
    try {
        if(editingService) {
            await updateXeroxService(editingService.id, values);
            toast({ title: "Service Updated" });
        } else {
            // A simple way to order, might need improvement
            const newOrder = services.length > 0 ? Math.max(...services.map(s => s.order || 0)) + 1 : 1;
            await addXeroxService({ ...values, order: newOrder });
            toast({ title: "Service Added" });
        }
      serviceForm.reset();
      setEditingService(null);
      fetchServices(); // Refresh list
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsSubmittingService(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    try {
      await deleteXeroxService(deletingService.id);
      toast({ title: "Service Deleted" });
      setDeletingService(null);
      fetchServices(); // Refresh list
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
              const result = await mammoth.extractRawText({ arrayBuffer });
              // Simple estimation: ~250 words per page
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

    const selectedService = services.find(s => s.id === values.serviceId);
    if (!selectedService) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected service not found.' });
        return;
    }

    // Crude check for 'front and back' or similar terms in the service name
    const isFrontAndBack = selectedService.name.toLowerCase().includes('back') || selectedService.name.toLowerCase().includes('double');
    
    let pagesToCharge = fileDetails.pages;
    if (isFrontAndBack) {
      pagesToCharge = Math.ceil(fileDetails.pages / 2);
    }
    
    const totalCost = pagesToCharge * selectedService.price * values.quantity;

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
                 <Dialog open={isManageServicesOpen} onOpenChange={setIsManageServicesOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><Cog className="mr-2 h-4 w-4" /> Manage Services</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>{editingService ? 'Edit Service' : 'Manage Services'}</DialogTitle>
                        <DialogDescription>{editingService ? 'Update the service details.' : 'Add or remove printing services.'}</DialogDescription>
                      </DialogHeader>
                      
                      <Form {...serviceForm}>
                        <form onSubmit={serviceForm.handleSubmit(handleAddOrUpdateService)} className="grid grid-cols-3 gap-4 items-start">
                            <FormField control={serviceForm.control} name="name" render={({ field }) => (
                                <FormItem className="col-span-3 sm:col-span-1"><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="e.g., A4 B&W Front" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={serviceForm.control} name="price" render={({ field }) => (
                                <FormItem className="col-span-3 sm:col-span-1"><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="flex gap-2 self-end col-span-3 sm:col-span-1">
                                {editingService && <Button type="button" variant="secondary" onClick={() => setEditingService(null)}>Cancel</Button>}
                                <Button type="submit" disabled={isSubmittingService}>{isSubmittingService ? 'Saving...' : (editingService ? 'Update' : 'Add')}</Button>
                            </div>
                        </form>
                      </Form>

                      <div className="mt-4 border rounded-md max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>{s.name}</TableCell>
                                        <TableCell>Rs {s.price?.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setEditingService(s)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingService(s)}>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField
                                control={orderForm.control}
                                name="serviceId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Service Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {services.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name} (Rs {opt.price?.toFixed(2)})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={orderForm.control}
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

                        <Button type="submit" disabled={isLoading || orderForm.formState.isSubmitting} className="w-full">
                            {(isLoading || orderForm.formState.isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Calculate
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>

    <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deletingService?.name}" service. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    