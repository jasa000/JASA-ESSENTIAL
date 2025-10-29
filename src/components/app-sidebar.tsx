
"use client"

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Sun, Settings, LogOut, UserPlus, LogIn, Home, LayoutGrid, ShoppingCart, User, Moon } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/context/theme-provider"

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

  return (
    <SidebarContent className="p-2">
        <SidebarGroup className="bg-sidebar-accent rounded-lg p-2">
            <SidebarMenu className="flex flex-row justify-around">
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Theme" size="icon" onClick={toggleTheme} className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                        {theme === 'dark' ? <Sun /> : <Moon />}
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 {user ? (
                    <>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Settings" size="icon" className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                                <Link href="/profile">
                                    <Settings />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Logout" onClick={handleSignOut} size="icon" className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                                <LogOut />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </>
                 ) : (
                    <>
                        <SidebarMenuItem>
                             <SidebarMenuButton tooltip="Sign Up" size="icon" className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                                <Link href="/signup">
                                    <UserPlus />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                           <SidebarMenuButton tooltip="Login" size="icon" className="text-white hover:bg-sidebar-accent/80 hover:text-white">
                                <Link href="/login">
                                    <LogIn />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </>
                 )}
            </SidebarMenu>
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
    </SidebarContent>
  )
}
