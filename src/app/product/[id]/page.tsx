
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getProductById, getProducts } from "@/lib/data";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProductCard from "@/components/product-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const StarRating = ({ rating, onRate, disabled }: { rating: number, onRate: (r: number) => void, disabled: boolean }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''} ${
                        star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                    }`}
                    onClick={() => !disabled && onRate(star)}
                />
            ))}
        </div>
    );
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<{ [key in Product['category']]?: Product[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);

  const [emblaApi, setEmblaApi] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (typeof id !== 'string') return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          fetchedProduct, 
          stationary, 
          books, 
          electronics
        ] = await Promise.all([
          getProductById(id as string),
          getProducts('stationary'),
          getProducts('books'),
          getProducts('electronics'),
        ]);

        setProduct(fetchedProduct);
        setProductsByCategory({ stationary, books, electronics });
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load product details.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, toast]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const handleRate = (rating: number) => {
    setUserRating(rating);
    toast({
      title: "Thank you for rating!",
      description: `You gave ${product?.name} ${rating} stars.`,
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const renderProductSection = (category: Product['category'], title: string) => {
    const productList = (productsByCategory[category] || []).filter(p => p.id !== product?.id);

    if (productList.length === 0) return null;

    return (
      <section className="mb-8">
        <h3 className="font-headline text-xl font-bold tracking-tight sm:text-2xl mb-4">{title}</h3>
        <Card>
          <CardContent className="p-4">
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {productList.slice(0, 10).map((p) => (
                  <div key={p.id} className="w-[35vw] flex-shrink-0 sm:w-40">
                    <ProductCard product={p} hideRating hideBuyButton />
                  </div>
              ))}
              </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl font-bold">Product Not Found</h1>
        <p className="mt-2 text-muted-foreground">The product you're looking for does not exist.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Go to Homepage</Button>
      </div>
    );
  }
  
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice!) / product.price) * 100) : 0;
  const images = product.imageNames && product.imageNames.length > 0 ? product.imageNames : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Shop
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div className="w-full">
            <Carousel setApi={setEmblaApi} className="w-full">
              <CarouselContent>
                {images.length > 0 ? (
                  images.map((imgUrl, index) => (
                    <CarouselItem key={index}>
                      <Card className="overflow-hidden">
                        <div className="relative aspect-square w-full">
                          <Image src={imgUrl} alt={`${product.name} image ${index + 1}`} fill className="object-cover" />
                        </div>
                      </Card>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <Card>
                      <div className="flex aspect-square h-full w-full items-center justify-center bg-muted text-muted-foreground font-bold text-3xl">
                        JASA
                      </div>
                    </Card>
                  </CarouselItem>
                )}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="hidden md:flex" />
                  <CarouselNext className="hidden md:flex" />
                </>
              )}
            </Carousel>
             {images.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-300",
                      currentSlide === index ? "w-6 bg-primary" : "bg-muted-foreground/50"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
        </div>
        <div className="flex flex-col space-y-6">
          <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">{product.name}</h1>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-bold text-primary">
              ₹{hasDiscount ? product.discountPrice?.toFixed(2) : product.price.toFixed(2)}
            </p>
            {hasDiscount && (
              <>
                <p className="text-xl text-muted-foreground line-through">
                  ₹{product.price.toFixed(2)}
                </p>
                <Badge variant="destructive">{discountPercent}% OFF</Badge>
              </>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Rate this item</h3>
            <StarRating rating={userRating} onRate={handleRate} disabled={!user || userRating > 0} />
            {!user && <p className="text-xs text-muted-foreground mt-1">Please log in to rate.</p>}
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          
          <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={!user}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {user ? 'Add to Cart' : 'Login to Add'}
          </Button>
        </div>
      </div>
      
      <div className="mt-16">
          <h2 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl text-center mb-8">OUR OTHER PRODUCTS</h2>
          <div className="space-y-12">
            {renderProductSection('stationary', 'Featured Stationary')}
            {renderProductSection('books', 'Latest Books')}
            {renderProductSection('electronics', 'Top Electronic Kits')}
          </div>
      </div>
    </div>
  );
}
