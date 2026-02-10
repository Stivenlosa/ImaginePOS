# ImaginePOS - AI Coding Assistant Instructions

## Project Overview
A Next.js 15 Point-of-Sale (POS) system using React 19, TypeScript, and Tailwind CSS. Features product management, cart operations, and a collapsible sidebar navigation with theme switching.

## Architecture

### App Structure (Next.js App Router)
- **Route Groups**: `(home)` directory for main sales page at `/` route
- **Layout Hierarchy**: [layout.tsx](../src/app/layout.tsx) provides global sidebar + dark mode providers
- **Key Routes**: 
  - `/` (home) - Sales/POS interface with product grid + cart
  - `/products` - Product management (CRUD operations)

### State Management Pattern
Context-based architecture with React Context API - **no Redux or external state libraries**:

```tsx
// Provider nesting in providers.tsx
<ThemeProvider>
  <LanguageProvider>
    <SidebarProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </SidebarProvider>
  </LanguageProvider>
</ThemeProvider>
```

**Key Contexts**:
- `CartProvider` ([cart-context.tsx](../src/components/cartSummary/cart-context.tsx)) - Cart state with add/remove/clear
- `SidebarProvider` ([sidebar-context.tsx](../src/components/sidebar/sidebar-context.tsx)) - Sidebar collapse/expand + mobile detection
- `LanguageProvider` ([i18n/language-context.tsx](../src/i18n/language-context.tsx)) - i18n translations with localStorage persistence

### Client/Server Component Convention
- **All interactive components use `"use client"`** directive at the top
- Server components are rare - most UI is client-side due to interactivity needs
- Pages with forms, modals, or state MUST be client components

### Internationalization (i18n)
The app supports multiple languages using a custom local translation system (no external API calls).

**Structure**:
- Translation files: `src/i18n/translations/{lang}.json` (en.json, es.json)
- Language context: `src/i18n/language-context.tsx`
- Exports: `src/i18n/index.ts`

**Usage Pattern - ALWAYS use translations for UI text**:
```tsx
import { useTranslation } from "@/i18n";

function MyComponent() {
    const { t } = useTranslation();
    return (
        <button>{t("common.save")}</button>
        <span>{t("cart.empty")}</span>
    );
}
```

**With parameters**:
```tsx
// Translation: "notifications.new": "{{count}} new"
t("notifications.new", { count: 5 }) // "5 new"
```

**Adding new text**:
1. Add key to `src/i18n/translations/en.json`
2. Add translated key to `src/i18n/translations/es.json`
3. Use `t("section.key")` in component

**Translation file structure**:
```json
{
    "common": { "save": "Save", "cancel": "Cancel", "search": "Search" },
    "cart": { "title": "Cart", "empty": "Cart is empty" },
    "products": { "editProduct": "Edit Product" },
    "navigation": { "sales": "Sales", "products": "Products" }
}
```

**Adding new languages**:
1. Create new JSON file: `src/i18n/translations/fr.json`
2. Add to `LANGUAGES` in `language-context.tsx`:
```tsx
export const LANGUAGES = {
    en: { name: "English", nativeName: "English", flag: "🇺🇸" },
    es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    fr: { name: "French", nativeName: "Français", flag: "🇫🇷" },
} as const;
```
3. Import and add to `translations` object in same file

**Language switcher**: Located in user-info dropdown (top-right avatar menu)

## Styling Conventions

### Tailwind Configuration
- **Custom color system**: Primary green (`#10B981`), extensive dark mode palette
- **Custom breakpoints**: `2xsm: 375px`, `xsm: 425px`, `3xl: 2000px`, **critical `850px` mobile threshold**
- **Font**: Custom "Satoshi" font family loaded via [satoshi.css](../src/css/satoshi.css)

### Dark Mode
- Uses `next-themes` with class strategy: `dark:` prefixes auto-switch
- Toggle in header: `<ThemeToggle />` component
- Consistent pattern: `bg-white dark:bg-gray-dark`, `text-gray-700 dark:text-dark-6`

