
"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/lib/data";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BooksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await getProducts("books");
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to fetch books data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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

    if (products.length === 0) {
      return (
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold">No Books Found</h2>
          <p className="text-muted-foreground">
            There are no books available at the moment.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

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

      <div className="mt-8">{renderProductGrid()}</div>
    </div>
  );
}
