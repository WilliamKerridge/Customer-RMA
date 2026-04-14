# Cosworth Electronics — RMA Portal
## Project Setup Guide — Getting Started with Claude Code

> This guide walks you through setting up the project from scratch, placing all documents correctly, and starting your first Claude Code build session. Follow every step in order.

---

## What's in This Package

| File | Where it goes | Purpose |
|---|---|---|
| `CLAUDE.md` | Project root | Claude Code reads this automatically every session |
| `TESTING.md` | Project root | Testing rules — read every session involving tests |
| `.claude/UI_UX_DESIGN.md` | `.claude/` folder | Design intelligence — read before any UI work |
| `.claude/commands/implement-phase.md` | `.claude/commands/` | `/implement-phase` slash command |
| `.claude/commands/fix-failing-test.md` | `.claude/commands/` | `/fix-failing-test` slash command |
| `.claude/commands/security-check.md` | `.claude/commands/` | `/security-check` slash command |
| `.claude/commands/review-component.md` | `.claude/commands/` | `/review-component` slash command |
| `.claude/commands/write-tests.md` | `.claude/commands/` | `/write-tests` slash command |
| `.claude/commands/check-prototype.md` | `.claude/commands/` | `/check-prototype` slash command |
| `docs/Cosworth_RMA_Complete_Brief_v1.1.md` | `docs/` | Full requirements specification |
| `docs/Cosworth_RMA_Claude_Code_Guide.md` | `docs/` | Phase-by-phase build guide with exact prompts |
| `docs/Cosworth_RMA_Testing_Security_Guide.md` | `docs/` | Full test suite spec and security audit checklist |
| `docs/cosworth-rma-portal-v2.html` | `docs/` | Interactive prototype — open in browser |

---

## Step 1 — Prerequisites

Before you start, make sure the following are installed. Open a terminal in VS Code (`Ctrl + `` ` ``) and run each check:

### Node.js (version 18 or higher required)
```
node -v
```
If not installed: download the LTS version from https://nodejs.org and install it. Restart VS Code after.

### Git
```
git --version
```
If not installed: download from https://git-scm.com/download/win and install with all defaults.

### Claude Code CLI
```
claude --version
```
If not installed:
```
npm install -g @anthropic-ai/claude-code
claude auth login
```
The login command opens a browser — sign in with your Anthropic (claude.ai) account.

### Supabase CLI
```
supabase --version
```
If not installed:
```
npm install -g supabase
```

---

## Step 2 — Create the Next.js Project

Open a terminal, navigate to where you want the project to live, then run:

```
cd C:\Projects
npx create-next-app@latest cosworth-rma
```

Answer the prompts exactly as follows:

```
TypeScript?                    → Yes
ESLint?                        → Yes
Tailwind CSS?                  → Yes
src/ directory?                → Yes
App Router?                    → Yes
Customize import alias?        → No
```

Once complete:
```
cd cosworth-rma
code .
```

VS Code opens with the project.

---

## Step 3 — Place the Project Documents

This is the most important step. All documents must be in the right location so Claude Code can find them automatically.

### 3.1 Create the folder structure

In the VS Code terminal:
```
mkdir docs
mkdir .claude
mkdir .claude\commands
```

> **Note on Windows:** If `mkdir .claude` fails because the name starts with a dot, use:
> ```
> New-Item -ItemType Directory -Name ".claude"
> New-Item -ItemType Directory -Path ".claude\commands"
> ```

### 3.2 Copy all files into the project

Copy every file from this package into your project exactly as shown:

```
cosworth-rma/
├── CLAUDE.md                              ← root (Claude reads automatically)
├── TESTING.md                             ← root (Claude reads for test sessions)
│
├── .claude/
│   ├── UI_UX_DESIGN.md                    ← design intelligence skill
│   └── commands/
│       ├── implement-phase.md             ← /implement-phase command
│       ├── fix-failing-test.md            ← /fix-failing-test command
│       ├── security-check.md             ← /security-check command
│       ├── review-component.md            ← /review-component command
│       ├── write-tests.md                 ← /write-tests command
│       └── check-prototype.md             ← /check-prototype command
│
└── docs/
    ├── Cosworth_RMA_Complete_Brief_v1.1.md
    ├── Cosworth_RMA_Claude_Code_Guide.md
    ├── Cosworth_RMA_Testing_Security_Guide.md
    └── cosworth-rma-portal-v2.html
```

### 3.3 Why each location matters

**`CLAUDE.md` in root** — Claude Code reads any `CLAUDE.md` in the project root automatically at the start of every session. No prompt needed.

