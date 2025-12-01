
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WelcomeCardProps = {
    imageUrl?: string;
}

export default function WelcomeCard({ imageUrl }: WelcomeCardProps) {
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
    <div className="relative w-full overflow-hidden">
      {!imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900"></div>
      )}
      <Card className={cn(
        "relative z-10 w-full h-64 md:h-80 lg:h-[23rem] flex flex-col justify-center rounded-2xl",
        imageUrl ? "bg-transparent" : "bg-transparent border-0"
      )}>
        {imageUrl && (
            <Image 
                src={imageUrl} 
                alt="Welcome background" 
                fill 
                className="object-cover rounded-2xl -z-10"
            />
        )}
         {/* Overlay for when image is present to ensure text readability */}
        {imageUrl && <div className="absolute inset-0 bg-black/30 rounded-2xl -z-10"></div>}
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl text-white drop-shadow-lg">
            <span className="inline-block h-[45px]">
              {typedText}
              <span className="animate-blink border-r-2 border-white"></span>
            </span>
          </CardTitle>
          <CardDescription className="text-base text-white/90 drop-shadow-md">Your one-stop destination for all creative and academic needs.</CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>
    </div>
  );
}
