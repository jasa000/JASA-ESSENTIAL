
"use client";

import { useState, useEffect } from "react";
import { getProducts, getBrands, getProductTypes } from "@/lib/data";
import type { Product, Brand, ProductType } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLoading } from "@/hooks/use-loading";
import { Separator } from "@/components/ui/separator";
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

export default function StationaryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // State for applied filters
  const [appliedBrands, setAppliedBrands] = useState<string[]>([]);
  const [appliedTypes, setAppliedTypes] = useState<string[]>([]);
  const [appliedPriceSort, setAppliedPriceSort] = useState<"all" | "asc" | "desc">("all");

  // State for temporary selections in the dialog
  const [tempBrands, setTempBrands] = useState<string[]>([]);
  const [tempTypes, setTempTypes] = useState<string[]>([]);
  const [tempPriceSort, setTempPriceSort] = useState<"all" | "asc" | "desc">("all");
  
  const { isLoading, setIsLoading } = useLoading();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedProducts, fetchedBrands, fetchedTypes] = await Promise.all([
          getProducts("stationary"),
          getBrands("stationary"),
          getProductTypes("stationary"),
        ]);
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setBrands(fetchedBrands);
        setProductTypes(fetchedTypes);
      } catch (error) {
        console.error("Failed to fetch stationary data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  useEffect(() => {
    let tempProducts = [...products];

    // Filter by brand
    if (appliedBrands.length > 0) {
      tempProducts = tempProducts.filter(
        (product) => product.brandIds && product.brandIds.some(id => appliedBrands.includes(id))
      );
    }
    
    // Filter by product type
    if (appliedTypes.length > 0) {
      tempProducts = tempProducts.filter(
        (product) => product.productTypeIds && product.productTypeIds.some(id => appliedTypes.includes(id))
      );
    }
    
    // Sort by price
    if (appliedPriceSort !== "all") {
        tempProducts.sort((a, b) => {
            const priceA = a.discountPrice || a.price;
            const priceB = b.discountPrice || b.price;
            return appliedPriceSort === 'asc' ? priceA - priceB : priceB - a.price;
        });
    }

    setFilteredProducts(tempProducts);
  }, [appliedBrands, appliedTypes, appliedPriceSort, products]);

  const handleApplyFilters = () => {
    setAppliedBrands(tempBrands);
    setAppliedTypes(tempTypes);
    setAppliedPriceSort(tempPriceSort);
    setIsFilterDialogOpen(false);
  };

  const handleResetFilters = () => {
    setTempBrands([]);
    setTempTypes([]);
    setTempPriceSort("all");
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // When dialog opens, sync temp state with applied state
      setTempBrands(appliedBrands);
      setTempTypes(appliedTypes);
      setTempPriceSort(appliedPriceSort);
    }
    setIsFilterDialogOpen(open);
  };

  const renderProductGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4">
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
          <h2 className="text-xl font-semibold">No Products Found</h2>
          <p className="text-muted-foreground">
            There are no products matching the selected filters.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
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

  const SortRadioGroup = ({ selected, onSelectionChange }: {
    selected: string;
    onSelectionChange: (value: "all" | "asc" | "desc") => void;
  }) => (
     <div>
        <h3 className="mb-4 text-lg font-medium">Sort by Price</h3>
        <div className="flex flex-col space-y-2">
            <Button variant={selected === 'all' ? 'secondary' : 'ghost'} onClick={() => onSelectionChange('all')} className="justify-start">Default</Button>
            <Button variant={selected === 'asc' ? 'secondary' : 'ghost'} onClick={() => onSelectionChange('asc')} className="justify-start">Low to High</Button>
            <Button variant={selected === 'desc' ? 'secondary' : 'ghost'} onClick={() => onSelectionChange('desc')} className="justify-start">High to Low</Button>
        </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Stationary
        </h1>
        <p className="mt-2 text-muted-foreground">
          Find all your stationary needs here.
        </p>
      </div>

      <div className="sticky top-20 z-40 bg-background py-4">
        <Dialog open={isFilterDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters & Sorting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filters & Sorting</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <FilterCheckboxGroup title="Filter by Brand" items={brands} selected={tempBrands} onSelectionChange={setTempBrands} />
              <Separator />
              <FilterCheckboxGroup title="Filter by Type" items={productTypes} selected={tempTypes} onSelectionChange={setTempTypes} />
              <Separator />
              <SortRadioGroup selected={tempPriceSort} onSelectionChange={setTempPriceSort} />
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
