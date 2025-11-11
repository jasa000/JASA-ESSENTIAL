
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getXeroxOptions } from "@/lib/data";
import type { XeroxOption, XeroxOptionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileUp, XCircle, FileText, ClipboardList } from "lucide-react";
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


export default function XeroxOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [options, setOptions] = useState<Record<XeroxOptionType, XeroxOption[]>>({
    paperType: [],
    colorOption: [],
    formatType: [],
    printRatio: [],
    bindingType: [],
    laminationType: [], // Kept for data structure consistency, not used in form
  });
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileDetails, setFileDetails] = useState<{name: string; type: string; pages?: number; preview?: string;} | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const form = useForm<z.infer<typeof xeroxOrderSchema>>({
    resolver: zodResolver(xeroxOrderSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    fetchAllOptions();
  }, [user, authLoading, router]);

  const fetchAllOptions = async () => {
    setIsLoading(true);
    try {
      const optionCategories: XeroxOptionType[] = ['paperType', 'colorOption', 'formatType', 'printRatio', 'bindingType'];
      const allFetchedOptions = await Promise.all(
        optionCategories.map(cat => getXeroxOptions(cat))
      );
      const newOptionsState = { ...options };
      optionCategories.forEach((cat, index) => {
        newOptionsState[cat] = allFetchedOptions[index];
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

    const selectedPaper = options.paperType.find(opt => opt.id === values.paperType);
    if (!selectedPaper?.price) {
      toast({
        variant: 'destructive',
        title: 'Cannot Calculate',
        description: 'The selected paper type does not have a price associated with it.',
      });
      return;
    }

    const selectedRatio = options.printRatio.find(opt => opt.id === values.printRatio);
    if (!selectedRatio) {
      toast({
        variant: 'destructive',
        title: 'Cannot Calculate',
        description: 'Please select a valid print ratio.',
      });
      return;
    }

    let pagesToCharge = fileDetails.pages;
    if (selectedRatio.name === '1:2') {
      pagesToCharge = Math.ceil(fileDetails.pages / 2);
    }
    // You can add more ratio logic here, e.g., '1:4'
    
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
    <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
            Xerox Order Form
        </h1>
        <p className="mt-2 text-muted-foreground">
            Upload your document and select your printing options.
        </p>

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
                                        {options.paperType.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name} (Rs {opt.price?.toFixed(2)})</SelectItem>)}
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
                                        {options.colorOption.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
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
                                        {options.formatType.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
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
                                        {options.printRatio.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
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
                                        {options.bindingType.map(opt => <SelectItem key={opt.id} value={optid}>{opt.name}</SelectItem>)}
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
  );
}

    