# UI/UX Design Intelligence — Cosworth RMA Portal
## Design Rules for Claude Code

> This file is referenced in CLAUDE.md. Read it before building or modifying any UI component, page, or layout in this project.

---

## This Project's Design Identity

**Product type:** B2B Enterprise / Motorsport Engineering portal
**Style:** Dark Mode with Glassmorphism card surfaces — clean, data-dense, professional
**Tone:** Industrial precision. Sharp. Confident. Not flashy, not soft. The UI should feel like it belongs in a motorsport engineering environment — fast to scan, zero wasted space.
**Unforgettable element:** The dark navy header against the clean white card surfaces. Every page has a strong dark hero band that gives way to light content — like a pit lane wall opening into a bright garage.

**Never produce:** purple/pink AI gradients, rounded blobs, oversized emoji icons, pastel backgrounds, playful animations, soft shadows that obscure data, or generic SaaS aesthetics.

---

## Cosworth Brand Tokens (use these — never invent alternatives)

```css
--navy:        #002847   /* nav, hero backgrounds, sidebar */
--navy-mid:    #003a63   /* hero gradients */
--blue:        #0066cc   /* CTAs, active links, primary buttons */
--blue-light:  #0080ff   /* hover state on blue */
--accent:      #00b4d8   /* brand highlight, logo "RETURNS" text */
--white:       #ffffff   /* card backgrounds, page content */
--grey-50:     #f8fafc   /* page background */
--grey-100:    #f1f5f9   /* table alternates, input backgrounds */
--grey-200:    #e2e8f0   /* borders, dividers */
--grey-400:    #94a3b8   /* muted text, labels */
--grey-600:    #475569   /* secondary text */
--text:        #0f172a   /* primary body copy */
--green:       #10b981   /* success, closed, active */
--amber:       #f59e0b   /* hold states, warnings */
--amber-bg:    #fffbeb   /* hold state backgrounds */
--red:         #ef4444   /* errors, rejected, danger */
--purple:      #8b5cf6   /* RMA number references */
```

---

## Typography

| Use | Font | Weight | Size |
|---|---|---|---|
| Page titles, case numbers | Space Grotesk | 700 | 20–28px |
| Body, labels, buttons | DM Sans | 400–600 | 13–14px |
| Part numbers, fees, codes | DM Mono | 400–500 | 12–13px |
| Small labels, badges | DM Sans | 600 | 10–11px uppercase |

Import via `next/font/google` — never `<link>` tags.

---

## Component Patterns

### Cards
```tsx
// Standard card
<div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
  {/* card-header: px-6 py-4 border-b border-grey-100 flex items-center justify-between */}
  {/* card-body: p-6 */}
</div>
```
- Always `rounded-xl` not `rounded-lg` or `rounded-2xl`
- Border `border-grey-200`, shadow `shadow-sm` (never heavy shadows)
- Card headers use `border-b border-grey-100`

### Buttons
```tsx
// Primary
<button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 inline-flex items-center gap-1.5 cursor-pointer">

// Secondary
<button className="bg-white hover:bg-grey-50 text-grey-800 font-medium px-4 py-2 rounded-lg text-sm border border-grey-300 transition-all duration-200 cursor-pointer">

// Danger
<button className="bg-white hover:bg-red-50 text-red-600 font-medium px-4 py-2 rounded-lg text-sm border border-red-200 transition-all duration-200 cursor-pointer">
```
- All buttons: `cursor-pointer`, `transition-all duration-200`
- Loading state: disable + show spinner, never remove button
- Small variant: `btn-sm` → `px-3 py-1.5 text-xs`

### Badges / Status Pills
```tsx
// Pattern: background + text colour pair, small bold uppercase text, dot indicator
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
  Submitted
</span>
```

Status colour map:
- SUBMITTED → blue-50 / blue-700 / blue-500 dot
- UNDER_REVIEW → amber-50 / amber-800 / amber-500 dot
- RMA_ISSUED → purple-50 / purple-700 / purple-500 dot
- IN_REPAIR → orange-50 / orange-800 / orange-500 dot
- CLOSED → green-50 / green-700 / green-500 dot
- REJECTED → red-50 / red-800 / red-500 dot
- HOLD → amber-50 / amber-800 / amber border
- ACTION_REQUIRED → orange-50 / orange-800 / orange border

