# HackCanton Season 3 Submission Package

## 1. Project Information
- **Project Name**: Canton Private Refinancing Application (RefCanton)
- **Tagline**: Confidential Debt Refinancing with Atomic Collateral Repledging on Canton Network
- **Track**: Institutional Privacy & DeFi Infrastructure
- **Hackathon**: HackCanton Season 3 (July 23 – October 21, 2026)
- **Repository URL**: `https://github.com/intelliDean/refcanton`
- **Demo URL**: `http://localhost:4000` (Docker Compose or local)

---

## 2. Executive Pitch & Problem Statement

### The Problem
In commercial lending and syndicated credit facilities, debt refinancing is friction-heavy, risk-laden, and prone to predatory behavior:
1. **Confidentiality Bleed**: On transparent blockchains (Ethereum, Solana), loan refinancing exposes competitor rates, borrower debt service capabilities, and maturity profiles to all market participants.
2. **Bridge / Settlement Risk**: In traditional finance, releasing collateral before new funds arrive exposes the outgoing lender to loss. Conversely, wiring funds before collateral is pledged exposes the incoming lender to default.
3. **Double-Pledging**: Borrowers often attempt to pledge the same asset to multiple lenders simultaneously during transition periods.

### The Solution: Why Canton?
The Canton Network is uniquely suited to solve this problem through **Sub-Transaction Privacy** and **Global Atomic Composability**:
- **Confidentiality Projection**: Canton transactions are trees where nodes are projected only to parties with a need-to-know. Outgoing Lender A only sees their payoff of $101,000 and the release of their lien. Incoming Lender B only sees their new loan origination of $100,000 and the receipt of their collateral pledge. Neither lender sees the other's rate, terms, or identity.
- **Single-Transaction Atomic Swap**: Collateral is never unlocked or exposed. In Daml, the choice `SettleAndRepledge` transfers funds, satisfies Loan A, and repledges the 150 `COLLAT-TEST` units to Loan B in the **exact same block**. If any leg fails, the entire transaction reverts.

---

## 3. 3-Minute Video Demonstration Script

| Timestamp | Screen / Visual | Voiceover Script |
| :--- | :--- | :--- |
| **0:00 - 0:35** | **Problem Statement & Borrower Dashboard**<br>• Show Borrower (Alice) dashboard<br>• Highlight 150 COLLAT-TEST locked for Loan A ($100k @ 8.5%) | *"Welcome to RefCanton. Commercial borrowers frequently refinance debt to capture lower interest rates, but doing so on a blockchain usually leaks sensitive pricing terms to competitors, while traditional settlement exposes lenders to counterparty risk. Here on our Canton dashboard, Alice has an existing $100,000 loan with LegacyBank at 8.5% interest, secured by 150 test collateral units. Alice has found a new lender, NeoCapital, willing to refinance at 7.5%."* |
| **0:35 - 1:15** | **Lender Quotes & Escrow Funding**<br>• Switch to Lender A view ➔ Issue $101k Payoff Quote<br>• Switch to Lender B view ➔ Allocate $100k cash & commit Replacement Offer | *"First, we switch to LegacyBank's view. LegacyBank issues a binding Payoff Quote for $101,000, valid for 7 days. Next, we switch to incoming lender NeoCapital. NeoCapital commits an offer at 7.5% amortizing and locks $100,000 in escrow. Notice how NeoCapital cannot see LegacyBank's historical loan terms, and LegacyBank has zero knowledge of NeoCapital's presence."* |
| **1:15 - 1:55** | **Borrower Review & Atomic Execution**<br>• Switch back to Borrower<br>• Review terms side-by-side<br>• Click 'Execute Atomic Close' | *"Back on Alice's dashboard, both commitments are verified. Alice provides $1,000 equity to cover accrued interest. She clicks 'Execute Atomic Close'. Under the hood, Daml executes an atomic transaction: $101,000 is transferred to LegacyBank, Loan A is archived, 150 collateral units are instantaneously repledged to NeoCapital, and Loan B becomes active. In one ledger update, with zero counterparty bridge risk."* |
| **1:55 - 2:40** | **Canton Privacy Inspector Modal**<br>• Click 'Privacy Inspector'<br>• Highlight 3-column projection matrix | *"Now let's inspect Canton's sub-transaction privacy. Opening the Privacy Inspector, we view the exact projection received by each participant node. Notice that LegacyBank's projection redacts all details about Loan B, its 7.5% rate, and NeoCapital. Simultaneously, NeoCapital's projection redacts LegacyBank's prior 8.5% rate and payoff terms. Only Alice, the borrower, holds the full composite ledger projection."* |
| **2:40 - 3:00** | **Summary & Conclusion**<br>• Show transaction hash & audit log<br>• Show 100% passing test suite | *"RefCanton demonstrates how Canton's unique architectural strengths—sub-transaction privacy and atomic composability—unlock institutional-grade credit refinancing without settlement risk. Thank you!"* |

---

## 4. Technical Architecture Details

### Smart Contracts (Daml 3.4.11)
- **`Assets.daml`**: Implements digital cash and collateral holding with cryptographic lock enforcement. The `LockedCollateralHolding` can only be altered via `Repledge` or `Unlock` when authorized by the active lienholder.
- **`Loan.daml`**: Implements an extensible `LoanInterface` with two distinct loan structures:
  - `LoanA`: Fixed 8.5% bullet term loan.
  - `LoanB`: 7.5% cap-rate amortizing facility.
- **`Approvals.daml`**: Contains `PayoffQuote` and `ReplacementOffer` contracts that guarantee atomicity, expiry dates, and pre-allocated liquidity.
- **`Closing.daml`**: Single atomic `Execute` choice that coordinates payment, loan archiving, collateral re-assignment, and receipt generation.

### Edge Case & Security Verifications
Our Daml test suite (`daml/TestRefinancing.daml`) passes **7/7 automated scenarios** covering:
- **Insufficient Borrower Equity**: Reverts if the borrower cannot cover the delta between payoff and new funding.
- **Expired Quotes**: Reverts if either quote has expired.
- **Quote Revocation**: Prevents execution if the outgoing lender exercised their revocation right before closing.
- **Offer Withdrawal**: Prevents closing if the incoming lender withdrew their commitment.
- **Borrower Cancellation**: Allows clean abort and deallocation of funds prior to execution.

---

## 5. Verification Checklist for Hackathon Reviewers

1. [x] **Clean Checkout Test**: Repo contains clear build instructions and automated `npm test`.
2. [x] **SDK Compatibility**: Built with modern Daml 3.4.11 / Canton compatibility.
3. [x] **Role-Based Views**: Borrower, Outgoing Lender A, and Incoming Lender B all have role-tailored dashboards.
4. [x] **Atomic Collateral Repledge**: Collateral never enters an unlocked state during execution.
5. [x] **Privacy Demonstration**: Real-time Privacy Inspector proves sub-transaction data redaction between competitors.
6. [x] **Interactive Failure Simulator**: Live UI controls to inject borrower equity deficits or expired quotes and verify Canton atomic aborts.
7. [x] **Containerized Multi-Participant Topology**: 1-click Docker Compose deployment (`./scripts/run_docker.sh`) running 3 isolated participant nodes and a synchronizer domain.
8. [x] **Strict Scope Discipline**: Adheres strictly to single-currency (`USD-TEST`), single-collateral (`COLLAT-TEST`), and fixed negotiated terms without introducing unneeded off-ledger dependencies.