**`TESTING.md` in root** — Claude Code also reads `TESTING.md` automatically. It reinforces the testing prime directive every session.

**`.claude/UI_UX_DESIGN.md`** — Claude Code reads files in the `.claude/` folder. This makes the design intelligence available to every UI build session without you having to reference it manually.

**`.claude/commands/`** — Slash commands. In Claude Code, type `/` to see available commands. Each `.md` file in this folder becomes a command you can invoke.

**`docs/`** — Reference documents. Claude Code can read these when you reference them in prompts or when slash commands point to them.

### 3.4 Verify the structure

```
ls CLAUDE.md
ls TESTING.md
ls .claude\
ls .claude\commands\
ls docs\
```

All files should be present before moving to the next step.

---

## Step 4 — Install Dependencies

In the VS Code terminal, run all of these:

```
npm install @supabase/supabase-js @supabase/ssr
npm install better-auth
npm install resend @react-email/components
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install react-hook-form @hookform/resolvers zod
npm install xlsx
npm install date-fns
npm install clsx tailwind-merge
npm install lucide-react
npm install -D @types/node
```

---

## Step 5 — Set Up External Services

You need accounts on three services before you can build. Do all three now so you have your keys ready.

### 5.1 Supabase (database)
1. Go to https://supabase.com → Sign up → New Project
2. Name: `cosworth-rma` · Region: `West EU (Ireland)` · Create a strong database password and save it
3. Wait ~2 minutes for provisioning
4. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public** key
   - **service_role** key (reveal and copy — keep this secret)
5. Copy your **project ref** — it's the `abcdefgh` part of your project URL

### 5.2 Resend (email)
1. Go to https://resend.com → Sign up
2. Go to **API Keys → Add API Key** → name it `cosworth-rma` → copy the key (shown once only)

### 5.3 Stripe (payments — stub mode for now)
1. Go to https://stripe.com → Log in → make sure you are in **Test mode**
2. Go to **Developers → API Keys** → copy Publishable key (`pk_test_...`) and Secret key (`sk_test_...`)
3. Go to **Developers → Webhooks → Add endpoint** → enter placeholder URL `https://placeholder.cosworth.com/api/stripe/webhook` → select events `payment_intent.succeeded` and `payment_intent.payment_failed` → copy the Signing secret (`whsec_...`)

---

## Step 6 — Create the Environment File

In the project root, create a file called `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Resend
RESEND_API_KEY=your_resend_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Payment mode — keep as stub until Stripe is activated
PAYMENT_MODE=stub

# Office email routing — update with real inboxes before going live
UK_RETURNS_EMAIL=returns@cosworth.com
US_SALES_EMAIL=us-sales@cosworth.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a secure value for `BETTER_AUTH_SECRET` by running:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste the output into the env file.

---

## Step 7 — Initialise Supabase

```
supabase init
supabase login
supabase link --project-ref your_project_ref
```

Replace `your_project_ref` with the ref from Step 5.1 (the `abcdefgh` part of your project URL).

---

## Step 8 — Open the Prototype

Before writing a single line of code, open the prototype in your browser:

```
docs/cosworth-rma-portal-v2.html
```

Just double-click it or drag it into Chrome/Edge. Use the bottom pill navigation to move between all 12 pages:

- **Login** — sign in / register / guest option
- **Submit RMA** — full 5-step wizard
- **Success** — case ID confirmation
- **My Cases** — customer case list with action required cards
- **Hold / Action Req.** — customer view with response banner
- **Case (In Repair)** — workshop stage tracker (7 Planner stages)
- **Admin Queue** — staff case queue with stats
- **Admin Case** — full case management
- **Products & Fees** — combined table with inline fee editing
- **Accounts** — customer account list
- **Power BI Import** — upload → preview → confirm flow
- **Account Detail** — account settings + cases

This is your target. Every component Claude Code builds should match what you see here.

---

## Step 9 — Install Claude Code Plugins

Two plugins will significantly improve what Claude Code produces on this project. Install both before starting the build.

---

### Plugin 1 — UI UX Pro Max

**What it is:** A design intelligence skill with a searchable database of 50+ UI styles, 161 colour palettes, 57 font pairings, and 99 UX guidelines. It activates automatically when Claude Code works on any UI task and gives it the design reasoning to produce professional, non-generic interfaces.

**GitHub:** `github.com/nextlevelbuilder/ui-ux-pro-max-skill`

**Install via the Claude Code CLI:**
```
npm install -g uipro-cli
uipro init --ai claude
```

Or install via the Claude plugin marketplace inside Claude Code:
```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

