
"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/hooks/use-location";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LocationSelector() {
  const { userLocation, setUserLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(userLocation?.name || "");
  const [pincode, setPincode] = useState(userLocation?.pincode || "");
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (userLocation) {
      setName(userLocation.name);
      setPincode(userLocation.pincode);
    } else {
      setName("");
      setPincode("");
    }
  }, [userLocation]);
  
  useEffect(() => {
    if (isClient && !userLocation) {
        const hasBeenPrompted = sessionStorage.getItem('locationPrompted');
        if (!hasBeenPrompted) {
            setIsOpen(true);
            sessionStorage.setItem('locationPrompted', 'true');
        }
    }
  }, [userLocation, isClient]);

  const handleSave = () => {
    if (name.trim() && pincode.trim()) {
      setUserLocation({ name: name.trim(), pincode: pincode.trim() });
      toast({
        title: "Location Set",
        description: `Your location has been set to ${name.trim()}, ${pincode.trim()}.`,
      });
      setIsOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter both an area name and a pincode.",
      });
    }
  };

  const displayLocation = userLocation
    ? `${userLocation.name}, ${userLocation.pincode}`
    : "Location Not Set";
  
  const displayTooltip = userLocation ? `Your current location: ${userLocation.name}` : "Set your delivery location";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="mt-2 flex h-8 items-center justify-between rounded-full bg-muted/50 px-3">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500" />
          <p className="truncate text-xs text-muted-foreground" title={displayTooltip}>
            <span className="font-semibold text-foreground">Location:</span> {displayLocation}
          </p>
        </div>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            {userLocation ? "Change" : "Set Location"}
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Set Your Delivery Location</DialogTitle>
        </DialogHeader>
        {isClient ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Area / City Name</Label>
              <Input
                id="location-name"
                placeholder="e.g., Anna Nagar, Chennai"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                placeholder="e.g., 600040"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Render a placeholder or skeleton loader on the server */}
            <div className="space-y-2">
              <Label htmlFor="location-name">Area / City Name</Label>
              <Input id="location-name" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" disabled />
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
