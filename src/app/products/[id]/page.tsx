

"use client";

import { useEffect, useState, use } from 'react';
import { getProductById, getAuthors, getBrands } from '@/lib/data';
import type { Product } from '@/lib/types';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ProductDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [product, setProduct] = useState<Product | null>(null);
  const [names, setNames] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();
  const [mainImageIndex, setMainImageIndex] = useState(0);

  useEffect(() => {
    if (params.id) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const fetchedProduct = await getProductById(params.id);
          setProduct(fetchedProduct);
        } catch (error) {
          console.error("Failed to fetch product", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [params.id]);

  useEffect(() => {
    if (product) {
      const fetchNames = async () => {
        try {
            if (product.category === 'stationary' && product.brandIds && product.brandIds.length > 0) {
                const allBrands = await getBrands();
                const brandNames = product.brandIds
                    .map(id => allBrands.find(b => b.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                setNames(brandNames);
            } else if (product.category === 'books' && product.authorIds && product.authorIds.length > 0) {
                const allAuthors = await getAuthors();
                const authorNames = product.authorIds
                    .map(id => allAuthors.find(a => a.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                setNames(authorNames);
            } else if (product.category === 'electronics' && Array.isArray(product.brandIds) && product.brandIds.length > 0) {
                const allBrands = await getBrands();
                const brandNames = product.brandIds
                    .map(id => allBrands.find(b => b.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                setNames(brandNames);
            }
        } catch (error) {
            console.error("Could not fetch names for product", error);
        }
      };
      fetchNames();
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Skeleton className="w-full aspect-square rounded-lg" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <Skeleton className="h-20 w-20 rounded-lg" />
              <Skeleton className="h-20 w-20 rounded-lg" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const nextImage = () => {
    if (product.imageNames) {
        setMainImageIndex((prev) => (prev + 1) % product.imageNames!.length);
    }
  }

  const prevImage = () => {
     if (product.imageNames) {
        setMainImageIndex((prev) => (prev - 1 + product.imageNames!.length) % product.imageNames!.length);
    }
  }

  const rating = product.rating || 5;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const hasImages = product.imageNames && product.imageNames.length > 0;
  const mainImage = hasImages ? product.imageNames![mainImageIndex] : null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div>
           <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
             {hasImages && mainImage ? (
                <Image
                    src={`/images/products/${mainImage}`}
                    alt={product.name}
                    fill
                    className="object-cover transition-opacity duration-300"
                    key={mainImageIndex}
                />
              ) : (
                <p className="text-muted-foreground">No Image Available</p>
              )}
               {hasImages && product.imageNames!.length > 1 && (
                 <>
                    <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/50 hover:bg-background/80" onClick={prevImage}>
                        <ChevronLeft />
                    </Button>
                     <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/50 hover:bg-background/80" onClick={nextImage}>
                        <ChevronRight />
                    </Button>
                 </>
               )}
           </div>
            {hasImages && product.imageNames!.length > 1 && (
            <div className="mt-4 flex gap-2 justify-center">
                {product.imageNames!.map((img, index) => (
                    <button 
                        key={index} 
                        onClick={() => setMainImageIndex(index)} 
                        className={cn(
                            "h-20 w-20 rounded-lg overflow-hidden border-2 transition-all",
                            mainImageIndex === index ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                        )}
                    >
                        <div className="relative w-full h-full">
                           <Image
                                src={`/images/products/${img}`}
                                alt={`${product.name} thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </button>
                ))}
            </div>
            )}
        </div>

        <div className="flex flex-col justify-center">
          <div>
            {names && <p className="text-sm font-medium text-muted-foreground">{names}</p>}
            <h1 className="font-headline text-3xl font-bold lg:text-4xl">{product.name}</h1>
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({rating}.0)</span>
          </div>

          <Separator className="my-4" />
          
          <p className="text-foreground/80 leading-relaxed">{product.description}</p>
          
          <div className="mt-6">
            <div className='flex items-baseline gap-2'>
              <p className="text-3xl font-bold text-foreground">
                ₹{hasDiscount ? product.discountPrice?.toFixed(2) : product.price.toFixed(2)}
              </p>
              {hasDiscount && (
                <p className="text-xl text-muted-foreground line-through">
                  ₹{product.price.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Button size="lg" className="w-full max-w-xs rounded-full" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