**What it adds to your project:**
```
skills/
└── ui-ux-pro-max/
    ├── SKILL.md          ← main design intelligence skill
    └── scripts/
        └── search.py     ← searchable design database (styles, palettes, fonts)
```

**How it works in practice:** When you ask Claude Code to build a component or page, it automatically searches the database for the right style, colour palette, and font pairing for a B2B motorsport engineering portal before writing any code. You get a consistent professional design every time rather than generic AI aesthetics.

> **Note:** There is a known folder structure issue with some versions. If the skill does not activate automatically after installation, move the skill folder from `.claude/skills/ui-ux-pro-max/` to `skills/ui-ux-pro-max/`. See the GitHub issues page for the latest status.

---

### Plugin 2 — Superpowers

**What it is:** A complete agentic development methodology by Jesse Vincent (obra). It installs 20+ battle-tested skills that activate automatically — TDD, systematic debugging, subagent-driven development, verification before completion, and more. It also adds three powerful slash commands: `/superpowers:brainstorm`, `/superpowers:write-plan`, and `/superpowers:execute-plan`.

**GitHub:** `github.com/obra/superpowers`

**Install inside Claude Code:**
```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Then quit and restart Claude Code. You should see a session-start message confirming Superpowers is active.

**Verify it's working:**
```
Tell me about your superpowers
```

Claude should list the available skills including `test-driven-development`, `systematic-debugging`, `verification-before-completion`, and others.

**The most relevant Superpowers skills for this project:**

| Skill | When it activates | What it does |
|---|---|---|
| `test-driven-development` | When implementing any feature | Enforces red-green-refactor cycle — write test first, then code |
| `systematic-debugging` | When something breaks | Methodical root cause investigation before guessing |
| `verification-before-completion` | Before Claude says "done" | Checklist of checks before claiming a task is complete |
| `subagent-driven-development` | During complex build phases | Breaks work into independent tasks with two-stage review |
| `brainstorming` | Before writing an implementation plan | Spec refinement before any code is written |

**The three slash commands:**
```
/superpowers:brainstorm    ← refine what you want before building it
/superpowers:write-plan    ← create a clear implementation plan
/superpowers:execute-plan  ← execute the plan in reviewed batches
```

> **Important for this project:** Superpowers includes its own TDD skill which enforces writing tests before code. This is compatible with our testing rules — the prime directive (never modify a test) still applies. If there is ever a conflict between a Superpowers skill instruction and something in `CLAUDE.md` or `TESTING.md`, your project files take priority.

---




---

### Plugin 3 — Anthropic Frontend Design

**What it is:** The official Anthropic skill for production-grade frontend interfaces. Activates automatically when you ask Claude to build frontend interfaces and establishes a design direction before any code is written — preventing generic AI aesthetics. This is the canonical version of the design intelligence approach; it replaces the `.claude/UI_UX_DESIGN.md` file we created, which was adapted from it.

**Install:**
```
npx skills add https://github.com/anthropics/skills --skill frontend-design
```

Or via the Claude Code plugin marketplace:
```
/plugin install frontend-design@claude-code-plugin
```

**What it does for this project:** Every time Claude builds a React component or page, it commits to a clear aesthetic direction (dark navy enterprise, Space Grotesk headings, data-dense layout) before writing a single line of code. It explicitly warns against the patterns to avoid — Inter font, purple gradients, generic card layouts.

> **Note:** After installing this, you can remove `.claude/UI_UX_DESIGN.md` from your project if you prefer — the official skill covers the same ground. Or keep both; they complement rather than conflict.

---

### Plugin 4 — Web Design Guidelines (Vercel)

**What it is:** A code reviewer that checks UI code against 100+ Web Interface Guidelines covering accessibility, performance, and UX. Unlike the design generation skills, this one audits code that already exists. It fetches the latest guidelines live from Vercel's repo so the rules stay current.

**Install:**
```
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a claude-code
```

**When to use it on this project:** After completing each build phase, run:
```
Use the web-design-guidelines skill to review src/components/cases/
```

This catches accessibility violations, missing ARIA attributes, unlabelled form inputs, and focus management issues that are easy to miss when building quickly. Think of it as an automated code review pass after each phase.

**What it checks:** Proper ARIA attributes, visible focus states, labelled inputs, touch target sizes (important for trackside tablet use), reduced-motion support, semantic HTML, keyboard navigation, heading hierarchy, colour contrast, and dozens more.

---

### Plugin 5 — shadcn/ui Skill

**What it is:** Gives Claude project-aware context about shadcn/ui — reads your `components.json` and provides the correct APIs, aliases, installed components, and patterns so it generates correct code on the first try.

This is directly relevant because the project uses shadcn/ui for admin forms, dialogs, dropdowns, and data tables throughout the build.

**Install:**
```
npx shadcn skill
```

Or manually:
```
npx skills add https://github.com/shadcn-ui/ui --skill shadcn -a claude-code
```

**What it does for this project:** Without this skill, Claude guesses at component imports and prop APIs. With it, Claude reads your actual `components.json` and knows exactly which components are installed, what your Tailwind aliases are, and which Radix UI primitives underpin each component. Far fewer "component not found" errors during the build.

**Run after your initial project setup** (after Phase 2 when shadcn is initialised):
```
npx shadcn init
npx shadcn skill
```

---

### Full install sequence (all plugins)

Run these in order inside Claude Code and your terminal:

```bash
# Terminal — install via npx (run from project root)
uipro init --ai claude                                              # UI UX Pro Max
npx skills add https://github.com/anthropics/skills --skill frontend-design -a claude-code   # Anthropic Frontend Design
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a claude-code         # Web Design Guidelines

