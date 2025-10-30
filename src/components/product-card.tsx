
"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Star } from 'lucide-react';
import Link from 'next/link';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const rating = product.rating || 5;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square w-full overflow-hidden">
        <Link href="#">
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.image.hint}
          />
        </Link>
        <Button size="icon" variant="ghost" className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4 text-primary" />
        </Button>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex-grow">
          {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
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
        <div className="mt-4 flex items-center justify-between">
            <p className="text-lg font-semibold text-foreground">
                ₹{product.price.toFixed(2)}
            </p>
            <Button onClick={handleAddToCart} size="sm" className='rounded-full'>
                Shop Now
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
