
"use client";

import { useState, useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { getXeroxServices } from "@/lib/data";
import type { XeroxService } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function XeroxTicker() {
  const [services, setServices] = useState<XeroxService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const fetchedServices = await getXeroxServices();
        setServices(fetchedServices);
      } catch (error) {
        console.error("Failed to fetch xerox services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <Card className="w-full overflow-hidden">
        <CardHeader>
            <CardTitle className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">Xerox & Printing Services</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Link href="/xerox" className="group">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex-grow overflow-hidden">
                <Carousel
                  plugins={[plugin.current]}
                  opts={{
                    axis: "y",
                    loop: true,
                    align: "start",
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-mt-4 h-16">
                    {services.map((service) => {
                       const hasDiscount = service.discountPrice != null && service.discountPrice < service.price;
                       const discountPercent = hasDiscount ? Math.round(((service.price - service.discountPrice!) / service.price) * 100) : 0;
                      return (
                        <CarouselItem key={service.id} className="pt-4 basis-full">
                          <div className="flex items-center gap-4 text-sm md:text-base">
                            <span className="font-medium truncate">{service.name}</span>
                            {hasDiscount ? (
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-primary">Rs {service.discountPrice?.toFixed(2)}</span>
                                    <span className="text-xs text-muted-foreground line-through">Rs {service.price.toFixed(2)}</span>
                                    <Badge variant="destructive">{discountPercent}% OFF</Badge>
                                </div>
                            ) : (
                               <span className="font-bold text-primary">Rs {service.price.toFixed(2)}</span>
                            )}
                            {service.unit && <span className="text-muted-foreground hidden sm:inline">/ {service.unit}</span>}
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                </Carousel>
              </div>
              <div className="flex items-center gap-2 pl-4 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </CardContent>
    </Card>
  );
}
