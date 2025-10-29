import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/product-card';
import { products, categories } from '@/lib/data';
import CategoryCard from '@/components/category-card';

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="w-full">
        <Carousel
          className="w-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            <CarouselItem>
              <div className="relative h-[300px] w-full md:h-[450px]">
                <Image
                  src="https://picsum.photos/seed/hero1/1200/450"
                  alt="Hero Image"
                  fill
                  className="object-cover"
                  data-ai-hint="stationery items"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-center text-white">
                  <div className="max-w-md p-4">
                    <h1 className="font-headline text-2xl font-bold md:text-4xl">
                      Jasa essential in all stationary things available for
                      affordable price, shop your product.
                    </h1>
                    <Button asChild className="mt-4">
                      <Link href="#">Shop Now</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
             <CarouselItem>
              <div className="relative h-[300px] w-full md:h-[450px]">
                <Image
                  src="https://picsum.photos/seed/hero2/1200/450"
                  alt="Hero Image 2"
                  fill
                  className="object-cover"
                  data-ai-hint="office supplies"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-center text-white">
                  <div className="max-w-md p-4">
                    <h1 className="font-headline text-2xl font-bold md:text-4xl">
                      Quality Supplies for Every Need
                    </h1>
                    <Button asChild className="mt-4">
                      <Link href="#">Browse Products</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
             <CarouselPrevious />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <CarouselNext />
          </div>
        </Carousel>
      </section>

      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 sm:py-12">
        <h2 className="font-headline text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Our Best Stationary Products
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
