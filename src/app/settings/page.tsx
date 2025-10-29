
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find user email.",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Password Reset Email Sent",
        description:
          "Check your inbox (and spam folder) for a link to reset your password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message,
      });
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.email) {
      toast({
        variant: "destructive",
        title: "Incorrect Email",
        description: "The email you entered does not match your account's email.",
      });
      return;
    }
    
    setIsDeleting(true);
    
    if(!auth.currentUser) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "No user is currently signed in.",
      });
      setIsDeleting(false);
      return;
    }

    try {
      await deleteUser(auth.currentUser);
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Account Deletion Failed",
        description: "This is a sensitive operation that requires recent login. Please log out and log back in before trying again. Full error: " + error.message,
        duration: 9000
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Settings
      </h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account settings and preferences.
      </p>

      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Profile</CardTitle>
            <CardDescription>
              Manage your public profile and personal information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your profile is where you can update your name, contact details,
              and addresses.
            </p>
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
            <CardDescription>
              Manage settings related to your account security and data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Change Password</h3>
                <p className="text-sm text-muted-foreground">
                  Set a new password for your account via a secure link sent to
                  your email.
                </p>
              </div>
              <Button variant="outline" onClick={handleChangePassword}>
                Send Link
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
              <div>
                <h3 className="font-medium text-destructive">
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers. Please type
                      <strong className="px-1">{user.email}</strong> to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    type="email"
                    placeholder="Enter your email to confirm"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteInput !== user.email || isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
