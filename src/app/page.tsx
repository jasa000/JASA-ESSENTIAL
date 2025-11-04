
"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaCarouselType } from "embla-carousel-react";
import BannerCard from '@/components/banner-card';
import WelcomeCard from '@/components/welcome-card';
import CategoryLinkCard from '@/components/category-link-card';
import { categories as defaultCategories, getProducts, getHomepageContent } from '@/lib/data';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import PostCarousel from "@/components/post-carousel";
import type { Product, HomepageContent, Category } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


export default function Home() {
  const plugin = React.useRef(
    Autoplay({ 
      delay: 5000, 
      stopOnInteraction: true, // Stop on interaction
      stopOnMouseEnter: true, // Stop on hover
    })
  );

  const [productsByCategory, setProductsByCategory] = React.useState<{ [key in Product['category']]?: Product[] }>({});
  const [homepageContent, setHomepageContent] = React.useState<HomepageContent | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [displayCategories, setDisplayCategories] = React.useState<Category[]>(defaultCategories);
  
  const [emblaApi, setEmblaApi] = React.useState<EmblaCarouselType | null>(null);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  React.useEffect(() => {
    const fetchPageData = async () => {
      setIsLoading(true);
      try {
        const [
          stationary, 
          books, 
          electronics, 
          content
        ] = await Promise.all([
          getProducts('stationary'),
          getProducts('books'),
          getProducts('electronics'),
          getHomepageContent(),
        ]);
        setProductsByCategory({ stationary, books, electronics });
        setHomepageContent(content);

        // Always use default categories, but enrich with images if they exist
        const categoriesWithImages = defaultCategories.map(cat => {
            const categoryKey = cat.href.replace('/', '') as keyof HomepageContent['categoryImages'];
            const dynamicImageUrl = content?.categoryImages?.[categoryKey];
            return { 
                ...cat, 
                image: { 
                    ...cat.image, 
                    src: dynamicImageUrl || '',
                }
            };
        });
        setDisplayCategories(categoriesWithImages);


      } catch (error) {
        console.error("Failed to fetch data for home page:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPageData();
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = (api: EmblaCarouselType) => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    const onInit = (api: EmblaCarouselType) => {
      setScrollSnaps(api.scrollSnapList());
    }

    onInit(emblaApi);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onInit);

    return () => {
        emblaApi.off("select", onSelect);
        emblaApi.off("reInit", onInit);
    }
  }, [emblaApi]);

  const banners = homepageContent?.banners.filter(banner => banner.imageUrl) || [];

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
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-56 flex-shrink-0">
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-[250px] w-full rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
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
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {productList.map((product) => (
            <div key={product.id} className="w-56 flex-shrink-0">
              <ProductCard product={product} hideRating hideBuyButton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen overflow-x-hidden">
       <div className="w-full py-8">
         <Carousel
          setApi={setEmblaApi}
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.play}
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            <CarouselItem>
                <WelcomeCard />
            </CarouselItem>
            {isLoading ? (
                 <CarouselItem>
                    <div className="relative w-full overflow-hidden">
                        <Skeleton className="relative h-64 w-full rounded-lg md:h-80 lg:h-[23rem]" />
                    </div>
                 </CarouselItem>
            ) : banners.map((banner) => {
              return (
                <CarouselItem key={banner.id}>
                  <BannerCard
                    href={banner.href}
                    title={banner.title}
                    cta={banner.cta}
                    imageSrc={banner.imageUrl}
                    imageAlt={banner.title}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
        <div className="mt-4 flex justify-center gap-2">
            {scrollSnaps.map((_, index) => (
                <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                        "h-2 w-2 rounded-full transition-all duration-300",
                        currentSlide === index ? "w-6 bg-primary" : "bg-muted-foreground/50"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
      </div>
       
       <div className="container mx-auto px-4">
         <div className="py-8">
          <h2 className="text-center font-headline text-2xl font-bold tracking-tight sm:text-3xl mb-6">OUR SERVICES</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {displayCategories.map((category, index) => (
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
