
"use client";

import { useState, useEffect } from "react";
import { getProducts, getProductTypes } from "@/lib/data";
import type { Product, ProductType } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoading } from "@/hooks/use-loading";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function BooksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // State for applied filters
  const [appliedTypes, setAppliedTypes] = useState<string[]>([]);
  
  // State for temporary selections in the dialog
  const [tempTypes, setTempTypes] = useState<string[]>([]);

  const { isLoading, setIsLoading } = useLoading();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedProducts, fetchedTypes] = await Promise.all([
          getProducts("books"),
          getProductTypes("books"),
        ]);
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setProductTypes(fetchedTypes);
      } catch (error) {
        console.error("Failed to fetch books data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  useEffect(() => {
    let tempProducts = [...products];

    if (appliedTypes.length > 0) {
      tempProducts = tempProducts.filter(
        (product) => product.productTypeIds && product.productTypeIds.some(id => appliedTypes.includes(id))
      );
    }

    setFilteredProducts(tempProducts);
  }, [appliedTypes, products]);

  const handleApplyFilters = () => {
    setAppliedTypes(tempTypes);
    setIsFilterDialogOpen(false);
  };

  const handleResetFilters = () => {
    setTempTypes([]);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempTypes(appliedTypes);
    }
    setIsFilterDialogOpen(open);
  };

  const renderProductGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold">No Books Found</h2>
          <p className="text-muted-foreground">
            There are no books available at the moment or matching your filters.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };
  
  const FilterCheckboxGroup = ({ title, items, selected, onSelectionChange }: {
    title: string;
    items: { id: string, name: string }[];
    selected: string[];
    onSelectionChange: (newSelection: string[]) => void;
  }) => (
    <div>
      <h3 className="mb-4 text-lg font-medium">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${item.id}`}
              checked={selected.includes(item.id)}
              onCheckedChange={(checked) => {
                const newSelection = checked
                  ? [...selected, item.id]
                  : selected.filter((id) => id !== item.id);
                onSelectionChange(newSelection);
              }}
            />
            <Label htmlFor={`${title}-${item.id}`} className="font-normal">
              {item.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Books
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse our collection of books.
        </p>
      </div>

       <div className="sticky top-20 z-40 bg-background py-4">
        <Dialog open={isFilterDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <FilterCheckboxGroup title="Filter by Type" items={productTypes} selected={tempTypes} onSelectionChange={setTempTypes} />
            </div>
            <DialogFooter className="sticky bottom-0 bg-background py-4">
                <Button variant="ghost" onClick={handleResetFilters}>Reset</Button>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
       </div>

      <div className="mt-8">{renderProductGrid()}</div>
    </div>
  );
}
