"use client";

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-20 items-center justify-center px-4">
        <div className="w-full max-w-md items-center md:flex">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search your product"
              className="rounded-full border-primary pl-10"
            />
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
