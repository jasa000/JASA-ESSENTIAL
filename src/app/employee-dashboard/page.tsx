
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getShops } from "@/lib/shops";
import { getOrdersBySeller } from "@/lib/data";
import { getAllUsers } from "@/lib/users";
import { useToast } from "@/hooks/use-toast";
import type { Shop, Order, UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Package, FileText, Phone, Truck, MapPin, ChevronRight, Book, CircuitBoard, Printer, Notebook } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type GroupedOrders = {
  [userId: string]: {
    user: UserProfile;
    orders: Order[];
  };
};

type CategoryKey = "stationary" | "books" | "electronics" | "xerox";

const PENDING_DELIVERY_STATUSES: Order['status'][] = ["Processing", "Packed", "Shipped", "Out for Delivery"];

const categoryConfig: Record<CategoryKey, { icon: React.ElementType, label: string }> = {
  stationary: { icon: Notebook, label: "Stationary" },
  books: { icon: Book, label: "Books" },
  electronics: { icon: CircuitBoard, label: "Electronic Kits" },
  xerox: { icon: Printer, label: "Xerox & Printing" },
};

export default function EmployeeDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [assignedShops, setAssignedShops] = useState<Shop[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("employee")) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page.",
        });
        router.push("/");
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, router, toast]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [allShops, allUsers] = await Promise.all([getShops(), getAllUsers()]);
      
      const shopsForEmployee = allShops.filter(shop => shop.employeeIds?.includes(user.uid));
      setAssignedShops(shopsForEmployee);
      setUsers(allUsers);

      const shopIds = shopsForEmployee.map(s => s.id);
      const ordersPromises = shopIds.map(id => getOrdersBySeller(id));
      const ordersByShop = await Promise.all(ordersPromises);
      const allOrders = ordersByShop.flat();
      
      const pending = allOrders.filter(order => PENDING_DELIVERY_STATUSES.includes(order.status));
      setPendingOrders(pending);

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load dashboard data." });
    } finally {
      setIsLoading(false);
    }
  };

  const groupedByCustomer = useMemo<GroupedOrders>(() => {
    return pendingOrders.reduce((acc, order) => {
      const customer = users.find(u => u.uid === order.userId);
      if (customer) {
        if (!acc[order.userId]) {
          acc[order.userId] = { user: customer, orders: [] };
        }
        acc[order.userId].orders.push(order);
      }
      return acc;
    }, {} as GroupedOrders);
  }, [pendingOrders, users]);

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Employee Dashboard
      </h1>
      <p className="mt-2 text-muted-foreground">
        Overview of all pending delivery orders from your assigned shops.
      </p>

      {Object.keys(groupedByCustomer).length === 0 ? (
        <Card className="mt-8 text-center py-16">
          <CardHeader>
            <Truck className="mx-auto h-16 w-16 text-muted-foreground" />
            <CardTitle className="mt-4">All Caught Up!</CardTitle>
            <CardDescription>There are no pending delivery orders assigned to you right now.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {Object.values(groupedByCustomer).map(({ user, orders }) => {
            const ordersByCategory = orders.reduce((acc, order) => {
                const category: CategoryKey = order.category;
                if (!acc[category]) acc[category] = [];
                acc[category].push(order);
                return acc;
            }, {} as Record<CategoryKey, Order[]>);

            return (
              <Card key={user.uid}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User /> {user.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 pt-2">
                        <Phone className="h-4 w-4" />
                        <span>{orders[0].mobile}</span>
                    </div>
                     <div className="flex items-start gap-2 pt-2">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                        <span>{orders[0].shippingAddress.line1}, {orders[0].shippingAddress.city} - {orders[0].shippingAddress.postalCode}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(ordersByCategory).map(([category, catOrders]) => {
                    const CategoryIcon = categoryConfig[category as CategoryKey]?.icon || Package;
                    return (
                        <div key={category}>
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                                <CategoryIcon className="h-5 w-5" />
                                {categoryConfig[category as CategoryKey]?.label}
                            </h3>
                            <div className="space-y-2 pl-4 border-l-2">
                                {catOrders.map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-12 w-12 flex-shrink-0 bg-muted rounded-md flex items-center justify-center">
                                                {order.category === 'xerox' ? (
                                                     <FileText className="h-6 w-6 text-muted-foreground" />
                                                ) : (
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{order.productName}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge>{order.status}</Badge>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/seller/orders/${order.sellerId}`}>
                                                    View Shop <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
