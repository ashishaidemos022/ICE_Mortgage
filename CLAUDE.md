# ICE Mortgage Servicing Platform — Demo Build

## Project Overview

Build a **demo replica of the ICE Mortgage Technology MSP® Servicing Platform** — the industry-leading mortgage servicing system used by banks, credit unions, and mortgage companies. This is a standalone system that looks and functions like a real mortgage servicing agent desktop. It is NOT a Talkdesk demo — there should be **zero references to Talkdesk anywhere** in the UI, code, or data. This is a pure ICE Mortgage Technology servicing platform.

The system has a **Supabase backend** (project: `mnrseaapxpofdznnqrsv`) and exposes **REST APIs** that allow external systems to trigger screen pops, look up loans, and push notes/dispositions into the platform.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  ICE MSP® Servicing Platform (React Frontend)           │
│  ┌─────────────┬──────────────┬──────────────────────┐  │
│  │  Sidebar     │  Main View   │  Context Panel       │  │
│  │  (Nav)       │  (Module)    │  (Loan Summary,      │  │
│  │              │              │   Alerts, Predictions)│  │
│  └─────────────┴──────────────┴──────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │
                    Supabase Client
                           │
┌──────────────────────────▼───────────────────────────────┐
│  Supabase (mnrseaapxpofdznnqrsv)                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Tables (all prefixed icemortgage_)                 │ │
│  │  • icemortgage_borrowers                            │ │
│  │  • icemortgage_loans                                │ │
│  │  • icemortgage_properties                           │ │
│  │  • icemortgage_payments                             │ │
│  │  • icemortgage_escrow_accounts                      │ │
│  │  • icemortgage_escrow_disbursements                 │ │
│  │  • icemortgage_documents                            │ │
│  │  • icemortgage_interactions                         │ │
│  │  • icemortgage_collections_cases                    │ │
│  │  • icemortgage_lossmit_cases                        │ │
│  │  • icemortgage_lossmit_documents                    │ │
│  │  • icemortgage_compliance_flags                     │ │
│  │  • icemortgage_call_predictions                     │ │
│  │  • icemortgage_screen_pops                          │ │
│  │  • icemortgage_notes                                │ │
│  │  • icemortgage_dispositions                         │ │
│  │  • icemortgage_agents                               │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Edge Functions (Screen Pop APIs)                   │ │
│  │  • POST /screen-pop       → create screen pop event │ │
│  │  • GET  /loan-lookup      → lookup by loan # or ANI│ │
│  │  • POST /push-notes       → push notes + disp      │ │
│  │  • POST /push-interaction → log interaction         │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Realtime Subscriptions                             │ │
│  │  • icemortgage_screen_pops → triggers UI module pop │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Supabase Project

- **Project ID**: `mnrseaapxpofdznnqrsv`
- **All tables prefixed with**: `icemortgage_`
- **Existing tables on this project**: Many other demo verticals (insurance_, shopify_, auto_, etc.) — do NOT touch those. Only create/modify `icemortgage_*` tables.

## Database Schema

### Core Tables

