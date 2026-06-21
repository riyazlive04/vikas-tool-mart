# Product Requirements Document (PRD) — v2
## Vikas Tool Mart — Customer & Reputation Operations System (CROS)

| | |
|---|---|
| **Prepared by** | Sirah Digital |
| **Prepared for** | Vikas Tool Mart — Chairman: Jagadeesh, MD: Uma Jagadeesh |
| **Version** | Draft v2.0 (Discovery) |
| **Date** | 21 June 2026 |
| **Supersedes** | v1.0 |
| **Status** | For client review — open items in §12 |

> **What changed from v1.** v1 scoped a standalone CRE logging tool from the org chart + prototype. The live website revealed VTM runs a full **WooCommerce store** (INGCO® / Wadfow® dealer, Erode, GST invoicing, on-site reviews, COD, returns). v2 makes the **recommended path a system that reads from that existing store** so metrics are real and manual entry is minimised — while keeping standalone manual entry as a guaranteed fallback. We are **not** rebuilding or touching their store; we only read from it.

---

## 1. Guiding Design Principle (client-stated)

> **"As flexible and easy as possible. Reduce manual entries — but if needed, they can always enter manually."**

This drives every decision in this document. Concretely it means three non-negotiables:

1. **Automate-first.** Anything the WooCommerce store already knows is pulled automatically (orders, new vs repeat customers, on-site reviews, products). The team never re-types data the system can fetch.
2. **Manual override, always.** Every metric can be edited by hand. Auto-filled values are suggestions the user can accept or change. Nothing is ever locked because a sync failed.
3. **Configurable, not hard-coded.** KPIs, tasks, and social channels are admin-editable lists — VTM can change them without a developer.

---

## 2. Executive Summary

Vikas Tool Mart is a power-tool and hand-tool dealer (INGCO®, Wadfow®) running a WooCommerce store out of Erode alongside a physical showroom. Its CRE function — led by Indhumathi — runs the reputation and customer-experience engine: review/testimonial generation, complaint resolution, repeat-customer tracking, and daily social content.

VTM has already designed this workflow and captured it in a prototype. The prototype proves the workflow but is fatally limited as a system: all data lives in one browser, invisible to leadership, and **every number is hand-typed** even though their store already knows most of it.

**Recommendation:** build a cloud, multi-user **Customer & Reputation Operations System (CROS)** that (a) pulls the daily order list, customer history, and on-site reviews from their WooCommerce store automatically, (b) lets the CRE work that list with one-tap actions that *compute the KPI counts themselves*, (c) keeps full manual entry as a fallback, and (d) gives the MD a trustworthy real-time dashboard. Build the CRE function excellently first; design clean extension points for Service and Marketing later.

---

## 3. Business Context (updated from website)

