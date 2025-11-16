
"use client";

import { useEffect, useState } from "react";
import { getXeroxServices } from "@/lib/data";
import type { XeroxService } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function XeroxPage() {
  const [services, setServices] = useState<XeroxService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const fetchedServices = await getXeroxServices();
        setServices(fetchedServices);
      } catch (err) {
        setError("Failed to load printing services. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div>
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
          Xerox & Printing Services
        </h1>
        <p className="mt-4 text-muted-foreground">
          High-quality photocopying and printing at competitive prices.
        </p>
      </div>

      <div className="w-full bg-muted">
        <Card className="container mx-auto mt-0 rounded-none border-x-0 border-y shadow-none">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between text-center">
                <CardTitle>Price List</CardTitle>
                <ChevronDown
                  className={cn(
                    "h-6 w-6 transform transition-transform duration-200",
                    isOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="py-2">
                {error ? (
                  <p className="text-center text-destructive">{error}</p>
                ) : (
                  <Table>
                    <TableBody>
                      {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Skeleton className="h-6 w-48" />
                              </TableCell>
                              <TableCell className="text-right">
                                <Skeleton className="h-6 w-24 ml-auto" />
                              </TableCell>
                            </TableRow>
                          ))
                        : services.map((service) => {
                            const hasDiscount =
                              service.discountPrice != null &&
                              service.discountPrice < service.price;
                            const discountPercent = hasDiscount
                              ? Math.round(
                                  ((service.price - service.discountPrice!) /
                                    service.price) *
                                    100
                                )
                              : 0;

                            return (
                              <TableRow key={service.id}>
                                <TableCell className="font-medium">
                                  {service.name}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-4">
                                    {hasDiscount ? (
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs text-muted-foreground line-through">
                                            Rs {service.price.toFixed(2)}
                                          </span>
                                          <span className="text-xl font-bold">
                                            Rs{" "}
                                            {service.discountPrice?.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-lg font-bold">
                                        Rs {service.price.toFixed(2)}
                                      </span>
                                    )}
                                    <div className="flex flex-col items-center gap-1">
                                      {hasDiscount && (
                                        <Badge
                                          variant="destructive"
                                          className="h-fit"
                                        >
                                          {discountPercent}% OFF
                                        </Badge>
                                      )}
                                      {service.unit && (
                                        <span className="text-sm text-muted-foreground">
                                          {service.unit}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                    </TableBody>
                  </Table>
                )}
                {!isLoading && services.length === 0 && !error && (
                  <p className="py-8 text-center text-muted-foreground">
                    No printing services are available at the moment. Please
                    check back later.
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  );
}
