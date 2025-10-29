
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-8 h-12 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account settings and preferences.
      </p>

      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Profile</CardTitle>
            <CardDescription>Manage your public profile and personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your profile is where you can update your name, contact details, and addresses.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
                <Link href="/profile">Edit Profile</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Account</CardTitle>
            <CardDescription>Manage settings related to your account security and data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">Set a new password for your account.</p>
                </div>
                <Button variant="outline">Change</Button>
            </div>
             <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                <div>
                    <h3 className="font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                </div>
                <Button variant="destructive">Delete</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Notifications</CardTitle>
            <CardDescription>Manage how you receive notifications from us.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates about your orders and special offers.</p>
                </div>
                <Switch id="email-notifications" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
