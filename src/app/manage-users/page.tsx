import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ManageUsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Manage Users
      </h1>
      <p className="mt-4 text-muted-foreground">
        Admin tools for managing user accounts.
      </p>
      <Tabs defaultValue="user" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="seller">Seller</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage all registered users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>User management interface goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seller">
          <Card>
            <CardHeader>
              <CardTitle>Sellers</CardTitle>
              <CardDescription>
                Manage all registered sellers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Seller management interface goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Personnel</CardTitle>
              <CardDescription>
                Manage all delivery personnel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Delivery personnel management interface goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
              <CardDescription>
                Manage all administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Admin management interface goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}