"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock auth state
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        <div className="hidden w-full max-w-md items-center md:flex">
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

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/cart">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Cart
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Link>
          </Button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLoggedIn(false)}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
             <Button variant="outline" asChild className="hidden rounded-full sm:flex">
                <Link href="/profile">
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </Link>
              </Button>
              <Button asChild className="hidden rounded-full sm:flex">
                <Link href="/login">
                  Login
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="flex flex-col gap-4 p-4">
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
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="block w-full text-left" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setIsLoggedIn(false); setIsMenuOpen(false); }}>Logout</Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                 <Button variant="ghost" asChild><Link href="/login">Login</Link></Button>
                 <Button asChild><Link href="/signup">Sign Up</Link></Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