```sql
-- Borrowers
CREATE TABLE icemortgage_borrowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn_last4 TEXT, -- last 4 only
  date_of_birth DATE,
  email TEXT,
  phone TEXT,
  mailing_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loans (System of Record)
CREATE TABLE icemortgage_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number TEXT UNIQUE NOT NULL, -- e.g., '10478293'
  borrower_id UUID REFERENCES icemortgage_borrowers(id),
  loan_type TEXT NOT NULL, -- 'Conventional 30yr Fixed', 'FHA 30yr', 'VA 15yr', 'HELOC'
  interest_rate NUMERIC(5,3),
  origination_date DATE,
  original_balance NUMERIC(12,2),
  current_upb NUMERIC(12,2), -- unpaid principal balance
  monthly_payment NUMERIC(10,2), -- total P&I + escrow + PMI
  monthly_pi NUMERIC(10,2), -- principal & interest only
  monthly_escrow NUMERIC(10,2),
  monthly_pmi NUMERIC(10,2) DEFAULT 0,
  next_due_date DATE,
  last_payment_date DATE,
  last_payment_amount NUMERIC(10,2),
  loan_status TEXT DEFAULT 'current', -- 'current','30_days','60_days','90_plus','forbearance','modification','foreclosure','paid_off'
  investor TEXT, -- 'FNMA','FHLMC','GNMA','Private'
  servicer TEXT,
  ltv NUMERIC(5,2),
  pmi_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Properties
CREATE TABLE icemortgage_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  county TEXT,
  property_type TEXT, -- 'Single Family','Condo','Townhome','Multi-Family'
  sq_ft INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  year_built INTEGER,
  current_value NUMERIC(12,2), -- estimated/appraised
  last_appraisal_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment History
CREATE TABLE icemortgage_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  due_date DATE,
  amount_due NUMERIC(10,2),
  amount_paid NUMERIC(10,2),
  date_received DATE,
  payment_method TEXT, -- 'ACH Auto-Pay','ACH One-Time','Check','Wire','Online Portal'
  payment_status TEXT, -- 'applied','pending','returned','partial','late'
  late_fee NUMERIC(8,2) DEFAULT 0,
  principal_applied NUMERIC(10,2),
  interest_applied NUMERIC(10,2),
  escrow_applied NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Escrow Accounts
CREATE TABLE icemortgage_escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  current_balance NUMERIC(10,2),
  required_cushion NUMERIC(10,2),
  shortage_surplus NUMERIC(10,2), -- negative = shortage
  annual_tax NUMERIC(10,2),
  annual_insurance NUMERIC(10,2),
  insurance_carrier TEXT,
  tax_authority TEXT,
  last_analysis_date DATE,
  next_analysis_date DATE,
  payment_change_effective DATE, -- when new escrow amount kicks in
  payment_change_amount NUMERIC(10,2), -- delta (+ or -)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Escrow Disbursements
CREATE TABLE icemortgage_escrow_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_account_id UUID REFERENCES icemortgage_escrow_accounts(id),
  loan_id UUID REFERENCES icemortgage_loans(id),
  disbursement_date DATE,
  description TEXT, -- 'Property Tax - 1st Half', 'Hazard Insurance Premium'
  payee TEXT,
  amount NUMERIC(10,2),
  disbursement_type TEXT, -- 'tax','insurance','pmi','other'
  status TEXT DEFAULT 'completed', -- 'scheduled','completed','pending'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents
CREATE TABLE icemortgage_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  document_name TEXT NOT NULL,
  document_type TEXT, -- 'statement','escrow','tax','disclosure','legal','lossmit','correspondence'
  document_date DATE,
  delivery_status TEXT DEFAULT 'delivered', -- 'delivered','pending','archived'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Interactions / Conversation History (threaded)
CREATE TABLE icemortgage_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  borrower_id UUID REFERENCES icemortgage_borrowers(id),
  interaction_type TEXT, -- 'phone_inbound','phone_outbound','email','portal','letter','sms','system'
  channel TEXT, -- 'voice','digital','mail','system'
  direction TEXT, -- 'inbound','outbound','system'
  agent_name TEXT,
  summary TEXT,
  detail TEXT,
  topic TEXT, -- 'payment','escrow','collections','lossmit','payoff','general'
  resolution TEXT, -- 'first_call','follow_up','transferred','escalated'
  sentiment TEXT, -- 'positive','neutral','negative'
  call_duration_seconds INTEGER,
  recording_url TEXT,
  transcript_url TEXT,
  external_call_id TEXT, -- for CTI integration
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Collections Cases
CREATE TABLE icemortgage_collections_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  borrower_id UUID REFERENCES icemortgage_borrowers(id),
  days_delinquent INTEGER,
  total_amount_due NUMERIC(10,2),
  total_late_fees NUMERIC(8,2),
  contact_attempts_this_week INTEGER DEFAULT 0,
  contact_attempts_max INTEGER DEFAULT 7, -- FDCPA
  last_contact_date DATE,
  last_contact_outcome TEXT,
  eligible_programs JSONB, -- array of { program_name, description, terms }
  cease_desist BOOLEAN DEFAULT false,
  active_litigation BOOLEAN DEFAULT false,
  bankruptcy_filed BOOLEAN DEFAULT false,
  fema_disaster_area BOOLEAN DEFAULT false,
  fema_disaster_description TEXT,
  status TEXT DEFAULT 'active', -- 'active','resolved','referred_lossmit','foreclosure_referral'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loss Mitigation Cases
CREATE TABLE icemortgage_lossmit_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  borrower_id UUID REFERENCES icemortgage_borrowers(id),
  case_number TEXT UNIQUE,
  case_type TEXT, -- 'forbearance','modification','repayment_plan','short_sale','deed_in_lieu'
  hardship_reason TEXT, -- 'job_loss','medical','divorce','disaster','military','other'
  spoc_name TEXT, -- single point of contact
  forbearance_start DATE,
  forbearance_end DATE,
  deferred_amount NUMERIC(10,2),
  extension_requested BOOLEAN DEFAULT false,
  extension_requested_via TEXT, -- 'phone','servicing_digital','mail'
  eligible_workouts JSONB, -- array of workout options with details
  brp_status TEXT, -- borrower response package: 'complete','incomplete','expired'
  gse_evaluation TEXT, -- 'pending','approved','denied','not_applicable'
  scra_active_duty BOOLEAN DEFAULT false,
  dual_tracking_check BOOLEAN DEFAULT false,
  foreclosure_referral BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- 'active','approved','denied','withdrawn','completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loss Mit Required Documents
CREATE TABLE icemortgage_lossmit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lossmit_case_id UUID REFERENCES icemortgage_lossmit_cases(id),
  document_name TEXT, -- 'Hardship Affidavit', 'Pay Stubs (2 months)', etc.
  status TEXT, -- 'received','outstanding','expired'
  received_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Flags (per loan, surfaced contextually)
CREATE TABLE icemortgage_compliance_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  flag_type TEXT, -- 'fdcpa','scra','fema','bankruptcy','litigation','cease_desist','dual_tracking'
  flag_status TEXT, -- 'ok','warning','blocked'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Call Predictions (pre-computed per loan)
CREATE TABLE icemortgage_call_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  prediction_rank INTEGER, -- 1, 2, 3
  reason TEXT, -- 'Escrow payment increase', 'Payment posting question'
  confidence NUMERIC(5,2), -- 0.00 to 1.00
  supporting_signal TEXT, -- 'Annual escrow analysis sent 3/18, payment change effective 5/1'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Screen Pop Events (written by API, consumed by Realtime)
CREATE TABLE icemortgage_screen_pops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  borrower_id UUID REFERENCES icemortgage_borrowers(id),
  loan_number TEXT,
  caller_name TEXT,
  caller_phone TEXT,
  intent TEXT, -- 'payment_inquiry','past_due','hardship','escrow','payoff','general'
  target_module TEXT, -- 'customer_service','collections','loss_mitigation','escrow','payoff'
  target_view TEXT, -- 'loan_overview','payment_history','escrow_detail','collections_delinquency','lossmit_case','payoff_quote'
  auth_method TEXT, -- 'voice_biometric','ivr_pin','manual','none'
  auth_score NUMERIC(5,2),
  queue TEXT,
  external_call_id TEXT,
  context_data JSONB, -- any additional context from calling system
  consumed BOOLEAN DEFAULT false,
  consumed_at TIMESTAMPTZ,
  agent_id UUID REFERENCES icemortgage_agents(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes (pushed back to calling systems)
CREATE TABLE icemortgage_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  screen_pop_id UUID REFERENCES icemortgage_screen_pops(id),
  agent_name TEXT,
  note_text TEXT,
  synced_to_external BOOLEAN DEFAULT false,
  external_system TEXT, -- which system it was pushed to
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dispositions
CREATE TABLE icemortgage_dispositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES icemortgage_loans(id),
  screen_pop_id UUID REFERENCES icemortgage_screen_pops(id),
  primary_reason TEXT, -- 'escrow_inquiry','payment_question','pmi_inquiry','payoff_request', etc.
  resolution TEXT, -- 'first_call_resolution','follow_up_required','transferred','escalated'
  sentiment TEXT, -- 'positive','neutral','negative'
  agent_name TEXT,
  synced_to_external BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agents
CREATE TABLE icemortgage_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  agent_code TEXT UNIQUE,
  department TEXT, -- 'customer_service','collections','loss_mitigation','retention'
  status TEXT DEFAULT 'available', -- 'available','on_call','away','offline'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Screen Pop API Design

The screen pop system works via **Supabase Realtime**. External systems call a REST endpoint (Edge Function or direct Supabase insert) that writes to `icemortgage_screen_pops`. The frontend subscribes to this table via Realtime and reacts immediately.

### API Endpoints (via Supabase Edge Functions)

#### 1. `POST /functions/v1/icemortgage-screen-pop`

Triggers a screen pop on the agent desktop. This is the primary integration point.

**Request Body:**
```json
{
  "loan_number": "10478293",
  "caller_name": "James Richardson",
  "caller_phone": "(972) 555-0147",
  "intent": "payment_inquiry",
  "auth_method": "voice_biometric",
  "auth_score": 98.4,
  "queue": "customer_service",
  "external_call_id": "CALL-2026-04-12-78234",
  "context_data": {
    "ivr_path": "Main > Servicing > Payment",
    "wait_time_seconds": 72,
    "caller_sentiment": "neutral"
  }
}
```

**Intent → Module Routing Map (hardcoded in the Edge Function):**

| Intent               | Target Module        | Target View                   |
| -------------------- | -------------------- | ----------------------------- |
| `payment_inquiry`    | `customer_service`   | `loan_overview`               |
| `past_due`           | `collections`        | `collections_delinquency`     |
| `hardship`           | `loss_mitigation`    | `lossmit_case`                |
| `escrow`             | `customer_service`   | `escrow_detail`               |
| `payoff`             | `payoff`             | `payoff_quote`                |
| `general`            | `customer_service`   | `loan_overview`               |
| `insurance_change`   | `customer_service`   | `escrow_detail`               |
| `pmi_inquiry`        | `customer_service`   | `loan_overview`               |
| `document_request`   | `customer_service`   | `documents`                   |

**Response:**
```json
{
  "success": true,
  "screen_pop_id": "uuid",
  "loan_id": "uuid",
  "target_module": "customer_service",
  "target_view": "loan_overview",
  "call_predictions": [
    { "rank": 1, "reason": "Escrow payment increase", "confidence": 0.87 },
    { "rank": 2, "reason": "Payment posting question", "confidence": 0.62 },
    { "rank": 3, "reason": "PMI removal inquiry", "confidence": 0.28 }
  ]
}
```

#### 2. `GET /functions/v1/icemortgage-loan-lookup?loan_number=10478293`

OR `GET /functions/v1/icemortgage-loan-lookup?phone=(972)555-0147`

Returns full loan data for screen pop context. Joins borrower, loan, property, escrow, recent payments, active collections/lossmit cases, compliance flags, and call predictions.

#### 3. `POST /functions/v1/icemortgage-push-notes`

Pushes notes and disposition from agent back into ICE.

```json
{
  "screen_pop_id": "uuid",
  "loan_number": "10478293",
  "agent_name": "Sarah Johnson",
  "note_text": "Borrower called regarding escrow increase...",
  "disposition": {
    "primary_reason": "escrow_inquiry",
    "resolution": "first_call_resolution",
    "sentiment": "neutral"
  }
}
```

#### 4. `POST /functions/v1/icemortgage-push-interaction`

Logs a full interaction record (call metadata from CTI system).

```json
{
  "loan_number": "10478293",
  "interaction_type": "phone_inbound",
  "agent_name": "Sarah Johnson",
  "summary": "Escrow payment increase inquiry - resolved",
  "topic": "escrow",
  "resolution": "first_call",
  "sentiment": "positive",
  "call_duration_seconds": 402,
  "recording_url": "https://...",
  "transcript_url": "https://...",
  "external_call_id": "CALL-2026-04-12-78234"
}
```

## Frontend Structure

Build as a **single-page React app** (Vite + React + Tailwind or vanilla CSS). The UI should look like an enterprise mortgage servicing platform — think financial services, not startup.

### Design System

- **Font**: IBM Plex Sans (body), IBM Plex Mono (loan numbers, amounts)
- **Colors**: Navy (#0B1D3A) topbar, Blue (#0066CC) primary, Orange (#E65100) collections, Red (#C62828) loss mit/alerts, Green (#2E7D32) success, Teal (#00897B) escrow
- **Layout**: Fixed topbar + left sidebar (220px) + main content area + right context panel (340px)
- **Style**: Dense, data-rich, enterprise feel. No rounded corners > 6px. Minimal whitespace. Think Bloomberg terminal meets Salesforce.

### Component Hierarchy

```
App
├── TopBar (ICE branding, loan search, agent info)
├── MainLayout
│   ├── Sidebar
│   │   ├── Loan Navigation (Overview, Payments, Escrow, Documents)
│   │   ├── Modules (Customer Service, Collections, Loss Mit, Payoff)
│   │   └── Actions (Notes & Disposition)
│   ├── ContentArea
│   │   ├── ContentHeader (title, module badge, action buttons)
│   │   └── ContentBody (renders current module view)
│   └── ContextPanel (right side)
│       ├── CallerIdentity (auth method, score)
│       ├── LoanSummary (quick loan data from MSP core)
│       ├── CallPredictions (AI-generated top 3 reasons)
│       ├── ScreenPopTarget (which module was routed)
│       └── QuickActions (push notes, copy summary)
└── ScreenPopOverlay (modal that appears on API trigger)
```

### Module Views

Each module renders a distinct view when navigated to:

1. **Loan Overview** (`customer_service` / `loan_overview`)
   - AI Call Prediction card (top)
   - Borrower info + Property info (side by side cards)
   - Full loan details grid (loan #, type, rate, UPB, monthly payment, dates, investor, PMI, LTV)
   - Recent activity timeline
   - Proactive opportunities (PMI removal, HELOC, refi)

2. **Payment History** (`customer_service` / `payment_history`)
   - Payment summary (P&I breakdown, escrow, PMI, total)
   - If payment change pending: show old vs. new comparison with effective date
   - Payment history table (last 12 months)

3. **Escrow Detail** (`customer_service` / `escrow_detail`)
   - Alert banner if shortage/surplus or upcoming change
   - Escrow account summary (balance, cushion, shortage)
   - Upcoming disbursements table
   - Disbursement history table

4. **Documents** (`customer_service` / `documents`)
   - Document list table with type, date, status, view/download buttons

5. **Customer Service** (full module view)
   - Call prediction card
   - Talk script suggestion (based on prediction + loan signals)
   - Threaded conversation history
   - Proactive opportunities (PMI removal, HELOC, refi retention)

6. **Collections** (`collections` / `collections_delinquency`)
   - DANGER alert banner (delinquency summary)
   - Compliance flags strip (FDCPA, SCRA, FEMA, bankruptcy, litigation, C&D)
   - Amount due breakdown card
   - Eligible assistance programs card (repayment plan, FEMA forbearance, partial payment)
   - FDCPA-tracked contact history table
   - One-click referral to Loss Mitigation

7. **Loss Mitigation** (`loss_mitigation` / `lossmit_case`)
   - DANGER alert (case active, forbearance expiring)
   - Active case summary (case #, type, hardship reason, SPOC, dates, deferred amount)
   - Eligible workout options (forbearance extension, modification, repayment plan, with projected payment impact)
   - Borrower Response Package document checklist (status per doc)
   - GSE evaluation status (FNMA SMDU, Freddie Resolve)
   - Compliance / second-level review controls

8. **Payoff / Refi** (`payoff` / `payoff_quote`)
   - Payoff quote (UPB, per diem, good-through date, fees, total)
   - Equity analysis (current value, UPB, available equity, LTV, max HELOC)
   - Retention: refinance comparison table (rate & term, cash-out, HELOC options with monthly savings and break-even)
   - Retention play recommendation

9. **Notes & Disposition**
   - Call notes textarea
   - Disposition pills (primary reason, resolution, sentiment)
   - Push to external system button
   - Call metadata display (duration, recording, transcript, sentiment)
   - Data flow diagram showing bidirectional sync

### Screen Pop Behavior

When the frontend receives a new record in `icemortgage_screen_pops` via Supabase Realtime:

1. **Overlay appears** — modal showing incoming call with caller name, intent, and loan # 
2. **Auto-route** — after 2 seconds (or on agent click "Accept"), the main view navigates to the `target_module` + `target_view`
3. **Context panel updates** — caller identity, loan summary, predictions, module target all populate
4. **Compliance flags load** — if collections or loss mit, compliance flags auto-surface
5. **Prediction card renders** — AI call predictions from `icemortgage_call_predictions` for that loan

### Realtime Subscription

```javascript
supabase
  .channel('screen-pops')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'icemortgage_screen_pops',
    filter: 'consumed=eq.false'
  }, (payload) => {
    // Show screen pop overlay
    // Load loan data
    // Navigate to target module
    // Mark as consumed
  })
  .subscribe();
