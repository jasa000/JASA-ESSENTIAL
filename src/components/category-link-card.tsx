
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

const animationClasses = [
  'animate-float-1',
  'animate-float-2',
  'animate-float-3',
  'animate-float-4',
];

const Icon = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <LucideIcons.HelpCircle {...props} />;
  }
  return <LucideIcon {...props} />;
};

export default function CategoryLinkCard({ category, index }: CategoryLinkCardProps) {
  return (
    <Link href={category.href} className="group block w-40 flex-shrink-0">
      <Card className={cn(
        "relative flex w-full h-full overflow-hidden rounded-lg border-2 p-2 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 md:p-4",
        "bg-gray-900 text-gray-100 border-transparent hover:border-primary",
        "dark:bg-gray-100 dark:text-gray-900 dark:hover:border-primary"
      )}>
        <div 
           className="shining-card-animation"
           style={{ animationDelay: `${index * 0.2}s` }}
        />
        <div className="flex flex-col items-center justify-center w-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-black md:h-16 md-w-16">
              <Icon 
                name={category.icon} 
                className={cn(
                  "h-6 w-6 text-black dark:text-white md:h-8 md:w-8",
                   animationClasses[index % animationClasses.length]
                )}
              />
            </div>
            <h3 className="mt-2 flex-grow flex items-center font-headline text-xs font-semibold md:text-base">{category.name}</h3>
        </div>
      </Card>
    </Link>
  );
}
