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
import { Home, Notebook, ShoppingBag, User, Settings, PenSquare } from "lucide-react"
import Link from "next/link"

export default function AppSidebar() {
  const { state } = useSidebar()
  const isLoggedIn = false; // mock

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
          <SidebarMenuItem>
            <SidebarMenuButton href={isLoggedIn ? "/profile" : "/login"} tooltip={isLoggedIn ? "Profile" : "Login"} asChild>
              <Link href={isLoggedIn ? "/profile" : "/login"}>
                <User />
                {isLoggedIn ? "Profile" : "Login"}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