```

## Seed Data

Seed at least **4 borrowers with distinct scenarios** so the demo can showcase all modules:

### Borrower 1: James Richardson (Current / Payment Inquiry)
- Loan #10478293, Conv 30yr Fixed @ 6.125%, Current
- UPB $387,420.18, Monthly $2,847.33
- Property: 4521 Oak Meadow Ln, Plano TX 75024, Value $495K
- Escrow: shortage of -$312.40, payment increase of +$89/mo effective 05/01/2026
- Recent escrow analysis sent 03/18, borrower viewed it on portal 3 times
- PMI at $142/mo, LTV 78.2% (close to removal)
- Predictions: escrow increase (87%), payment posting (62%), PMI removal (28%)

### Borrower 2: Marcus DeLeon (60 Days Delinquent / Collections)
- Loan #10891547, Conv 30yr Fixed @ 5.875%, 60 Days Delinquent
- UPB $312,880.45, Monthly $2,340.00 (2 payments missed + $89 late fees)
- Property: 782 Cedar Ridge Dr, McKinney TX 75070, Value $410K
- Collections case active, FDCPA tracking (3 of 7 attempts used this week)
- FEMA disaster area flag (Collin County tornado 03/2026)
- Eligible: repayment plan (6mo), FEMA forbearance (6mo), partial payment
- Predictions: requesting payment plan (91%), disputing late fee (45%), hardship disclosure (33%)

### Borrower 3: Patricia Nguyen (90+ Days / Loss Mitigation)
- Loan #10234891, FHA 30yr Fixed @ 5.50%, 90+ Days Delinquent, Forbearance Active
- UPB $278,340.00, Monthly $2,180.00
- Property: 1205 Willowbrook Ct, Allen TX 75002, Value $365K
- Loss Mit case LM-2026-00412, Forbearance since 11/15/2025, expires 05/15/2026
- Hardship: Job loss, Deferred $17,084, Extension requested via portal
- BRP partially complete (hardship affidavit expired, pay stubs outstanding)
- Workout options: forbearance extension, modification (5.25% = $1,680/mo), repayment plan
- Predictions: forbearance extension (93%), modification inquiry (71%), short sale (18%)

### Borrower 4: David & Sarah Kim (Current / Payoff-Refi)
- Loan #10567234, Conv 30yr Fixed @ 6.75%, Current
- UPB $445,200.00, Monthly $3,210.00
- Property: 3890 Preston Ridge Ln, Frisco TX 75034, Value $620K
- Equity: $174,800 available, LTV 71.8%
- Interested in payoff or refi (browsing Servicing Digital refi calculator)
- Predictions: payoff statement (85%), refi rate inquiry (68%), HELOC interest (42%)

## Key Implementation Notes

1. **No Talkdesk references anywhere** — not in UI, not in code comments, not in variable names, not in database columns. The screen pop API is generic — it could be called by any CTI system, IVR, or external platform.

2. **The `intent` field** in the screen pop API is just a string. The Edge Function maps it to a `target_module` and `target_view` using the routing table above. The calling system doesn't need to know about ICE modules.

3. **Realtime is critical** — the screen pop must feel instantaneous. When the API is called, the agent desktop reacts within 1-2 seconds.

4. **Data density** — mortgage servicing agents need a LOT of data on screen. Don't over-space things. Use compact grids, small fonts (12-13px body), and dense tables. Think enterprise, not consumer.

5. **Compliance flags** are not optional decoration — they need to auto-surface when entering Collections or Loss Mitigation views. FDCPA contact tracking, SCRA military status, FEMA disaster, bankruptcy, litigation, cease & desist, and dual-tracking prevention are all real regulatory requirements.

6. **Call predictions** should be pre-seeded in `icemortgage_call_predictions` per loan. In a real system these are ML-generated from loan signals (recent escrow analysis, payment change, delinquency, portal activity, etc.). For the demo, just seed them.

7. **The Context Panel** (right side) stays persistent across all views. It shows the current caller/loan context and doesn't change when the agent navigates between module views. It's the "always visible" summary.

8. **Notes & Disposition** should write to both `icemortgage_notes` and `icemortgage_dispositions` tables AND create an `icemortgage_interactions` record. The push-to-external button should call the Edge Function which logs the sync.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS or vanilla CSS, Supabase JS client
- **Backend**: Supabase (Postgres + Realtime + Edge Functions)
- **Hosting**: Deploy frontend to Vercel, Netlify, or serve locally
- **Supabase Edge Functions**: Deno/TypeScript

## File Structure

```
ice-mortgage-demo/
├── CLAUDE.md                    # This file
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   └── 002_seed_data.sql
│   └── functions/
│       ├── icemortgage-screen-pop/
│       │   └── index.ts
│       ├── icemortgage-loan-lookup/
│       │   └── index.ts
│       ├── icemortgage-push-notes/
│       │   └── index.ts
│       └── icemortgage-push-interaction/
│           └── index.ts
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── supabaseClient.js
│   ├── components/
│   │   ├── TopBar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ContextPanel.jsx
│   │   ├── ScreenPopOverlay.jsx
│   │   └── modules/
│   │       ├── LoanOverview.jsx
│   │       ├── PaymentHistory.jsx
│   │       ├── EscrowDetail.jsx
│   │       ├── Documents.jsx
│   │       ├── CustomerService.jsx
│   │       ├── Collections.jsx
│   │       ├── LossMitigation.jsx
│   │       ├── PayoffRefi.jsx
│   │       └── NotesDisposition.jsx
│   ├── hooks/
│   │   ├── useScreenPop.js        # Realtime subscription
│   │   ├── useLoanData.js         # Fetch loan + related data
│   │   └── useCallPredictions.js  # Fetch predictions for loan
│   └── lib/
│       ├── intentRouting.js       # Intent → module/view map
│       └── constants.js           # Statuses, colors, labels
├── package.json
├── vite.config.js
└── index.html
```

## Testing the Screen Pop

After deployment, test the full flow:

```bash
# 1. Trigger a payment inquiry screen pop for James Richardson
curl -X POST https://mnrseaapxpofdznnqrsv.supabase.co/functions/v1/icemortgage-screen-pop \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_number": "10478293",
    "caller_name": "James Richardson",
    "caller_phone": "(972) 555-0147",
    "intent": "payment_inquiry",
    "auth_method": "voice_biometric",
    "auth_score": 98.4,
    "queue": "customer_service"
  }'

