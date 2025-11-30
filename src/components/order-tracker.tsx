
"use client";

import { cn } from "@/lib/utils";
import { Package, ShieldCheck, Truck, Home } from "lucide-react";
import type { Order } from "@/lib/types";

type OrderTrackerProps = {
  trackingInfo: Order['tracking'];
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function OrderTracker({ trackingInfo }: OrderTrackerProps) {
  if (!trackingInfo) return null;

  const steps = [
    { id: "ordered", label: "Confirmed", icon: ShieldCheck, date: trackingInfo.confirmed },
    { id: "packed", label: "Packed", icon: Package, date: trackingInfo.packed },
    { id: "shipped", label: "Shipped", icon: Truck, date: trackingInfo.shipped },
    { id: "delivered", label: "Delivered", icon: Home, date: trackingInfo.delivered },
  ];

  let activeStepIndex = steps.findIndex(step => !step.date) -1;
  if (activeStepIndex < 0 && steps.every(s => s.date)) {
      activeStepIndex = steps.length - 1;
  }
  

  return (
    <div className="py-4 px-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold">Order Journey</h3>
        {trackingInfo.expectedDelivery && !trackingInfo.delivered && (
            <p className="text-sm text-muted-foreground">
                Expected by: <span className="font-medium text-foreground">{formatDate(trackingInfo.expectedDelivery)}</span>
            </p>
        )}
      </div>

      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-muted"></div>
        <div 
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-primary transition-all duration-500"
          style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index <= activeStepIndex;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background text-muted-foreground"
                )}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <p className={cn("mt-2 text-center text-xs font-semibold", isCompleted ? "text-primary" : "text-muted-foreground")}>
                {step.label}
              </p>
               {step.date ? (
                    <div className="text-center text-xs text-muted-foreground">
                        <p>{formatDate(step.date)}</p>
                        <p>{formatTime(step.date)}</p>
                    </div>
                ) : (
                   <div className="text-center text-xs text-muted-foreground h-8"></div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
