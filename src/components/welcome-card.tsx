
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function WelcomeCard() {
  const [typedText, setTypedText] = useState("");
  const fullText = "Welcome to Jasa Essentials";

  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;

    const type = () => {
      if (isDeleting) {
        setTypedText(fullText.substring(0, currentIndex - 1));
        currentIndex--;
        if (currentIndex === 0) {
          isDeleting = false;
        }
      } else {
        setTypedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        if (currentIndex === fullText.length) {
          setTimeout(() => {
            isDeleting = true;
          }, 2000); // Pause before deleting
        }
      }
    };

    const typingInterval = setInterval(type, isDeleting ? 100 : 150);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-teal-100 to-sky-100 dark:from-sky-900/50 dark:via-teal-900/50 dark:to-sky-900/50"></div>
      <Card className="relative z-10 w-full bg-background/80 backdrop-blur-sm dark:bg-background/60">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl">
            <span className="inline-block h-[45px]">
              {typedText}
              <span className="animate-blink border-r-2 border-foreground"></span>
            </span>
          </CardTitle>
          <CardDescription className="text-base">Your one-stop destination for all creative and academic needs.</CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>
    </div>
  );
}
