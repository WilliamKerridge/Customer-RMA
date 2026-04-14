# /review-component

Review a React component or page against the Cosworth prototype and design rules.

## Usage
```
/review-component [file path]
```

Example:
- `/review-component src/components/cases/WorkshopStageTracker.tsx`
- `/review-component src/app/(admin)/products/page.tsx`

## What this command does

1. Reads the specified component file
2. Opens the relevant page in `docs/cosworth-rma-portal-v2.html` prototype to compare
3. Reads `.claude/UI_UX_DESIGN.md` design rules
4. Checks the component against both the prototype and design rules
5. Reports any discrepancies and suggests fixes

## Review checklist

### Visual fidelity (vs prototype)
- [ ] Layout matches prototype structure
- [ ] Colours use Cosworth brand tokens (not raw Tailwind defaults)
- [ ] Typography uses Space Grotesk for headings, DM Sans for body, DM Mono for reference numbers
- [ ] Status badges match prototype colour scheme
- [ ] Spacing and padding match prototype proportions

### Code quality
- [ ] TypeScript — no `any` types
- [ ] All props typed with interfaces
- [ ] Server Component vs Client Component used correctly
- [ ] `next/image` used for all images
- [ ] `next/font/google` used for fonts (no `<link>` tags)

### Accessibility
- [ ] All form inputs have `<label htmlFor>`
- [ ] All interactive elements have `cursor-pointer`
- [ ] Focus states visible: `focus-visible:ring-2`
- [ ] Colour alone not used to convey status
- [ ] `alt` text on all images

### Interactions
- [ ] All transitions: `transition-all duration-200`
- [ ] Loading states on async operations
- [ ] Error states handled and displayed
- [ ] `prefers-reduced-motion` respected

### Security
- [ ] No sensitive data exposed in component props or state
- [ ] `CREDIT_HELD` not referenced anywhere in customer-facing component
- [ ] Internal-only data not rendered conditionally (filtered at API level)

## Output format

```
MATCHES PROTOTYPE: [yes/no — brief note]
ISSUES FOUND: [N]

1. [Issue description]
   File: [path] Line: [N]
   Fix: [specific change]
```
