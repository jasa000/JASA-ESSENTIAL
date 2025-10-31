
"use client";

import { Bell, LogIn, LogOut, Search, ShoppingCart, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-provider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Sign Out Error",
        description: "There was a problem signing you out.",
      });
    }
  };

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

        <div className="flex flex-1 justify-center px-4">
          <div className="relative w-full max-w-md">
            <Input
              type="text"
              placeholder="Search your product"
              className="rounded-full border-primary pl-12 pr-10"
            />
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
               <Image src="/favicon.ico" alt="Jasa Essentials" width={32} height={32} className="rounded-full border-2 border-primary" />
            </span>
             <span className="absolute inset-y-0 right-0 flex items-center pr-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2">
            {user && (
              <Button asChild variant="ghost" size="icon" className='rounded-full'>
                  <Link href="#">
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
