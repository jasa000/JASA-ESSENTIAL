

"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getMyOrders, updateOrderStatus, requestReturn } from "@/lib/data";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Info, Clock, AlertTriangle, XCircle, ShoppingCart, Phone, ChevronDown, FileText, Undo2, Repeat } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription as AlertDesc } from "@/components/ui/alert";
import OrderTracker from "@/components/order-tracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { addDays, differenceInMilliseconds, formatDistanceStrict } from 'date-fns';


const statusConfig: { [key in Order['status']]: { icon: React.ElementType, label: string, descriptiveLabel: string } } = {
  "Pending Confirmation": { icon: Clock, label: "Pending", descriptiveLabel: "Waiting for confirmation" },
  "Processing": { icon: Package, label: "Processing", descriptiveLabel: "Processing" },
  "Packed": { icon: Package, label: "Packed", descriptiveLabel: "Packed or Printed" },
  "Shipped": { icon: Truck, label: "Shipped", descriptiveLabel: "Shipping" },
  "Out for Delivery": { icon: Truck, label: "Out for Delivery", descriptiveLabel: "Out for Delivery" },
  "Delivered": { icon: CheckCircle, label: "Delivered", descriptiveLabel: "Delivered" },
  "Cancelled": { icon: XCircle, label: "Cancelled", descriptiveLabel: "Cancelled by You" },
  "Rejected": { icon: AlertTriangle, label: "Rejected", descriptiveLabel: "Rejected by Seller" },
  "Return Requested": { icon: Undo2, label: "Return Requested", descriptiveLabel: "Return Requested" },
  "Return Approved": { icon: CheckCircle, label: "Return Approved", descriptiveLabel: "Return Approved" },
  "Out for Pickup": { icon: Truck, label: "Out for Pickup", descriptiveLabel: "Out for Pickup" },
  "Picked Up": { icon: Package, label: "Picked Up", descriptiveLabel: "Picked Up" },
  "Return Rejected": { icon: XCircle, label: "Return Rejected", descriptiveLabel: "Return Rejected" },
  "Return Completed": { icon: CheckCircle, label: "Return Completed", descriptiveLabel: "Return Completed" },
  "Replacement Issued": { icon: Repeat, label: "Replacement Issued", descriptiveLabel: "Replacement Issued" },
};

