
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getPincodeDistricts, updatePincodeDistrictStatus } from "@/lib/pincodes";
import type { PincodeDistrict } from "@/lib/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManagePincodesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [districts, setDistricts] = useState<PincodeDistrict[]>([]);
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
        fetchDistricts();
      }
    }
  }, [user, authLoading, router, toast]);

  const fetchDistricts = async () => {
    setIsLoading(true);
    try {
      const fetchedDistricts = await getPincodeDistricts();
      setDistricts(fetchedDistricts);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch pincode districts.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleActive = async (districtId: string, currentStatus: boolean) => {
    try {
      await updatePincodeDistrictStatus(districtId, !currentStatus);
      toast({
        title: "Status Updated",
        description: `District is now ${!currentStatus ? 'active' : 'inactive'}.`,
      });
      // Update local state for immediate feedback
      setDistricts(prev => 
        prev.map(d => d.id === districtId ? { ...d, isActive: !currentStatus } : d)
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };

  const renderDistrictCards = () => {
    if (isLoading) {
      return Array.from({ length: 9 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-12" />
            </div>
          </CardContent>
        </Card>
      ));
    }
    
    if (districts.length === 0) {
        return <p className="col-span-full text-center text-muted-foreground">No districts found. Please seed the database.</p>
    }

    return districts.map((district) => (
      <Card key={district.id}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {district.districtName}
          </CardTitle>
           <Badge variant={district.isActive ? "default" : "secondary"}>
            {district.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{district.pincodes.length} pincodes</p>
            <Switch
              checked={district.isActive}
              onCheckedChange={() => handleToggleActive(district.id, district.isActive)}
              aria-label={`Toggle ${district.districtName} status`}
            />
          </div>
        </CardContent>
      </Card>
    ));
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Manage Serviceable Pincodes
      </h1>
      <p className="mt-2 text-muted-foreground">
        Activate or deactivate districts to make them available for shop service areas.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {renderDistrictCards()}
      </div>
    </div>
  );
}
