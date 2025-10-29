import ProductCard from "@/components/product-card";
import { products } from "@/lib/data";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl" style={{color: '#7EC8E3'}}>
          Find Your Perfect Stationery
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A curated collection for your creative and professional needs.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
