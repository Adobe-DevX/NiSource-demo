# NiSource Design System — Developer Reference

> **Purpose:** Engineering reference for building the NiSource Adobe Commerce Storefront on Edge Delivery Services (EDS), based on the [aem-boilerplate-commerce](https://github.com/hlxsites/aem-boilerplate-commerce) template.
>
> **Source:** NiSource Component Library (WIP)
> **Status:** Work in progress — values may evolve. Treat this as a living document.

---

## Table of Contents

1. [Foundations](#1-foundations)
   - [1.1 Spacing & Grid](#11-spacing--grid)
   - [1.2 Typography](#12-typography)
   - [1.3 Color Palette](#13-color-palette)
2. [Logo Usage](#2-logo-usage)
3. [Implementation in EDS Boilerplate](#3-implementation-in-eds-boilerplate)
   - [3.1 Where to put tokens](#31-where-to-put-tokens)
   - [3.2 CSS custom properties](#32-css-custom-properties-design-tokens)
   - [3.3 Drop-in branding](#33-drop-in-branding-overrides)
4. [Open Questions](#4-open-questions)

---

## 1. Foundations

### 1.1 Spacing & Grid

The grid is built on an **8-pixel base unit**. All margins, paddings, column widths, row heights, and component dimensions should be multiples of 8.

| Token            | Value | Suggested CSS variable    |
| ---------------- | ----- | ------------------------- |
| `space-1` (1×)   | 8px   | `--spacing-xxsmall`       |
| `space-2` (2×)   | 16px  | `--spacing-xsmall`        |
| `space-3` (3×)   | 24px  | `--spacing-small`         |
| `space-4` (4×)   | 32px  | `--spacing-medium`        |
| `space-6` (6×)   | 48px  | `--spacing-big`           |
| `space-7` (7×)   | 56px  | `--spacing-large`         |
| `space-8` (8×)   | 64px  | `--spacing-xlarge`        |
| `space-9` (9×)   | 72px  | `--spacing-xxlarge`       |
| `space-10` (10×) | 80px  | `--spacing-xxxlarge`      |

**Rule of thumb:** never invent off-grid values like 12px or 20px. If you need something between 16 and 24, pick one — don't split the difference.

---

### 1.2 Typography

**Primary typeface:** Arial (all NiSource brands).

> Arial is a system font on all major OSes, so no `@font-face` declaration is needed in the EDS boilerplate. Configure `font-family: Arial, sans-serif;` in `styles/styles.css`.

#### Type stack

| Role                      | Family | Weight  | Size (px) | Use                                |
| ------------------------- | ------ | ------- | --------- | ---------------------------------- |
| **H2**                    | Arial  | Black   | 40        | Page-level headings                |
| **H3**                    | Arial  | Black   | 24        | Section headings                   |
| **H4**                    | Arial  | Black   | 20        | Subsection headings                |
| **H5**                    | Arial  | Black   | 18        | Minor headings                     |
| **Large Paragraph**       | Arial  | Regular | 18        | Lead/intro body copy               |
| **Paragraph**             | Arial  | Regular | 16        | Default body copy                  |
| **Small Paragraph**       | Arial  | Regular | 14        | Secondary body copy                |
| **Small Text**            | Arial  | Regular | 12        | Captions, fine print               |
| **Body Bold**             | Arial  | Bold    | 16        | Inline emphasis in body            |
| **Small Header / Button** | Arial  | Bold    | 14        | Button labels, small section heads |
| **Terms & Conditions**    | Arial  | Bold    | 12        | T&C-style emphasized fine print    |
| **Table Headers**         | Arial  | Bold    | 12        | Table column headings              |
| **Desktop Menu Text**     | Arial  | Bold    | 22        | Top-nav items (desktop)            |
| **Mobile Menu Text**      | Arial  | Bold    | 16        | Top-nav items (mobile)             |
| **Chart Text**            | Arial  | Bold    | 10        | Chart labels, tiny annotations     |
| **Menu & Footer Heading** | Arial  | Bold    | 16        | Footer column headings             |

#### Notes for implementation

- **H1 is not defined** in the source library — confirm with design before using. A common assumption is H1 = Arial Black 48–56px; verify before shipping.
- **Line height & letter-spacing** are not specified. Use sensible defaults until design provides values:
  - Headings: `line-height: 1.2`
  - Body: `line-height: 1.5`
  - Small text: `line-height: 1.4`
- **"Black" weight** maps to `font-weight: 900` in CSS. Arial Black is a separate family on some systems (`font-family: 'Arial Black', Arial, sans-serif`); test rendering and pick whichever produces consistent output across browsers.

---

### 1.3 Color Palette

The palette is grouped by purpose. Hex values are authoritative — do not approximate.

#### Gray scale

| Token       | Hex       | Usage                                |
| ----------- | --------- | ------------------------------------ |
| Gray 70     | `#26333A` | Primary text                         |
| Gray 60     | `#535454` | Text on inactive buttons             |
| Gray 50     | `#898D8D` | Secondary body text                  |
| Gray 40     | `#AAAAAA` | Inactive buttons                     |
| Gray 30     | `#E2E2E2` | Borders & outlines                   |
| Gray 20     | `#F2F2F2` | Content block backgrounds            |
| Gray 10     | `#F7F7F7` | Help section of homepage CTA bar     |
| White       | `#FFFFFF` | Page backgrounds                     |

#### Blue (primary brand)

| Token   | Hex       | Usage                                |
| ------- | --------- | ------------------------------------ |
| Blue 60 | `#003A68` | Secondary button hover               |
| Blue 50 | `#004B87` | Secondary CTA buttons; content block bg |
| Blue 40 | `#0061AF` | Primary button hover                 |
| Blue 30 | `#0072CE` | Primary buttons, CTAs, links         |
| Blue 20 | `#62B5E5` | Web portal header & accents         |
| Blue 10 | `#EFF3FC` | Table headers                        |

#### Green — success status

| Token    | Hex       | Usage              |
| -------- | --------- | ------------------ |
| Green 30 | `#0C6446` | Button text        |
| Green 20 | `#60C7A4` | Buttons, alert border |
| Green 10 | `#DFF4ED` | Alert background   |

#### Yellow — tips & highlights

| Token     | Hex       | Usage         |
| --------- | --------- | ------------- |
| Yellow 40 | `#A47D12` | Button text   |
| Yellow 30 | `#FFC72C` | Borders       |
| Yellow 20 | `#FFD665` | Buttons       |

#### Orange — warning status

| Token     | Hex       | Usage         |
| --------- | --------- | ------------- |
| Orange 40 | `#8E5A1E` | Button text   |
| Orange 30 | `#E99738` | Alert border  |
| Orange 20 | `#EFB36E` | Buttons       |

#### Red — error status

| Token  | Hex       | Usage                       |
| ------ | --------- | --------------------------- |
| Red 30 | `#AA0000` | Emergency contact text      |
| Red 20 | `#FF4E2E` | Buttons, alert border       |
| Red 10 | `#FFDCD5` | Alert background            |

#### Misc

| Token         | Hex       | Usage         |
| ------------- | --------- | ------------- |
| Lime Green    | `#8DC63F` | Progress bar  |
| Lavender Gray | `#F6F6F6` | Portal bg     |

#### Branding accent colors

`#8DC63F` (Lime Green), `#34B44A` (Bright Green), `#278642` (Dark Green), `#4CBEA0` (Sea Foam), `#19385F` (Navy Blue), `#807F83` (Gray), `#FA8D29` (Orange), `#D79D29` (Mustard Gold), `#FFC425` (Gold).

#### Logo colors

| Brand               | Hex       |
| ------------------- | --------- |
| NiSource Blue       | `#004B87` |
| Columbia Gas Blue   | `#1467A3` |
| Columbia Gas Red    | `#F15D2F` |

#### App colors (likely the canonical UI palette to use in code)

> **Important:** the "App Colors" set appears to be the most production-ready palette. Default to these for the storefront unless a specific brand context (NiSource corporate vs Columbia Gas) requires otherwise. Confirm with design.

| Token         | Hex       | Usage                          |
| ------------- | --------- | ------------------------------ |
| Electric Blue | `#0077DA` | Primary buttons, text links    |
| Sky Blue      | `#4FA6FF` | Logo, active button            |
| Red           | `#B00020` | Error states                   |
| Green         | `#31D0AA` | Success states                 |
| Black         | `#000000` | Heading text                   |
| Dark Gray     | `#555555` | Body text                      |
| Charcoal      | `#898989` | Secondary text                 |
| Medium Gray   | `#C4C4C4` | Text field borders             |
| Silver        | `#E2E2E2` | Borders, dividers              |
| Light Gray    | `#F2F2F2` | Section backgrounds            |

---

## 2. Logo Usage

**Alignment:**
- Horizontal row → bottom-align to the baselines of the text in the logotype.
- Stacked vertical column → left-align the left-most ascenders in the logotype.

**Do NOT:**
- Apply drop shadows or special effects
- Squeeze or stretch logos to fit a space
- Remove the starburst from the logos
- Outline the logo
- Change the proportions of the symbol to the logo
- Infringe on the clear space
- Choose alternate colors
- Rotate or angle

**Implementation note:** Logo assets should live in `/icons/` (per EDS convention). Reference them via the EDS `<icon>` block or as plain `<img>` tags in document-authored content. SVG is preferred to preserve crispness.

---

## 3. Implementation in EDS Boilerplate

### 3.1 Where to put tokens

The boilerplate's global stylesheet lives at **`styles/styles.css`**. This is the right place for:

- `:root` CSS custom properties for color, spacing, type
- Global resets and base typography
- Body-level font family declaration

Block-specific styling lives in **`blocks/<block-name>/<block-name>.css`** and should consume the global tokens via `var(--token)` rather than hard-coding hex values.

Drop-in components (cart, checkout, PDP, etc.) are styled separately — see [Drop-in branding](#33-drop-in-branding-overrides) below.

### 3.2 CSS custom properties (design tokens)

Drop this into the `:root` block of `styles/styles.css`. Variable names follow the boilerplate's existing convention (`--color-*`, `--spacing-*`, `--font-*`).

```css
:root {
  /* === Spacing (8px base) === */
  --spacing-xxsmall:   8px;
  --spacing-xsmall:   16px;
  --spacing-small:    24px;
  --spacing-medium:   32px;
  --spacing-big:      48px;
  --spacing-large:    56px;
  --spacing-xlarge:   64px;
  --spacing-xxlarge:  72px;
  --spacing-xxxlarge: 80px;

  /* === Typography === */
  --font-family-primary: Arial, Helvetica, sans-serif;
  --font-family-display: 'Arial Black', Arial, sans-serif;

  --font-weight-regular: 400;
  --font-weight-bold:    700;
  --font-weight-black:   900;

  --font-size-h2:        40px;
  --font-size-h3:        24px;
  --font-size-h4:        20px;
  --font-size-h5:        18px;
  --font-size-large-p:   18px;
  --font-size-p:         16px;
  --font-size-small-p:   14px;
  --font-size-small:     12px;
  --font-size-xsmall:    10px;
  --font-size-menu-desktop: 22px;

  /* === Color: App palette (default UI) === */
  --color-primary:        #0077DA; /* electric blue */
  --color-primary-hover:  #0061AF; /* blue 40, fallback hover */
  --color-accent:         #4FA6FF; /* sky blue */
  --color-success:        #31D0AA;
  --color-warning:        #FFC72C;
  --color-error:          #B00020;

  --color-text-heading:   #000000;
  --color-text-body:      #555555;
  --color-text-secondary: #898989;

  --color-border:         #E2E2E2;
  --color-border-input:   #C4C4C4;
  --color-bg-page:        #FFFFFF;
  --color-bg-section:     #F2F2F2;
  --color-bg-portal:      #F6F6F6;

  /* === Color: Brand & accent === */
  --color-brand-nisource:       #004B87;
  --color-brand-columbia-blue:  #1467A3;
  --color-brand-columbia-red:   #F15D2F;

  --color-accent-lime:    #8DC63F;
  --color-accent-bright:  #34B44A;
  --color-accent-dark:    #278642;
  --color-accent-seafoam: #4CBEA0;
  --color-accent-navy:    #19385F;
  --color-accent-orange:  #FA8D29;
  --color-accent-mustard: #D79D29;
  --color-accent-gold:    #FFC425;

  /* === Color: Status alerts === */
  --color-success-bg:     #DFF4ED;
  --color-success-border: #60C7A4;
  --color-success-text:   #0C6446;

  --color-warning-bg:     #FFD665;
  --color-warning-border: #FFC72C;
  --color-warning-text:   #A47D12;

  --color-error-bg:       #FFDCD5;
  --color-error-border:   #FF4E2E;
  --color-error-text:     #AA0000;

  /* === Color: Progress === */
  --color-progress: #8DC63F;
}
```

### 3.3 Drop-in branding overrides

Adobe Commerce drop-ins (cart, checkout, PDP, user-account, etc.) ship with their own design tokens that need to be themed. The mechanism is documented at [Drop-ins → Branding](https://experienceleague.adobe.com/developer/commerce/storefront/dropins/all/branding/).

Map these drop-in tokens to the NiSource palette in your global stylesheet:

```css
:root {
  /* Drop-in primary action color (Add to Cart, Place Order, etc.) */
  --color-brand-500: #0077DA;
  --color-brand-700: #0061AF;
  --color-brand-300: #4FA6FF;

  /* Drop-in semantic tokens */
  --color-positive-500: #31D0AA;
  --color-warning-500:  #FFC72C;
  --color-alert-500:    #B00020;

  /* Drop-in neutrals */
  --color-neutral-900: #000000;
  --color-neutral-700: #555555;
  --color-neutral-500: #898989;
  --color-neutral-300: #C4C4C4;
  --color-neutral-200: #E2E2E2;
  --color-neutral-100: #F2F2F2;
  --color-neutral-50:  #F6F6F6;
}
```

> The exact drop-in token names depend on the drop-in version. Check `node_modules/@dropins/<name>/dist/styles.css` after `npm install` to see the canonical variable names, then override them in `styles/styles.css`.

---

## 4. Open Questions

These items are not specified in the source library. Confirm with the design team before going to production.

1. **H1 styling** — not defined; needs size/weight.
2. **Line heights and letter spacing** — not specified for any type style.
3. **Responsive type scale** — do font sizes shrink on mobile? At what breakpoints?
4. **Breakpoints / responsive grid** — the doc covers spacing but not column counts or breakpoint widths.
5. **Border radii** — no values provided for buttons, cards, inputs.
6. **Elevation / shadows** — none specified, but logo guidance forbids drop shadows on the logo itself; UI elements likely still need elevation tokens.
7. **Button states** — hover colors are given for primary/secondary, but disabled, focus, pressed, and loading states are not.
8. **Focus ring** — accessibility-critical; needs a defined token.
9. **Transitions / motion** — no duration or easing tokens.
10. **App palette vs Logo palette priority** — the doc lists overlapping blues (`#0077DA` "Electric Blue" vs `#0072CE` "Blue 30"). Confirm which is the canonical primary for the storefront.
11. **Multi-brand handling** — Columbia Gas has its own logo colors. Will the storefront need theme switching, or is this NiSource-only?
