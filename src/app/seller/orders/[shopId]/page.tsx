
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';
import { useState, useEffect, useMemo } from 'react';
import { getOrdersBySeller, updateOrderStatus, updateOrderRejectionReason } from '@/lib/data';
import { getAllUsers } from '@/lib/users';
import type { Order, UserProfile, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, User, Package, FileText, Phone, Truck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import OrderTracker from '@/components/order-tracker';

type GroupedOrders = {
  [userId: string]: {
    user: UserProfile;
    orders: Order[];
  };
};

const NEXT_STATUS: Record<string, OrderStatus> = {
  "Processing": "Packed",
  "Packed": "Shipped",
  "Shipped": "Out for Delivery",
  "Out for Delivery": "Delivered",
};

export default function ManageShopOrdersPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<GroupedOrders>({});
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const fetchOrdersAndUsers = async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const [shopOrders, allUsers] = await Promise.all([
        getOrdersBySeller(shopId),
        getAllUsers()
      ]);

      const usersMap = new Map(allUsers.map(u => [u.uid, u]));

      const grouped: GroupedOrders = shopOrders.reduce((acc, order) => {
        if (!acc[order.userId]) {
          const orderUser = usersMap.get(order.userId);
          if (orderUser) {
            acc[order.userId] = { user: orderUser, orders: [] };
          }
        }
        if (acc[order.userId]) {
          acc[order.userId].orders.push(order);
        }
        return acc;
      }, {} as GroupedOrders);

      setOrders(grouped);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("seller")) {
        router.push("/");
        return;
      }
      fetchOrdersAndUsers();
    }
  }, [authLoading, user, shopId]);

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'Processing');
      toast({ title: 'Order Confirmed', description: 'The order is now being processed.' });
      fetchOrdersAndUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleRejectOrder = async () => {
    if (!rejectingOrder || !rejectionReason.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'A reason for rejection is required.' });
        return;
    }
    try {
      await updateOrderRejectionReason(rejectingOrder.id, rejectionReason);
      toast({ title: 'Order Rejected', description: 'The customer has been notified.' });
      setRejectingOrder(null);
      setRejectionReason("");
      fetchOrdersAndUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleUpdateStatus = async (order: Order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    try {
      await updateOrderStatus(order.id, nextStatus);
      toast({ title: 'Status Updated', description: `Order is now: ${nextStatus}` });
      fetchOrdersAndUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const ordersByStatus = useMemo(() => {
    const pending: GroupedOrders = {};
    const active: GroupedOrders = {};

    Object.entries(orders).forEach(([userId, group]) => {
      const pendingOrders = group.orders.filter(o => o.status === 'Pending Confirmation');
      const activeOrders = group.orders.filter(o => o.status !== 'Pending Confirmation' && o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Rejected');
      
      if (pendingOrders.length > 0) {
        pending[userId] = { user: group.user, orders: pendingOrders };
      }
      if (activeOrders.length > 0) {
        active[userId] = { user: group.user, orders: activeOrders };
      }
    });
    return { pending, active };
  }, [orders]);


  const renderOrderList = (groupedOrders: GroupedOrders, isPendingList: boolean) => {
    if (isLoading) {
      return (
         <div className="mt-8 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
         </div>
      );
    }

    const orderGroups = Object.values(groupedOrders);

    if (orderGroups.length === 0) {
      return (
        <Card className="mt-8 text-center py-12">
            <CardHeader>
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>No {isPendingList ? 'Pending' : 'Active'} Orders</CardTitle>
                <CardDescription>There are no new orders to process at this time.</CardDescription>
            </CardHeader>
        </Card>
      );
    }
    
    return (
        <div className="mt-8 space-y-6">
          {orderGroups.map(({ user, orders }) => (
            <Card key={user.uid}>
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                    <User /> Customer: {user.name}
                </CardTitle>
                <CardDescription>Email: {user.email}</CardDescription>
                 <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
                    <Phone className="h-4 w-4" />
                    <div>
                        <p>{orders[0].mobile}</p>
                        {orders[0].altMobiles?.[0]?.value && <p>{orders[0].altMobiles[0].value}</p>}
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="p-4 border rounded-lg flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-4">
                              <div className="relative h-16 w-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                                  {order.productImage ? (
                                      <Image src={order.productImage} alt={order.productName} fill className="object-cover" />
                                  ) : (
                                      <FileText className="h-8 w-8 text-muted-foreground m-auto" />
                                  )}
                              </div>
                              <div>
                                  <p className="font-semibold">{order.productName}</p>
                                  <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                                  <p className="text-sm text-muted-foreground">Total: Rs {(order.price * order.quantity).toFixed(2)}</p>
                              </div>
                          </div>
                          {isPendingList && (
                            <div className="flex gap-2 self-end md:self-center">
                                <Button size="sm" onClick={() => handleConfirmOrder(order.id)}>
                                    <Check className="mr-2 h-4 w-4"/> Confirm
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => setRejectingOrder(order)}>
                                    <X className="mr-2 h-4 w-4"/> Reject
                                </Button>
                            </div>
                          )}
                        </div>
                        {!isPendingList && (
                          <>
                           <Separator />
                           <OrderTracker trackingInfo={order.tracking} />
                           <CardFooter>
                              <Button 
                                className="w-full" 
                                onClick={() => handleUpdateStatus(order)} 
                                disabled={!NEXT_STATUS[order.status]}
                              >
                                {NEXT_STATUS[order.status] ? `Update to: ${NEXT_STATUS[order.status]}` : "Order Complete"}
                              </Button>
                           </CardFooter>
                          </>
                        )}
                    </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
    )
  }

  return (
    <>
    <Dialog open={!!rejectingOrder} onOpenChange={(open) => {if (!open) setRejectingOrder(null)}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reject Order: {rejectingOrder?.productName}</DialogTitle>
                <DialogDescription>
                    Please provide a reason for rejecting this order. This will be shown to the customer.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    placeholder="e.g., Item is out of stock, Unable to deliver to the provided address, etc."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setRejectingOrder(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRejectOrder}>Confirm Rejection</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Manage Shop Orders
      </h1>
      <p className="mt-2 text-muted-foreground">
        Review and process incoming orders for your shop.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Confirmation ({Object.values(ordersByStatus.pending).reduce((sum, group) => sum + group.orders.length, 0)})</TabsTrigger>
            <TabsTrigger value="active">Active Orders ({Object.values(ordersByStatus.active).reduce((sum, group) => sum + group.orders.length, 0)})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {renderOrderList(ordersByStatus.pending, true)}
        </TabsContent>
        <TabsContent value="active">
          {renderOrderList(ordersByStatus.active, false)}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
