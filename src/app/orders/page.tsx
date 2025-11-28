
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getMyOrders, updateOrderStatus } from "@/lib/data";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, PackageOpen, Info, Clock, AlertTriangle, XCircle, ShoppingCart } from "lucide-react";
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

const statusConfig = {
  "Pending Confirmation": { icon: Clock, color: "bg-yellow-500", label: "Pending" },
  "Processing": { icon: Package, color: "bg-blue-500", label: "Processing" },
  "Shipped": { icon: Truck, color: "bg-blue-500", label: "Shipped" },
  "Delivered": { icon: CheckCircle, color: "bg-green-500", label: "Delivered" },
  "Cancelled": { icon: XCircle, color: "bg-gray-500", label: "Cancelled" },
  "Rejected": { icon: AlertTriangle, color: "bg-red-500", label: "Rejected" },
};

const OrderCard = ({ order, onCancel }: { order: Order, onCancel: (orderId: string) => void }) => {
  const { toast } = useToast();
  const StatusIcon = statusConfig[order.status]?.icon || Package;

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
                <AlertDescription>
                    {order.rejectionReason}
                </AlertDescription>
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
                <p><span className="font-medium">Quantity:</span> {order.quantity}</p>
                <p><span className="font-medium">Price per item:</span> Rs {order.price.toFixed(2)}</p>
                <p className="font-bold"><span className="font-medium">Total:</span> Rs {(order.price * order.quantity).toFixed(2)}</p>
            </div>
        </div>
        <Separator className="my-4" />
        <div>
            <h4 className="font-medium mb-2">Shipping Address</h4>
            <div className="text-sm text-muted-foreground">
                <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
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

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            fetchOrders(user.uid);
        }
    }, [user, authLoading, router]);
    
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

    const handleCancelOrder = async (orderId: string) => {
        try {
            await updateOrderStatus(orderId, 'Cancelled');
            toast({ title: 'Order Cancelled', description: 'Your order has been successfully cancelled.' });
            fetchOrders(user!.uid); // Refresh orders
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Cancellation Failed', description: error.message });
        }
    };

    if (authLoading || isLoading) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Order Status & History</h1>
      <p className="mt-2 text-muted-foreground">View the status of your current orders and your order history.</p>
      
      <div className="mt-8">
        {orders.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} onCancel={handleCancelOrder} />
                ))}
            </div>
        ) : (
             <div className="py-16 text-center">
                <PackageOpen className="mx-auto h-24 w-24 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No Orders Found</h2>
                <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
