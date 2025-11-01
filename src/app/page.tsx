
"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import BannerCard from '@/components/banner-card';
import WelcomeCard from '@/components/welcome-card';
import CategoryLinkCard from '@/components/category-link-card';
import { categories, getProducts } from '@/lib/data';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import PostCarousel from "@/components/post-carousel";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


export default function Home() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const [productsByCategory, setProductsByCategory] = React.useState<{ [key in Product['category']]?: Product[] }>({});
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const [stationary, books, electronics] = await Promise.all([
          getProducts('stationary'),
          getProducts('books'),
          getProducts('electronics'),
        ]);
        setProductsByCategory({ stationary, books, electronics });
      } catch (error) {
        console.error("Failed to fetch products for home page:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const banners = [
    { id: 'banner-stationary', href: '/stationary', title: 'Level Up Your Workspace', cta: 'Shop Stationary', imageName: 'stationary.png', alt: 'A modern, well-organized desk with stationary supplies.' },
    { id: 'banner-books', href: '/books', title: 'Explore New Worlds', cta: 'Browse Books', imageName: 'books.png', alt: 'A cozy library aisle with shelves full of books.' },
    { id: 'banner-xerox', href: '/xerox', title: 'High-Quality Printing', cta: 'Print Now', imageName: 'xerox.png', alt: 'Close-up of a modern printer in a bright office.' },
    { id: 'banner-electronics', href: '/electronics', title: 'Build Your Next Project', cta: 'Explore Kits', imageName: 'electronics.png', alt: 'A person soldering an electronics circuit board.' }
  ];

  const categoryDisplayInfo = {
      stationary: { title: "Featured Stationary", href: "/stationary" },
      books: { title: "Latest Books", href: "/books" },
      electronics: { title: "Top Electronic Kits", href: "/electronics" },
  }

  const renderProductSection = (category: Product['category']) => {
    const catInfo = categoryDisplayInfo[category];
    const productList = productsByCategory[category] || [];

    if (isLoading) {
      return (
        <div className="py-8">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
             {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[250px] w-64 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )
    }

    if (!productList.length || !catInfo) return null;

    return (
      <div className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">{catInfo.title}</h2>
          <Button asChild variant="outline">
            <Link href={catInfo.href}>
              <span>View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {productList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen overflow-x-hidden">
       <div className="w-full py-8">
         <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            stopOnInteraction: false,
            stopOnMouseEnter: true,
            loop: true,
          }}
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
          <div className="flex gap-4 overflow-x-auto pb-4">
              {categories.map((category, index) => (
                  <CategoryLinkCard key={category.id} category={category} index={index} />
              ))}
          </div>
         </div>

         {renderProductSection('stationary')}
         {renderProductSection('books')}
         {renderProductSection('electronics')}

        <div className="py-8">
          <PostCarousel />
        </div>
       </div>
    </div>
  );
}
