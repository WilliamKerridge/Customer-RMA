# Cosworth RMA Portal — Claude Code Build Guide
## Windows / VS Code — Full Stack Demo

> **Purpose:** Build a fully working demo of the Cosworth RMA & Returns Portal using Claude Code in VS Code on Windows. The demo covers the four key flows: submit a return, track a case, admin approval and workshop stage management, and the Action Required customer response mechanism.
>
> **Payment approach:** Stripe is wired in and ready but starts in stub mode. Non-credit customers see a "Contact Cosworth" notification. One environment variable switches to live Stripe when ready.

---

## Contents

1. [Environment Setup](#1-environment-setup)
2. [Project Scaffold](#2-project-scaffold)
3. [Supabase Setup](#3-supabase-setup)
4. [Claude Code Setup in VS Code](#4-claude-code-setup-in-vs-code)
5. [Build Order & Claude Prompts](#5-build-order--claude-prompts)
   - [Phase 1 — Foundation](#phase-1--foundation)
   - [Phase 2 — Database & Auth](#phase-2--database--auth)
   - [Phase 3 — RMA Submission Form](#phase-3--rma-submission-form)
   - [Phase 4 — Customer Case Tracking](#phase-4--customer-case-tracking)
   - [Phase 5 — Admin Portal](#phase-5--admin-portal)
   - [Phase 6 — Workshop Stages & Hold States](#phase-6--workshop-stages--hold-states)
   - [Phase 7 — Email Notifications](#phase-7--email-notifications)
   - [Phase 8 — Payment Stub & Stripe Wiring](#phase-8--payment-stub--stripe-wiring)
   - [Phase 9 — Seed Data & Demo Polish](#phase-9--seed-data--demo-polish)
6. [Running the Demo](#6-running-the-demo)
7. [Demo Script](#7-demo-script)
8. [Activating Stripe (When Ready)](#8-activating-stripe-when-ready)
9. [Deployment to Vercel](#9-deployment-to-vercel)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Environment Setup

Work through each section below. If you already have something installed, skip to the verification step to confirm it is working.

---

### 1.1 Install Node.js

Node.js powers the Next.js app and all build tooling.

**Check if already installed:**
Open a terminal in VS Code (`Ctrl + `` ` ``) and run:
```
node -v
npm -v
```
If both return version numbers (Node 18+ required), skip to Section 1.2.

**Install if needed:**
1. Go to https://nodejs.org
2. Download the **LTS** version (the left button)
3. Run the installer — accept all defaults
4. Restart VS Code after installation
5. Re-open the terminal and run `node -v` to confirm

---

### 1.2 Install Git

**Check if already installed:**
```
git --version
```
If a version number appears, skip to Section 1.3.

**Install if needed:**
1. Go to https://git-scm.com/download/win
2. Download and run the installer — accept all defaults
3. Restart VS Code
4. Run `git --version` to confirm

---

### 1.3 Install the Supabase CLI

The Supabase CLI lets you push your database schema from your machine to the cloud project.

**Check if already installed:**
```
supabase --version
```

**Install if needed:**
Run this in the VS Code terminal:
```
npm install -g supabase
```
Then confirm:
```
supabase --version
```

---

### 1.4 Install Claude Code CLI

**Check if already installed:**
```
claude --version
```

**Install if needed:**
```
npm install -g @anthropic-ai/claude-code
```

After installation, authenticate:
```
claude auth login
```
This opens a browser window — log in with your Anthropic account (the same account you use on claude.ai).

---

### 1.5 VS Code Extensions

Open VS Code and install the following extensions if not already present. Press `Ctrl+Shift+X` to open the Extensions panel and search for each:

| Extension | Publisher | Why |
|---|---|---|
| **Claude Code** | Anthropic | AI coding assistant in VS Code |
| **ESLint** | Microsoft | Code quality checks |
| **Prettier** | Prettier | Code formatting |
| **Tailwind CSS IntelliSense** | Bradlc | Autocomplete for Tailwind classes |
| **TypeScript** | Microsoft | Usually pre-installed |

To confirm Claude Code extension is active: look for the Claude icon in the left sidebar or press `Ctrl+Shift+P` and type `Claude`.

---

### 1.6 Create a Supabase Account

1. Go to https://supabase.com and click **Start your project**
2. Sign up with GitHub or email
3. Once logged in, click **New Project**
4. Fill in:
   - **Organisation:** your name or Cosworth
   - **Project name:** `cosworth-rma`
   - **Database password:** create a strong password and **save it somewhere safe**
   - **Region:** choose `West EU (Ireland)` for lowest latency from the UK
5. Click **Create new project** and wait ~2 minutes for it to provision
6. Once ready, go to **Project Settings → API** and note down:
   - `Project URL` (looks like `https://xxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (click to reveal — keep this secret)

---

### 1.7 Create a Resend Account

Resend handles all transactional emails.

1. Go to https://resend.com and sign up
2. Go to **API Keys → Add API Key**
3. Name it `cosworth-rma` and copy the key — you only see it once
4. Go to **Domains** and add your sending domain if you have one, or use Resend's default `onboarding@resend.dev` for testing

---

### 1.8 Stripe Setup (Wired but Stubbed)

Stripe is configured now so it is ready to activate without code changes later.

1. Go to https://stripe.com — log in or create an account
2. In the Stripe dashboard, make sure you are in **Test mode** (toggle in top left)
3. Go to **Developers → API Keys** and copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
4. Go to **Developers → Webhooks → Add endpoint**
   - For now enter a placeholder URL: `https://placeholder.cosworth.com/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **Signing secret** (starts with `whsec_`)
   - You will update this URL after deploying to Vercel

---

## 2. Project Scaffold

### 2.1 Create the Next.js Project

Open VS Code terminal and navigate to where you want the project. For example:
```
cd C:\Projects
```

Run the Next.js project creator:
```
npx create-next-app@latest cosworth-rma
```

When prompted, answer exactly as follows:

```
Would you like to use TypeScript?                → Yes
Would you like to use ESLint?                    → Yes
Would you like to use Tailwind CSS?              → Yes
Would you like to use the src/ directory?        → Yes
Would you like to use App Router?                → Yes
Would you like to customize the default import alias? → No
```

After it finishes:
```
cd cosworth-rma
code .
```

This opens the project in VS Code.

---

### 2.2 Install Project Dependencies

In the VS Code terminal (`Ctrl + `` ` ``), run:

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
```

Then install dev dependencies:
```
npm install -D @types/node
```

---

### 2.3 Create the Environment File

In the project root, create a file called `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Better Auth
BETTER_AUTH_SECRET=generate_a_random_32_char_string_here
BETTER_AUTH_URL=http://localhost:3000

# Resend
RESEND_API_KEY=your_resend_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Payment mode — set to "stripe" to activate real payments
PAYMENT_MODE=stub

# Office email routing
UK_RETURNS_EMAIL=returns@cosworth.com
US_SALES_EMAIL=us-sales@cosworth.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace each placeholder with your actual values from Section 1.

**Generate a random secret for BETTER_AUTH_SECRET:**
Run this in the terminal:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output into the env file.

---

### 2.4 Create .env.local.example

Create a copy of the env file without real values for version control:
```
copy .env.local .env.local.example
```
Then edit `.env.local.example` and replace all real values with placeholder text.

Make sure `.env.local` is in your `.gitignore` (Next.js adds it automatically).

---

## 3. Supabase Setup

### 3.1 Initialise Supabase in the Project

In the VS Code terminal:
```
supabase init
```

This creates a `supabase/` folder in your project.

---

### 3.2 Link to Your Cloud Project

```
supabase login
supabase link --project-ref your_project_ref
```

Your project ref is the string in your Supabase project URL — e.g. if the URL is `https://abcdefgh.supabase.co` then the ref is `abcdefgh`.

---

### 3.3 Create the Schema File

Create the file `supabase/migrations/001_initial_schema.sql`. The content of this file will be generated by Claude Code in Phase 2. Leave it empty for now.

---

## 4. Claude Code Setup in VS Code

### 4.1 Open Claude Code

There are two ways to use Claude Code in VS Code:

**Option A — Integrated panel (recommended):**
- Press `Ctrl+Shift+P`
- Type `Claude: Open Chat`
- The Claude panel opens on the right side of VS Code

**Option B — Terminal CLI:**
- Open the VS Code terminal
- Type `claude` and press Enter
- Claude Code starts in interactive mode

Either approach works. The integrated panel is easier for reviewing and applying code changes.

---

### 4.2 How to Use This Guide with Claude Code

Each phase below contains **one or more prompts** to give Claude Code. Follow this process for each prompt:

1. Copy the prompt exactly
2. Paste it into Claude Code
3. Review what Claude proposes — read through it before accepting
4. Accept the changes (Claude Code will show diffs for file changes)
5. Run the verification step listed after each prompt
6. Fix any errors before moving to the next prompt

**Important:** Always run the verification step before moving on. Each phase builds on the previous one.

---

### 4.3 Giving Claude Code Context

At the start of each VS Code session, give Claude Code this context prompt first:

```
I am building the Cosworth Electronics RMA & Returns Portal. This is a Next.js 14 App Router application with TypeScript, Tailwind CSS, Supabase, Better Auth, Resend, and Stripe. The project is in the src/ directory with App Router. We are building a product returns and repair management system for a motorsport electronics company. The brand colours are: navy #003057, blue #005B99, accent #00b4d8. Always use these colours in any UI you create. Always use TypeScript strict mode with no any types. Always validate API inputs with Zod.
```

---

## 5. Build Order & Claude Prompts

---

### Phase 1 — Foundation

**Goal:** Get the app running with Cosworth branding, navigation, and layout.

---

#### Prompt 1.1 — Tailwind Brand Config

```
Update tailwind.config.ts to add Cosworth brand colours as custom tokens. Add these to the theme extend colours:
- navy: #003057
- navy-mid: #003a63  
- blue: #0066cc
- blue-light: #0080ff
- accent: #00b4d8
- cosworth-white: #ffffff
- cosworth-grey: #f5f7fa

Also add the Space Grotesk and DM Sans fonts from Google Fonts. Add the font imports to src/app/globals.css and set DM Sans as the default body font and Space Grotesk for headings.
```

**Verify:** Run `npm run dev` — the app should start at http://localhost:3000 with no errors.

---

#### Prompt 1.2 — Root Layout with Nav and Footer

```
Create the root layout at src/app/layout.tsx with a Cosworth-branded navigation bar and footer.

Navigation bar requirements:
- Dark navy background (#003057), full width, sticky, height 64px
- Left: Cosworth logo mark (a square navy button with a simple stacked layers SVG icon) followed by "COSWORTH RETURNS" in Space Grotesk bold, with RETURNS in accent colour #00b4d8
- Right: nav links area (empty for now, will be populated with auth controls later)
- Box shadow on scroll

Footer requirements:
- Dark navy background, padding 32px
- Three columns: Cosworth Ltd (Northampton address), Cosworth Electronics Ltd (Cambridge address), Cosworth Electronics LLC (Indianapolis address)
- Copyright line: "COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited"
- Links: Legal Policies, User Guides
- White text on navy, muted at 50% opacity for secondary text

Create src/components/layout/Navbar.tsx and src/components/layout/Footer.tsx as separate components imported into the layout.

The main content area should have padding-top equal to the navbar height so content is not hidden behind it.
```

**Verify:** Visit http://localhost:3000 — you should see the navy nav bar and footer.

---

#### Prompt 1.3 — Shared UI Components

```
Create the following shared UI components in src/components/ui/:

Button.tsx — variants: primary (blue #0066cc), secondary (white with grey border), success (green #10b981), danger (white with red border), ghost (transparent), amber (#f59e0b). Each variant has hover and focus states. Accept size prop: default and sm. Accept loading prop that shows a spinner and disables the button.

Badge.tsx — variants matching case statuses: submitted (light blue), review (amber), rma (purple), repair (orange), closed (green), rejected (red), hold (amber with border), action (orange with border), grey. Each badge has a coloured dot on the left.

DataTable.tsx — a reusable table component that accepts columns and data props. Includes sticky header with grey background, hover state on rows, and a clickable row callback. Columns accept a render function for custom cell content.

Card.tsx — white background, rounded-xl, border grey-200, subtle shadow. Accepts optional header prop (title string + optional right-side content slot) and body prop with padding.

All components must be fully typed with TypeScript interfaces. Export all from src/components/ui/index.ts.
```

**Verify:** No TypeScript errors (`npm run build` — fix any type errors before continuing).

---

### Phase 2 — Database & Auth

**Goal:** Supabase schema created and pushed, Better Auth configured, login and register pages working.

---

#### Prompt 2.1 — Database Schema

```
Create the complete Supabase database schema at supabase/migrations/001_initial_schema.sql.

Create the following tables with all columns exactly as specified:

TABLE: users
- id uuid primary key default gen_random_uuid()
- email text unique not null
- full_name text
- company text  
- phone text
- role text not null default 'customer' check (role in ('customer','staff_uk','staff_us','admin'))
- office text check (office in ('UK','US'))
- created_at timestamptz default now()
- updated_at timestamptz default now()

TABLE: customer_accounts
- id uuid primary key default gen_random_uuid()
- user_id uuid references users(id) on delete cascade
- company_name text
- billing_address jsonb
- shipping_address jsonb
- credit_terms boolean default false
- po_required boolean default false
- account_active boolean default true
- notes text
- created_at timestamptz default now()
- updated_at timestamptz default now()

TABLE: products
- id uuid primary key default gen_random_uuid()
- part_number text unique not null
- variant text
- display_name text not null
- category text not null
- active boolean default true
- test_fee decimal(10,2) default 0
- standard_repair_fee decimal(10,2) default 0
- major_repair_fee decimal(10,2) default 0
- notes text
- created_at timestamptz default now()
- updated_at timestamptz default now()

TABLE: cases
- id uuid primary key default gen_random_uuid()
- case_number text unique not null
- customer_id uuid references users(id)
- office text not null check (office in ('UK','US'))
- status text not null default 'SUBMITTED'
- fault_type text not null check (fault_type in ('repair','service','service_plan','loan_return','code_update'))
- fault_description text
- fault_display_info boolean default false
- fault_display_details text
- tested_on_other_unit boolean default false
- fault_follows text check (fault_follows in ('unit','car'))
- required_return_date date
- shipping_address jsonb
- rma_number text
- sap_repair_order text
- sap_sales_order text
- sap_works_order text
- sap_booked_in_date date
- sap_estimated_completion date
- sap_order_value decimal(10,2)
- sap_spent_hours decimal(6,2)
- sap_days_open integer
- last_import_at timestamptz
- workshop_stage text
- is_on_hold boolean default false
- hold_reason text
- hold_customer_label text
- awaiting_customer_question text
- payment_required boolean default false
- payment_status text default 'pending' check (payment_status in ('pending','paid','waived','invoiced','stub_notified'))
- stripe_payment_intent_id text
- po_number text
- assigned_to uuid references users(id)
- parent_case_id uuid references cases(id)
- is_internal_transfer boolean default false
- internal_po text
- created_at timestamptz default now()
- updated_at timestamptz default now()
- closed_at timestamptz

TABLE: case_products
- id uuid primary key default gen_random_uuid()
- case_id uuid references cases(id) on delete cascade
- product_id uuid references products(id)
- serial_number text
- quantity integer default 1
- fault_notes text
- test_fee_applied decimal(10,2)
- repair_fee_applied decimal(10,2)

TABLE: case_updates
- id uuid primary key default gen_random_uuid()
- case_id uuid references cases(id) on delete cascade
- author_id uuid references users(id)
- content text not null
- is_internal boolean default false
- status_change_to text
- created_at timestamptz default now()

TABLE: case_attachments
- id uuid primary key default gen_random_uuid()
- case_id uuid references cases(id) on delete cascade
- uploaded_by uuid references users(id)
- file_name text not null
- storage_path text not null
- file_size integer
- mime_type text
- created_at timestamptz default now()

TABLE: case_response_tokens
- id uuid primary key default gen_random_uuid()
- case_id uuid references cases(id) on delete cascade
- token text unique not null
- created_at timestamptz default now()
- expires_at timestamptz not null
- used_at timestamptz

TABLE: email_notifications
- id uuid primary key default gen_random_uuid()
- case_id uuid references cases(id)
- recipient_email text not null
- template text not null
- sent_at timestamptz default now()
- resend_message_id text

After all tables, add these RLS policies:
- Enable RLS on all tables
- users: users can read and update their own row. Staff and admin can read all.
- customer_accounts: users can read their own. Staff and admin can read and update all.
- products: everyone can read active products. Only staff and admin can insert/update/delete.
- cases: customers can read their own cases. Staff can read cases matching their office. Admin can read all. Insert allowed for authenticated users and service role.
- case_products, case_updates, case_attachments, case_response_tokens: follow same pattern as cases.
- email_notifications: staff and admin read only.

Also add a function and trigger to auto-update updated_at on cases and users tables.

Also add a function generate_case_number() that creates numbers in format CASE-YYYYMM-XXXX where XXXX is a zero-padded sequence number per month. Create equivalent functions for RMA-YYYYMM-XXXX and INT-YYYYMM-XXXX.
```

**Verify:** Push the schema to Supabase:
```
supabase db push
```
Go to your Supabase dashboard → Table Editor and confirm all tables exist.

---

#### Prompt 2.2 — Seed Data

```
Create supabase/seed.sql with the following seed data for the demo:

1. Seed the products table with the first 20 products from the Cosworth returns form, across these categories:
   - Engine Management Systems: Antares 8 TLA (01E-501120), MQ12Di (01E-501085), SQ6M ECU (01E-500720), SQ6 ECU (01E-500700)
   - Displays: CDU 10.3 (01D-640060), CDU 7.0 (01D-640040), CDU 4.3 (01D-640030), ICD MK2 (01D-640050), Firefly TLA (01D-640080)
   - Loggers: Badenia 4 Porsche (01L-650115-P), Badenia 3 Porsche Cup (01L-650111-P-CUP), CLU Plus (01L-650001), RLU (01L-650030), SJU (01L-650050)
   - Power Systems: Centaurus 5 TLA (01I-610100), Centaurus 4 Porsche (01I-610110-P), IPS32 Mk2 (01I-610083)
   - Steering Wheels: CCW Mk3 PSA (01D-641350-PSA), CCW Mk2 8STA (01D-641150-8STA), CCW Mk3 Analogue Paddle (01D-641390)
   
   Set test_fee to 700.00, standard_repair_fee to 1500.00, and major_repair_fee to 3500.00 as defaults for ECU/Engine Management products. Scale fees proportionally for other categories: Displays (350/750/1800), Loggers (450/950/2200), Power Systems (550/1200/2800), Steering Wheels (200/450/950).

2. Seed 3 demo user accounts:
   - Customer: email: demo.customer@btspor t.com, full_name: Will Kerridge, company: BT Sport Motorsport, role: customer
   - Staff UK: email: demo.staff@cosworth.com, full_name: Nigel Seamarks, company: Cosworth Electronics, role: staff_uk, office: UK
   - Admin: email: demo.admin@cosworth.com, full_name: Matthew Parry, company: Cosworth Electronics, role: admin, office: UK

3. Seed 1 customer_account for Will Kerridge:
   - credit_terms: true
   - po_required: true
   - account_active: true

4. Seed 2 demo cases with realistic data:
   Case 1: CASE-202604-0047
   - customer: Will Kerridge
   - office: UK
   - status: IN_REPAIR
   - fault_type: repair
   - workshop_stage: FINAL_TEST
   - product: CDU 10.3, serial CEL-20250112
   - rma_number: RMA-202604-0047
   - sap_repair_order: REP-2026-04471
   - sap_sales_order: 4500012847
   - sap_works_order: REP-2026-04471
   - sap_order_value: 340.00
   - sap_spent_hours: 2.5
   - sap_days_open: 10
   - sap_estimated_completion: 14 days from now
   - required_return_date: 45 days from now
   - po_number: BT-2026-0441

   Case 2: CASE-202604-0051
   - customer: Will Kerridge
   - office: UK
   - status: SUBMITTED
   - fault_type: repair  
   - product: Antares 8 TLA
   - required_return_date: 60 days from now

   Add 3 case_updates for Case 1 showing a realistic repair timeline.
```

**Verify:** Run `supabase db seed` then check the Supabase Table Editor — products, users, and cases should all have data.

---

#### Prompt 2.3 — Supabase Client Setup

```
Create the Supabase client utilities:

src/lib/supabase/client.ts — browser client using createBrowserClient from @supabase/ssr. Export a createClient function.

src/lib/supabase/server.ts — server client using createServerClient from @supabase/ssr that reads cookies from Next.js headers(). Export an async createClient function.

src/lib/supabase/middleware.ts — middleware helper that refreshes the session on every request.

src/types/database.ts — TypeScript types for all database tables. Create a Database interface with public.Tables for each table, with Row, Insert, and Update types for each. Include all columns from the schema.

Update middleware.ts in the project root to use the Supabase middleware helper and protect routes:
- /admin/* requires staff_uk, staff_us, or admin role — redirect to /login if not authorised
- /cases/* requires any authenticated user — redirect to /login if not authenticated
- /submit is public
- /cases/[caseId]/respond is public (token auth handled in the route handler)
```

**Verify:** No TypeScript errors. Run `npm run build`.

---

#### Prompt 2.4 — Better Auth Configuration

```
Configure Better Auth for the project.

Create src/lib/auth.ts:
- Configure Better Auth with Supabase adapter
- Email and password authentication
- Session configuration: 30 day expiry
- Define user roles: customer, staff_uk, staff_us, admin
- Password reset enabled
- Email verification required for new registrations

Create src/app/api/auth/[...all]/route.ts as the Better Auth route handler.

Create the auth pages:

src/app/(auth)/login/page.tsx:
- Cosworth branded card layout centred on the page with dark navy gradient background
- Navy card header with Cosworth logo mark icon, title "Cosworth Returns Portal", subtitle "Electronics Product Returns & RMA Management"
- Two tabs: Sign In / Register
- Sign In form: email, password, forgot password link, sign in button
- Register form: first name, last name, company, email, password fields, create account button
- Below both forms: "Continue as guest — Submit a Return Without Account" option that goes to /submit
- Full form validation with error messages
- Loading states on buttons

src/app/(auth)/forgot-password/page.tsx:
- Simple card with email input and send reset link button

Update the Navbar component to show auth state:
- When logged out: show Login button (nav-btn-primary style)
- When logged in: show user avatar (initials in a circle), user name, and role below
- Clicking the avatar shows a dropdown with: My Cases, Sign Out

All auth forms must use React Hook Form with Zod validation.
```

**Verify:** Visit http://localhost:3000/login — login and register tabs should work. Create an account using the demo customer email and confirm it appears in Supabase Auth.

---

### Phase 3 — RMA Submission Form

**Goal:** The five-step submission form working end to end, creating a real case in Supabase.

---

#### Prompt 3.1 — Form Foundation & Step Wizard

```
Create the RMA submission form at src/app/(customer)/submit/page.tsx.

This is a five-step wizard. Create a StepWizard component at src/components/forms/RMASubmitForm.tsx that:
- Tracks current step in React state (1-5)
- Shows a step progress bar at the top with circles numbered 1-5, labels below: Contact, Office & Date, Products, Fault Details, Review
- Completed steps show a green tick, current step is blue with a pulsing ring, future steps are grey
- Shows a progress fill bar below the step circles that fills proportionally
- Each step is a separate component rendered inside the wizard
- Validates each step with Zod before allowing advance to the next step
- Stores all form data across steps in a single React state object

Wrap the entire submit page in the customer layout (src/app/(customer)/layout.tsx) which adds:
- A page hero section with dark navy gradient background, breadcrumb, page title "New Return Request", and subtitle
- The main content area below

Create src/app/(customer)/layout.tsx if it does not exist.
```

---

#### Prompt 3.2 — Form Steps 1 to 3

```
Create the five step components for the RMA submission form.

Step 1 — Customer Details (src/components/forms/steps/Step1Contact.tsx):
- If user is authenticated: pre-fill full_name, company, email, phone from their account. Fields are editable.
- If guest: show all fields empty with a note "Create an account to save your details for future returns"
- Fields: Full Name (required), Company (required), Email (required), Phone
- Shipping address section: Street Address, City, Postcode/ZIP, Country dropdown defaulting to UK

Step 2 — Office & Return Details (src/components/forms/steps/Step2Office.tsx):
- Office selection as two clickable radio cards side by side:
  Left card: "Cosworth Electronics UK" with subtitle "Cambridge, CB24 8PS"
  Right card: "Cosworth Electronics USA" with subtitle "Indianapolis, IN 46268"
  Selected card has blue border and light blue background
- Required Return Date: date picker, cannot select dates in the past
- Purchase Order Number: text field, only shown if the logged-in user's customer_account has po_required=true. Label: "Purchase Order Number (required for your account)"

Step 3 — Products (src/components/forms/steps/Step3Products.tsx):
- Fetch active products from Supabase grouped by category
- Each product entry shows:
  - A grouped select dropdown showing category headers and product options in format "Part Number: Display Name"
  - Serial Number text field
  - Quantity number field (default 1)
  - Fault Notes textarea
- "Add Another Product" button that appends a new product entry
- Remove button on each product entry (cannot remove if only one remains)
- File upload zone at the bottom of the step:
  - Dashed border, upload icon, "Click to upload or drag & drop" text, "Photos, fault evidence — max 10 files, 10MB each" subtext
  - Shows file names and sizes after selection
  - Accepts images and common document types
```

---

#### Prompt 3.3 — Form Steps 4 and 5 plus Submission

```
Create the remaining form steps and the submission logic.

Step 4 — Fault Details (src/components/forms/steps/Step4Fault.tsx):
- Fault Type: a row of clickable cards for each option:
  Repair, End of Season Service, Service Plan, Loan Unit Return, Code Update
  Selected card has blue border
- "Was fault information displayed on the unit?" — Yes/No toggle buttons
  If Yes: show a text field "Please describe what was displayed"
- "Have you tested the unit on another car?" — Yes/No toggle buttons
- "Does the fault follow the unit or the car?" — Unit/Car toggle buttons
- Additional fault description textarea (required when fault type is Repair, optional otherwise)
  Label: "Describe the fault in as much detail as possible"

Step 5 — Review & Submit (src/components/forms/steps/Step5Review.tsx):
- Display a clean summary of all entered data:
  Contact details section, Office and dates section, Products list with fees if applicable, Fault details section
- If the customer account requires payment (credit_terms=false or guest): show a payment notice box in amber:
  "Payment Notice: An inspection fee of £[amount] is required. You will be contacted by our team to arrange payment before your RMA is issued."
- If credit terms account: show "Account: Credit Terms — PO [number] will be referenced on your invoice"
- Large "Submit Return Request" primary button
- Back button to return to step 4

Submission logic — create src/app/api/cases/route.ts:
- POST handler that accepts the complete form data
- Validates all fields with Zod
- Generates a case number using the generate_case_number() database function
- Creates the case record in Supabase
- Creates case_product records for each product
- If files were uploaded: upload to Supabase Storage bucket "case-attachments/[caseId]/" and create case_attachment records
- If payment required and PAYMENT_MODE=stub: set payment_status to stub_notified, set payment_required to true
- If payment required and PAYMENT_MODE=stripe: create a Stripe PaymentIntent and return the client secret
- Returns the new case_number and case_id
- On error: return appropriate error message

Create the success page at src/app/(customer)/submit/success/page.tsx:
- Large green tick icon
- "Return Request Submitted" heading
- Case ID displayed prominently in a styled box: "Your Case ID: CASE-202604-XXXX"
- "Save this reference number. Use it in all correspondence with Cosworth."
- If payment stub mode: show amber box "A member of our team will contact you within 24 hours to arrange payment before your RMA is issued. Please quote your Case ID."
- Two buttons: "Track This Case" (goes to /cases/[caseId]) and "Submit Another Return"
```

**Verify:** Complete the full form submission. Check Supabase — a new case should appear in the cases table with all products, and any uploaded files in Storage.

---

### Phase 4 — Customer Case Tracking

**Goal:** Customer can log in and see all their cases, with full detail and workshop stage progress on each.

---

#### Prompt 4.1 — Case List Page

```
Create the customer case list page at src/app/(customer)/cases/page.tsx.

Requirements:
- Fetch all cases for the logged-in customer from Supabase, ordered by created_at descending
- Page hero section with title "My Returns" and subtitle
- Tab row with pill-style tabs: All, Open, On Hold, Closed — filters the case list client-side
- "New Return" button top right in primary blue

For each case render a CaseSummaryCard component (src/components/cases/CaseSummaryCard.tsx):
- If the case has is_on_hold=true and hold_reason=AWAITING_CUSTOMER: render with an orange border and a banner at the top of the card reading "Action Required — Your response is needed to continue the repair" with a warning icon. Show a "Respond Now" button.
- Otherwise: standard white card
- Show: Case ID in monospace blue badge, status badge, product name and fault type, required return date
- Show a mini status progress bar with 6 nodes: Submitted, RMA Issued, Received, In Repair/Workshop stage, QC/Returned
- Colour completed nodes green, current node blue with pulse animation, pending nodes grey
- If workshop_stage is set and status is IN_REPAIR: show the current workshop stage label next to the In Repair node
- "View Details" link bottom right of card

Clicking anywhere on the card navigates to /cases/[caseId].
```

---

#### Prompt 4.2 — Case Detail Page

```
Create the customer case detail page at src/app/(customer)/cases/[caseId]/page.tsx.

Fetch the case, its products, updates (where is_internal=false), and attachments from Supabase.

Layout: two-column grid on desktop (left column wider, right column narrower). Single column on mobile.

LEFT COLUMN:

1. If is_on_hold=true and hold_reason=AWAITING_CUSTOMER: render HoldStateBanner component (Action Required variant) at the very top, before everything else.

2. If is_on_hold=true and hold_reason is anything else: render HoldStateBanner (informational amber variant).

3. WorkshopStageTracker component (src/components/cases/WorkshopStageTracker.tsx):
   - Only shown when status is IN_REPAIR or workshop_stage is set
   - Shows only the 7 Planner bucket stages — NO SAP milestone tier on the customer view
   - Seven stage nodes: Awaiting Test, Under Test, In Rework, Final Test, Finishing, Inspection, Repair Complete
   - Stage sequence determines colour: stages before current are green done, current is blue active with pulse, future are grey pending
   - If is_on_hold=true: current stage node shows amber hold colour instead of blue with a hold icon
   - Below the stages: a subtle info bar showing "Est. completion: [date]" and "Days open: [N]" if SAP data is populated

4. Case Updates Timeline (src/components/cases/CaseTimeline.tsx):
   - Show only non-internal updates
   - Each update: coloured dot on left (colour by update type), connected by vertical line to next update
   - Update card: author name, timestamp in monospace, message content
   - Most recent update at top

RIGHT COLUMN:

1. Reference boxes: three boxes in a row for Case ID (blue), RMA Number (purple), SAP Repair Order
   If RMA or SAP not yet issued: show "Pending" in muted grey italic

2. Case Details card with two-column grid of label/value pairs:
   Customer, Company, Office, Fault Type, Required By, Est. Completion, Payment Status

3. Products card listing each product with part number, serial number, and fault notes

4. Shipping Instructions card (only shown after RMA_ISSUED status):
   Show the relevant office address with instruction to quote the RMA number on outer packaging
```

---

#### Prompt 4.3 — Hold State Banner & Customer Response

```
Create the HoldStateBanner component at src/components/cases/HoldStateBanner.tsx.

The component accepts these props: holdReason, holdCustomerLabel, awaitingCustomerQuestion, caseId, onResponseSent callback.

Render differently based on holdReason:

AWAITING_CUSTOMER variant (Action Required):
- Orange border card (border-orange-200 background orange-50)
- Header row: orange warning icon in a rounded box, title "Action Required — Your Response Needed" in orange-900, subtitle "Repair is paused until you respond"
- Staff question displayed in a styled quote box with italic text and the staff member name/timestamp if available
- Textarea for customer response (min 3 characters required)
- Two buttons: "I'll call to discuss" (secondary, links to contact page) and "Send Response" (amber primary)

Other hold variants (Informational):
- Amber border card (amber-50 background)
- Header: amber warning icon, title showing holdCustomerLabel
- Brief message: "Our team is working on this. We will update you as soon as we have more information."
- No response form

On "Send Response" click:
- POST to /api/cases/[caseId]/respond with the response text and session auth
- Show loading state on button
- On success: call onResponseSent callback and show a success inline message "Response sent. Our team has been notified."
- On error: show inline error message

Create the API route src/app/api/cases/[caseId]/respond/route.ts:
- Accepts POST with body: { response: string, token?: string }
- Auth: either valid session (customer) OR valid token in case_response_tokens table (not expired, not used)
- Validates the case exists and is in AWAITING_CUSTOMER hold
- Creates a case_update record with the customer response content, is_internal=false
- Marks the token as used (sets used_at) if token auth was used
- Clears the hold: sets is_on_hold=false, hold_reason=null, hold_customer_label=null on the case
- Returns success

Also create the tokenised response page at src/app/(customer)/cases/[caseId]/respond/page.tsx:
- Reads token from URL search params: /cases/[caseId]/respond?token=xxx
- Validates token against case_response_tokens table
- If invalid or expired: show error card "This response link has expired or is invalid. Please log in to respond."
- If valid: show minimal branded page (nav + footer, no auth required) with:
  The staff question displayed
  A textarea for response
  Submit button
- On submit: POST to the respond API route with the token
- On success: show confirmation page
```

**Verify:** Log in as the demo customer. Visit /cases — both demo cases should appear. Click CASE-202604-0047 — the workshop stage tracker should show Final Test as the current stage.

---

### Phase 5 — Admin Portal

**Goal:** Staff can log in, see the case queue, and manage cases.

---

#### Prompt 5.1 — Admin Layout and Dashboard

```
Create the admin layout at src/app/(admin)/layout.tsx.

The admin layout has two columns: a fixed-width sidebar (232px) on the left and a scrollable main content area on the right.

Create the AdminSidebar component at src/components/layout/AdminSidebar.tsx:
- White background with right border
- User info at the top: avatar (initials), name, role badge
- Navigation sections with labels:

  OVERVIEW section:
  - Dashboard (grid icon) with badge showing count of open cases requiring action
  - All Cases (document icon) with badge showing total open cases

  ADMIN section:
  - Products (tag icon)
  - Accounts (people icon)

  - Import Power BI (upload icon) with amber "!" badge if last import was more than 3 days ago

- Active link has left blue border, blue text, light blue background
- Highlight any nav item that needs attention in amber

Create the admin dashboard at src/app/(admin)/dashboard/page.tsx:
- Filter cases by the logged-in staff member's office (staff_uk sees UK cases, staff_us sees US cases, admin sees all)
- Stats strip: 4 stat cards showing New This Week, Awaiting Action (submitted + awaiting payment + awaiting customer), In Workshop (IN_REPAIR status), Closed This Month. Each card has a coloured top border.
- Filter bar: search input, status dropdown, workshop stage dropdown, assigned to dropdown, New Case button
- Cases table with columns: Case ID, Customer/Company, Products, Workshop Stage, Status, Est. Completion, Assigned, Actions
- Cases in AWAITING_CUSTOMER hold shown with amber row background
- Cases where required_return_date is within 7 days shown with red date text
- Clicking a row navigates to /admin/cases/[caseId]
- Approve button shown inline for SUBMITTED cases
- The table must use server-side data fetching with the Supabase server client
```

---

#### Prompt 5.2 — Admin Case Detail

```
Create the admin case detail page at src/app/(admin)/cases/[caseId]/page.tsx.

Fetch full case data including products, all updates (internal and customer-visible), attachments, and customer account details.

HEADER ROW:
- Case number in large Space Grotesk heading
- Status badge
- Customer name and company in muted text below
- Action buttons right-aligned: Reject (danger), Edit (secondary), Close Case (success)

REFERENCE BOXES (4 boxes):
- Case ID, RMA Number, SAP Sales Order, SAP Works Order

TWO-COLUMN LAYOUT:

LEFT COLUMN (wider):

1. Workshop Stage Control card:
   Header: "Workshop Stage" title, Hold State dropdown and Set Hold button on the right
   Body:
   - Stage advance buttons: render 7 rounded pill buttons for each workshop stage
     Done stages: green background green text with tick
     Active stage: blue border blue text with blue shadow ring
     Future stages: grey border grey text
     Clicking a future/active stage button calls PATCH /api/cases/[caseId]/stage
   - If is_on_hold=true: show amber alert bar below the stage buttons showing the hold reason and a "Clear Hold" button
   Hold State dropdown options: Awaiting Parts, With Support, With Engineering, Awaiting Confirmation — Customer, Credit Held, — Clear Hold —
   When "Awaiting Confirmation — Customer" is selected: show a textarea to enter the question/message to send the customer before the Set Hold button

2. Post Update card:
   Header: "Post Update" title, "Internal only" toggle switch on right
   Body:
   - Optional status change select dropdown
   - Textarea for update content
   - Attach File button and Send button row

3. Case Timeline:
   Same as customer timeline but shows ALL updates including internal ones
   Internal updates shown with amber background and "Internal Note" label in amber
   Customer response updates shown with green background and "Customer Response" label

RIGHT COLUMN (narrower):

1. SAP Data card:
   Header: title + "Last sync: [date]" in monospace
   Grid of label/value pairs: Order Value, Spent Hours, Days Open, Est. Completion, Booked In Date, Required Return Date

2. Customer Account card:
   Avatar, name, company
   Credit Terms badge, PO Required, PO Number, Total Cases for this account

3. Products card with each product, part number, serial number, fault notes

4. Attachments card with file list and upload button
```

---

#### Prompt 5.3 — Case Approval, Stage & Hold API Routes

```
Create the following API route handlers:

src/app/api/cases/[caseId]/approve/route.ts:
- POST handler, requires staff or admin role
- Generates RMA number using the generate_rma_number() database function
- Updates case: status=RMA_ISSUED, rma_number=[generated]
- Creates a case_update record: "Case approved. RMA [number] issued. Customer may now ship parts to [office address]."
- Returns the new RMA number

src/app/api/cases/[caseId]/reject/route.ts:
- POST handler, requires staff or admin role
- Accepts body: { reason: string }
- Updates case: status=REJECTED
- Creates a case_update record with the rejection reason, is_internal=false
- Returns success

src/app/api/cases/[caseId]/stage/route.ts:
- PATCH handler, requires staff or admin role
- Accepts body: { stage: WorkshopStage }
- Validates stage is a valid WorkshopStage enum value
- Updates case workshop_stage to the new value
- If the case is not already IN_REPAIR: also update status to IN_REPAIR
- Creates a case_update record: "Workshop stage updated to [stage label]." with is_internal=false so customer can see it
- Returns success

src/app/api/cases/[caseId]/hold/route.ts:
- POST handler: set hold state — requires staff or admin role
  Accepts body: { holdReason: HoldReason, customerLabel: string, question?: string }
  Updates case: is_on_hold=true, hold_reason, hold_customer_label, awaiting_customer_question (if AWAITING_CUSTOMER)
  If AWAITING_CUSTOMER: generate a response token (crypto.randomBytes(32).toString('hex')), insert into case_response_tokens with expires_at = now() + 7 days
  Creates a case_update record with the question as content, is_internal=false
  Returns the token if created (for email link generation)

- DELETE handler: clear hold state — requires staff or admin role
  Updates case: is_on_hold=false, hold_reason=null, hold_customer_label=null, awaiting_customer_question=null
  Creates a case_update record: "Hold cleared. Work has resumed." is_internal=false
  Returns success

Create TypeScript enums in src/types/workshop.ts:
  WorkshopStage enum: AWAITING_TEST, RETEST, REWORK, FINAL_TEST, CLEAN_AND_LABEL, INSPECTION, WORKSHOP_COMPLETE
  HoldReason enum: AWAITING_PARTS, WITH_SUPPORT, WITH_ENGINEERING, AWAITING_CUSTOMER, CREDIT_HELD
  WorkshopStageLabel map: maps each WorkshopStage to its customer-facing label
  HoldCustomerLabel map: maps each HoldReason to its customer-facing label (CREDIT_HELD maps to "On Hold — Please Contact Us")
```

**Verify:** Log in as demo.staff@cosworth.com. Visit /admin/dashboard — both demo cases should appear. Try advancing the workshop stage on CASE-202604-0047 and verify it updates in Supabase.

---

### Phase 6 — Workshop Stages & Hold States

**Goal:** Full workshop stage and hold state flow working in both customer and admin views.

---

#### Prompt 6.1 — Workshop Stage Tracker Component

```
Create the WorkshopStageTracker component at src/components/cases/WorkshopStageTracker.tsx.

Props: workshopStage, isOnHold, holdCustomerLabel, sapEstimatedCompletion, sapDaysOpen

The component renders a single-tier Planner bucket stage progress bar.

Seven nodes in sequence: Awaiting Test, Under Test, In Rework, Final Test, Finishing, Inspection, Repair Complete
Map from WorkshopStage enum values to display labels using WorkshopStageLabel.
Node states:
- Stages before current: green done with tick icon
- Current stage AND not on hold: blue active with pulse animation
- Current stage AND is_on_hold=true: amber hold with warning icon
- Future stages: grey pending

Connector lines colour to green for completed sections, blue for the active connector, grey for pending.
Node circles are 28px. Labels below each node in 10px text, max-width 64px, centred.

Below the stages: a subtle grey info bar showing "Est. completion: [date]" and "Days open: [N]" if data is available.

If is_on_hold=true: add a small amber pill below the current stage node reading the holdCustomerLabel text.

The component should animate smoothly when stage changes — use CSS transitions on node background colours.
```

---

#### Prompt 6.2 — Admin Products & Fees Page

```
Create the combined Products & Fees management pages. There is no separate fees page — fees are managed inline on the products page.

src/app/(admin)/products/page.tsx:
- Title: "Products & Fees"
- Subtitle: "Approved returnable products and their service fees. Active products appear in the customer submission form. Click any fee to edit inline."
- Filter bar: search by name or part number, category dropdown, active/inactive toggle, Import CSV button, Add Product button
- Single table with columns: Part Number, Category, Description (name + subtitle), Test Fee, Standard Repair Fee, Major Repair Fee, Active toggle, Edit button
- Fee cells are clickable inline — clicking replaces the cell with a number input, saves on Enter or blur, flashes green to confirm
- Active toggle: clicking immediately calls PATCH /api/products/[productId] to toggle active state. Inactive rows dim to 50% opacity.
- Column header note: "Test Fee" in blue, "Standard Repair" in purple, "Major Repair" in amber

src/app/(admin)/products/new/page.tsx and src/app/(admin)/products/[productId]/edit/page.tsx:
- Two-column layout: left has Product Details card + Service Fees card, right has Visibility card + Product Info card + Danger Zone
- Product Details: Part Number (required, unique), Variant, Display Name (required), Category (dropdown), Internal Notes
- Service Fees card (labelled "Service Fees — shown to customers as estimates"):
  Test Fee (£) — "Fee charged when unit is received and tested"
  Standard Repair Fee (£) — "Standard component-level repair"
  Major Repair Fee (£) — "Board-level or full unit replacement"
- Visibility card: large active toggle with explanation, deactivation note
- Product Info card: created date, last updated, total cases, open cases
- Danger Zone: delete button (disabled if open cases exist)
- Validation with Zod

Create API routes:
src/app/api/products/route.ts — GET (list with filters) and POST (create, admin only)
src/app/api/products/[productId]/route.ts — GET, PATCH, DELETE (staff and admin only)
```
---

#### Prompt 6.3 — Admin Accounts Pages

```
Create the customer accounts management pages.

src/app/(admin)/accounts/page.tsx:
- Title: "Customer Accounts"
- Stats strip: Total Accounts, Credit Terms count, PO Required count, Open Cases count
- Filter bar: search by name/company/email, credit terms dropdown, active/inactive dropdown, Add Account button
- Accounts table columns: Contact (avatar initials + name + email), Company, Credit Terms (Yes/No badge), PO Required (Required badge or —), Total Cases, Open Cases (blue if >0), Active toggle, View button
- Inactive accounts dimmed to 50% opacity
- Clicking View navigates to /admin/accounts/[accountId]

src/app/(admin)/accounts/new/page.tsx and src/app/(admin)/accounts/[accountId]/page.tsx:
- Header: avatar, full name, company, active badge, Deactivate + Save buttons
- Two-column layout

Left column:
  Account Settings card: Full Name, Company, Email, Phone fields
  Credit Terms toggle (large, with explanation: "Account has approved credit terms. Payment collected by invoice.")
  PO Number Required toggle (with explanation: "Customer must provide a PO number when submitting a return.")
  Internal Notes textarea
  Cases table: last 10 cases with Case ID, Product, Type, Status, Date — rows link to admin case detail
  "View all N cases" button

Right column:
  Account Summary card: Total Cases, Open Cases, Credit Terms badge, PO Required badge, Account Since, Last Case
  Billing Address card with edit button
  Danger Zone card: Deactivate button with explanation

Create API routes:
src/app/api/accounts/route.ts — GET (list with filters) and POST (create, admin only)
src/app/api/accounts/[accountId]/route.ts — GET, PATCH (staff and admin only)
```


---

### Phase 7 — Email Notifications

**Goal:** All key email notifications sending via Resend.

---

#### Prompt 7.1 — Email Templates

```
Create React Email templates for all transactional emails. Install @react-email/components if not already installed.

All templates share a common layout wrapper: src/emails/components/EmailLayout.tsx
- Full width email
- Navy header (#003057) with Cosworth logo mark icon and "COSWORTH RETURNS" text in white
- White content area with 40px padding
- Grey footer with "Cosworth Electronics Ltd, Brookfield Technology Centre, Cambridge CB24 8PS" and "This is an automated notification from the Cosworth Returns Portal"
- Font: Arial throughout

Create these templates:

src/emails/CaseSubmitted.tsx — Props: customerName, caseNumber, products (array), officeLabel, requiredDate
Content: "Thank you for submitting your return request. Your case has been created and our team will review it within 24 hours." Show case number prominently. List products. Show expected timeline.

src/emails/RMAIssued.tsx — Props: customerName, caseNumber, rmaNumber, officeAddress
Content: "Your return has been approved. Please ship your unit(s) to [address] quoting [RMA number] on the outer packaging." Show both case number and RMA number prominently.

src/emails/CaseUpdate.tsx — Props: customerName, caseNumber, updateContent, authorName, caseUrl
Content: Show the update message. Include a "View Case" button linking to the case URL.

src/emails/CaseRejected.tsx — Props: customerName, caseNumber, reason
Content: "Unfortunately your return request has been rejected." Show reason. "Please contact us if you have questions."

src/emails/ActionRequired.tsx — Props: customerName, caseNumber, question, responseUrl, expiresAt
Content: "Your repair requires your confirmation before we can continue." Show the question in a styled box. Large "Respond Now" button linking to responseUrl. Note that the link expires in 7 days. Also show "Or log in to respond at [portal url]"

src/emails/HoldStateChanged.tsx — Props: customerName, caseNumber, holdLabel, caseUrl
Content: "There is a temporary hold on your repair case." Show holdLabel. "We will update you as soon as we have more information." View Case button.

src/emails/HoldCleared.tsx — Props: customerName, caseNumber, caseUrl
Content: "Good news — the hold on your repair case has been removed and work has resumed."

src/emails/WorkshopStageUpdate.tsx — Props: customerName, caseNumber, stageName, stagesCompleted (number), totalStages (7), estimatedCompletion, caseUrl
Content: "Your repair has progressed to a new stage: [stageName]" Show a simple text-based progress indicator showing X of 7 stages complete. Include estimated completion date. View Case button.

src/emails/CustomerResponseReceived.tsx — Props: staffName, caseNumber, customerName, responseContent, caseUrl
Content: Internal notification for staff. "A customer has responded to your hold query." Show the response content. View Case button.

src/emails/PaymentStubNotification.tsx — Props: customerName, caseNumber, inspectionFee, contactEmail
Content: "Payment is required to proceed with your return. A member of our team will contact you within 24 hours to arrange payment. Your case reference is [caseNumber]. Inspection fee: £[amount]. Please quote your case number in all correspondence."
```

---

#### Prompt 7.2 — Email Sending Service

```
Create the email sending service at src/lib/email.ts.

Import the Resend client and all email templates.

Create and export these functions — each accepts the relevant props and sends the email via Resend, logging the result to the email_notifications table:

sendCaseSubmitted(caseId, customerEmail, props)
sendRMAIssued(caseId, customerEmail, staffEmail, props)
sendCaseUpdate(caseId, customerEmail, props)
sendCaseRejected(caseId, customerEmail, props)
sendActionRequired(caseId, customerEmail, props) — also generates the response token URL
sendHoldStateChanged(caseId, customerEmail, props)
sendHoldCleared(caseId, customerEmail, props)
sendWorkshopStageUpdate(caseId, customerEmail, props)
sendCustomerResponseReceived(caseId, staffEmail, props)
sendPaymentStubNotification(caseId, customerEmail, props)

Each function:
- Uses the Resend client from src/lib/resend.ts
- Sends from "Cosworth Returns <returns@cosworth.com>" (or the configured from address)
- Logs to email_notifications table via Supabase service role client
- Returns the Resend message ID
- Has a try/catch — email failures should log an error but not throw (never let a failed email break the user's action)

Update the case submission API route (src/app/api/cases/route.ts) to call sendCaseSubmitted after creating the case.

Update the approve route to call sendRMAIssued.
Update the reject route to call sendCaseRejected.
Update the stage route to call sendWorkshopStageUpdate.
Update the hold POST route to call sendActionRequired (if AWAITING_CUSTOMER) or sendHoldStateChanged (all others).
Update the hold DELETE route to call sendHoldCleared.
Update the respond route to call sendCustomerResponseReceived.
```

**Verify:** Submit a test return and check your email inbox for the CaseSubmitted template. Check the email_notifications table in Supabase — a record should have been created.

---

### Phase 8 — Payment Stub & Stripe Wiring

**Goal:** Payment stub working for demo, Stripe ready to activate with one environment variable change.

---

#### Prompt 8.1 — Payment Logic

```
Create the payment system with stub and Stripe modes controlled by the PAYMENT_MODE environment variable.

Create src/lib/payment.ts:

Export a function: initiatePayment(caseId, amount, customerEmail, caseNumber)

If PAYMENT_MODE=stub:
  - Update case payment_status to 'stub_notified'
  - Call sendPaymentStubNotification
  - Return { mode: 'stub', message: 'Payment notification sent' }

If PAYMENT_MODE=stripe:
  - Create a Stripe PaymentIntent with the amount in pence (multiply decimal by 100)
  - Metadata: { caseId, caseNumber, customerEmail }
  - Update case stripe_payment_intent_id with the PaymentIntent ID
  - Update case payment_status to 'pending'
  - Return { mode: 'stripe', clientSecret: paymentIntent.client_secret }

Create the payment page at src/app/(customer)/payment/[caseId]/page.tsx:

Fetch the case to get payment details.

If payment_status is already 'paid' or 'stub_notified': redirect to /cases/[caseId] with a message.

If PAYMENT_MODE=stub:
  Show a clean information page:
  - Cosworth branded card
  - Heading: "Payment Required"
  - Case number and inspection fee amount
  - Amber info box: "A member of our Cosworth team will contact you within 24 hours to arrange payment. Please quote your case reference CASE-XXXXXX in all correspondence."
  - Contact details: email and phone for the relevant office
  - "Return to My Cases" button

If PAYMENT_MODE=stripe:
  Show the Stripe Elements payment form:
  - Fetch or create PaymentIntent on page load
  - Render Stripe PaymentElement
  - Submit button: "Pay £[amount]"
  - On payment success: redirect to /cases/[caseId]?payment=success

Create the Stripe webhook handler at src/app/api/stripe/webhook/route.ts:
  - Verify the Stripe webhook signature using STRIPE_WEBHOOK_SECRET
  - Handle payment_intent.succeeded: update case payment_status to 'paid', update case status to UNDER_REVIEW if currently AWAITING_PAYMENT, send PaymentReceived email
  - Handle payment_intent.payment_failed: log the failure, keep status as AWAITING_PAYMENT
  - Return 200 for all recognised events

Update the case submission route to call initiatePayment if payment is required after creating the case.

Add a helper function in src/lib/payment.ts: isPaymentRequired(customerAccount) that returns true if credit_terms=false or the account does not exist (guest).
```

---

### Phase 9 — Seed Data & Demo Polish

**Goal:** The app is demo-ready with realistic data, good loading states, and error handling throughout.

---

#### Prompt 9.1 — Demo Data Enhancement

```
Update the Supabase seed file (supabase/seed.sql) to add richer demo data.

Add these additional demo cases to give the demo a full range of statuses:

Case 3: CASE-202604-0051 — Submitted status, Antares 8 TLA, TF Sport customer (Alex Hartley, demo.customer2@tfsport.com)
Case 4: CASE-202604-0050 — Under Review, Badenia 4 Porsche GT3R, Sarah Monks, Porsche Motorsport (demo.customer3@porsche.com)
Case 5: CASE-202604-0044 — IN_REPAIR with AWAITING_PARTS hold, CLU Plus, Dale Hinton (demo.customer4@indycar.com)

For Case 5 (AWAITING_PARTS hold):
- workshop_stage: RETEST
- is_on_hold: true
- hold_reason: AWAITING_PARTS
- hold_customer_label: "On Hold — Awaiting Parts"

Add a second customer account (demo.customer2@tfsport.com):
- credit_terms: false (so payment stub flow is triggered for this account)
- po_required: false

Add 4 case_updates for Case 1 showing a complete repair journey including a resolved AWAITING_CUSTOMER hold:
- Update 1: "Case submitted" (system)
- Update 2: "Case approved. RMA issued." (staff)
- Update 3: "Parts received at Cambridge." (staff)
- Update 4: "Unit in repair. Backlight driver fault confirmed." (staff)

Re-run: supabase db reset then supabase db seed to apply all seed data fresh.
```

---

#### Prompt 9.2 — Loading States and Error Handling

```
Add loading states and error handling throughout the application.

Loading states:
- All pages that fetch data from Supabase: add a loading.tsx file alongside the page.tsx in the same directory. Show a skeleton loading UI that matches the page layout (grey shimmer rectangles in place of real content).
- All form submit buttons: disable and show a spinner during submission
- Admin case queue table: show a skeleton table during load

Error handling:
- All pages that fetch data: add an error.tsx file alongside page.tsx. Show a clean error card: "Something went wrong loading this page. Please try refreshing." with a retry button.
- API routes: all errors return consistent JSON: { error: string, code: string }
- Form submissions: show inline error messages below the form when the API returns an error
- If a customer tries to access a case that is not theirs: redirect to /cases with a "Case not found" toast

Add toast notifications using a simple custom hook (src/hooks/useToast.ts):
- Show success/error/info toasts in the top-right corner
- Auto-dismiss after 4 seconds
- Success: green, Error: red, Info: blue
- Use this for: case submitted successfully, RMA issued, stage updated, hold set/cleared, response sent

Add not-found pages:
- src/app/(customer)/cases/[caseId]/not-found.tsx — "Case not found or you do not have permission to view it."
- src/app/(admin)/cases/[caseId]/not-found.tsx — "Case not found."
```

---

#### Prompt 9.3 — Power BI Import Page

```
Create the Power BI Excel import page for the admin portal.

src/app/(admin)/import/page.tsx:
- Page hero: "Power BI Import", subtitle explaining the purpose
- Two-column layout: upload card (left, wider) and last import summary card (right)

Upload card:
- File upload zone: dashed border, upload icon, "Click to upload or drag & drop" text, ".xlsx files only — Power BI repairs report export" subtext
- Alert info box: "The import matches rows using the Description column (RMA number). All changes are shown in a preview before being applied."
- When a file is selected: show the filename and file size, and a "Parse File" button

Last import summary card:
- Timestamp of last import
- Stats: Rows processed, Cases updated, Warnings, Action Required triggered, Unmatched

Import preview (shown after parsing, replaces the upload view):
- Summary strip: 5 stat boxes — Matched, Stage Changes, Action Required, Warnings, Unmatched
- Preview table showing each row:
  Columns: RMA Number, Case ID (linked), Customer, Stage Change (old → new arrow), Hold Change, SAP Updates, Flag badge
  Row background colours: yellow for changes, orange for warnings/holds, red for unmatched
- Alert warning box: "Review before confirming. The following changes will be applied. X cases will trigger customer notifications."
- Back to Upload button and Confirm Import button row
- Confirm Import button is disabled if there are unmatched rows without manual acknowledgement

Import history table at the bottom of the page:
- Columns: Date & Time, Imported By, Rows, Updated, Warnings, Action Req., Unmatched
- Last 10 imports

Create the import API route at src/app/api/admin/import/route.ts:
- POST: accepts multipart form with xlsx file
  Parses using the xlsx library (SheetJS)
  Maps columns using the mapping table from Section 15.2
  Maps Product Status to workshop stage or hold reason using Section 15.3 mapping
  Validates each row
  Returns preview data (no DB changes yet)

- PUT: accepts the confirmed preview data
  Applies all changes in a single Supabase transaction
  For each AWAITING_CUSTOMER hold: generates response token, calls sendActionRequired
  For other hold changes: calls sendHoldStateChanged
  For stage changes: calls sendWorkshopStageUpdate
  Logs the import to a new import_logs table (create this in a new migration)
  Returns import summary
```

---

## 6. Running the Demo

### Start the Development Server

```
npm run dev
```

Visit http://localhost:3000

### Demo Accounts

| Role | Email | Password | Notes |
|---|---|---|---|
| Customer (credit terms) | demo.customer@btsport.com | Demo1234! | Will Kerridge, BT Sport |
| Customer (no credit terms) | demo.customer2@tfsport.com | Demo1234! | Alex Hartley, TF Sport — triggers payment stub |
| Staff UK | demo.staff@cosworth.com | Demo1234! | Nigel Seamarks |
| Admin | demo.admin@cosworth.com | Demo1234! | Matthew Parry |

> Note: These passwords need to be set in Supabase Auth after running the seed. Go to Supabase Dashboard → Authentication → Users and set passwords for each demo user.

---

## 7. Demo Script

Walk through these flows in order for the most effective demonstration:

### Flow 1 — Submit a Return (5 minutes)

1. Open the app in a browser — show the Cosworth branding matches the main website
2. Log in as `demo.customer@btsport.com`
3. Click "New Return" — walk through the 5-step form
4. Select UK office, fill in a required date, add CDU 10.3 from the products dropdown
5. Select Repair as fault type, describe a fault
6. Review step — show the fee estimate and credit terms note
7. Submit — show the Case ID on the success screen
8. Navigate to "Track This Case"

### Flow 2 — Customer Case Tracking (3 minutes)

1. Show the case list — highlight the two existing demo cases
2. Click CASE-202604-0047 — show the full detail view
3. Point out the workshop progress bar showing all 7 Planner stages — Awaiting Test through to Repair Complete (no SAP milestone tier shown to customer)
4. Show Final Test as the active stage with the pulse animation
5. Show the case timeline with repair updates
6. Show the reference box row — Case ID, RMA Number, SAP Repair Order all visible

### Flow 3 — Admin Approval Flow (5 minutes)

1. Open a second browser tab (or incognito window)
2. Log in as `demo.staff@cosworth.com`
3. Show the admin dashboard — stats strip, case queue with workshop stage column
4. Find the newly submitted case — click Approve
5. RMA number is issued — show it in the reference boxes
6. Advance workshop stages: click Awaiting Test → Rework → Final Test
7. Show the customer view updating in real time (refresh the customer tab)
8. Show the email log in Supabase — notifications have been sent

### Flow 4 — Action Required Hold (4 minutes)

1. In the admin view, on CASE-202604-0047
2. Set hold state to "Awaiting Confirmation — Customer"
3. Type a question: "We found additional damage to the CAN bus connector. Repair will cost an additional £85+VAT. Please confirm to proceed."
4. Click Set Hold
5. Switch to the customer browser tab and refresh
6. Show the orange Action Required banner at the top of the case
7. Show the staff question displayed in the banner
8. Type a response and click Send Response
9. Switch back to admin — show the response in the case timeline
10. Show the hold has been automatically cleared

### Flow 5 — Payment Stub (2 minutes)

1. Log in as `demo.customer2@tfsport.com` (no credit terms)
2. Submit a new return
3. On the success page — show the amber payment notice
4. Navigate to the payment page — show the "contact Cosworth" stub screen
5. Explain: "When we switch PAYMENT_MODE=stripe in the environment, this page shows the Stripe payment form instead — no code changes required"

---

## 8. Activating Stripe (When Ready)

When the decision is made to activate real payments:

1. Open `.env.local` (or Vercel environment variables)
2. Change:
   ```
   PAYMENT_MODE=stub
   ```
   to:
   ```
   PAYMENT_MODE=stripe
   ```
3. Update the Stripe webhook URL in the Stripe dashboard to your live URL:
   `https://returns.cosworth.com/api/stripe/webhook`
4. No code changes required — the payment page and submission flow automatically switch to Stripe

For production, also switch from Stripe test keys to live keys:
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 9. Deployment to Vercel

### 9.1 Push to GitHub

```
git init
git add .
git commit -m "Initial Cosworth RMA Portal"
git remote add origin https://github.com/your-username/cosworth-rma.git
git push -u origin main
```

### 9.2 Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click **Add New Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js — click **Deploy**
5. After the first deploy, go to **Project Settings → Environment Variables**
6. Add all variables from your `.env.local` file
7. Change `BETTER_AUTH_URL` to your Vercel deployment URL
8. Change `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
9. Redeploy: `git commit --allow-empty -m "trigger redeploy" && git push`

### 9.3 Add Custom Domain

1. In Vercel project settings → Domains
2. Add `returns.cosworth.com`
3. Vercel shows you the CNAME record to add: `returns.cosworth.com → cname.vercel-dns.com`
4. Add this in your DNS provider (wherever cosworth.com DNS is managed)
5. SSL is provisioned automatically

### 9.4 Update Stripe Webhook

In the Stripe dashboard → Developers → Webhooks:
1. Update the endpoint URL to `https://returns.cosworth.com/api/stripe/webhook`
2. Copy the new signing secret
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

---

## 10. Troubleshooting

### Common Issues

**"Module not found" errors after npm install**
```
npm install
npm run dev
```
If still failing: delete `node_modules` and `.next` folders, then re-run `npm install`.

**Supabase "Invalid API key" error**
Double-check `.env.local` — make sure there are no extra spaces around the `=` sign and the values are not wrapped in quotes.

**Better Auth session not persisting**
Make sure `BETTER_AUTH_URL` matches exactly what is in the browser address bar (including http vs https).

**Supabase RLS blocking data**
In Supabase Dashboard → Table Editor, check the RLS policies on the table. For debugging, you can temporarily disable RLS on a table via the Supabase UI (never do this in production).

**Emails not sending**
Check the Resend dashboard for failed sends. Verify `RESEND_API_KEY` is correct. During development Resend may only send to verified email addresses — add your email as a verified sender in the Resend dashboard.

**TypeScript errors on build**
Run `npx tsc --noEmit` to see all type errors. Fix them before deploying — the build will fail on Vercel if there are TypeScript errors.

**Stripe webhook not receiving events**
For local development, use the Stripe CLI to forward webhooks:
```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
The CLI gives you a temporary webhook secret to use in `.env.local` during development.

### Getting Help

If Claude Code gets stuck or produces incorrect code:

1. Show Claude the error message in full — paste it directly into the chat
2. If a file is wrong, open it and ask Claude to review and fix specific issues
3. For TypeScript errors, run `npx tsc --noEmit` and paste the full output
4. If a whole phase isn't working, you can ask Claude to start fresh on that phase with: "Let's redo Phase X from scratch. Here is the current error: [error]"

---

*End of Claude Code Build Guide — Cosworth Electronics RMA Portal*
*Read alongside: Cosworth_RMA_Complete_Brief_v1.1.md and cosworth-rma-portal-v2.html*
