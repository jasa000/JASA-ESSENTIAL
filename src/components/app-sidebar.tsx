
"use client"

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
import { useAuth } from "@/context/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Sun, Settings, LogOut, UserPlus, LogIn, Home, LayoutGrid, ShoppingCart, User, Moon, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/context/theme-provider"
import { Skeleton } from "./ui/skeleton"

export default function AppSidebar() {
  const { user, loading } = useAuth()
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
        <SidebarMenu className="flex flex-row justify-around">
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Theme" size="icon" onClick={toggleTheme} className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                    {theme === 'dark' ? <Sun /> : <Moon />}
                </SidebarMenuButton>
            </SidebarMenuItem>
             {user ? (
                <>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings" size="icon" asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                            <Link href="/profile">
                                <Settings />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <SidebarMenuButton tooltip="Logout" size="icon" className="text-white hover:bg-sidebar-accent/80 hover:text-white">
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
                         <SidebarMenuButton tooltip="Sign Up" size="icon" asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                            <Link href="/signup">
                                <UserPlus />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                       <SidebarMenuButton tooltip="Login" size="icon" asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                            <Link href="/login">
                                <LogIn />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </>
             )}
        </SidebarMenu>
    )
  }

  return (
    <SidebarContent className="p-2">
        <SidebarGroup className="bg-sidebar-accent rounded-lg p-2">
            {renderUserActions()}
        </SidebarGroup>
         <SidebarGroup className="bg-sidebar-accent rounded-lg p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                        <Link href="/">
                            <Home />
                            <span>Back to Home</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
         <SidebarGroup className="bg-sidebar-accent rounded-lg p-2">
            <SidebarGroupLabel className="text-white/90">USER ACCESS</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                        <Link href="/">
                            <LayoutGrid />
                            <span>Products</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                        <Link href="/cart">
                            <ShoppingCart />
                            <span>Cart</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                        <Link href="/profile">
                            <User />
                            <span>Profile</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
        
        {user?.role === 'admin' && (
          <SidebarGroup className="bg-sidebar-accent rounded-lg p-2">
              <SidebarGroupLabel className="text-white/90">ADMIN ACCESS</SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                          <Link href="#">
                              <ShieldCheck />
                              <span>Manage Users</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarGroup>
        )}
    </SidebarContent>
  )
}
