
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, PackageOpen, Info } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import OrderTracker from "@/components/order-tracker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const mockOrders: Order[] = [];

const statusConfig = {
  Processing: { icon: Package, color: "bg-yellow-500", label: "Processing" },
  Shipped: { icon: Truck, color: "bg-blue-500", label: "Shipped" },
  Delivered: { icon: CheckCircle, color: "bg-green-500", label: "Delivered" },
  Cancelled: { icon: PackageOpen, color: "bg-red-500", label: "Cancelled" },
};

const OrderCard = ({ order }: { order: Order }) => {
  const StatusIcon = statusConfig[order.status].icon;
  
  // Manual date formatting to avoid hydration errors
  const [year, month, day] = order.date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/50 p-4">
        <div>
          <CardTitle className="font-headline text-lg">Order #{order.id}</CardTitle>
          <CardDescription>Date: {formattedDate}</CardDescription>
        </div>
        <Badge variant={order.status === 'Cancelled' ? 'destructive' : 'default'} className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            {order.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        {order.cancellationReason && (
            <Alert variant="destructive" className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Cancellation Reason</AlertTitle>
                <AlertDescription>
                    {order.cancellationReason}
                </AlertDescription>
            </Alert>
        )}
        <div className="space-y-2">
            <p className="text-sm font-medium">Sold by: <span className="font-normal text-muted-foreground">{order.seller}</span></p>
            {order.items.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                    <p>{item.name} <span className="text-muted-foreground">x{item.quantity}</span></p>
                    <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
            ))}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-bold">
            <p>Total</p>
            <p>₹{order.total.toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline" disabled={order.status === 'Cancelled'}>Track Order</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Track Order #{order.id}</DialogTitle>
              <DialogDescription>
                Current status of your shipment.
              </DialogDescription>
            </DialogHeader>
            <OrderTracker trackingInfo={order.tracking} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
};

const categories: { value: Order['category'], label: string }[] = [
    { value: 'stationary', label: 'Stationary' },
    { value: 'books', label: 'Books' },
    { value: 'electronics', label: 'Electronic Kit' },
    { value: 'xerox', label: 'Xerox' },
]

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState<Order['category']>('stationary');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Order Status & History</h1>
      <p className="mt-2 text-muted-foreground">View the status of your current orders and your order history.</p>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Order['category'])} className="mt-8">
        <div className="sticky top-20 z-10 bg-background py-4">
            <TabsList className="grid w-full grid-cols-4">
                 {categories.map((cat) => (
                    <TabsTrigger 
                        key={cat.value} 
                        value={cat.value}
                    >
                        {cat.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
        
        {categories.map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-8">
                {(() => {
                    const filteredOrders = mockOrders.filter(order => order.category === cat.value);
                    if (filteredOrders.length > 0) {
                        return (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {filteredOrders.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        );
                    } else {
                        return (
                            <div className="py-16 text-center">
                                <PackageOpen className="mx-auto h-24 w-24 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">No Orders Found</h2>
                                <p className="text-muted-foreground">You have no orders in this category yet.</p>
                            </div>
                        );
                    }
                })()}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
