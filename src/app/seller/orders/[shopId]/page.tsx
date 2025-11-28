
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';
import { useState, useEffect } from 'react';
import { getOrdersBySeller, updateOrderStatus, updateOrderRejectionReason } from '@/lib/data';
import { getAllUsers } from '@/lib/users';
import type { Order, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, MessageSquare, User, Package, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

type GroupedOrders = {
  [userId: string]: {
    user: UserProfile;
    orders: Order[];
  };
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

  const fetchOrdersAndUsers = async () => {
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
      fetchOrdersAndUsers();
      setRejectingOrder(null);
      setRejectionReason("");
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const pendingOrders = Object.values(orders).filter(group => 
      group.orders.some(order => order.status === 'Pending Confirmation')
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Manage Shop Orders
      </h1>
      <p className="mt-2 text-muted-foreground">
        Review and process incoming orders for your shop.
      </p>

      {isLoading ? (
         <div className="mt-8 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
         </div>
      ) : pendingOrders.length === 0 ? (
        <Card className="mt-8 text-center py-12">
            <CardHeader>
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>No Pending Orders</CardTitle>
                <CardDescription>There are no new orders to process at this time.</CardDescription>
            </CardHeader>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {pendingOrders.map(({ user, orders }) => (
            <Card key={user.uid}>
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                    <User /> Customer: {user.name}
                </CardTitle>
                <CardDescription>Email: {user.email} | Phone: {user.mobile || 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {orders.filter(o => o.status === 'Pending Confirmation').map(order => (
                    <div key={order.id} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                        <div className="flex gap-2 self-end md:self-center">
                            <Button size="sm" onClick={() => handleConfirmOrder(order.id)}>
                                <Check className="mr-2 h-4 w-4"/> Confirm
                            </Button>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="destructive" onClick={() => setRejectingOrder(order)}>
                                    <X className="mr-2 h-4 w-4"/> Reject
                                </Button>
                            </DialogTrigger>
                        </div>
                    </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!rejectingOrder} onOpenChange={(open) => !open && setRejectingOrder(null)}>
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
                <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={handleRejectOrder}>Confirm Rejection</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