### Component Styling Pattern
Use `cn()` utility ([lib/utils.ts](../src/lib/utils.ts)) for conditional classes:
```tsx
className={cn(
  "base-classes",
  condition && "conditional-classes",
  isMobile ? "mobile-classes" : "desktop-classes"
)}
```

## Critical Conventions

### Mobile Responsiveness
- **Custom hook**: `useIsMobile()` uses `850px` breakpoint (NOT Tailwind's default md:768px)
- Sidebar: Desktop sticky, mobile fixed overlay with backdrop
- Always test responsive behavior with `MOBILE_BREAKPOINT = 850`

### Path Aliases
- `@/*` maps to `src/*` (tsconfig paths)
- Import example: `import { cn } from "@/lib/utils"`

### Icon Management
- Icons colocated with components in `icons.tsx` files
- Each major component folder (sidebar, header, notification) has own icon definitions
- Global icons in [assets/icons.tsx](../src/assets/icons.tsx)

### Navigation Structure
- `NAV_DATA` in [sidebar/data/index.ts](../src/components/sidebar/data/index.ts) defines all routes
- Uses `titleKey` and `labelKey` for i18n translation keys (e.g., `"navigation.sales"`)
- Supports nested items with collapsible sections
- Active state detection via `usePathname()` from Next.js navigation

## Development Workflow

### Commands
```bash
npm run dev        # Start dev server with Turbopack
npm run build      # Production build with Turbopack  
npm start          # Start production server
```

### Component Creation Pattern
1. Create component in appropriate `src/components/[feature]/` folder
2. Add `"use client"` if interactive (useState, event handlers, context)
3. Create colocated `icons.tsx` if component needs custom icons
4. Export via `index.tsx` barrel file
5. Use `cn()` for all conditional styling
6. **Use `useTranslation()` for all UI text** - add keys to both `en.json` and `es.json`

### Adding New Routes
1. Create folder in `src/app/` (use route groups with `()` if needed)
2. Add `page.tsx` - mark `"use client"` if interactive
3. Update `NAV_DATA` in [sidebar/data/index.ts](../src/components/sidebar/data/index.ts)
4. Add icon to sidebar icons if needed

### TypeScript Patterns
- Prefer `type` over `interface` (consistent with codebase)
- Type imports: `import type { Metadata } from "next"`
- Props: `{ children }: PropsWithChildren` or explicit destructuring

## Key Implementation Details

### Cart System
- Products have `{ id, name, price }` structure
- Cart items extend to `{ ...product, qty: number }`
- `addToCart()` increments qty if product exists, else adds with qty=1
- `removeFromCart()` decrements qty, filters out items with qty≤0

### Sidebar Behavior
- Desktop: Toggle between expanded/collapsed, always visible
- Mobile: Overlay with backdrop, closes on outside click
- Hamburger button: Opacity-based visibility (not display none)
- State syncs with viewport changes via `useIsMobile()` effect

### Modal Pattern (Products Page)
Uses conditional rendering with fixed overlay:
```tsx
{modalOpen && <Modal onClose={() => setModalOpen(false)} />}
// Modal renders with: fixed inset-0 z-50 bg-black/40
```

## Common Pitfalls to Avoid
- Don't use Tailwind's `md:` breakpoint for mobile logic - use `useIsMobile()` hook
- Don't forget `"use client"` on components with useState/useContext/event handlers
- Don't import icons globally - use colocated `icons.tsx` per component
- Sidebar toggle needs both `isOpen` state AND `isMobile` for correct behavior
- Always use `cn()` for dynamic classes, not template literals with Tailwind
- **Never hardcode UI text** - always use `t("key")` from `useTranslation()` hook for all user-facing strings

## External Dependencies
- **Charts**: ApexCharts + react-apexcharts (unused in current implementation)
- **Date**: dayjs for date manipulation
- **UI**: Custom components in `components/ui/` (dropdown, skeleton, table)
- **Loading**: nextjs-toploader for page transitions
