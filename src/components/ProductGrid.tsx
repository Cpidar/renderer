// apps/storefront/components/ProductGrid.tsx
import React from "react";

export interface ProductGridProps {
  title?: string;
  products: {
    id: string;
    name: string;
    price: number;
    image?: string;
    href?: string;
  }[];
}

export default function ProductGrid({ title, products }: ProductGridProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      {title && <h2 className="mb-8 text-2xl font-bold">{title}</h2>}

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {products.map((p) => (
          <a key={p.id} href={p.href ?? `/product/${p.id}`}>
            <div className="rounded-lg border p-4 hover:shadow">
              {p.image && (
                <img
                  src={p.image}
                  alt={p.name}
                  className="mb-4 h-48 w-full object-cover"
                />
              )}
              <h3 className="text-sm font-medium">{p.name}</h3>
              <p className="mt-2 font-semibold">${p.price}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
