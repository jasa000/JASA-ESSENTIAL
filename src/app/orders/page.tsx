
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getMyOrders, updateOrderStatus } from "@/lib/data";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Info, Clock, AlertTriangle, XCircle, ShoppingCart, Phone } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription as AlertDesc } from "@/components/ui/alert";
import OrderTracker from "@/components/order-tracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const statusConfig: { [key in Order['status']]: { icon: React.ElementType, label: string } } = {
  "Pending Confirmation": { icon: Clock, label: "Pending" },
  "Processing": { icon: Package, label: "Processing" },
  "Packed": { icon: Package, label: "Packed" },
  "Shipped": { icon: Truck, label: "Shipped" },
  "Out for Delivery": { icon: Truck, label: "Out for Delivery" },
  "Delivered": { icon: CheckCircle, label: "Delivered" },
  "Cancelled": { icon: XCircle, label: "Cancelled" },
  "Rejected": { icon: AlertTriangle, label: "Rejected" },
};


const OrderCard = ({ order, onCancel }: { order: Order, onCancel: (orderId: string) => void }) => {
  const { toast } = useToast();
  const StatusIcon = statusConfig[order.status]?.icon || Package;
  const itemPrice = order.price || 0;
  const itemQuantity = order.quantity || 1;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/50 p-4">
        <div>
          <CardTitle className="font-headline text-lg truncate max-w-xs">{order.productName}</CardTitle>
          <CardDescription>Order ID: {order.id}</CardDescription>
        </div>
        <Badge variant={order.status === 'Rejected' || order.status === 'Cancelled' ? 'destructive' : 'default'} className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            {order.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        {order.rejectionReason && (
            <Alert variant="destructive" className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Rejection Reason</AlertTitle>
                <AlertDesc>
                    {order.rejectionReason}
                </AlertDesc>
            </Alert>
        )}
        <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                {order.productImage ? (
                    <Image src={order.productImage} alt={order.productName} fill className="object-cover" />
                ) : (
                    <ShoppingCart className="h-10 w-10 text-muted-foreground m-auto" />
                )}
            </div>
            <div className="space-y-2 text-sm">
                <p><span className="font-medium">Quantity:</span> {itemQuantity}</p>
                <p><span className="font-medium">Price per item:</span> Rs {(itemPrice).toFixed(2)}</p>
                <p className="font-bold"><span className="font-medium">Total:</span> Rs {(itemPrice * itemQuantity).toFixed(2)}</p>
            </div>
        </div>

        {(order.status !== 'Pending Confirmation' && order.status !== 'Cancelled' && order.status !== 'Rejected') && (
          <>
            <Separator className="my-4" />
            <OrderTracker trackingInfo={order.tracking} />
          </>
        )}

        <Separator className="my-4" />
        <div>
            <h4 className="font-medium mb-2">Shipping Address & Contact</h4>
            <div className="text-sm text-muted-foreground">
                <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
                 <div className="mt-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <div>
                        <p>{order.mobile}</p>
                        {order.altMobiles?.[0]?.value && <p>{order.altMobiles[0].value}</p>}
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        {order.status === 'Pending Confirmation' && (
           <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className="w-full" variant="destructive">Cancel Order</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will cancel your order for "{order.productName}". This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Order</AlertDialogCancel>
                <AlertDialogAction onClick={() => onCancel(order.id)} className="bg-destructive hover:bg-destructive/90">
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  )
};

const filterConfig = {
    all: (orders: Order[]) => orders,
    processing: (orders: Order[]) => orders.filter(o => 
        ["Pending Confirmation", "Processing", "Packed", "Shipped", "Out for Delivery"].includes(o.status)
    ),
    delivered: (orders: Order[]) => orders.filter(o => o.status === "Delivered"),
    cancelled: (orders: Order[]) => orders.filter(o => ["Cancelled", "Rejected"].includes(o.status)),
};

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const fetchOrders = async (userId: string) => {
        setIsLoading(true);
        try {
            const fetchedOrders = await getMyOrders(userId);
            setOrders(fetchedOrders);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to fetch orders: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            fetchOrders(user.uid);
        }
    }, [user, authLoading, router]);
    

    const handleCancelOrder = async (orderId: string) => {
        try {
            await updateOrderStatus(orderId, 'Cancelled');
            toast({ title: 'Order Cancelled', description: 'Your order has been successfully cancelled.' });
            if (user) {
              fetchOrders(user.uid); // Refresh orders
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Cancellation Failed', description: error.message });
        }
    };
    
    const filteredOrders = useMemo(() => {
        const filterFn = filterConfig[activeTab as keyof typeof filterConfig] || filterConfig.all;
        return filterFn(orders);
    }, [orders, activeTab]);

    if (authLoading || (isLoading && orders.length === 0)) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Order Status & History</h1>
                <p className="mt-2 text-muted-foreground">View the status of your current orders and your order history.</p>
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-96 w-full" />
                    ))}
                </div>
            </div>
        )
    }
    
    const renderOrderGrid = (ordersToRender: Order[]) => {
      if (ordersToRender.length === 0) {
        return (
          <div className="py-16 text-center">
            <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Orders in this Category</h2>
            <p className="text-muted-foreground">You don't have any orders with this status.</p>
          </div>
        )
      }

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ordersToRender.map(order => (
                <OrderCard key={order.id} order={order} onCancel={handleCancelOrder} />
            ))}
        </div>
      );
    }


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Order Status & History</h1>
      <p className="mt-2 text-muted-foreground">View the status of your current orders and your order history.</p>
      
      {orders.length === 0 && !isLoading ? (
            <div className="py-16 text-center">
                <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No Orders Found</h2>
                <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
        ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
                <div className="sticky top-[80px] z-40 bg-background py-2">
                    <TabsList className="w-full flex-nowrap overflow-x-auto justify-start">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="processing">Processing</TabsTrigger>
                        <TabsTrigger value="delivered">Delivered</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                </div>
                <div className="mt-4">
                    {renderOrderGrid(filteredOrders)}
                </div>
            </Tabs>
        )}
    </div>
  );
}

    