# AllPro Wallet Design System

This document outlines the design tokens, components, and style guidelines used to maintain the "smooth and clean" aesthetic of the AllPro Wallet dashboard.

## 1. Layout & Structure

### Grid System
- **Main Layout**: `flex min-h-screen bg-[#F8FAFC]`
- **Sidebar**: Fixed width `w-[220px]`, `h-screen`
- **Header**: Fixed height `h-[64px]`, sticky top
- **Dashboard Grid**: `grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]`
  - Left column: Flexible width (Main content)
  - Right column: Fixed width `400px` (Secondary content/Sidebar)

### Spacing
- **Page Padding**: `p-6`
- **Component Gap**: `space-y-6` or `gap-6`
- **Internal Card Padding**: `p-6` (Standard), `p-5` (Compact)
- **Element Spacing**: `gap-2`, `gap-3`, `gap-4`

### Z-Index Layers
- **Header**: `z-30`
- **Mobile Nav Overlay**: `z-40`
- **Mobile Nav Toggle**: `z-50`

---

## 2. Colors

### Core Palette
- **Primary**: `bg-primary` (Blue), `text-primary`
- **Background**:
  - App Background: `#F8FAFC` (Slate-50/100 equivalent)
  - Card Background: `bg-white`
  - Muted Backgrounds: `bg-muted/20`, `bg-muted/30`, `bg-muted/50`, `bg-muted/60`
- **Borders**: `border-border/40` (Subtle, light gray)

### Text Colors
- **Headings (Primary)**: `text-gray-800` (Soft black)
- **Headings (Secondary)**: `text-gray-700`
- **Body/Muted**: `text-muted-foreground`
- **Muted/Subtle**: `text-muted-foreground/70`

### Status Colors
- **Success**: `bg-emerald-100 text-emerald-700`
- **Warning**: `bg-orange-100 text-orange-700`
- **Error**: `bg-red-100 text-red-700`
- **Blue Accent**: `bg-blue-50 text-blue-700`

---

## 3. Typography

### Font Weights
- **Normal**: `font-normal` (Used for almost all headings and numbers to reduce visual weight)
- **Medium**: `font-medium` (Used sparingly for buttons, small labels, and active states)
- **Semibold**: `font-semibold` (Used only for the Brand Name)

### Text Sizes
- **Page Title**: `text-xl`
- **Large Balance**: `text-3xl tracking-tight`
- **Section Headers**: `text-xs` or `text-sm`
- **Body Text**: `text-sm`
- **Small/Label**: `text-xs`
- **Micro**: `text-[10px]` or `text-[11px]`

### Examples
| Element | Style Classes |
| :--- | :--- |
| **Page Title** | `text-xl font-normal text-gray-800` |
| **Page Subtitle** | `text-xs text-muted-foreground` |
| **Card Header** | `text-xs font-normal text-gray-700` |
| **Big Number** | `text-3xl font-normal tracking-tight text-gray-800` |
| **Table Row** | `text-sm font-normal text-gray-700` |

---

## 4. Components

### Cards
- **Container**: `rounded-xl border border-border/40 bg-white shadow-sm`
- **Padding**: `p-6` usually, `p-5` for denser cards
- **Elevation**: `shadow-sm` (Subtle lift)

### Buttons
- **Primary**:
  ```tsx
  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
  ```
- **Secondary (Outline)**:
  ```tsx
  className="rounded-md border border-border/40 bg-background px-4 py-2 text-sm font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground"
  ```
- **Ghost/Text**:
  ```tsx
  className="text-xs font-medium text-muted-foreground hover:text-foreground"
  ```
- **Icon Button**:
  ```tsx
  className="rounded-md p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
  ```

### Navigation (Sidebar)
- **Item Container**: `flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors`
- **Inactive Text**: `text-sm font-medium text-muted-foreground`
- **Hover State**: `hover:bg-muted/50 hover:text-foreground`
- **Active State**: `bg-primary text-white`

### Inputs (Search)
- **Container**: `relative`
- **Input Field**:
  ```tsx
  className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
  ```
- **Icon**: `absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`

### Dividers
- **Standard**: `border-t border-border/40`
- **Vertical**: `h-6 w-px bg-border/40`

---

## 5. Visual Effects

### Gradients
- **Blue Card**: `bg-gradient-to-br from-blue-600 to-blue-700`
- **Dark Card**: `bg-gradient-to-br from-slate-800 via-slate-900 to-black`
- **Emerald Card**: `bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900`

### Shadows
- **Card Shadow**: `shadow-sm`
- **Hover Shadow**: `shadow-lg` -> `hover:shadow-xl` (Interactive cards)

### Animations/Transitions
- **Standard Transition**: `transition-colors` or `transition-all`
- **Hover Effects**: `hover:bg-muted/50`, `hover:text-foreground`

---

## 6. Iconography
- **Library**: `lucide-react`
- **Standard Size**: `h-4 w-4` or `h-5 w-5`
- **Color**: Usually `text-muted-foreground` or `text-primary` depending on context.
