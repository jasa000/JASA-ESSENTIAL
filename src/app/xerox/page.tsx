
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getXeroxServices, getXeroxOptions } from "@/lib/data";
import type { XeroxService, XeroxOption } from "@/lib/types";
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
import { ChevronDown, Loader2, FileUp, XCircle, FileText, ShoppingCart, Plus, Minus, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Set up worker for pdf.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

type DocumentState = {
  id: number;
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
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentState[]>([]);
  const nextId = useRef(0);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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
    };
    setDocuments(prev => [...prev, newDocument]);
    handleFileChange(file, newDocId);
    setActiveDocumentId(newDocId);
  };
  
  const updateDocumentState = (id: number, updates: Partial<DocumentState>) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === id) {
          const updatedDoc = { ...doc, ...updates };
          // If paper type is changed, find the new details from the cached paperTypes
          if ('selectedPaperType' in updates) {
            const newPaperDetails = paperTypes.find(pt => pt.id === updates.selectedPaperType) || null;
            updatedDoc.currentPaperDetails = newPaperDetails;
            // Reset dependent options to defaults for the new paper type
            updatedDoc.selectedColorOption = newPaperDetails?.colorOptionIds?.[0] || '';
            updatedDoc.selectedFormatType = newPaperDetails?.formatTypeIds?.[0] || '';
            updatedDoc.selectedPrintRatio = newPaperDetails?.printRatioIds?.[0] || '';
            updatedDoc.selectedBindingType = 'none';
            updatedDoc.selectedLaminationType = 'none';
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
              const wordCount = result.value.split(/\s+/).length;
              return Math.ceil(wordCount / 250); // Rough estimation
          }
           return 1; // Default for images and other file types
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
      e.target.value = ''; // Reset input to allow same file upload again
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
  }, [allOptions.bindingTypes, allOptions.laminationTypes]);

  const documentPrices = useMemo(() => {
    return documents.map(doc => ({
      id: doc.id,
      price: calculateDocumentPrice(doc)
    }));
  }, [documents, calculateDocumentPrice]);

  const finalTotalPrice = useMemo(() => {
    return documentPrices.reduce((total, item) => total + item.price, 0);
  }, [documentPrices]);


  const DocumentCard = ({ document }: { document: DocumentState }) => {
    const isExpanded = activeDocumentId === document.id;
    const singleDocPrice = documentPrices.find(p => p.id === document.id)?.price || 0;

    const renderOptionSelect = (
        id: string, label: string, selectedValue: string,
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
    
    return (
        <Card>
          <Collapsible open={isExpanded} onOpenChange={(open) => setActiveDocumentId(open ? document.id : null)}>
            
             <CardHeader className="flex flex-row justify-between items-center p-4">
                <h4 className="text-base font-bold truncate">Document {documents.findIndex(d => d.id === document.id) + 1}</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={(e) => { e.stopPropagation(); removeDocument(document.id); }}>
                  <XCircle className="h-5 w-5 text-red-500" />
                </Button>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                {!isExpanded ? (
                     <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium truncate p-1">{document.fileDetails?.name}</TableCell>
                                <TableCell className="text-right font-semibold p-1">Rs {singleDocPrice.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                ) : (
                <CollapsibleContent>
                  <Card className="p-4 relative">
                      <div className="flex items-start gap-4">
                          {document.fileDetails?.preview ? (
                              <div className="relative h-24 w-24 flex-shrink-0">
                                  <Image src={document.fileDetails.preview} alt="File preview" fill className="rounded-md object-cover" />
                              </div>
                          ) : (
                              <div className="h-24 w-24 flex-shrink-0 flex items-center justify-center bg-muted rounded-md">
                                  <FileText className="h-10 w-10 text-muted-foreground" />
                              </div>
                          )}
                          <div className="flex-grow min-w-0">
                              <p className="font-semibold truncate">{document.fileDetails?.name}</p>
                              <p className="text-sm text-muted-foreground capitalize truncate">{document.fileDetails?.type.split('/')[1]}</p>
                              {document.isParsing ? (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Loader2 className="h-4 w-4 animate-spin"/> Checking pages...</p>
                              ) : document.fileDetails?.pages !== undefined && (
                                  <p className="text-sm text-muted-foreground">Pages: {document.fileDetails.pages}</p>
                              )}
                          </div>
                      </div>
                  </Card>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                          <Label htmlFor={`paper-type-${document.id}`}>Paper Type</Label>
                          <Select value={document.selectedPaperType} onValueChange={value => updateDocumentState(document.id, { selectedPaperType: value })} disabled={isLoading}>
                              <SelectTrigger id={`paper-type-${document.id}`}>
                                  <SelectValue placeholder="Select paper type..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {paperTypes.map(type => (
                                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      {renderOptionSelect(`color-option-${document.id}`, 'Color', document.selectedColorOption, value => updateDocumentState(document.id, {selectedColorOption: value}), document.currentPaperDetails?.colorOptionIds, HARDCODED_XEROX_OPTIONS.colorOptions)}
                      {renderOptionSelect(`format-type-${document.id}`, 'Format', document.selectedFormatType, value => updateDocumentState(document.id, {selectedFormatType: value}), document.currentPaperDetails?.formatTypeIds, HARDCODED_XEROX_OPTIONS.formatTypes)}
                      {renderOptionSelect(`print-ratio-${document.id}`, 'Print Ratio', document.selectedPrintRatio, value => updateDocumentState(document.id, {selectedPrintRatio: value}), document.currentPaperDetails?.printRatioIds, HARDCODED_XEROX_OPTIONS.printRatios)}
                      {renderOptionSelect(`binding-type-${document.id}`, 'Binding Type', document.selectedBindingType, value => updateDocumentState(document.id, {selectedBindingType: value}), document.currentPaperDetails?.bindingTypeIds, allOptions.bindingTypes, true)}
                      {renderOptionSelect(`lamination-type-${document.id}`, 'Lamination Type', document.selectedLaminationType, value => updateDocumentState(document.id, {selectedLaminationType: value}), document.currentPaperDetails?.laminationTypeIds, allOptions.laminationTypes, true)}
                      <div>
                          <Label htmlFor={`quantity-${document.id}`}>Quantity</Label>
                          <div className="flex items-center gap-2 mt-2">
                              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => updateDocumentState(document.id, { quantity: Math.max(1, document.quantity - 1) })}> <Minus className="h-4 w-4" /> </Button>
                              <Input id={`quantity-${document.id}`} type="number" min="1" value={document.quantity} onChange={(e) => updateDocumentState(document.id, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1)})} className="h-9 w-20 text-center" />
                              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => updateDocumentState(document.id, { quantity: document.quantity + 1 })}> <Plus className="h-4 w-4" /> </Button>
                          </div>
                      </div>
                  </div>
                   <div className="mt-4 text-right">
                      <p className="text-sm text-muted-foreground">Document Price</p>
                      <p className="text-xl font-bold">Rs {singleDocPrice.toFixed(2)}</p>
                  </div>
              </CollapsibleContent>
                )}
            </CardContent>
            <CardFooter className="p-0">
              <CollapsibleTrigger asChild>
                  <Button 
                    variant={isExpanded ? 'default' : 'ghost'} 
                    className={cn(
                        "w-full rounded-t-none flex items-center gap-2",
                        isExpanded && "bg-green-600 text-white hover:bg-gray-500"
                    )}
                  >
                      <ChevronsUpDown className="h-5 w-5 text-green-600 animate-float-up" />
                       <span>{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
                  </Button>
              </CollapsibleTrigger>
            </CardFooter>
          </Collapsible>
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

       {documents.length === 0 && !isLoading ? renderInitialState() : (
         <div className="container mx-auto px-4 py-8 space-y-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}

            <Button 
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

          {documents.length > 0 && (
              <Card>
                  <CardHeader>
                      <CardTitle>Final Estimation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Table>
                        <TableBody>
                            {documentPrices.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">Document {index + 1}</TableCell>
                                    <TableCell className="text-right">Rs {item.price.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                             <TableRow className="font-bold text-lg border-t-2">
                                <TableCell>Final Price</TableCell>
                                <TableCell className="text-right">Rs {finalTotalPrice.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <Button 
                      size="lg" 
                      className="w-full"
                      disabled={documents.some(d => d.isParsing)}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Check Out Now
                    </Button>
                  </CardContent>
              </Card>
          )}
        </div>
       )}
    </div>
  );
}
