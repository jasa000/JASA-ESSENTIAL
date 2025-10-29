
"use client";

import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

type CategoryLinkCardProps = {
  category: Category;
  index: number;
};

const Icon = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <LucideIcons.HelpCircle {...props} />;
  }
  return <LucideIcon {...props} />;
};

export default function CategoryLinkCard({ category, index }: CategoryLinkCardProps) {
  return (
    <Link href={category.href} className="group block w-full">
      <Card className={cn(
        "relative w-full overflow-hidden rounded-lg border-2 border-transparent bg-card p-2 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 md:p-4",
        "dark:bg-gray-800 dark:hover:border-primary",
        "hover:border-primary"
      )}>
        <div 
           className="shining-card-animation"
           style={{ animationDelay: `${index * 0.2}s` }}
        />
        <div className="flex flex-col items-center justify-center">
            <Icon name={category.icon} className="h-6 w-6 text-primary md:h-8 md:w-8" />
            <h3 className="mt-2 font-headline text-xs font-semibold md:text-base">{category.name}</h3>
        </div>
      </Card>
    </Link>
  );
}