### Form Inputs
```tsx
<input className="w-full px-3.5 py-2.5 border-2 border-grey-200 rounded-lg text-sm text-grey-900 bg-white font-sans outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
```
- Always `border-2` not `border`
- Focus: `border-blue-500` + `ring-2 ring-blue-500/10`
- Error state: `border-red-400` + `ring-2 ring-red-400/10`

### Tables
```tsx
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-grey-50 border-b border-grey-200">
      <th className="text-left text-xs font-semibold text-grey-500 uppercase tracking-wider px-4 py-3">
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-grey-100 hover:bg-grey-50 cursor-pointer transition-colors duration-150">
      <td className="px-4 py-3.5 text-sm text-grey-700">
    </tr>
  </tbody>
</table>
```
- Header: `bg-grey-50`, `text-xs uppercase tracking-wider`
- Rows: `hover:bg-grey-50`, `border-b border-grey-100`
- Clickable rows: always `cursor-pointer`
- Last row: no bottom border (`last:border-0`)

### Page Hero Sections
```tsx
<div className="bg-gradient-to-br from-[#002847] via-[#003a63] to-[#004080] px-8 py-9 relative overflow-hidden">
  {/* Radial glow: absolute top-[-60px] right-[-60px] w-72 h-72 bg-[radial-gradient(...)] */}
  {/* Bottom accent line: absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00b4d8]/40 to-transparent */}
  <div className="text-xs text-white/50 font-mono mb-2.5">{/* breadcrumb */}</div>
  <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-white">{/* title */}</h1>
  <p className="mt-1.5 text-sm text-white/60">{/* subtitle */}</p>
</div>
```

### Reference Number Boxes
Case IDs, RMA numbers, SAP refs — always monospace, always in a styled pill:
```tsx
<span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
  CASE-202604-0047
</span>
```

---

## Icons

Use **Lucide React** exclusively. Never use emoji as icons. All icons must be from the same set.

```tsx
import { CheckCircle, AlertCircle, Clock, Package, Wrench } from 'lucide-react'
// Size: w-4 h-4 for inline, w-5 h-5 for buttons, w-6 h-6 for cards
```

---

## Spacing System

Use Tailwind's spacing scale consistently:
- Page content padding: `px-8 py-7`
- Card body: `p-6`
- Card header: `px-6 py-4`
- Table cells: `px-4 py-3.5`
- Gap between cards: `gap-5` or `gap-6`
- Form group spacing: `mb-5`
- Section spacing: `mb-6`

---

## Animation Rules

- All hover transitions: `transition-all duration-200`
- Active/pulse states (e.g. current workshop stage): `animate-pulse` with `ring-4 ring-blue-500/20`
- Page load stagger: `animate-in` with `fade-in slide-in-from-bottom-2` and staggered delays
- Loading skeletons: `animate-pulse bg-grey-100 rounded`
- Always include: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`

---

## Accessibility Rules (WCAG AA minimum)

- All interactive elements: visible focus ring (`focus-visible:ring-2 focus-visible:ring-blue-500`)
- All form inputs: associated `<label>` with `htmlFor`
- All images: descriptive `alt` text
- Minimum contrast: 4.5:1 for body text, 3:1 for large text
- Colour alone never conveys status — always use text or icon alongside colour
- Tab order must follow visual flow

---

## Pre-Build Checklist

Before writing any component code, answer:

1. **Have I opened the prototype** (`docs/cosworth-rma-portal-v2.html`) to see exactly how this page/component looks?
2. **Am I using Cosworth brand tokens** — not Tailwind defaults like `blue-600` but the custom CSS variables?
3. **Is the component mobile-first** — does it work at 375px before I consider desktop?
4. **Are all icons from Lucide** — no emoji, no other icon sets?
5. **Do all interactive elements have** `cursor-pointer` and `transition-all duration-200`?
6. **Are all form inputs** properly labelled with `<label htmlFor>`?

---

## Industry Classification for This Project

This portal matches **two** industry types from the design system:

- **B2B Enterprise** → Minimalism & Swiss Style → navy, grey, white → structured, clean grid
- **Motorsport / Engineering** → Dark Mode accent → Space Grotesk / DM Sans → sharp data viz

The result is a **dark-accented enterprise portal** — navy hero headers + clean white card interiors + monospace reference numbers. This combination is already established in the prototype. Maintain it consistently across every page.

---

*UI/UX Design Intelligence — Cosworth RMA Portal adaptation*
*Source: UI UX Pro Max v2.2.1 (MIT) + Anthropic frontend-design skill*