- **What they are:** Authorised dealer/reseller of INGCO® and Wadfow® tools — power tools, hand tools, construction, garden, air, bench, cleaning, painting tools, accessories.
- **Channels:** Live WooCommerce store + physical showroom (18 Krishna Chetti Rd, Erode 638001, TN) + heavy social (Facebook, Instagram, YouTube, **Pinterest**, WhatsApp on +91 93612 23456).
- **Commerce signals:** GST-inclusive pricing, COD, combo/clearance/deal-of-the-week promotions, on-site product reviews (CusRev trust badge), defined return/refund/cancellation policies.
- **Implication:** The CRE workflow is *built around this store*. "Repeat customers," "reviews received," "customers contacted," and "invoice list received" all have a real source of truth in WooCommerce. After-sales **service/warranty** (Kokila's dept) is a real function because power tools carry warranties and returns.

### Organisation (unchanged)
Chairman (Jagadeesh) → MD (Uma Jagadeesh) → Accounts · Sales (Head TBD) · Marketing (Head TBD, Yuvadharsini) · Packing (Head TBD, Kannan) · **CRE (Indhumathi)** · Service (Head TBD, Kokila) · Offline Showroom (Rajkumar) · Purchase (Maheswari). *Sales, Marketing, Packing, Service heads still to be confirmed.*

---

## 4. The Core Insight This Build Delivers

The prototype makes the CRE **type counts**: "repeat customers: 12," "reviews received: 4," "customers contacted: 30." Two problems:

1. **It's slow** — defeats "easy as possible."
2. **It's untrustworthy** — a typed number can't be audited. If the MD is paying for *visibility*, a self-reported figure is theatre; a figure pulled from real orders is an instrument.

**CROS fixes both with an Order Worklist.** Each morning the system pulls the day's orders from WooCommerce and shows them as a worklist. The CRE works the list and taps actions per order — *Contacted, Review requested, Unboxing requested, Testimonial requested, Log complaint*. Those taps **auto-increment the matching KPI counts** and leave an audit trail. New-vs-repeat, on-site reviews, and average rating are computed from store data directly. The CRE types only what's genuinely manual (Google reviews received, feedback forms, "did we post the story today," and the daily reflections) — and can still override any auto number by hand.

---

## 5. Goals & Success Metrics

| Goal | Measure of success |
|---|---|
| Cut manual entry sharply | ≥ 60% of daily KPI values auto-populated from WooCommerce / system actions |
| Trustworthy leadership visibility | MD dashboard shows real-time, source-tagged metrics any day without asking staff |
| Permanent, safe data | 100% server-side with backups; zero data-loss incidents |
| Keep daily logging fast | A CRE completes the day's entry faster than the prototype; daily-completion ≥ 90% |
| Honest complaint tracking | Every complaint logged → assigned → resolved with timestamps; open/closed visible to MD |

---

## 6. Users & Roles

| Role | Who | Can do |
|---|---|---|
| **Admin / Leadership** | MD, Chairman | Everything: dashboards, exports, user management, configure KPIs/tasks/channels, WooCommerce settings |
| **Department Head** | CRE Head (Indhumathi); later Service (Kokila), Marketing | Review own team's entries, manage complaints, see department dashboard |
| **CRE Executive** | CRE team | Daily workbook, order worklist, log complaints |
| *(Future)* Service / Marketing staff | — | Resolve assigned complaints; content posting status |

---

## 7. Data Sources — Auto vs Manual (the heart of the spec)

| Metric / data | Source | Notes |
|---|---|---|
| Daily order / invoice list | **AUTO** (Woo REST API) | Replaces the "Invoice List Received" task entirely |
| New vs Repeat customers | **AUTO** (computed from Woo order history) | Overridable |
| On-site product reviews + average rating | **AUTO** (Woo / CusRev reviews) | Overridable |
| Complaints logged / assigned | **AUTO** (derived from complaint records created/assigned in-app) | No double entry — logging a complaint increments the KPI |
| Customers contacted | **TAP-ACTION** on worklist (fallback manual) | Tap "Contacted" per order; or type a count |
| Review / unboxing / testimonial requested | **TAP-ACTION** on worklist (fallback manual) | Same pattern |
| **Google** reviews received | **MANUAL now** (Google Business Profile API = future) | On-site reviews are auto; Google needs separate OAuth — kept manual in Phase 1 |
| Feedback forms completed | **MANUAL** | Unless a form tool exists (see §12) |
| Social posts done (stories, tip, hand-tool, clearance, restock) | **MANUAL** (tap checkbox) | Whether content was posted is a human fact |
| Social follower counts | **MANUAL** | Platform follower APIs are restricted/not worth it for SME; manual daily entry |
| Daily reflections (achievement, issues, commitment, notes) | **MANUAL** | Qualitative |

> Every AUTO value renders as an editable field pre-filled with the synced number, tagged with its source. Editing it records who overrode it and when.

---

## 8. Scope — Phase 1

### In scope
Cloud, bilingual (English/Tamil), mobile-first **CROS**: auth & roles, WooCommerce **read-only** sync, Order Worklist, daily CRE workbook (KPIs + tasks + social + reflections, automate-first), complaint/ticket tracking, management dashboard, reporting & export, and an admin configuration area.

### Explicitly OUT of scope (Phase 1)
- Rebuilding / modifying the WooCommerce store (we only read from it)
- Inventory, purchase orders, accounting/billing/POS, e-commerce features
- Packing/logistics workflow
- WhatsApp automation / chatbot *(deferred by design)*
- Meta Ads management
- Google Business Profile review auto-pull *(manual in P1; automate later)*
- Social follower auto-pull via platform APIs

Future phases (validate before building): Service-dept complaint routing + customer records (CRM-lite) → Marketing content calendar → broader ops. Gated by a genuine business case, not assumed.

---

## 9. Functional Requirements (MoSCoW)

**Auth & roles:** secure login; roles Admin/Head/CRE; admin user management; per-entry attribution. *(Must)*

**WooCommerce sync:** read-only connection via store API keys; scheduled daily pull of orders, customers, products, on-site reviews; manual "Sync now" button; sync log with status/errors; graceful degradation to manual if the store is unreachable. *(Must)*

**Order Worklist:** show the day's orders; per-order one-tap actions (Contacted / Review requested / Unboxing requested / Testimonial requested / Log complaint) that auto-feed KPIs; filter & search. *(Must)*

**Daily Workbook:** one entry per CRE per day; KPIs (auto-prefilled + manual override), task checklist, social channel snapshots, reflection fields; progress indicators; opens pre-populated. *(Must)*

**Complaints:** log → assign → status (Open/In Progress/Resolved) → follow-up → resolution notes; optional link to a Woo order; category incl. warranty/defect/delivery/other; feeds complaint KPIs. *(Must)*

**Social tracking:** per-channel (Instagram, YouTube, Facebook, WhatsApp Community, **Pinterest**) yesterday/today counts with auto change; content-posted checklist. *(Must)*

**Management Dashboard:** today snapshot across all CREs; trends (avg rating, reviews, complaints open/closed, repeat vs new, follower growth); date-range filter; accountability view (who submitted / missed); source tags on every metric. *(Must)*

**Reporting & export:** auto end-of-day report; weekly/monthly summary; export to PDF and Excel. *(Should)*

**Admin configuration (flexibility):** add/edit/reorder/disable KPIs (set each as auto-with-source or manual), tasks, and social channels; manage targets; set sync schedule; manage bilingual labels. *(Must — this is what makes it "flexible")*

---

## 10. Non-Functional Requirements

- **Mobile-first** responsive web app (PWA-installable preferred over native).
- **Cloud + backups** (fixes the prototype's #1 flaw).
- **Bilingual** English/Tamil UI (Erode team).
- **Performance:** daily entry must feel instant; worklist + sync must not block the UI.
- **Security & DPDP Act:** customer PII (names/phones from orders, complaints) stored with access control and India data residency; WooCommerce API keys encrypted at rest.
- **Resilience:** the app must work fully on manual entry if WooCommerce sync is down.
- **Right-sized cost:** SME-appropriate hosting (Hostinger VPS); no over-engineering.

---

## 11. Recommended Architecture (high level — detail in build prompt)

Next.js 14 (App Router, full-stack) + PostgreSQL + Prisma + Better Auth + Tailwind, with a lightweight scheduled worker for the WooCommerce read-sync, hosted on Hostinger VPS. Charts via Recharts; exports via PDF + SheetJS. Bilingual via next-intl. Redis/BullMQ noted as an upgrade path if sync volume grows. *(Full technical spec and build order are in the companion Claude Code master prompt.)*

---

## 12. Open Questions / To Be Confirmed

1. **WooCommerce access:** can VTM issue **read-only** REST API keys (consumer key/secret)? Plugin set (confirm CusRev for reviews).
2. **Sync frequency:** once daily (morning) enough, or multiple times a day?
3. **CRE headcount:** only Indhumathi, or a team? (single log vs roll-up).
4. **Counts vs customer records:** keep counts (Phase 1) or store customer records for follow-up/CRM-lite (bigger, DPDP)?
5. **Google reviews:** is auto-pull from Google Business Profile wanted later, or is manual fine?
6. **Feedback forms:** is there an existing form tool to integrate, or manual count?
7. **Languages:** confirm Tamil + English (assumed yes).
8. **Service dept:** confirm Kokila/Service to receive routed complaints (Phase 2)?
9. **Hosting & ownership:** Hostinger VPS confirmed; who maintains post-launch?

---

## 13. Risks & Assumptions

- **Assumption:** the prototype reflects the *agreed current* workflow; VTM can provide read-only Woo API keys.
- **Risk — scope creep across 8 departments** → hard boundary (§8); future phases gated.
- **Risk — sync reliability** → mitigated by mandatory manual fallback and visible sync logs.
- **Risk — adoption** → mitigated by automate-first worklist (faster than the prototype is a Phase-1 acceptance test).
- **Risk — PII/compliance** → DPDP-aligned storage; keep customer records out unless Q4 says otherwise.

---

## 14. Next Steps

1. Share v2 + run a short discovery call (resolve §12, esp. Woo API access and counts-vs-records).
2. Lock Phase-1 scope and KPI targets.
3. Build per the companion **Claude Code master prompt** → pilot with CRE → MD review → iterate.

*Prepared by Sirah Digital. Discovery-stage draft; figures, phases, and architecture subject to confirmation.*
