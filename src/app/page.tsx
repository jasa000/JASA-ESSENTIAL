
"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import BannerCard from '@/components/banner-card';
import WelcomeCard from '@/components/welcome-card';
import CategoryLinkCard from '@/components/category-link-card';
import { categories, products } from '@/lib/data';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import PostCarousel from "@/components/post-carousel";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";


export default function Home() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const banners = [
    { id: 'banner-stationary', href: '/stationary', title: 'Level Up Your Workspace', cta: 'Shop Stationary', imageName: 'stationary.png', alt: 'A modern, well-organized desk with stationary supplies.' },
    { id: 'banner-books', href: '/books', title: 'Explore New Worlds', cta: 'Browse Books', imageName: 'books.png', alt: 'A cozy library aisle with shelves full of books.' },
    { id: 'banner-xerox', href: '/xerox', title: 'High-Quality Printing', cta: 'Print Now', imageName: 'xerox.png', alt: 'Close-up of a modern printer in a bright office.' },
    { id: 'banner-electronics', href: '/electronics', title: 'Build Your Next Project', cta: 'Explore Kits', imageName: 'electronics.png', alt: 'A person soldering an electronics circuit board.' }
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
       <div className="w-full py-8">
         <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            <CarouselItem>
                <WelcomeCard />
            </CarouselItem>
            {banners.map((banner) => {
              return (
                <CarouselItem key={banner.id}>
                  <BannerCard
                    href={banner.href}
                    title={banner.title}
                    cta={banner.cta}
                    imageSrc={`/images/banner/${banner.imageName}`}
                    imageAlt={banner.alt}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4" />
          <CarouselNext className="absolute right-4" />
        </Carousel>
      </div>
       
       <div className="container mx-auto px-4">
         <div className="py-8">
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
              <div key={category} className="py-8">
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

        <div className="py-8">
          <PostCarousel />
        </div>
       </div>
    </div>
  );
}
