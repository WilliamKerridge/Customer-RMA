# /check-prototype

Look up how a specific page or component should look in the Cosworth prototype before building it.

## Usage
```
/check-prototype [page or component name]
```

Examples:
- `/check-prototype workshop stage tracker`
- `/check-prototype admin case detail page`
- `/check-prototype hold state banner`
- `/check-prototype products and fees table`

## What this command does

1. Opens `docs/cosworth-rma-portal-v2.html`
2. Locates the relevant page or component in the prototype
3. Describes the exact visual structure, layout, colours, and interactions
4. Lists the key elements to replicate in the React component
5. Flags any interactions (clicks, toggles, animations) that need to be wired up

## Use this command

- **Before building any new page or component** — always check the prototype first
- **When you're unsure about layout** — the prototype is the source of truth for design
- **When a component looks wrong** — compare against the prototype before making changes

## Prototype page reference

| Bottom nav label | Page ID | What it shows |
|---|---|---|
| Login | page-login | Sign in / register / guest option |
| Submit RMA | page-submit | 5-step form wizard |
| Success | page-success | Case ID confirmation |
| My Cases | page-track | Customer case list |
| Hold / Action Req. | page-case-hold | Action Required banner + response form |
| Case (In Repair) | page-case-detail | Workshop stage tracker + timeline |
| Admin Queue | page-admin | Staff dashboard + case table |
| Admin Case | page-admin-case | Full case management |
| Products & Fees | page-products | Combined table with inline fee editing |
| Accounts | page-accounts | Account list |
| Account Detail | page-account-detail | Account settings + cases |
| Power BI Import | page-import | Upload → preview → confirm |
