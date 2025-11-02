
"use client";

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import Image from 'next/image';

type CategoryLinkCardProps = {
  category: Category;
  index: number;
};

export default function CategoryLinkCard({ category, index }: CategoryLinkCardProps) {
  const hasUploadedImage = category.image.src && category.image.src.startsWith('http');
  
  return (
    <Link href={category.href} className="group block w-full">
        <Card className={cn(
          "relative w-full overflow-hidden rounded-2xl border-2 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
          "border-transparent hover:border-primary",
          "bg-gray-100 dark:bg-gray-900"
        )}>
           <div 
            className="shining-card-animation"
            style={{ animationDelay: `${index * 0.2}s` }}
          />
          <CardContent className="relative aspect-square w-full p-0">
             {hasUploadedImage ? (
                <Image 
                    src={category.image.src} 
                    alt={category.name}
                    fill
                    className="object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                    <p className="font-bold text-2xl text-muted-foreground">JASA</p>
                </div>
            )}
          </CardContent>
          <CardFooter className="p-3">
             <h3 className="w-full text-center font-headline text-sm font-semibold truncate">{category.name}</h3>
          </CardFooter>
        </Card>
      </Link>
  );
}