# After Phase 2 (once shadcn is set up)
npx shadcn skill                                                    # shadcn/ui

# Inside Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Restart Claude Code after all installs. Verify:
```
What skills and plugins do you have available?
```

You should see: UI UX Pro Max, frontend-design, web-design-guidelines, shadcn, and the Superpowers skills.

---



Press `Ctrl+Shift+X` and install:

| Extension | Why |
|---|---|
| **Claude Code** (Anthropic) | AI coding assistant |
| **ESLint** (Microsoft) | Code quality |
| **Prettier** (Prettier) | Formatting |
| **Tailwind CSS IntelliSense** (Bradlc) | Class autocomplete |

---

### Plugin install order

```
# 1. UI UX Pro Max
uipro init --ai claude
# OR
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill

# 2. Superpowers
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# 3. Restart Claude Code after both installs
```

After restart, verify both are active:
```
What skills and plugins do you have available?
```

Claude should list both UI UX Pro Max and the Superpowers skills.

## Step 10 — Starting Your First Claude Code Session

### Open Claude Code
Press `Ctrl+Shift+P` → type `Claude: Open Chat` → the panel opens on the right.

### Confirm context is loaded
Claude Code reads `CLAUDE.md` and `TESTING.md` automatically. Confirm with:

```
What project are we building, what is the payment mode, and what is the testing prime directive?
```

Claude should answer: Cosworth RMA Portal, `PAYMENT_MODE=stub`, and "never modify a test to make it pass."

If it doesn't respond correctly:
```
Please read CLAUDE.md and TESTING.md in the project root.
```

### Using slash commands
Type `/` in the Claude Code chat to see available commands. The ones in this project:

| Command | What it does |
|---|---|
| `/implement-phase 1` | Starts Phase 1 of the build — reads the guide and implements it |
| `/check-prototype workshop stage tracker` | Describes exactly how that component looks in the prototype |
| `/security-check src/app/api/cases/route.ts` | Audits a file against security rules |
| `/review-component src/components/cases/CaseTimeline.tsx` | Checks a component against prototype and design rules |
| `/fix-failing-test [paste error]` | Fixes failing tests by correcting application code |
| `/write-tests hold state feature` | Writes tests per the testing guide spec |

### Using the design intelligence
The `.claude/UI_UX_DESIGN.md` skill loads automatically. For any UI build session you can also explicitly trigger it:

```
Before building this component, check .claude/UI_UX_DESIGN.md 
and confirm the Cosworth design rules you'll apply.
```

### Set the testing rule for test sessions
At the start of any session involving tests, paste:

```
TESTING RULE — entire session:
Never modify a test to make it pass. Fix the application code.
Read TESTING.md before writing or changing any test file.
```

---

## Step 11 — Working Through the Build Guide

Open `docs/Cosworth_RMA_Claude_Code_Guide.md`. The build is split into 10 phases. Work through them in order.

### How each phase works

1. **Read the phase intro** — understand what you're building before you start
2. **Paste the prompt** into Claude Code exactly as written
3. **Review** what Claude proposes before accepting — read the diff
4. **Accept** the changes
5. **Run the verification step** listed after the prompt
6. **Fix any errors** before moving to the next prompt — paste the full error message back to Claude

### The most important rule

> If something breaks, paste the **complete error message** into Claude Code. Never describe the error in your own words — always paste it verbatim. Claude needs the exact text.

