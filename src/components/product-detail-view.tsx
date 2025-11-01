

"use client";

import { useEffect, useState } from 'react';
import { getAuthors, getBrands } from '@/lib/data';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-provider';
import AuthForm from './auth-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ProductDetailView({ product }: { product: Product }) {
  const { user } = useAuth();
  const [names, setNames] = useState('');
  const { addItem } = useCart();
  const { toast } = useToast();
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

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

  const handleAddToCart = () => {
    if (!user) {
        setIsAuthDialogOpen(true);
        return;
    }
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
  
  const AuthDialog = (
     <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="max-w-sm">
           <DialogHeader>
             <DialogTitle className="sr-only">Authentication</DialogTitle>
           </DialogHeader>
           <AuthForm onSuccess={() => setIsAuthDialogOpen(false)} />
        </DialogContent>
     </Dialog>
  )

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-0">
       <div className="md:sticky md:top-0">
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
              <p className="text-muted-foreground font-bold text-3xl dark:text-gray-400">JASA</p>
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

      <div className="flex flex-col">
        <DialogHeader className="relative">
          {names && <p className="text-sm font-medium text-muted-foreground">{names}</p>}
          <DialogTitle className="font-headline text-3xl font-bold lg:text-4xl pr-12">{product.name}</DialogTitle>
            <Button size="icon" variant="outline" className="absolute top-0 right-0 rounded-full h-10 w-10" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Add to cart</span>
            </Button>
        </DialogHeader>
        
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
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Description</AccordionTrigger>
            <AccordionContent>
              <p className="text-foreground/80 leading-relaxed">{product.description}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex-grow"></div>
        
        <DialogFooter className="mt-6 flex-col sm:flex-col sm:justify-start sm:space-x-0 gap-4 sticky bottom-0 bg-background py-4">
          <div>
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
          <Button size="lg" className="w-full rounded-full" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </DialogFooter>
      </div>
    </div>
    {AuthDialog}
    </>
  );
}

