
"use client";

import Link from 'next/link';
import { Card } from '@/components/ui/card';
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
    <div className="flex flex-col items-center gap-2">
      <Link href={category.href} className="group block w-full">
        <Card className={cn(
          "relative w-full overflow-hidden rounded-2xl border-2 p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 aspect-square",
          "bg-gray-100 text-gray-900 border-transparent hover:border-primary",
          "dark:bg-gray-900 dark:text-gray-100 dark:hover:border-primary"
        )}>
          <div 
            className="shining-card-animation"
            style={{ animationDelay: `${index * 0.2}s` }}
          />
          <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-black overflow-hidden">
                {hasUploadedImage ? (
                  <Image 
                    src={category.image.src} 
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <p className="font-bold text-2xl">JASA</p>
                )}
              </div>
          </div>
        </Card>
      </Link>
      <h3 className="text-center font-headline text-sm font-semibold">{category.name}</h3>
    </div>
  );
}
