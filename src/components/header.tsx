
"use client";

import { Bell, LogIn, Search, ShoppingCart, User, Home, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-provider';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuthForm from './auth-form';
import { useState } from 'react';

export default function Header() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authDialogDefaultTab, setAuthDialogDefaultTab] = useState<'login' | 'signup'>('login');


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-4">
            <SidebarTrigger className="relative h-7 w-7 bg-transparent text-foreground hover:bg-transparent/20" />
            <Link href="/" className="hidden items-center gap-2 sm:flex">
                <span className="font-headline text-lg font-bold">
                Jasa Essentials
                </span>
            </Link>
        </div>

        <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
          <div className="flex items-center justify-end space-x-2">
              <Button asChild variant="ghost" size="icon" className={cn(
                'h-7 w-7 rounded-full', 
                !isHomePage && 'border-2 border-transparent animate-border-pulse'
              )}>
                <Link href="/">
                    <Home className="h-5 w-5" />
                    <span className="sr-only">Home</span>
                </Link>
              </Button>
              {user && (
                <Button asChild variant="ghost" size="icon" className='rounded-full'>
                    <Link href="/notifications">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                    </Link>
                </Button>
              )}
              <Button asChild variant="outline" size={isMobile ? "icon" : "default"} className='rounded-full'>
                  <Link href="/cart">
                      <ShoppingCart className={isMobile ? "h-5 w-5" : "h-4 w-4"}/>
                      <span className="hidden md:inline">Cart</span>
                  </Link>
              </Button>
            {user ? (
                <Button asChild variant="outline" size={isMobile ? "icon" : "default"} className='rounded-full'>
                  <Link href="/profile">
                    <User className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                    <span className="hidden md:inline">Profile</span>
                  </Link>
                </Button>
            ) : (
              <>
                <DialogTrigger asChild>
                  <Button 
                    size={isMobile ? "icon" : "default"} 
                    className='rounded-full' 
                    onClick={() => setAuthDialogDefaultTab('login')}>
                    <LogIn className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                    <span className="hidden md:inline">Login</span>
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                   <Button 
                    variant="secondary"
                    size={isMobile ? "icon" : "default"} 
                    className='rounded-full' 
                    onClick={() => setAuthDialogDefaultTab('signup')}>
                    <UserPlus className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                    <span className="hidden md:inline">Sign Up</span>
                  </Button>
                </DialogTrigger>
              </>
            )}
          </div>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="sr-only">
                {authDialogDefaultTab === 'login' ? 'Login' : 'Sign Up'}
              </DialogTitle>
            </DialogHeader>
            <AuthForm defaultTab={authDialogDefaultTab} onSuccess={() => setIsAuthDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
