export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  category: string;
  image: string;
  description: string;
};

const BRANDS = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Soylent', 'Hooli'];
const CATEGORIES = ['Audio', 'Wearables', 'Home', 'Gaming', 'Mobile', 'Photo'];
const ADJECTIVES = ['Pro', 'Max', 'Ultra', 'Air', 'Mini', 'Plus', 'Lite', 'X'];

function imageFor(seed: number): string {
  return `https://picsum.photos/seed/shop-${seed}/1080/1080`;
}

export const PRODUCTS: Product[] = Array.from({ length: 500 }, (_, i) => {
  const brand = BRANDS[i % BRANDS.length];
  const category = CATEGORIES[i % CATEGORIES.length];
  const adjective = ADJECTIVES[i % ADJECTIVES.length];
  return {
    id: String(i),
    name: `${category} ${adjective} ${i}`,
    brand,
    price: 19 + ((i * 7) % 980),
    rating: 1 + ((i * 13) % 40) / 10,
    category,
    image: imageFor(i),
    description:
      `The ${brand} ${category} ${adjective} ${i} is a premium device built for people ` +
      `who demand the very best. `.repeat(8),
  };
});

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
