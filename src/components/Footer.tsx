// apps/storefront/components/Footer.tsx
import React from "react";

export interface FooterProps {
  links?: { label: string; href: string }[];
  copyright?: string;
}

export default function Footer({
  links = [],
  copyright = "© 2025 Your Company",
}: FooterProps) {
  return (
    <footer className="bg-black py-12 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <nav className="flex flex-wrap gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="mt-8 text-xs text-gray-400">{copyright}</p>
      </div>
    </footer>
  );
}
