
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
import { ShoppingCart, Pencil, Trash2 } from 'lucide-react';
import { getBrands, getAuthors } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-provider';
import AuthForm from './auth-form';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

type ProductCardProps = {
  product: Product;
  className?: string;
  showAdminControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function ProductCard({ product, className, showAdminControls = false, onEdit, onDelete }: ProductCardProps) {
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
    e.preventDefault();
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
  
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice!) / product.price) * 100) : 0;

  const mainImage = product.imageNames && product.imageNames.length > 0 && typeof product.imageNames[0] === 'string' && product.imageNames[0].startsWith('http') ? product.imageNames[0] : null;

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
    <div className="relative aspect-[4/5] w-full overflow-hidden">
       {hasDiscount && (
        <Badge variant="destructive" className="absolute top-2 left-2 z-10">
          {discountPercent}% OFF
        </Badge>
      )}
       <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
            {!showAdminControls && (
                <span className="text-blue-600 font-bold text-sm">JASA</span>
            )}
            {showAdminControls && (
                <>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
      {mainImage ? (
        <Image
          src={mainImage}
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
      <h3 className="font-headline text-sm font-semibold leading-tight tracking-tight line-clamp-3" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>{product.name}</h3>
    </div>
  )

  return (
    <>
      <Link href={`/product/${product.id}`} className="h-full">
        <Card className={cn("group flex h-full w-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl", className)}>
            <div className='relative'>
              {cardImage}
            </div>
          
          <CardContent className="flex flex-1 flex-col p-3">
              <div className='flex-grow'>{cardInfo}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div>
                  {hasDiscount && (
                      <p className="text-sm text-muted-foreground line-through">
                          Rs {product.price.toFixed(2)}
                      </p>
                  )}
                  <p className="text-lg font-semibold text-foreground">
                      Rs {hasDiscount ? product.discountPrice?.toFixed(2) : product.price.toFixed(2)}
                  </p>
                </div>
                 {!showAdminControls && (
                    <Button 
                      size="sm"
                      className="h-auto rounded-md bg-blue-600 p-1.5 text-white hover:bg-slate-700"
                      onClick={handleAddToCart}>
                        <div className="flex flex-col items-center">
                            <ShoppingCart className="h-5 w-5" />
                            <span className="text-[10px] font-bold">ADD</span>
                        </div>
                    </Button>
                 )}
              </div>
          </CardContent>
        </Card>
      </Link>
      {AuthDialog}
    </>
  );
}
