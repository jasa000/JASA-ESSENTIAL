
"use client"

import {
  SidebarContent,
} from "@/components/ui/sidebar"
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
        {/* All menu items have been removed as requested. */}
    </SidebarContent>
  )
}
