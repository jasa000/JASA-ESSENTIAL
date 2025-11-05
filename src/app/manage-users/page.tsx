

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getAllUsers, updateUserRoles } from "@/lib/users";
import { type UserProfile, type UserRole, USER_ROLES } from "@/lib/types";

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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const SECRET_CODE = "JASA01012000";

export default function ManageUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoles, setNewRoles] = useState<UserRole[]>([]);
  const [secretCode, setSecretCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("admin")) {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.roles.includes("admin")) {
      fetchUsers();
    }
  }, [user]);

  const handleOpenDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRoles(user.roles || ['user']);
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
    
    if (!selectedUser) return;
    if (newRoles.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "A user must have at least one role.",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserRoles(selectedUser.uid, newRoles);
      toast({
        title: "Roles Updated",
        description: `${selectedUser.name}'s roles have been updated.`,
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


  const renderUserTable = (role: UserRole) => {
    const filteredUsers = users.filter((u) => u.roles?.includes(role));

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
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(u)} disabled={u.uid === user?.uid}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  if (authLoading || !user?.roles.includes('admin')) {
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
            <DialogTitle>Edit Roles for {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Select roles and enter the secret code to confirm the change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Roles</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {USER_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={newRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        const updatedRoles = checked
                          ? [...newRoles, role]
                          : newRoles.filter((r) => r !== role);
                        setNewRoles(updatedRoles);
                      }}
                    />
                    <Label htmlFor={`role-${role}`} className="font-normal capitalize">{role}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-code">
                Secret Code
              </Label>
              <Input
                id="secret-code"
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
