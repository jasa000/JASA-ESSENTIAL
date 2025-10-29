
"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import BannerCard from '@/components/banner-card';
import WelcomeCard from '@/components/welcome-card';
import CategoryLinkCard from '@/components/category-link-card';
import { categories } from '@/lib/data';
import imageData from '@/lib/placeholder-images.json';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import PostCarousel from "@/components/post-carousel";


export default function Home() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const banners = [
    { id: 'banner-stationary', href: '/stationary', title: 'Level Up Your Workspace', cta: 'Shop Stationary' },
    { id: 'banner-books', href: '/books', title: 'Explore New Worlds', cta: 'Browse Books' },
    { id: 'banner-xerox', href: '/xerox', title: 'High-Quality Printing', cta: 'Print Now' },
    { id: 'banner-electronics', href: '/electronics', title: 'Build Your Next Project', cta: 'Explore Kits' }
  ];

  return (
    <div className="flex flex-col">
       <WelcomeCard />
       
       <div className="container mx-auto px-4 py-8">
        <div className="flex w-full gap-2 md:gap-4">
            {categories.map((category, index) => (
                <CategoryLinkCard key={category.id} category={category} index={index} />
            ))}
        </div>
       </div>

       <PostCarousel />

       <div className="container mx-auto px-4 py-8">
         <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {banners.map((banner) => {
               const image = imageData.placeholderImages.find(img => img.id === banner.id);
               if (!image) return null;
              return (
                <CarouselItem key={banner.id}>
                  <BannerCard
                    href={banner.href}
                    title={banner.title}
                    cta={banner.cta}
                    imageSrc={image.imageUrl}
                    imageAlt={image.description}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
