# Wapsi Dashboard Optimization: Card Pruning and Consolidation Strategy

## Executive Summary

The primary architectural flaw of the official Income Tax portal (incometax.gov.in) is extreme fragmentation: routine workflows are split across disconnected menus, sub-portals (TRACES, Compliance Portal, e-Pay Tax), and separate pre-login calculators.

Wapsi's core brand promise is a **"facts-first, conversational paradigm."** Presenting 18 simultaneous cards on the main dashboard reproduces the government portal's cognitive overload and decision paralysis. 

By pruning redundant standalone tools and consolidating fragmented flows, Wapsi transitions from an unorganized 18-card directory into a focused **7-card tactile grid**, supported by an onboarding header and a persistent AI Copilot.

---

## 1. Cards to Remove Completely from the Main Grid (3 Cards)

These cards dilute Wapsi's core value proposition by making the app look like an ad-supported personal finance blog rather than an authoritative filing engine:

* **Remove: "Rent allowance check" (HRA)**
  * **Architectural Reason:** Section 10(13A) House Rent Allowance exemption is simply an allowance within the Salary schedule. Elevating HRA to the home dashboard while excluding other major deductions (such as Section 80D medical insurance, 80CCD NPS, or home loan interest) breaks visual and logical consistency.
  * **Target Location:** Resides inside the **Salary Income fact card** during return preparation or accessible via prompt in the AI Tax Copilot.

* **Remove: "Shares or property sold?" (Capital Gains)**
  * **Architectural Reason:** Capital gains (Sections 111A, 112, 112A) are schedule-level line items in ITR-2. Giving them an isolated dashboard tile isolates them from the general filing flow.
  * **Target Location:** Ingested automatically into **"Match department records"** via broker/AIS statements.

* **Remove: "My documents and details"**
  * **Architectural Reason:** Taxpayers do not use an income tax platform as a generic file storage cabinet. Displaying this upfront adds clutter.
  * **Target Location:** Relocated to a **Settings / Profile drawer** in the top navigation header.

---

## 2. Cards to Remove as Standalone Tiles and Consolidate (7 Cards)

These capabilities are retained in full but consolidated into unified surfaces:

* **Remove: "Does my TDS match?"**
  * **Consolidate into:** **"Match with the department's records"**
  * **Reason:** Tax Deducted at Source (TDS from Form 16 and Form 26AS) is a core component of the department's records. Having separate cards for "Match records" and "Does my TDS match?" confuses users about where to reconcile their withholdings.

* **Remove: "Tax calculator"**
  * **Consolidate into:** **"Old regime or new?"** (Rename to: **"Tax & Regime Optimizer"**)
  * **Reason:** A static tax calculator that does not compare regimes side by side is obsolete. Wapsi's reactive calculation engine evaluates both regimes simultaneously with AY 2026–27 marginal relief, making a single optimizer card the complete solution.

* **Remove: "Advance-tax dates"**
  * **Consolidate into:** **"Tax calendar"** (Rename to: **"Tax Calendar & Deadlines"**)
  * **Reason:** Advance tax installments (June 15, Sept 15, Dec 15, March 15) are milestone dates within the tax calendar. Keeping them separate takes up unnecessary grid space.

* **Remove: "Where is my refund?", "e-Verify my return", "Download acknowledgement", and "Filing history" (4 Cards)**
  * **Consolidate into:** **"Return Status & Past Filings"**
  * **Reason:** These are all post-filing lifecycle actions. Displaying four separate tiles to an assessee who has not yet submitted their current return adds clutter. Consolidate them into a dynamic post-filing hub that displays an e-Verify countdown if unverified, a refund pipeline if processing, and a direct download link for the signed Form ITR-V.

---

## 3. Cards to Relocate Outside the Grid (2 Components)

* **Relocate: "Connect DigiLocker"**
  * **Reason:** Identity synchronization is an initial onboarding step, not a recurring task.
  * **Target Location:** Placed as a prominent **"Quick Start / Pre-fill Banner"** directly above the main card grid.

* **Relocate: "Ask the assistant"**
  * **Reason:** A conversational AI copilot should not be treated as a passive grid item.
  * **Target Location:** Positioned as a floating/docked Copilot input bar or integrated into the persistent navigation header.

---

## 4. The Optimized 7-Card Grid Architecture

The streamlined dashboard organizes actions into 7 high-impact surfaces:

| Card Title | Consolidates & Replaces | Core Functional Role |
| :--- | :--- | :--- |
| **1. File or Review Return** | File return, Form 16 ingestion | Unified facts-first return builder and submission pipeline. |
| **2. Match Official Records** | Match records, TDS match, AIS/26AS | Reconciles Form 16, 26AS, and AIS data with CBDT feedback codes. |
| **3. Tax & Regime Optimizer** | Tax calc, Old vs. New, HRA | Real-time reactive calculation with Section 87A marginal relief. |
| **4. Pay Tax Due** | Challan 280, e-Pay Tax | Self-assessment payment u/s 140A with instant simulated UPI QR codes. |
| **5. Notices & Defect Resolver** | Respond to a letter, e-Proceedings | Automated defense drafter for Section 143(1)(a) and 139(9) notices. |
| **6. Return Status & History** | Refund status, e-Verify, ITR-V, History | Unified lifecycle tracker for past filings, verification, and refunds. |
| **7. Tax Calendar & Deadlines** | Tax calendar, Advance-tax dates | Integrated milestone tracker for statutory dates and penalty cutoffs. |

---

## 5. Architectural Comparison

| Dimension | Current Prototype (18 Cards) | Proposed Optimized Architecture (7 Cards) |
| :--- | :--- | :--- |
| **Cognitive Load** | High; user must guess between overlapping tools (e.g., TDS match vs. 26AS). | Low; structured flow: File, Reconcile, Optimize, Pay, Resolve. |
| **Design Aesthetic** | Crowded 3 x 6 layout; resembles an index directory. | Clean, tactile index-card surfaces aligned with Direction-13 aesthetic. |
| **Government Parity** | Replicates the government portal's isolated menu anti-pattern. | Unifies fragmented statutory schedules into coherent conversational surfaces. |
