// apps/storefront/components/Callout.tsx
import React from "react";

export interface CalloutProps {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  tone?: "info" | "warning" | "positive";
}

export default function Callout({
  text,
  ctaLabel,
  ctaHref,
  tone = "info",
}: CalloutProps) {
  const toneClasses =
    tone === "warning"
      ? "bg-yellow-50 border-yellow-300"
      : tone === "positive"
      ? "bg-green-50 border-green-300"
      : "bg-blue-50 border-blue-300";

  return (
    <div
      className={`mx-auto my-12 max-w-3xl border-l-4 p-6 ${toneClasses}`}
    >
      <p className="text-lg">{text}</p>

      {ctaLabel && ctaHref && (
        <a href={ctaHref} className="mt-4 inline-block text-blue-600 underline">
          {ctaLabel}
        </a>
      )}
    </div>
  );
}
