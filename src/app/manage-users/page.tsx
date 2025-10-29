
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getAllUsers } from "@/lib/users";
import type { UserProfile } from "@/lib/types";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      const fetchUsers = async () => {
        setLoading(true);
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        setLoading(false);
      };
      fetchUsers();
    }
  }, [user]);

  const renderUserTable = (role: UserProfile["role"]) => {
    const filteredUsers = users.filter((u) => u.role === role);

    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }
    
    if (filteredUsers.length === 0) {
      return <p>No users found with this role.</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((u) => (
            <TableRow key={u.uid}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Manage Users
        </h1>
        <p className="mt-4 text-muted-foreground">
          Loading...
        </p>
      </div>
    );
  }


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
                Manage all registered users with the 'user' role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable("user")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seller">
          <Card>
            <CardHeader>
              <CardTitle>Sellers</CardTitle>
              <CardDescription>
                Manage all registered users with the 'seller' role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable("seller")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Personnel</CardTitle>
              <CardDescription>
                 Manage all registered users with the 'delivery' role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable("delivery")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
              <CardDescription>
                 Manage all registered users with the 'admin' role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable("admin")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
