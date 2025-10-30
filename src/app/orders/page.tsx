
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, PackageOpen } from "lucide-react";
import type { Product } from "@/lib/types";

type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  category: "stationary" | "books" | "electronics" | "xerox";
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  seller: string;
};

const mockOrders: Order[] = [
  {
    id: "ORD-STN-001",
    date: "2023-10-26",
    status: "Delivered",
    category: "stationary",
    items: [
      { name: "Bril ink Bottle", quantity: 2, price: 20 },
      { name: "Kangaroo Stapler", quantity: 1, price: 60 },
    ],
    total: 105.00, // including 5 shipping
    seller: "Jasa Books & Stationary"
  },
  {
    id: "ORD-BK-001",
    date: "2023-10-28",
    status: "Shipped",
    category: "books",
    items: [{ name: "The Alchemist", quantity: 1, price: 250 }],
    total: 255.00,
    seller: "Readers Corner"
  },
  {
    id: "ORD-ELEC-001",
    date: "2023-10-29",
    status: "Processing",
    category: "electronics",
    items: [{ name: "CX-Scientific calculator", quantity: 1, price: 600 }],
    total: 605.00,
    seller: "Gadget Galaxy"
  },
   {
    id: "ORD-STN-002",
    date: "2023-11-02",
    status: "Processing",
    category: "stationary",
    items: [{ name: "XO-BALL P", quantity: 10, price: 10 }],
    total: 105.00,
    seller: "Jasa Books & Stationary"
  },
];

const statusConfig = {
  Processing: { icon: Package, color: "bg-yellow-500", label: "Processing" },
  Shipped: { icon: Truck, color: "bg-blue-500", label: "Shipped" },
  Delivered: { icon: CheckCircle, color: "bg-green-500", label: "Delivered" },
  Cancelled: { icon: PackageOpen, color: "bg-red-500", label: "Cancelled" },
};

const OrderCard = ({ order }: { order: Order }) => {
  const StatusIcon = statusConfig[order.status].icon;
  const [day, month, year] = order.date.split('-').reverse();
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
          <Button className="w-full" variant="outline">Track Order</Button>
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
