
"use client";

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManageXeroxFormPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("admin"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Manage Xerox Order Form
      </h1>
      <p className="mt-2 text-muted-foreground">
        Configure the options and pricing for the user-facing Xerox order form.
      </p>
      {/* Configuration UI will be built here */}
    </div>
  );
}
