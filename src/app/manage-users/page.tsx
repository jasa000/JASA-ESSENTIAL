
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getAllUsers, updateUserRole } from "@/lib/users";
import type { UserProfile } from "@/lib/types";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

const SECRET_CODE = "JASA01012000";

export default function ManageUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserProfile['role']>('user');
  const [secretCode, setSecretCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);
  
  const fetchUsers = async () => {
    setLoading(true);
    const allUsers = await getAllUsers();
    setUsers(allUsers);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  const handleOpenDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setSecretCode('');
    setIsUpdating(false);
  };

  const handleRoleChange = async () => {
    if (secretCode !== SECRET_CODE) {
      toast({
        variant: "destructive",
        title: "Invalid Secret Code",
        description: "The secret code you entered is incorrect.",
      });
      return;
    }
    
    if (!selectedUser || !newRole) return;

    setIsUpdating(true);
    try {
      await updateUserRole(selectedUser.uid, newRole);
      toast({
        title: "Role Updated",
        description: `${selectedUser.name}'s role has been updated to ${newRole}.`,
      });
      fetchUsers(); // Re-fetch users to show the change
      handleCloseDialog();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };


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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((u) => (
            <TableRow key={u.uid}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(u)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
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
    <>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role for {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Select a new role and enter the secret code to confirm the change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-select" className="text-right">
                Role
              </Label>
              <Select
                value={newRole}
                onValueChange={(value: UserProfile['role']) => setNewRole(value)}
              >
                <SelectTrigger id="role-select" className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secret-code" className="text-right">
                Secret Code
              </Label>
              <Input
                id="secret-code"
                type="password"
                className="col-span-3"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleRoleChange} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