### Phase overview

| Phase | What gets built | Key verification |
|---|---|---|
| 1 | Tailwind colours, nav, footer, shared UI components | `npm run dev` — app loads at localhost:3000 |
| 2 | Database schema, seed data, Supabase clients, auth, login page | `supabase db push` — tables appear in Supabase dashboard |
| 3 | 5-step RMA submission form, case creation API | Submit a form — case appears in Supabase |
| 4 | Customer case list, case detail, workshop tracker, hold banner | Login as customer — cases visible with stage tracker |
| 5 | Admin dashboard, case queue, case detail, approve/reject/stage | Login as staff — approve a case, RMA number issued |
| 6 | Workshop stages, Products & Fees page, Accounts pages | Navigate all admin pages — fees editable inline |
| 7 | All Resend email templates and sending logic | Submit a case — email arrives in inbox |
| 8 | Payment stub page and Stripe wiring | Non-credit customer sees stub notice |
| 9 | Power BI Excel import page | Upload test file — preview table shows correctly |
| 10 | Seed data, loading states, error handling | Full demo flows work end to end |

---

## Step 12 — Running the Demo

Once Phase 10 is complete, run:
```
npm run dev
```

Open http://localhost:3000 and walk through these five flows:

**Flow 1 — Submit a return** (5 min)
Log in as `demo.customer@btsport.com` → New Return → complete all 5 steps → submit → note the Case ID

**Flow 2 — Customer tracking** (3 min)
From the success page → Track This Case → show workshop progress bar at Final Test stage → show reference boxes

**Flow 3 — Admin approval** (5 min)
New tab → log in as `demo.staff@cosworth.com` → Admin Queue → approve the submitted case → advance workshop stages → show customer view updating

**Flow 4 — Action Required hold** (4 min)
Admin view → set hold to "Awaiting Confirmation — Customer" → type a question → customer tab shows orange Action Required banner → customer responds → hold clears

**Flow 5 — Payment stub** (2 min)
Log in as `demo.customer2@tfsport.com` (no credit terms) → submit a return → show the payment notice stub page → explain the one-line switch to activate Stripe

---

## Step 13 — Before Going Live

Work through the pre-deployment checklist in `docs/Cosworth_RMA_Testing_Security_Guide.md` (Section 11). Key items:

```
npm run test:coverage     → all unit and integration tests pass
npm run test:rls          → all Supabase RLS policies verified
npm run test:e2e          → all Playwright flows pass
npm run build             → no TypeScript errors
```

Then follow Section 9 of the build guide for Vercel deployment and DNS setup.

---

## Reference — Document Map

When you need to look something up, go to the right document:

| I need to know... | Go to... | Section |
|---|---|---|
| Database table columns | Complete Brief | Section 5 |
| API route behaviour | Complete Brief | Sections 7–11 |
| Email template specs | Complete Brief | Section 9 |
| Auth roles and permissions | Complete Brief | Section 10 |
| Payment stub logic | Complete Brief | Section 11 |
| Exact Claude Code prompt for a feature | Build Guide | Phase matching the feature |
| What to verify after each build step | Build Guide | After each prompt |
| How to set up tests | Testing Guide | Section 2 |
| Security audit checklist | Testing Guide | Section 6 |
| RLS verification | Testing Guide | Section 7 |
| What a page should look like | Prototype HTML | Open in browser |
| Folder structure | Complete Brief | Section 6 |
| Workshop stage mapping | CLAUDE.md | Workshop Stages section |
| Fee column names | CLAUDE.md | Fee Structure section |

---

## Quick Reference — Key Decisions Made

These decisions are final and reflected in all documents. Do not revisit them:

- **No SAP milestone tier on customer view** — workshop tracker shows only 7 Planner stages
- **No separate fees page** — fees are inline on the Products & Fees page
- **Three fee types** — `test_fee`, `standard_repair_fee`, `major_repair_fee` (not inspection/repair/service)
- **Payment is stubbed** — `PAYMENT_MODE=stub` shows contact message; flip to `stripe` when ready
- **Case ID follows everything** — one Case ID, RMA number and SAP refs attach later
- **USA → UK transfers** create an INT child case; completion auto-updates parent
- **Credit held is internal** — customers always see "On Hold — Please Contact Us"
- **`CREDIT_HELD` never reaches the customer** — enforced at API, RLS, and test level

---

*Cosworth Electronics RMA Portal — Project Package*
*Documents: Brief v1.1 · Build Guide · Testing Guide · Prototype v2 · CLAUDE.md*
