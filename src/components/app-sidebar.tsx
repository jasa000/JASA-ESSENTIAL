
"use client"

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Home, Notebook, ShoppingBag, User, Settings, PenSquare, LogIn, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function AppSidebar() {
  const { state } = useSidebar()
  const { user } = useAuth()
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
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
           <PenSquare className="h-8 w-8 text-sky-blue" />
          {state === "expanded" && (
            <span className="font-headline text-lg font-bold">
              Jasa Essentials
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
           <SidebarMenuItem>
            <SidebarMenuButton href="/" tooltip="Home" asChild>
              <Link href="/">
                <Home />
                Home
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" tooltip="Products" asChild>
              <Link href="#">
                <Notebook />
                Products
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="/cart" tooltip="Cart" asChild>
              <Link href="/cart">
                <ShoppingBag />
                Cart
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton href="/profile" tooltip="Profile" asChild>
                <Link href="/profile">
                  <User />
                  Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" tooltip="Settings" asChild>
              <Link href="#">
                <Settings />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {user ? (
               <SidebarMenuButton onClick={handleSignOut} tooltip="Logout">
                  <LogOut />
                  Logout
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton href="/login" tooltip="Login" asChild>
                <Link href="/login">
                  <LogIn />
                  Login
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
