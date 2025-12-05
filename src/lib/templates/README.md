# Template Snapshot and Puck Page

Got you — here are two complete, realistic examples:

templates/modern.json → a full theme snapshot (colors, typography, layout, component defaults, etc.)

**An example Puck Page JSON → what your multi‑tenant page schema would look like, ready to drop into your database and test locally.

Both follow the performance blueprint you approved (minimal config, lazy component hooks, stable IDs, predictable component map).

✅ 1. templates/modern.json
A complete, production‑ready theme snapshot for a modern storefront.

```json
{
  "templateName": "modern",
  "version": "1.0.0",
  "tokens": {
    "colors": {
      "primary": "#2563eb",
      "primaryDark": "#1e3a8a",
      "secondary": "#f97316",
      "background": "#ffffff",
      "foreground": "#0f172a",
      "muted": "#f1f5f9",
      "border": "#e2e8f0"
    },
    "fonts": {
      "heading": "Inter, sans-serif",
      "body": "Inter, sans-serif",
      "mono": "Menlo, monospace"
    },
    "radius": {
      "sm": "4px",
      "md": "8px",
      "lg": "16px"
    },
    "spacing": {
      "xs": "4px",
      "sm": "8px",
      "md": "16px",
      "lg": "24px",
      "xl": "48px"
    },
    "container": {
      "maxWidth": "1280px"
    }
  },
  "layout": {
    "header": {
      "type": "Navbar",
      "props": {
        "logo": "/branding/modern/logo.svg",
        "sticky": true,
        "menuStyle": "underline",
        "ctaText": "Shop Now"
      }
    },
    "footer": {
      "type": "FooterSimple",
      "props": {
        "copyright": "© 2025 Modern Storefront",
        "links": [
          { "label": "Contact", "href": "/contact" },
          { "label": "Privacy", "href": "/privacy" }
        ]
      }
    }
  },
  "defaults": {
    "HeroMain": {
      "titleSize": "4xl",
      "padding": "xl",
      "align": "center"
    },
    "ProductCard": {
      "showPrice": true,
      "showCTA": true,
      "imageRatio": "1:1",
      "shadow": "md"
    },
    "Grid": {
      "columns": { "mobile": 1, "tablet": 2, "desktop": 4 },
      "gap": "md"
    }
  }
}
```
✅ 2. Example Puck Page JSON (for / homepage)
This is a realistic page snapshot that Puck Editor will emit.

Works perfectly with:

multi‑tenant template merging

dynamic component registry

ISR/SSR hybrid renderer

lazy‑loaded components

👉 This example demonstrates blocks, nested layouts, props, stable IDs.
```json
{
  "id": "home",
  "title": "Homepage",
  "path": "/",
  "updatedAt": "2025-12-01T00:00:00.000Z",
  "components": [
    {
      "id": "hero-98ad2",
      "type": "HeroMain",
      "props": {
        "title": "Modern Commerce Starts Here",
        "subtitle": "Beautiful templates. Lightning fast. Fully customizable.",
        "backgroundImage": "/uploads/hero-modern.jpg",
        "ctaText": "Browse Products",
        "ctaLink": "/products"
      }
    },
    {
      "id": "grid-934nn",
      "type": "Grid",
      "props": {
        "columns": { "mobile": 1, "tablet": 2, "desktop": 3 },
        "gap": "lg"
      },
      "children": [
        {
          "id": "product-list-111aa",
          "type": "ProductCollection",
          "props": {
            "collectionType": "featured",
            "limit": 6,
            "cardPreset": "default"
          }
        }
      ]
    },
    {
      "id": "banner-849vn",
      "type": "BannerPromo",
      "props": {
        "text": "⚡️ Free shipping on orders over $75!",
        "background": "#2563eb",
        "color": "#ffffff",
        "padding": "md",
        "align": "center"
      }
    },
    {
      "id": "content-442pq",
      "type": "RichText",
      "props": {
        "content": "<h2>Why Choose Us?</h2><p>Because performance, freedom and design matter.</p>"
      }
    }
  ]
}
```

⭐ What This Gives You
You now have:

✔ A full example template snapshot (modern.json)
✔ A full example Puck Page snapshot
✔ Both are compliant with the recommended:

lazy component map

dynamic renderer

tenant ⨯ template merge model

SSR/ISR caching layers

per-tenant snapshot resolution

minimal JSON footprint