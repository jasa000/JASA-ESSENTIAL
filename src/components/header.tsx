"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, User, Search, PenSquare } from 'lucide-react';
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

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#', label: 'Products' },
  { href: '#', 'label': 'About' },
  { href: '#', 'label': 'Contact' }
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock auth state
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <PenSquare className="h-7 w-7" style={{color: '#7EC8E3'}} />
            <span className="font-headline text-xl font-bold tracking-tight" style={{color: '#7EC8E3'}}>
              Jasa Essentials
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden w-full max-w-sm items-center lg:flex">
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-10"
            />
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </span>
          </div>

          <Link href="/cart" className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-0"
              >
                {cartItemCount}
              </Badge>
            )}
            <span className="sr-only">Shopping Cart</span>
          </Link>

          <div className="hidden md:block">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-6 w-6" />
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild><Link href="/login">Login</Link></Button>
                <Button asChild><Link href="/signup">Sign Up</Link></Button>
              </div>
            )}
          </div>

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
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-4">
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
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
