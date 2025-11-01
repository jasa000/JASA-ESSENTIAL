
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
import { ShoppingCart, Star, Pencil, Trash2 } from 'lucide-react';
import { getBrands, getAuthors } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProductDetailView from './product-detail-view';
import { useAuth } from '@/context/auth-provider';
import AuthForm from './auth-form';

type ProductCardProps = {
  product: Product;
  className?: string;
  showAdminControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  hideRating?: boolean;
  hideBuyButton?: boolean;
};

export default function ProductCard({ product, className, showAdminControls = false, onEdit, onDelete, hideRating = false, hideBuyButton = false }: ProductCardProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [names, setNames] = useState('');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

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
            } else if (product.category === 'electronics' && Array.isArray(product.brandIds) && product.brandIds.length > 0) {
                const allBrands = await getBrands();
                const brandNames = product.brandIds
                    .map(id => allBrands.find(b => b.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                setNames(brandNames);
            }
        } catch (error) {
            console.error("Could not fetch names for product card", error);
        }
    };

    fetchNames();
  }, [product]);


  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); 
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

  const rating = product.rating || 5;
  
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  const mainImage = product.imageNames && product.imageNames.length > 0 ? product.imageNames[0] : null;

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

  const cardImage = (
    <div className="relative aspect-square w-full overflow-hidden">
      {mainImage ? (
        <Image
          src={`/images/products/${mainImage}`}
          alt={product.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-bold text-2xl">
          JASA
        </div>
      )}
    </div>
  );
  
  const cardInfo = (
     <div className="flex-grow">
      {names && <p className="text-xs text-muted-foreground">{names}</p>}
      <h3 className="font-headline text-base font-semibold leading-tight tracking-tight">{product.name}</h3>
      {!hideRating && (
        <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground'}`}
            />
            ))}
        </div>
      )}
    </div>
  )
  
  const CardContentTrigger = showAdminControls ? 'div' : DialogTrigger;
  const cardContentProps = showAdminControls ? {} : { asChild: true };

  return (
    <>
      <Dialog>
        <Card className={cn("group flex h-full w-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg", className)}>
            <div className='relative'>
              <CardContentTrigger {...cardContentProps}>
                 <div className='cursor-pointer'>{cardImage}</div>
              </CardContentTrigger>
              {showAdminControls && (
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={onEdit}>
                          <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md" onClick={onDelete}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              )}
            </div>
          
          <CardContent className="flex flex-1 flex-col p-4">
              <CardContentTrigger {...cardContentProps}>
                 <div className='cursor-pointer'>{cardInfo}</div>
              </CardContentTrigger>
              <div className="mt-4 flex flex-col sm:flex-row items-baseline justify-between">
                <div className='flex items-baseline gap-2'>
                  <p className="text-lg font-semibold text-foreground">
                      ₹{hasDiscount ? product.discountPrice?.toFixed(2) : product.price.toFixed(2)}
                  </p>
                  {hasDiscount && (
                      <p className="text-sm text-muted-foreground line-through">
                          ₹{product.price.toFixed(2)}
                      </p>
                  )}
                </div>
                  {!showAdminControls && !hideBuyButton && (
                      <>
                          <Button onClick={handleAddToCart} size="sm" className='rounded-full mt-2 sm:mt-0'>
                              Shop Now
                          </Button>
                          <Button size="icon" variant="ghost" className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background z-10" onClick={handleAddToCart}>
                              <ShoppingCart className="h-4 w-4 text-primary" />
                          </Button>
                      </>
                  )}
              </div>
          </CardContent>
        </Card>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProductDetailView product={product} />
        </DialogContent>
      </Dialog>
      {AuthDialog}
    </>
  );
}