# 2. Trigger a collections screen pop for Marcus DeLeon
curl -X POST https://mnrseaapxpofdznnqrsv.supabase.co/functions/v1/icemortgage-screen-pop \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_number": "10891547",
    "caller_name": "Marcus DeLeon",
    "caller_phone": "(469) 555-0283",
    "intent": "past_due",
    "auth_method": "voice_biometric",
    "auth_score": 96.1,
    "queue": "collections"
  }'

# 3. Trigger loss mitigation for Patricia Nguyen
curl -X POST https://mnrseaapxpofdznnqrsv.supabase.co/functions/v1/icemortgage-screen-pop \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_number": "10234891",
    "caller_name": "Patricia Nguyen",
    "caller_phone": "(214) 555-0391",
    "intent": "hardship",
    "auth_method": "voice_biometric",
    "auth_score": 97.2,
    "queue": "loss_mitigation"
  }'

# 4. Trigger payoff inquiry for David Kim
curl -X POST https://mnrseaapxpofdznnqrsv.supabase.co/functions/v1/icemortgage-screen-pop \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_number": "10567234",
    "caller_name": "David Kim",
    "caller_phone": "(972) 555-0518",
    "intent": "payoff",
    "auth_method": "voice_biometric",
    "auth_score": 99.1,
    "queue": "retention"
  }'
```

## Acceptance Criteria

- [ ] All `icemortgage_*` tables created with seed data for 4 borrowers
- [ ] Frontend loads loan data from Supabase and renders all 9 module views
- [ ] Screen pop API writes to `icemortgage_screen_pops` and includes intent routing
- [ ] Frontend Realtime subscription picks up screen pop and auto-navigates to correct module
- [ ] Screen pop overlay shows incoming call details before routing
- [ ] Context panel persists across view navigation with current caller/loan context
- [ ] Collections view shows compliance flags and FDCPA tracking
- [ ] Loss Mitigation view shows active case, workout options, BRP document checklist
- [ ] Payoff view shows payoff quote, equity analysis, and retention refi comparison
- [ ] Notes & Disposition writes to DB and marks synced
- [ ] No references to Talkdesk anywhere in the system
- [ ] Loan search works (by loan number or borrower name)
- [ ] Call predictions render for each loan with confidence scores
