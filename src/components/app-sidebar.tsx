
"use client"

import { useState, useEffect } from "react"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { usePathname, useRouter } from "next/navigation"
import { Sun, Settings, LogOut, UserPlus, LogIn, Home, ShoppingCart, User, Moon, ShieldCheck, Notebook, Book, Printer, CircuitBoard, FilePenLine, Store, Package, History, FolderKanban } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/context/theme-provider"
import { Skeleton } from "./ui/skeleton"
import { getShops } from "@/lib/shops"
import type { Shop } from "@/lib/types"
import Image from "next/image";
import AuthForm from "./auth-form";

export default function AppSidebar() {
  const { user, loading } = useAuth()
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sellerShops, setSellerShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const { setOpenMobile } = useSidebar();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authDialogDefaultTab, setAuthDialogDefaultTab] = useState<'login' | 'signup'>('login');

  const handleMenuItemClick = () => {
    setOpenMobile(false);
  };

  useEffect(() => {
    if (user?.role === 'seller') {
      const fetchSellerShops = async () => {
        setIsLoadingShops(true);
        try {
          const allShops = await getShops();
          const ownedShops = allShops.filter(shop => shop.ownerIds.includes(user.uid));
          setSellerShops(ownedShops);
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Could not load your shops." });
        } finally {
          setIsLoadingShops(false);
        }
      };
      fetchSellerShops();
    }
  }, [user, toast]);

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const renderUserActions = () => {
    if (loading) {
      return (
        <div className="flex w-full justify-around">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      )
    }

    return (
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <SidebarMenu className="flex flex-row justify-around">
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Theme" size="icon" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                </SidebarMenuButton>
            </SidebarMenuItem>
             {user ? (
                <>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings" size="icon" asChild onClick={handleMenuItemClick}>
                            <Link href="/settings">
                                <Settings />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <SidebarMenuButton tooltip="Logout" size="icon">
                                <LogOut />
                            </SidebarMenuButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will sign you out of your account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSignOut}>Confirm</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </SidebarMenuItem>
                </>
             ) : (
                <>
                    <SidebarMenuItem>
                        <DialogTrigger asChild>
                           <SidebarMenuButton tooltip="Sign Up" size="icon" onClick={() => { setAuthDialogDefaultTab('signup'); handleMenuItemClick(); }}>
                              <UserPlus />
                          </SidebarMenuButton>
                        </DialogTrigger>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <DialogTrigger asChild>
                           <SidebarMenuButton tooltip="Login" size="icon" onClick={() => { setAuthDialogDefaultTab('login'); handleMenuItemClick(); }}>
                                <LogIn />
                            </SidebarMenuButton>
                        </DialogTrigger>
                    </SidebarMenuItem>
                </>
             )}
        </SidebarMenu>
        <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="sr-only">{authDialogDefaultTab === 'login' ? 'Login' : 'Sign Up'}</DialogTitle>
            </DialogHeader>
            <AuthForm defaultTab={authDialogDefaultTab} onSuccess={() => setIsAuthDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    )
  }
  
  const renderSellerAccess = () => {
    if (loading || isLoadingShops) {
      return (
        <SidebarGroup className="bg-gray-100 dark:bg-gray-900 rounded-lg">
          <SidebarGroupLabel>SELLER ACCESS</SidebarGroupLabel>
          <Skeleton className="h-10 w-full" />
        </SidebarGroup>
      )
    }

    if (user?.role === 'seller' && sellerShops.length > 0) {
      return (
        <>
          {sellerShops.map(shop => (
            <SidebarGroup key={shop.id} className="bg-gray-100 dark:bg-gray-900 rounded-lg">
                <SidebarGroupLabel>{shop.name}</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith(`/seller/orders/${shop.id}`)}>
                            <Link href={`/seller/orders/${shop.id}`}>
                                <FolderKanban />
                                <span>Manage Orders</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
          ))}
        </>
      );
    }

    return null;
  };


  return (
    <SidebarContent className="p-2">
        <div className="flex items-center justify-center p-4 gap-2">
            <div className="relative h-10 w-10">
              <Image src="/favicon.ico" alt="Jasa Essentials Logo" layout="fill" className="rounded-full border-2 border-black dark:border-white" />
            </div>
            <h2 className="font-headline text-xl font-bold text-sidebar-foreground">JASA ESSENTIAL</h2>
        </div>
        <SidebarGroup className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2">
            {renderUserActions()}
        </SidebarGroup>
         <SidebarGroup className="bg-gray-100 dark:bg-gray-900 rounded-lg">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname === '/'}>
                        <Link href="/">
                            <Home />
                            <span>Back to Home</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
         <SidebarGroup className="bg-gray-100 dark:bg-gray-900 rounded-lg">
            <SidebarGroupLabel>USER ACCESS</SidebarGroupLabel>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/stationary')}>
                        <Link href="/stationary">
                            <Notebook />
                            <span>Stationary</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/books')}>
                        <Link href="/books">
                            <Book />
                            <span>Books</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/xerox')}>
                        <Link href="/xerox">
                            <Printer />
                            <span>Xerox</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/electronics')}>
                        <Link href="/electronics">
                            <CircuitBoard />
                            <span>Electronic Kit</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/cart')}>
                        <Link href="/cart">
                            <ShoppingCart />
                            <span>Cart</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/profile')}>
                        <Link href="/profile">
                            <User />
                            <span>Profile</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/orders')}>
                        <Link href="/orders">
                            <History />
                            <span>Order History</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
        
        {renderSellerAccess()}

        {user?.role === 'admin' && (
          <SidebarGroup className="bg-gray-100 dark:bg-gray-900 rounded-lg">
              <SidebarGroupLabel>ADMIN ACCESS</SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/manage-users')}>
                          <Link href="/manage-users">
                              <ShieldCheck />
                              <span>Manage Users</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/post-update')}>
                          <Link href="/post-update">
                              <FilePenLine />
                              <span>Post Update</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/manage-shops')}>
                          <Link href="/manage-shops">
                              <Store />
                              <span>Manage Shops</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild onClick={handleMenuItemClick} isActive={pathname.startsWith('/manage-products')}>
                          <Link href="/manage-products">
                              <Package />
                              <span>Manage Products</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarGroup>
        )}
    </SidebarContent>
  )
}

    