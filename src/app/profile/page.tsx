import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockUser = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  initials: "JD",
  avatarUrl: "https://picsum.photos/seed/user/100/100"
};

const mockOrders = [
  {
    id: "ORD-001",
    date: "2023-10-26",
    status: "Delivered",
    total: 89.99,
  },
  {
    id: "ORD-002",
    date: "2023-11-15",
    status: "Processing",
    total: 35.0,
  },
  {
    id: "ORD-003",
    date: "2023-11-20",
    status: "Shipped",
    total: 124.50,
  },
  {
    id: "ORD-004",
    date: "2023-09-01",
    status: "Delivered",
    total: 18.00,
  },
];

const statusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
  Delivered: "default",
  Processing: "secondary",
  Shipped: "outline",
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">My Profile</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
                <AvatarFallback>{mockUser.initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline pt-4">{mockUser.name}</CardTitle>
              <CardDescription>{mockUser.email}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order History</CardTitle>
              <CardDescription>
                Here is a list of your recent orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status] || "default"}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${order.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
