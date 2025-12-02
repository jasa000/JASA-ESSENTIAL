
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getXeroxServices, getXeroxOptions } from "@/lib/data";
import type { XeroxService, XeroxOption, XeroxDocument } from "@/lib/types";
import { HARDCODED_XEROX_OPTIONS } from "@/lib/xerox-options";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Loader2, FileUp, XCircle, FileText, ShoppingCart, Plus, Minus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";


// Set up worker for pdf.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

type DocumentState = {
  id: number;
  file: File | null;
  fileDetails: { name: string; type: string; pages?: number; preview?: string } | null;
  isParsing: boolean;
  selectedPaperType: string;
  currentPaperDetails: XeroxOption | null;
  selectedColorOption: string;
  selectedFormatType: string;
  selectedPrintRatio: string;
  selectedBindingType: string;
  selectedLaminationType: string;
  quantity: number;
  message: string;
};

const MAX_WORDS = 100;

export default function XeroxPage() {
  const [services, setServices] = useState<XeroxService[]>([]);
  const [paperTypes, setPaperTypes] = useState<XeroxOption[]>([]);
  const [allOptions, setAllOptions] = useState({
      bindingTypes: [] as XeroxOption[],
      laminationTypes: [] as XeroxOption[],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPriceListOpen, setIsPriceListOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentState[]>([]);
  const nextId = useRef(0);
  
  const [editingDocument, setEditingDocument] = useState<DocumentState | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedServices, fetchedPaperTypes, bindingTypes, laminationTypes] = await Promise.all([
          getXeroxServices(),
          getXeroxOptions('paperType'),
          getXeroxOptions('bindingType'),
          getXeroxOptions('laminationType'),
        ]);
        setServices(fetchedServices);
        setPaperTypes(fetchedPaperTypes);
        setAllOptions({ bindingTypes, laminationTypes });
        
      } catch (err) {
        setError("Failed to load printing services. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const addNewDocument = (file: File) => {
    const newDocId = nextId.current++;
    const defaultPaperType = paperTypes.length > 0 ? paperTypes[0] : null;
    const newDocument: DocumentState = {
      id: newDocId,
      file,
      fileDetails: null,
      isParsing: true,
      selectedPaperType: defaultPaperType?.id || '',
      currentPaperDetails: defaultPaperType,
      selectedColorOption: defaultPaperType?.colorOptionIds?.[0] || '',
      selectedFormatType: defaultPaperType?.formatTypeIds?.[0] || '',
      selectedPrintRatio: defaultPaperType?.printRatioIds?.[0] || '',
      selectedBindingType: 'none',
      selectedLaminationType: 'none',
      quantity: 1,
      message: '',
    };
    setDocuments(prev => [...prev, newDocument]);
    handleFileChange(file, newDocId);
  };
  
  const updateDocumentState = (id: number, updates: Partial<DocumentState>) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === id) {
          const updatedDoc = { ...doc, ...updates };
          if ('selectedPaperType' in updates && updates.selectedPaperType !== doc.selectedPaperType) {
            const newPaperDetails = paperTypes.find(pt => pt.id === updates.selectedPaperType) || null;
            updatedDoc.currentPaperDetails = newPaperDetails;
            if (newPaperDetails && !newPaperDetails.colorOptionIds?.includes(updatedDoc.selectedColorOption)) {
                updatedDoc.selectedColorOption = newPaperDetails.colorOptionIds?.[0] || '';
            }
            if (newPaperDetails && !newPaperDetails.formatTypeIds?.includes(updatedDoc.selectedFormatType)) {
                updatedDoc.selectedFormatType = newPaperDetails.formatTypeIds?.[0] || '';
            }
            if (newPaperDetails && !newPaperDetails.printRatioIds?.includes(updatedDoc.selectedPrintRatio)) {
                updatedDoc.selectedPrintRatio = newPaperDetails.printRatioIds?.[0] || '';
            }
             if (newPaperDetails && !newPaperDetails.bindingTypeIds?.includes(updatedDoc.selectedBindingType)) {
                updatedDoc.selectedBindingType = 'none';
            }
            if (newPaperDetails && !newPaperDetails.laminationTypeIds?.includes(updatedDoc.selectedLaminationType)) {
                updatedDoc.selectedLaminationType = 'none';
            }
          }
          return updatedDoc;
        }
        return doc;
      })
    );
  };
  
  const removeDocument = (id: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };


  const getPageCount = async (file: File) => {
      try {
          const arrayBuffer = await file.arrayBuffer();
          if (file.type === 'application/pdf') {
              const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
              return pdf.numPages;
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              const result = await mammoth.extractRawText({ arrayBuffer });
              const wordCount = result.value.split(/\s+/).filter(Boolean).length;
              return Math.ceil(wordCount / 250);
          }
           return 1;
      } catch (error) {
          console.error("Error getting page count:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not parse document page count.' });
          return undefined;
      }
  };

  const handleFileChange = async (file: File, docId: number) => {
      updateDocumentState(docId, { isParsing: true });
      const pages = await getPageCount(file);
      const isImage = file.type.startsWith('image/');
      updateDocumentState(docId, {
          fileDetails: {
              name: file.name,
              type: file.type,
              pages: isImage ? 1 : pages,
              preview: isImage ? URL.createObjectURL(file) : undefined,
          },
          isParsing: false,
      });
  };
  
  const handleMultipleFileChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        addNewDocument(file);
      });
      e.target.value = '';
    }
  }

  const calculateDocumentPrice = useCallback((doc: DocumentState) => {
    if (!doc.currentPaperDetails || !doc.fileDetails?.pages) return 0;
      
    const colorOption = HARDCODED_XEROX_OPTIONS.colorOptions.find(o => o.id === doc.selectedColorOption);
    const formatType = HARDCODED_XEROX_OPTIONS.formatTypes.find(o => o.id === doc.selectedFormatType);
    const printRatio = HARDCODED_XEROX_OPTIONS.printRatios.find(o => o.id === doc.selectedPrintRatio);
    const bindingType = allOptions.bindingTypes.find(o => o.id === doc.selectedBindingType);
    const laminationType = allOptions.laminationTypes.find(o => o.id === doc.selectedLaminationType);
    
    const pricePerPage = colorOption?.name === 'Gradient / Colour' ? doc.currentPaperDetails.priceColor ?? 0 : doc.currentPaperDetails.priceBw ?? 0;
    const documentPages = doc.fileDetails.pages;
    
    const physicalPages = formatType?.name === 'Front and Back' ? Math.ceil(documentPages / 2) : documentPages;
    let printingCost = physicalPages * pricePerPage;

    if (printRatio?.name === '1:2 (Two pages per sheet)') {
        printingCost /= 2;
    }

    const bindingCost = bindingType?.price || 0;
    const laminationCost = laminationType?.price || 0;

    const singleCopyPrice = printingCost + bindingCost + laminationCost;
    return singleCopyPrice * doc.quantity;
  }, [allOptions.bindingTypes, allOptions.laminationTypes, paperTypes]);

  const documentPrices = useMemo(() => {
    return documents.map(doc => ({
      id: doc.id,
      price: calculateDocumentPrice(doc)
    }));
  }, [documents, calculateDocumentPrice]);

  const finalTotalPrice = useMemo(() => {
    return documentPrices.reduce((total, item) => total + item.price, 0);
  }, [documentPrices]);
  
  const handleCheckout = () => {
    if (documents.some(d => d.isParsing)) {
      toast({
        variant: "destructive",
        title: "Please wait",
        description: "Some documents are still being processed.",
      });
      return;
    }

    const xeroxJobsForStorage = documents.map((doc, index) => {
      const price = documentPrices.find(p => p.id === doc.id)?.price || 0;
      if (!doc.file || !doc.fileDetails) return null;
      return {
        id: `${Date.now()}-${index}`,
        file: doc.file,
        fileDetails: {
          name: doc.fileDetails.name,
          type: doc.fileDetails.type,
        },
        pageCount: doc.fileDetails.pages || 0,
        price: price / doc.quantity,
        config: {
          paperType: doc.selectedPaperType,
          colorOption: doc.selectedColorOption,
          formatType: doc.selectedFormatType,
          printRatio: doc.selectedPrintRatio,
          bindingType: doc.selectedBindingType,
          laminationType: doc.selectedLaminationType,
          quantity: doc.quantity,
          message: doc.message,
        }
      };
    }).filter(job => job !== null);

    sessionStorage.setItem('xeroxCheckoutJobs', JSON.stringify(xeroxJobsForStorage));
    router.push('/xerox/checkout');
  };
  
  const EditDocumentDialog = ({ doc, index, onSave }: { doc: DocumentState | null, index: number, onSave: (updatedDoc: DocumentState) => void }) => {
    const [localDoc, setLocalDoc] = useState<DocumentState | null>(doc);
  
    useEffect(() => {
      setLocalDoc(doc);
    }, [doc]);
  
    if (!localDoc) return null;
  
    const handleLocalUpdate = (updates: Partial<DocumentState>) => {
      setLocalDoc(prev => {
        if (!prev) return null;
        const updatedDoc = { ...prev, ...updates };

        if ('selectedPaperType' in updates && updates.selectedPaperType !== prev.selectedPaperType) {
          const newPaperDetails = paperTypes.find(pt => pt.id === updates.selectedPaperType) || null;
          updatedDoc.currentPaperDetails = newPaperDetails;
          if (newPaperDetails) {
            if (!newPaperDetails.colorOptionIds?.includes(updatedDoc.selectedColorOption)) updatedDoc.selectedColorOption = newPaperDetails.colorOptionIds?.[0] || '';
            if (!newPaperDetails.formatTypeIds?.includes(updatedDoc.selectedFormatType)) updatedDoc.selectedFormatType = newPaperDetails.formatTypeIds?.[0] || '';
            if (!newPaperDetails.printRatioIds?.includes(updatedDoc.selectedPrintRatio)) updatedDoc.selectedPrintRatio = newPaperDetails.printRatioIds?.[0] || '';
            if (!newPaperDetails.bindingTypeIds?.includes(updatedDoc.selectedBindingType)) updatedDoc.selectedBindingType = 'none';
            if (!newPaperDetails.laminationTypeIds?.includes(updatedDoc.selectedLaminationType)) updatedDoc.selectedLaminationType = 'none';
          }
        }
        return updatedDoc;
      });
    };
  
    const renderOptionSelect = (
        id: string, label: string, selectedValue: string | undefined,
        onValueChange: (value: string) => void,
        optionIds: string[] | undefined, allOptionList: { id: string, name: string, price?: number }[],
        includeNone: boolean = false
    ) => {
        if (!optionIds || optionIds.length === 0) return null;
        
        const availableOptions = allOptionList.filter(opt => optionIds.includes(opt.id));
        if (availableOptions.length === 0 && !includeNone) return null;

        return (
            <div>
                <Label htmlFor={id}>{label}</Label>
                <Select value={selectedValue} onValueChange={onValueChange} disabled={isLoading}>
                    <SelectTrigger id={id}><SelectValue placeholder={`Select ${label.toLowerCase()}...`} /></SelectTrigger>
                    <SelectContent>
                        {includeNone && <SelectItem value="none">No {label}</SelectItem>}
                        {availableOptions.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>
                                {opt.name} {opt.price ? `(Rs ${opt.price.toFixed(2)})` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }
    
    const wordCount = localDoc.message?.trim().split(/\s+/).filter(Boolean).length || 0;
  
    return (
      <Dialog open={!!doc} onOpenChange={(open) => {
          if (!open) {
              if (localDoc) onSave(localDoc);
              setEditingDocument(null);
          }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Options for: Document {index + 1}</DialogTitle>
            <DialogDescription>{localDoc.fileDetails?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
                <Label htmlFor={`paper-type-${localDoc.id}`}>Paper Type</Label>
                <Select
                  value={localDoc.selectedPaperType}
                  onValueChange={value => handleLocalUpdate({ selectedPaperType: value })}
                  disabled={isLoading}
                >
                    <SelectTrigger id={`paper-type-${localDoc.id}`}>
                        <SelectValue placeholder="Select paper type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {paperTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {renderOptionSelect(`color-option-${localDoc.id}`, 'Color', localDoc.selectedColorOption, value => handleLocalUpdate({ selectedColorOption: value }), localDoc.currentPaperDetails?.colorOptionIds, HARDCODED_XEROX_OPTIONS.colorOptions)}
            {renderOptionSelect(`format-type-${localDoc.id}`, 'Format', localDoc.selectedFormatType, value => handleLocalUpdate({ selectedFormatType: value }), localDoc.currentPaperDetails?.formatTypeIds, HARDCODED_XEROX_OPTIONS.formatTypes)}
            {renderOptionSelect(`print-ratio-${localDoc.id}`, 'Print Ratio', localDoc.selectedPrintRatio, value => handleLocalUpdate({ selectedPrintRatio: value }), localDoc.currentPaperDetails?.printRatioIds, HARDCODED_XEROX_OPTIONS.printRatios)}
            {renderOptionSelect(`binding-type-${localDoc.id}`, 'Binding Type', localDoc.selectedBindingType, value => handleLocalUpdate({ selectedBindingType: value }), localDoc.currentPaperDetails?.bindingTypeIds, allOptions.bindingTypes, true)}
            {renderOptionSelect(`lamination-type-${localDoc.id}`, 'Lamination Type', localDoc.selectedLaminationType, value => handleLocalUpdate({ selectedLaminationType: value }), localDoc.currentPaperDetails?.laminationTypeIds, allOptions.laminationTypes, true)}
            <div>
                <Label htmlFor={`quantity-${localDoc.id}`}>Quantity</Label>
                <div className="flex items-center gap-2 mt-2">
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => handleLocalUpdate({ quantity: Math.max(1, localDoc.quantity - 1) })}> <Minus className="h-4 w-4" /> </Button>
                    <Input id={`quantity-${localDoc.id}`} type="number" min="1" value={localDoc.quantity} onChange={(e) => handleLocalUpdate({ quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })} className="h-9 w-20 text-center" />
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => handleLocalUpdate({ quantity: localDoc.quantity + 1 })}> <Plus className="h-4 w-4" /> </Button>
                </div>
            </div>
            <div>
                <Label htmlFor={`message-${localDoc.id}`}>Special Instructions (Optional)</Label>
                <Textarea 
                    id={`message-${localDoc.id}`} 
                    placeholder="e.g., 'Please use a thick cover for binding.'"
                    value={localDoc.message}
                    onChange={e => handleLocalUpdate({ message: e.target.value })}
                    className="mt-2"
                />
                <p className={cn("text-xs mt-1", wordCount > MAX_WORDS ? "text-destructive" : "text-muted-foreground")}>
                    {wordCount} / {MAX_WORDS} words
                </p>
            </div>
          </div>
           <DialogFooter>
                <DialogClose asChild>
                    <Button variant="secondary" className="w-full">Close</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const DocumentCard = ({ document, index }: { document: DocumentState, index: number }) => {
    const singleDocPrice = documentPrices.find(p => p.id === document.id)?.price || 0;
    
    return (
        <Card className="relative">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 flex-shrink-0" onClick={() => removeDocument(document.id)}>
                <XCircle className="h-5 w-5 text-red-500" />
            </Button>
            <CardHeader className="p-4">
                <div className="flex items-start gap-4">
                    {document.fileDetails?.preview ? (
                        <div className="relative h-20 w-20 flex-shrink-0">
                            <Image src={document.fileDetails.preview} alt="File preview" fill className="rounded-md object-cover" />
                        </div>
                    ) : (
                        <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center bg-muted rounded-md">
                            {document.isParsing ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/> : <FileText className="h-10 w-10 text-muted-foreground" />}
                        </div>
                    )}
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold truncate">Document {index + 1}</p>
                        <p className="text-sm text-muted-foreground capitalize truncate">{document.fileDetails?.name || "Processing..."}</p>
                        {document.fileDetails?.pages !== undefined && (
                            <p className="text-sm text-muted-foreground">Pages: {document.fileDetails.pages}</p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">Rs {singleDocPrice.toFixed(2)}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingDocument(document)}>
                        <Pencil className="mr-2 h-4 w-4"/> Edit
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateDocumentState(document.id, { quantity: Math.max(1, document.quantity - 1) })}> <Minus className="h-4 w-4" /> </Button>
                    <span className="font-bold w-10 text-center">{document.quantity}</span>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateDocumentState(document.id, { quantity: document.quantity + 1 })}> <Plus className="h-4 w-4" /> </Button>
                </div>
            </CardFooter>
        </Card>
    );
  };
  
  const FinalEstimation = () => {
    if (documents.length === 0) return null;

    const getOptionName = (type: keyof typeof allOptions | 'paperType' | 'colorOption' | 'formatType' | 'printRatio', id: string): string => {
        if (!id || id === 'none') return '';
        if (type === 'paperType') return paperTypes.find(o => o.id === id)?.name || '';
        if (type === 'colorOption') return HARDCODED_XEROX_OPTIONS.colorOptions.find(o => o.id === id)?.name || '';
        if (type === 'formatType') return HARDCODED_XEROX_OPTIONS.formatTypes.find(o => o.id === id)?.name || '';
        if (type === 'printRatio') return HARDCODED_XEROX_OPTIONS.printRatios.find(o => o.id === id)?.name || '';
        
        const optionsList = allOptions[type as keyof typeof allOptions];
        return optionsList.find(o => o.id === id)?.name || '';
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Final Estimation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {documents.map((doc, index) => {
              const docPrice = documentPrices.find(p => p.id === doc.id)?.price || 0;
              const details = [
                { key: 'Paper', value: getOptionName('paperType', doc.selectedPaperType) },
                { key: 'Color', value: getOptionName('colorOption', doc.selectedColorOption) },
                { key: 'Format', value: getOptionName('formatType', doc.selectedFormatType) },
                { key: 'Ratio', value: getOptionName('printRatio', doc.selectedPrintRatio) },
                { key: 'Binding', value: getOptionName('bindingTypes', doc.selectedBindingType) },
                { key: 'Lamination', value: getOptionName('laminationTypes', doc.selectedLaminationType) },
              ].filter(d => d.value);

              return (
                <div key={doc.id} className="border-b pb-3 mb-3">
                    <div className="flex justify-between items-start mb-2">
                        <p className="font-medium truncate max-w-xs flex-1">Doc {index + 1}: {doc.fileDetails?.name}</p>
                        <div className="text-right">
                           <p className="font-semibold">Rs {docPrice.toFixed(2)}</p>
                           <p className="text-muted-foreground text-xs">{doc.quantity} x copies</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {details.map(d => (
                            <div key={d.key} className="flex">
                                <span className="font-semibold text-foreground/80 w-16 shrink-0">{d.key}:</span>
                                <span>{d.value}</span>
                            </div>
                        ))}
                    </div>
                    
                    {doc.message && (
                        <div className="mt-2 text-xs text-muted-foreground">
                             <span className="font-semibold text-foreground/80">Note:</span> {doc.message}
                        </div>
                    )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between font-bold text-base border-t-2 pt-2">
            <p>Final Price</p>
            <p>Rs {finalTotalPrice.toFixed(2)}</p>
          </div>
          <Button 
            size="lg" 
            className="w-full"
            disabled={documents.some(d => d.isParsing)}
            onClick={handleCheckout}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Check Out Now
          </Button>
        </CardContent>
      </Card>
    );
  };


  const renderInitialState = () => (
    <div className="container mx-auto px-4 py-8">
        <Card className="text-center p-8 border-dashed">
            <CardHeader>
                <FileUp className="mx-auto h-12 w-12 text-green-600 animate-float-up" />
                <CardTitle className="text-2xl">Start Your Printing Order</CardTitle>
                <CardDescription>Upload your documents to get started.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    type="button"
                    size="lg" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full h-14 bg-green-600 text-white hover:bg-gray-500"
                >
                    Upload Documents
                </Button>
                 <Input 
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleMultipleFileChanges}
                    accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                />
            </CardContent>
        </Card>
    </div>
  );


  return (
    <div>
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Xerox & Printing Services
        </h1>
        <p className="mt-4 text-muted-foreground">
          High-quality photocopying and printing at competitive prices.
        </p>
      </div>

      <div className="w-full bg-muted">
        <Card className="container mx-auto mt-0 rounded-none border-x-0 border-y shadow-none">
          <Collapsible open={isPriceListOpen} onOpenChange={setIsPriceListOpen}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between text-center">
                <CardTitle>Price List</CardTitle>
                <ChevronDown
                  className={cn(
                    "h-6 w-6 transform transition-transform duration-200",
                    isPriceListOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="py-2">
                {error ? (
                  <p className="text-center text-destructive">{error}</p>
                ) : (
                  <Table>
                    <TableBody>
                      {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Skeleton className="h-6 w-48" />
                              </TableCell>
                              <TableCell className="text-right">
                                <Skeleton className="h-6 w-24 ml-auto" />
                              </TableCell>
                            </TableRow>
                          ))
                        : services.map((service) => {
                            const hasDiscount =
                              service.discountPrice != null &&
                              service.discountPrice < service.price;
                            const discountPercent = hasDiscount
                              ? Math.round(
                                  ((service.price - service.discountPrice!) /
                                    service.price) *
                                    100
                                )
                              : 0;

                            return (
                              <TableRow key={service.id}>
                                <TableCell className="font-medium">
                                  {service.name}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-4">
                                    {hasDiscount ? (
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs text-muted-foreground line-through">
                                            Rs {service.price.toFixed(2)}
                                          </span>
                                          <span className="text-xl font-bold">
                                            Rs{" "}
                                            {service.discountPrice?.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-lg font-bold">
                                        Rs {service.price.toFixed(2)}
                                      </span>
                                    )}
                                    <div className="flex flex-col items-center gap-1">
                                      {hasDiscount && (
                                        <Badge
                                          variant="destructive"
                                          className="h-fit"
                                        >
                                          {discountPercent}% OFF
                                        </Badge>
                                      )}
                                      {service.unit && (
                                        <span className="text-sm text-muted-foreground">
                                          {service.unit}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                    </TableBody>
                  </Table>
                )}
                {!isLoading && services.length === 0 && !error && (
                  <p className="py-8 text-center text-muted-foreground">
                    No printing services are available at the moment. Please
                    check back later.
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
      
      {editingDocument && <EditDocumentDialog doc={editingDocument} index={documents.findIndex(d => d.id === editingDocument.id)} onSave={(updatedDoc) => updateDocumentState(updatedDoc.id, updatedDoc)} />}

       {documents.length === 0 && !isLoading ? renderInitialState() : (
         <div className="container mx-auto px-4 py-8 space-y-4">
            {documents.map((doc, index) => (
              <DocumentCard key={doc.id} document={doc} index={index} />
            ))}

            <Button 
              type="button"
              className="w-full h-16 bg-green-600 text-white hover:bg-gray-500 flex-col"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-6 w-6" />
              <span>Add Another Document</span>
            </Button>
            <Input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleMultipleFileChanges}
                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
            />
            <FinalEstimation />
        </div>
       )}
    </div>
  );
}
