
"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import BannerCard from '@/components/banner-card';
import WelcomeCard from '@/components/welcome-card';
import CategoryLinkCard from '@/components/category-link-card';
import { categories, products } from '@/lib/data';
import imageData from '@/lib/placeholder-images.json';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import PostCarousel from "@/components/post-carousel";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";


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

  const productsByCategory = {
    stationary: products.filter(p => p.category === 'stationary'),
    books: products.filter(p => p.category === 'books'),
    electronics: products.filter(p => p.category === 'electronics'),
  }

  const categoryDisplayInfo = {
      stationary: { title: "Featured Stationary", href: "/stationary" },
      books: { title: "Latest Books", href: "/books" },
      electronics: { title: "Top Electronic Kits", href: "/electronics" },
  }

  return (
    <div className="flex flex-col">
       <WelcomeCard />
       
       <div className="container mx-auto px-4 py-8">
        <h2 className="text-center font-headline text-2xl font-bold tracking-tight sm:text-3xl mb-6">OUR SERVICES</h2>
        <div className="flex w-full gap-2 md:gap-4">
            {categories.map((category, index) => (
                <CategoryLinkCard key={category.id} category={category} index={index} />
            ))}
        </div>
       </div>

       {Object.entries(productsByCategory).map(([category, productList]) => {
          const catInfo = categoryDisplayInfo[category as keyof typeof categoryDisplayInfo];
          if (!productList.length || !catInfo) return null;

          return (
            <div key={category} className="container mx-auto px-4 py-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">{catInfo.title}</h2>
                <Button asChild variant="outline">
                  <Link href={catInfo.href}>
                    <span>View All</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
                {productList.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          );
       })}


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

      <PostCarousel />
    </div>
  );
}
