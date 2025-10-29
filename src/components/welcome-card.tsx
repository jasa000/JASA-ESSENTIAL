
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export default function WelcomeCard() {
  const services = ["Xerox", "Books", "Electronic Kit", "Stationary Products"];

  return (
    <div className="relative w-full overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-teal-100 to-sky-100 dark:from-sky-900/50 dark:via-teal-900/50 dark:to-sky-900/50"></div>
      <Card className="relative z-10 w-full bg-background/80 backdrop-blur-sm dark:bg-background/60">
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl">Welcome to Jasa Essentials</CardTitle>
          <CardDescription className="text-base">Your one-stop destination for all creative and academic needs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {services.map((service) => (
              <Badge key={service} variant="secondary" className="flex items-center justify-center gap-2 rounded-full py-2 text-sm sm:text-base">
                <CheckCircle className="h-4 w-4 text-teal-500" />
                <span>{service}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
