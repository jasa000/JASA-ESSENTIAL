
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getNotificationsForUser, markNotificationAsRead } from "@/lib/data";
import type { Notification } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Info, Phone, Package, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const NotificationCard = ({ notification }: { notification: Notification }) => {
    
  const handleMarkAsRead = async () => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }
  };

  return (
    <Card 
      onClick={handleMarkAsRead}
      className={`transition-colors ${notification.isRead ? 'bg-muted/50' : 'bg-background'}`}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Package className="h-6 w-6" />
        </div>
        <div className="flex-grow">
          <CardTitle className="text-base font-semibold">{notification.title}</CardTitle>
          <CardDescription>{notification.message}</CardDescription>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="h-2.5 w-2.5 rounded-full bg-primary" title="Unread"></div>
        )}
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/orders">View Order</Link>
        </Button>
        {notification.sellerMobileNumbers && notification.sellerMobileNumbers.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button>
                <Phone className="mr-2 h-4 w-4" /> Contact Seller
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <p className="font-semibold">Seller Contact Numbers</p>
                <Separator />
                {notification.sellerMobileNumbers.map((number, index) => (
                  <p key={index} className="text-sm">{number}</p>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </CardFooter>
    </Card>
  );
};


export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      const fetchNotifications = async () => {
        setIsLoading(true);
        try {
          const fetchedNotifications = await getNotificationsForUser(user.uid);
          setNotifications(fetchedNotifications);
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to load notifications." });
        } finally {
          setIsLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [user, authLoading, router, toast]);

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Notifications</h1>
        <p className="mt-2 text-muted-foreground">Checking for new updates...</p>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Notifications</h1>
        <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <Badge>{notifications.filter(n => !n.isRead).length} New</Badge>
        </div>
      </div>
      <p className="mt-2 text-muted-foreground">Here are your latest updates.</p>

      <div className="mt-8">
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground" />
            <CardTitle className="mt-4">Your inbox is empty</CardTitle>
            <CardDescription className="mt-2">
              You have no new notifications. Order updates will appear here.
            </CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}
