
"use client";

import Image from 'next/image';
import type { Product, Author } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Star } from 'lucide-react';
import Link from 'next/link';
import { getBrands, getAuthors } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type ProductCardProps = {
  product: Product;
  className?: string;
};

export default function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [names, setNames] = useState('');

  useEffect(() => {
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
            } else if (product.category === 'electronics' && Array.isArray(product.brandIds) && product.brandIds.length > 0 && typeof product.brandIds[0] === 'string') {
                 setNames(product.brandIds.join(', '));
            }
        } catch (error) {
            console.error("Could not fetch names for product card", error);
        }
    };

    fetchNames();
  }, [product]);


  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const rating = product.rating || 5;
  const primaryImage = product.images[0];
  
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <Card className={cn("group flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg w-64 flex-shrink-0", className)}>
      <div className="relative aspect-square w-full overflow-hidden">
        <Link href="#">
          {primaryImage && (
            <Image
              src={primaryImage.src}
              alt={primaryImage.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </Link>
        <Button size="icon" variant="ghost" className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4 text-primary" />
        </Button>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex-grow">
          {names && <p className="text-xs text-muted-foreground">{names}</p>}
          <h3 className="font-headline text-base font-semibold leading-tight tracking-tight">{product.name}</h3>
          <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground'}`}
                />
              ))}
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
            <div className='flex flex-col'>
               {hasDiscount && (
                 <p className="text-sm text-muted-foreground line-through">
                    ₹{product.price.toFixed(2)}
                 </p>
               )}
               <p className="text-lg font-semibold text-foreground">
                  ₹{hasDiscount ? product.discountPrice?.toFixed(2) : product.price.toFixed(2)}
               </p>
            </div>
            <Button onClick={handleAddToCart} size="sm" className='rounded-full'>
                Shop Now
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
