
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getXeroxServices, getXeroxOptions } from "@/lib/data";
import type { XeroxService, XeroxOption } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronDown, Loader2, FileUp, XCircle, FileText } from "lucide-react";
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

type ColorOption = "bw" | "color";

export default function XeroxPage() {
  const [services, setServices] = useState<XeroxService[]>([]);
  const [paperTypes, setPaperTypes] = useState<XeroxOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPriceListOpen, setIsPriceListOpen] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileDetails, setFileDetails] = useState<{name: string; type: string; pages?: number; preview?: string;} | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Form state
  const [selectedPaperType, setSelectedPaperType] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ColorOption>('bw');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedServices, fetchedPaperTypes] = await Promise.all([
          getXeroxServices(),
          getXeroxOptions('paperType')
        ]);
        setServices(fetchedServices);
        setPaperTypes(fetchedPaperTypes);
        
        const defaultPaper = fetchedPaperTypes.find(pt => pt.isDefault);
        if (defaultPaper) {
            setSelectedPaperType(defaultPaper.id);
        } else if (fetchedPaperTypes.length > 0) {
            setSelectedPaperType(fetchedPaperTypes[0].id);
        }

      } catch (err) {
        setError("Failed to load printing services. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPageCount = async (file: File) => {
      setIsParsing(true);
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
      }
  }, [toast]);

  const handleClearFile = () => {
      setFileDetails(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };


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

       <div className="container mx-auto px-4 py-8">
        <Card>
            <CardHeader>
                <CardTitle>ADD document</CardTitle>
            </CardHeader>
            <CardContent>
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
                 {fileDetails && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="paper-type">Paper Type</Label>
                            <Select value={selectedPaperType} onValueChange={setSelectedPaperType}>
                                <SelectTrigger id="paper-type">
                                    <SelectValue placeholder="Select paper type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {paperTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                           <Label htmlFor="color-option">Color</Label>
                           <Select value={selectedColor} onValueChange={(value) => setSelectedColor(value as ColorOption)}>
                                <SelectTrigger id="color-option">
                                    <SelectValue placeholder="Select color option..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bw">Black & White</SelectItem>
                                    <SelectItem value="color">Gradient / Colour</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                 )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
