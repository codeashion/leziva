/**
 * LEZIVA Brand Identity & Design Token Configuration
 * 
 * Official Colors:
 * - Warm Ivory: #EAE6DE
 * - Deep Editorial Blue: #226192
 * - Coral Orange: #EF8557
 * - Rose Gold Metallic Accent: #C88D79
 */

export const BRAND_IDENTITY = {
  name: "LEZIVA",
  tagline: "UNIQUE. ELEGANT. AUTHENTIC.",
  description:
    "A premium, original fashion e-commerce platform curating bespoke sarees, dresses, kurtis, ethnic wear, and contemporary women's fashion.",
  colors: {
    // Official Core Brand Palette
    warmIvory: {
      hex: "#EAE6DE",
      rgb: "234, 230, 222",
      hsl: "40, 20%, 89%",
      role: "Primary luxury background & canvas tone",
    },
    deepEditorialBlue: {
      hex: "#226192",
      rgb: "34, 97, 146",
      hsl: "206, 62%, 35%",
      role: "Hero brand color, primary typography & deep structural accents",
    },
    coralOrange: {
      hex: "#EF8557",
      rgb: "239, 133, 87",
      hsl: "18, 83%, 64%",
      role: "Vibrant CTA, high-energy accents & notification badges",
    },
    // Supporting Editorial & Metallic Palette (from official logo)
    roseGoldMetallic: {
      hex: "#C88D79",
      rgb: "200, 141, 121",
      role: "Signature logo metallic foil tone & luxury flourishes",
    },
    editorialNavy: {
      hex: "#164366",
      rgb: "22, 67, 102",
      role: "Deep header/footer surfaces and high contrast text",
    },
    champagneGold: {
      hex: "#D4AF37",
      rgb: "212, 175, 55",
      role: "Bespoke zardozi & bridal ethnic luxury accents",
    },
    charcoalNoir: {
      hex: "#1A1D20",
      rgb: "26, 29, 32",
      role: "High-legibility editorial body copy",
    },
    softSilk: {
      hex: "#F9F8F5",
      rgb: "249, 248, 245",
      role: "Clean elevated card surfaces",
    },
  },
  typography: {
    serif: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
    sans: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  assets: {
    logoOfficial: "/brand/leziva_logo.webp",
    logoFull: "/brand/leziva_logo.webp",
    logoSymbol: "/brand/leziva_symbol.png",
    favicon: "/favicon.png",
  },
  proportions: {
    width: 300,
    height: 111,
    aspectRatio: "300 / 111",
  },
} as const;

export type BrandIdentity = typeof BRAND_IDENTITY;
