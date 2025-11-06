
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getShops } from "@/lib/shops";
import { useToast } from "@/hooks/use-toast";
import type { Shop } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, Store } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [sellerShops, setSellerShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("seller")) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page.",
        });
        router.push("/");
      } else {
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
    }
  }, [user, authLoading, router, toast]);

  if (authLoading || isLoadingShops) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Seller Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Loading your information...
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Seller Dashboard
      </h1>
      <p className="mt-2 text-muted-foreground">
        Welcome, {user?.name}. Here are the shops you manage.
      </p>

      <div className="mt-8">
        {sellerShops.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sellerShops.map((shop) => (
              <Card key={shop.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store /> {shop.name}
                  </CardTitle>
                  <CardDescription>{shop.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Services: {shop.services.join(', ')}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/seller/orders/${shop.id}`}>
                      <FolderKanban className="mr-2 h-4 w-4" />
                      Manage Orders
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Shops Assigned</CardTitle>
              <CardDescription>
                You are not currently assigned as an owner of any shops. Please contact an admin.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
