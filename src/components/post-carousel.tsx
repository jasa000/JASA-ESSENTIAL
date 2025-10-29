
"use client";

import { useState, useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { getPosts } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { MessageSquareQuote } from "lucide-react";

export default function PostCarousel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const allPosts = await getPosts();
        const activePosts = allPosts.filter(post => post.isActive);
        setPosts(activePosts);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      }
    };
    fetchPosts();
  }, []);

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden p-4 sm:p-6 lg:p-8">
       <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-teal-100 to-sky-100 dark:from-sky-900/50 dark:via-teal-900/50 dark:to-sky-900/50"></div>
       <div className="relative rounded-xl p-0.5 bg-gradient-to-br from-teal-400 via-sky-500 to-teal-400 animate-border-glow">
        <Card className="relative z-10 w-full rounded-[10px] bg-background/80 backdrop-blur-sm dark:bg-background/60">
          <CardContent className="p-6">
            <Carousel
              plugins={[plugin.current]}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              opts={{
                loop: true,
              }}
            >
              <CarouselContent>
                {posts.map((post) => (
                  <CarouselItem key={post.id}>
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <MessageSquareQuote className="h-8 w-8 text-primary" />
                        <p className="mt-4 font-body text-lg italic tracking-tight md:text-xl">
                            &ldquo;{post.content}&rdquo;
                        </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
