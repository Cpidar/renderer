// apps/storefront/components/Page.tsx
import React from "react";

export interface PageProps {
  title?: string;
  children: React.ReactNode;
}

export default function Page({ title, children }: PageProps) {
  return (
    <main className="min-h-screen bg-white">
      {title && (
        <header className="border-b bg-gray-50 py-6">
          <div className="mx-auto max-w-4xl px-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </header>
      )}

      <div>{children}</div>
    </main>
  );
}
