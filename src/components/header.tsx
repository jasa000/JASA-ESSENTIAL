"use client";

import { LogIn, Search, ShoppingCart, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from './ui/button';
import { PenSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Header() {
  // Mock user login state. In a real app, this would come from an auth provider.
  const isLoggedIn = false;
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex w-1/3 items-center">
           <Link href="/" className="flex items-center gap-2">
            <PenSquare className="h-8 w-8" style={{color: '#7EC8E3'}} />
            <span className="font-headline text-lg font-bold hidden sm:inline-block">Jasa Essentials</span>
          </Link>
        </div>
        <div className="flex flex-1 justify-center px-4">
          <div className="relative w-full max-w-md">
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
        <div className="flex w-1/3 items-center justify-end space-x-2">
            <Button asChild variant="outline" size={isMobile ? "icon" : "default"} className='rounded-full'>
                <Link href="/cart">
                    <ShoppingCart className={isMobile ? "h-5 w-5" : "h-4 w-4"}/>
                    <span className="hidden md:inline">Cart</span>
                </Link>
            </Button>
          {isLoggedIn ? (
            <Button asChild variant="outline" size={isMobile ? "icon" : "default"} className='rounded-full'>
              <Link href="/profile">
                <User className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                <span className="hidden md:inline">Profile</span>
              </Link>
            </Button>
          ) : (
            <Button asChild size={isMobile ? "icon" : "default"} className='rounded-full'>
              <Link href="/login">
                <LogIn className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                <span className="hidden md:inline">Login</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
