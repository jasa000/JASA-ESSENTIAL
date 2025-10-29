
"use client"

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Home, Notebook, ShoppingBag, User, Settings, LogIn, LogOut, Moon, UserPlus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function AppSidebar() {
  const { user, loading } = useAuth()
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
    <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="flex-row justify-center">
             {!loading && (
              <>
                {user ? (
                  <>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="#" tooltip="Theme" asChild>
                      <Link href="#">
                        <Moon />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="#" tooltip="Settings" asChild>
                      <Link href="#">
                        <Settings />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut} tooltip="Logout">
                        <LogOut />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  </>
                ) : (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/signup" tooltip="Sign Up" asChild>
                        <Link href="/signup">
                          <UserPlus />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/login" tooltip="Login" asChild>
                      <Link href="/login">
                        <LogIn />
                      </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/" tooltip="Home">
                      <Home />
                      Back to Home
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel>User Access</SidebarGroupLabel>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" tooltip="Products">
                    <Notebook />
                    Products
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/cart" tooltip="Cart">
                    <ShoppingBag />
                    Cart
                </SidebarMenuButton>
            </SidebarMenuItem>
            {!loading && user && (
                <SidebarMenuItem>
                <SidebarMenuButton href="/profile" tooltip="Profile">
                    <User />
                    Profile
                </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            </SidebarMenu>
        </SidebarGroup>

    </SidebarContent>
  )
}
