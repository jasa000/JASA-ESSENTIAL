
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getAllUsers } from "@/lib/users";
import { getProducts } from "@/lib/data";
import { getShops } from "@/lib/shops";
import type { UserProfile, Product, Shop, UserRole } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Package, Store, BarChart2, LineChart as LineChartIcon } from "lucide-react";
import { subDays, format } from 'date-fns';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = useState({ users: 0, products: 0, shops: 0 });
  const [userRoleData, setUserRoleData] = useState<any[]>([]);
  const [userSignupData, setUserSignupData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("admin")) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page.",
        });
        router.push("/");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, allProducts, allShops] = await Promise.all([
        getAllUsers(),
        getProducts(),
        getShops(),
      ]);

      // Set basic stats
      setStats({
        users: allUsers.length,
        products: allProducts.length,
        shops: allShops.length,
      });

      // Process user role data
      const rolesCount = allUsers.reduce((acc, u) => {
        u.roles.forEach(role => {
          acc[role] = (acc[role] || 0) + 1;
        });
        return acc;
      }, {} as Record<UserRole, number>);
      
      setUserRoleData(Object.entries(rolesCount).map(([name, value]) => ({ name, users: value })));
      
      // Process user signup data for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
      const signupCounts = last7Days.map(day => ({
        date: format(day, 'MMM dd'),
        signups: 0,
      }));

      allUsers.forEach(u => {
        if (u.createdAt?.seconds) {
            const signupDate = new Date(u.createdAt.seconds * 1000);
            const dayStr = format(signupDate, 'MMM dd');
            const dayData = signupCounts.find(d => d.date === dayStr);
            if (dayData) {
                dayData.signups++;
            }
        }
      });
      setUserSignupData(signupCounts);


    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch dashboard data: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: number, icon: React.ElementType, loading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Admin Dashboard
      </h1>
      <p className="mt-2 text-muted-foreground">
        An overview of your application's activity and data.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard title="Total Users" value={stats.users} icon={Users} loading={isLoading} />
        <StatCard title="Total Products" value={stats.products} icon={Package} loading={isLoading} />
        <StatCard title="Total Shops" value={stats.shops} icon={Store} loading={isLoading} />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart2 /> User Roles Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userRoleData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="users" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <LineChartIcon /> Recent Sign-ups (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userSignupData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="signups" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dummy useToast hook for type-safety since it's used in useEffect but we handle error manually here.
const useToast = () => ({ toast: console.log });
