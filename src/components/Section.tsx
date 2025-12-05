// apps/storefront/components/Section.tsx
import React from "react";

export interface SectionProps {
  title?: string;
  background?: "white" | "gray" | "dark";
  children?: React.ReactNode;
}

export default function Section({
  title,
  background = "white",
  children,
}: SectionProps) {
  const bg =
    background === "gray"
      ? "bg-gray-50"
      : background === "dark"
      ? "bg-gray-900 text-white"
      : "bg-white";

  return (
    <section className={bg + " py-16"}>
      <div className="mx-auto max-w-5xl px-6">
        {title && (
          <h2 className="mb-6 text-xl font-semibold">{title}</h2>
        )}

        {children}
      </div>
    </section>
  );
}
