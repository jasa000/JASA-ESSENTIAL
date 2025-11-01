
"use client";

import { useState, useEffect } from "react";
import { getProducts, getBrands, getProductTypes } from "@/lib/data";
import type { Product, Brand, ProductType } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLoading } from "@/hooks/use-loading";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SlidersHorizontal } from "lucide-react";

export default function ElectronicsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [priceSort, setPriceSort] = useState<"all" | "asc" | "desc">("all");
  const { isLoading, setIsLoading } = useLoading();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedProducts, fetchedBrands, fetchedTypes] = await Promise.all([
          getProducts("electronics"),
          getBrands("electronics"),
          getProductTypes("electronics"),
        ]);
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setBrands(fetchedBrands);
        setProductTypes(fetchedTypes);
      } catch (error) {
        console.error("Failed to fetch electronics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  useEffect(() => {
    let tempProducts = [...products];

    // Filter by brand
    if (selectedBrand !== "all") {
      tempProducts = tempProducts.filter(
        (product) => product.brandIds && product.brandIds.includes(selectedBrand)
      );
    }
    
    // Filter by product type
    if (selectedType !== "all") {
      tempProducts = tempProducts.filter(
        (product) => product.productTypeIds && product.productTypeIds.includes(selectedType)
      );
    }
    
    // Sort by price
    if (priceSort !== "all") {
        tempProducts.sort((a, b) => {
            const priceA = a.discountPrice || a.price;
            const priceB = b.discountPrice || b.price;
            return priceSort === 'asc' ? priceA - priceB : priceB - a;
        });
    }

    setFilteredProducts(tempProducts);
  }, [selectedBrand, selectedType, priceSort, products]);

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
          <h2 className="text-xl font-semibold">No Kits Found</h2>
          <p className="text-muted-foreground">
            There are no electronic kits available at the moment or matching your filters.
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
  
  const FilterButtons = ({ items, selected, onSelect, title }: {
    items: {id: string, name: string}[];
    selected: string;
    onSelect: (id: string) => void;
    title: string;
  }) => (
    <div>
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
                variant={selected === "all" ? "default" : "outline"}
                className={cn("rounded-full", selected === "all" && "bg-primary text-primary-foreground")}
                onClick={() => onSelect("all")}
            >
                All
            </Button>
            {items.map((item) => (
                <Button
                key={item.id}
                variant={selected === item.id ? "default" : "outline"}
                className={cn("rounded-full", selected === item.id && "bg-primary text-primary-foreground")}
                onClick={() => onSelect(item.id)}
                >
                {item.name}
                </Button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Electronic Kits
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore our electronic kits and components.
        </p>
      </div>

       <div className="sticky top-20 z-40 bg-background py-4">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
             <Button variant="outline" className="w-full">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters & Sorting
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="py-4 space-y-4">
            <FilterButtons items={brands} selected={selectedBrand} onSelect={setSelectedBrand} title="Filter by Brand" />
            <Separator />
            <FilterButtons items={productTypes} selected={selectedType} onSelect={setSelectedType} title="Filter by Type" />
            <Separator />
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Sort by Price</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={priceSort === 'all' ? 'default' : 'outline'}
                  onClick={() => setPriceSort('all')}
                >
                  Default
                </Button>
                <Button
                  variant={priceSort === 'asc' ? 'default' : 'outline'}
                  onClick={() => setPriceSort('asc')}
                >
                  Low to High
                </Button>
                <Button
                  variant={priceSort === 'desc' ? 'default' : 'outline'}
                  onClick={() => setPriceSort('desc')}
                >
                  High to Low
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="mt-8">{renderProductGrid()}</div>
    </div>
  );
}
