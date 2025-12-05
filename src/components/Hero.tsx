// apps/storefront/components/Hero.tsx
import React from "react";

export interface HeroProps {
  title: string;
  subtitle?: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function Hero({
  title,
  subtitle,
  image,
  ctaLabel,
  ctaHref,
}: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-gray-50">
      {image && (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}

      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
        )}

        {ctaLabel && ctaHref && (
          <a
            href={ctaHref}
            className="mt-8 inline-block rounded bg-black px-6 py-3 text-white"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  );
}
