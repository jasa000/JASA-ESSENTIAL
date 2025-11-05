
"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCog } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const SECRET_CODE = "JASA01012000";

export default function ManageUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
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

  const handleSearch = () => {
    if (!searchQuery) {
        setSearchedUser(null);
        return;
    }
    const foundUser = users.find(u => u.email.toLowerCase() === searchQuery.toLowerCase());
    if (foundUser) {
        setSearchedUser(foundUser);
        setNewRoles(foundUser.roles || ['user']);
    } else {
        setSearchedUser(null);
        toast({
            variant: "destructive",
            title: "User Not Found",
            description: "No user found with that email address.",
        });
    }
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
    
    if (!searchedUser) return;

    setIsUpdating(true);
    try {
      await updateUserRoles(searchedUser.uid, newRoles);
      toast({
        title: "Roles Updated",
        description: `${searchedUser.name}'s roles have been updated.`,
      });
      fetchUsers(); // Re-fetch users to show the change
      setSecretCode('');
      setSearchedUser(null);
      setSearchQuery('');
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

        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCog /> Edit User Roles</CardTitle>
                <CardDescription>Search for a user by email to view and modify their roles.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input 
                        type="email"
                        placeholder="user@example.com"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4"/> Search</Button>
                </div>

                {searchedUser && (
                    <div className="mt-6 rounded-lg border p-6">
                        <h3 className="text-lg font-semibold">Editing: {searchedUser.name} ({searchedUser.email})</h3>
                        <div className="grid gap-4 py-4">
                            <div>
                                <Label className="font-medium">Roles</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                {USER_ROLES.map((role) => (
                                    <div key={role} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`role-${role}`}
                                        checked={newRoles.includes(role)}
                                        disabled={role === 'user' || searchedUser.uid === user.uid}
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
                                    Admin Secret Code
                                </Label>
                                <Input
                                    id="secret-code"
                                    type="password"
                                    value={secretCode}
                                    onChange={(e) => setSecretCode(e.target.value)}
                                    placeholder="Enter code to confirm changes"
                                />
                            </div>
                        </div>
                         <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setSearchedUser(null)}>
                            Cancel
                            </Button>
                            <Button onClick={handleRoleChange} disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

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
    </>
  );
}