const ReturnRequestDialog = ({ order, onReturnSubmit }: { order: Order, onReturnSubmit: (orderId: string, reason: string, returnType: 'refund' | 'replacement') => void }) => {
    const [reason, setReason] = useState("");
    const [returnType, setReturnType] = useState<'refund' | 'replacement'>('refund');
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleSubmit = () => {
        if (reason.trim().length < 10) {
            toast({ variant: 'destructive', title: 'Invalid Reason', description: 'Please provide a reason with at least 10 characters.' });
            return;
        }
        onReturnSubmit(order.id, reason, returnType);
        setIsOpen(false);
        setReason("");
        setReturnType("refund");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" variant="outline">Request Return/Replacement</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request for: {order.productName}</DialogTitle>
                    <AlertDesc>Please explain why you would like to return or replace this item.</AlertDesc>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label>Request Type</Label>
                        <RadioGroup value={returnType} onValueChange={(value: 'refund' | 'replacement') => setReturnType(value)} className="mt-2 flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="refund" id="refund" />
                                <Label htmlFor="refund">Return for Refund</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="replacement" id="replacement" />
                                <Label htmlFor="replacement">Request Replacement</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <Textarea
                        placeholder="e.g., Item was damaged, received wrong product, etc."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Submit Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const OrderCard = ({ order, onCancel, onReturnRequest }: { order: Order, onCancel: (orderId: string) => void, onReturnRequest: (orderId: string, reason: string, returnType: 'refund' | 'replacement') => void }) => {
  const { toast } = useToast();
  const StatusIcon = statusConfig[order.status]?.icon || Package;
  const descriptiveStatus = statusConfig[order.status]?.descriptiveLabel || order.status;
  const itemPrice = order.price || 0;
  const deliveryCharge = order.deliveryCharge || 0;
  const totalItemPrice = itemPrice + deliveryCharge;
  const itemQuantity = order.quantity || 1;
  const totalOrderPrice = totalItemPrice * itemQuantity;
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [returnTimeLeft, setReturnTimeLeft] = useState('');

  const returnDeadline = useMemo(() => {
    if (order.status === 'Delivered' && order.tracking?.delivered) {
      return addDays(new Date(order.tracking.delivered), 3);
    }
    return null;
  }, [order.status, order.tracking?.delivered]);

  const isReturnEligible = useMemo(() => {
    return order.status === 'Delivered' && order.category !== 'xerox' && returnDeadline && new Date() < returnDeadline;
  }, [order.status, order.category, returnDeadline]);
  
  useEffect(() => {
    if (!isReturnEligible || !returnDeadline) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = differenceInMilliseconds(returnDeadline, now);
      if (diff <= 0) {
        setReturnTimeLeft('');
        return;
      }
      setReturnTimeLeft(formatDistanceStrict(returnDeadline, now, { addSuffix: false }));
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(interval);

  }, [isReturnEligible, returnDeadline]);

  return (
    <>
    <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reason for Rejection</DialogTitle>
                <AlertDesc>
                    {order.rejectionReason}
                </AlertDesc>
            </DialogHeader>
        </DialogContent>
    </Dialog>
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 p-4">
          <CardDescription>Order ID: {order.id}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                {order.category === 'xerox' ? (
                    <FileText className="h-10 w-10 text-blue-500" />
                ) : order.productImage ? (
                    <Image src={order.productImage} alt={order.productName} fill className="object-cover" />
                ) : (
                    <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                )}
            </div>
            <div className="space-y-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <h3 className="font-headline text-lg font-semibold line-clamp-2">{order.productName}</h3>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{order.productName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={order.status === 'Rejected' || order.status === 'Cancelled' ? 'destructive' : 'default'} className="flex items-center gap-2 w-fit">
                        <StatusIcon className="h-4 w-4" />
                        {descriptiveStatus}
                    </Badge>
                     {order.status === 'Rejected' && order.rejectionReason && (
                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setIsReasonDialogOpen(true)}>
                            View Reason
                        </Button>
                    )}
                </div>
                
                <p className="text-sm pt-1"><span className="font-medium">Quantity:</span> {itemQuantity}</p>
                <p className="text-sm"><span className="font-medium">Price per item:</span> Rs {itemPrice.toFixed(2)}</p>
                {deliveryCharge > 0 && <p className="text-sm text-destructive"><span className="font-medium">Delivery Fee:</span> Rs {deliveryCharge.toFixed(2)} per item</p>}
                <p className="font-bold"><span className="font-medium">Total:</span> Rs {totalOrderPrice.toFixed(2)}</p>
            </div>
        </div>
        
        {isReturnEligible && returnTimeLeft && (
            <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Return & Replacement Window</AlertTitle>
                <AlertDesc>
                  This item is eligible for return/replacement for another <span className="font-bold">{returnTimeLeft}</span>.
                </AlertDesc>
            </Alert>
        )}

        <div className="mt-4 flex items-center justify-between">
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <Button variant="link" className="p-0 h-auto flex items-center gap-1 text-muted-foreground">
                        View Shipping & Contact Details
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                    <h4 className="font-medium">Shipping Address & Contact</h4>
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
                </CollapsibleContent>
            </Collapsible>

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">View Status</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Order Journey</DialogTitle>
                    </DialogHeader>
                    <OrderTracker trackingInfo={order.tracking} />
                </DialogContent>
            </Dialog>
        </div>
      </CardContent>
      {order.status === 'Pending Confirmation' && (
        <CardFooter className="bg-muted/50 p-4">
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
        </CardFooter>
      )}
      {isReturnEligible && (
         <CardFooter className="bg-muted/50 p-4">
            <ReturnRequestDialog order={order} onReturnSubmit={onReturnRequest} />
         </CardFooter>
      )}
    </Card>
    </>
  )
};

const statusFilterConfig = {
    all: (orders: Order[]) => orders,
    processing: (orders: Order[]) => orders.filter(o => 
        ["Pending Confirmation", "Processing", "Packed", "Shipped", "Out for Delivery"].includes(o.status)
    ),
    delivered: (orders: Order[]) => orders.filter(o => o.status === "Delivered"),
    cancelled: (orders: Order[]) => orders.filter(o => ["Cancelled", "Rejected", "Return Rejected"].includes(o.status)),
    returns: (orders: Order[]) => orders.filter(o => o.status.startsWith('Return') || o.status === 'Replacement Issued' || o.status === 'Picked Up'),
};

const categoryFilterOptions: { value: string, label: string }[] = [
    { value: 'all', label: 'All Items' },
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
    { value: 'xerox', label: 'Xerox' },
];

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusTab, setStatusTab] = useState('processing');
    const [categoryFilter, setCategoryFilter] = useState('all');

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
    
    const handleReturnRequest = async (orderId: string, reason: string, returnType: 'refund' | 'replacement') => {
        try {
            await requestReturn(orderId, reason, returnType);
            toast({ title: 'Request Submitted', description: 'Your request has been sent to the seller for review.' });
            if (user) {
                fetchOrders(user.uid); // Refresh orders
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Request Failed', description: error.message });
        }
    };

    const filteredOrders = useMemo(() => {
        const byCategory = categoryFilter === 'all' 
            ? orders 
            : orders.filter(o => o.category === categoryFilter);
        
        const statusFilterFn = statusFilterConfig[statusTab as keyof typeof statusFilterConfig] || statusFilterConfig.all;
        const byStatus = statusFilterFn(byCategory);

        const priorityStatuses = [
            "Return Requested", 
            "Return Approved", 
            "Out for Pickup",
            "Picked Up",
            "Replacement Issued"
        ];

        return [...byStatus].sort((a, b) => {
            const aIsPriority = priorityStatuses.includes(a.status);
            const bIsPriority = priorityStatuses.includes(b.status);

            if (aIsPriority && !bIsPriority) return -1; // a comes first
            if (!aIsPriority && bIsPriority) return 1;  // b comes first

            // If both are priority or neither are, sort by date
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
    }, [orders, statusTab, categoryFilter]);

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
                <OrderCard key={order.id} order={order} onCancel={handleCancelOrder} onReturnRequest={handleReturnRequest} />
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
            <div className="mt-8">
                <div className="sticky top-[80px] z-40 bg-background py-2 space-y-2">
                    <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                        <TabsList className="grid w-full grid-cols-5 h-auto flex-wrap">
                            {categoryFilterOptions.map(opt => (
                                <TabsTrigger key={opt.value} value={opt.value} className="text-xs sm:text-sm order-tabs-trigger">
                                    {opt.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                    <Tabs value={statusTab} onValueChange={setStatusTab}>
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="all" className="order-tabs-trigger">All</TabsTrigger>
                            <TabsTrigger value="processing" className="order-tabs-trigger">Processing</TabsTrigger>
                            <TabsTrigger value="delivered" className="order-tabs-trigger">Delivered</TabsTrigger>
                            <TabsTrigger value="returns" className="order-tabs-trigger">Returns</TabsTrigger>
                            <TabsTrigger value="cancelled" className="order-tabs-trigger">Cancelled</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="mt-4">
                    {renderOrderGrid(filteredOrders)}
                </div>
            </div>
        )}
    </div>
  );
}
