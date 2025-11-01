
"use client";

import { useState, useEffect } from "react";
import { getProducts, getBrands } from "@/lib/data";
import type { Product, Brand } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StationaryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedProducts, fetchedBrands] = await Promise.all([
          getProducts("stationary"),
          getBrands("stationary"),
        ]);
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setBrands(fetchedBrands);
      } catch (error) {
        console.error("Failed to fetch stationary data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBrand === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(
          (product) => product.brandIds && product.brandIds.includes(selectedBrand)
        )
      );
    }
  }, [selectedBrand, products]);

  const renderProductGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
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
            There are no products matching the selected brand.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

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
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedBrand === "all" ? "default" : "outline"}
            className={cn("rounded-full", selectedBrand === "all" && "bg-primary text-primary-foreground")}
            onClick={() => setSelectedBrand("all")}
          >
            All
          </Button>
          {brands.map((brand) => (
            <Button
              key={brand.id}
              variant={selectedBrand === brand.id ? "default" : "outline"}
              className={cn("rounded-full", selectedBrand === brand.id && "bg-primary text-primary-foreground")}
              onClick={() => setSelectedBrand(brand.id)}
            >
              {brand.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8">{renderProductGrid()}</div>
    </div>
  );
}
