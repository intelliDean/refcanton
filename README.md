# Canton Private Refinancing Application
> *Sub-Transaction Privacy & Atomic Collateral Repledging on Canton Network & Daml*

[![CI](https://github.com/intelliDean/refcanton/actions/workflows/ci.yml/badge.svg)](https://github.com/intelliDean/refcanton/actions/workflows/ci.yml)
[![Daml Tests](https://img.shields.io/badge/Daml%20Tests-17%20Passed%20(100%25)-brightgreen.svg)]()
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-5%20Suites%20Passed-brightgreen.svg)]()
[![Canton Evidence](https://img.shields.io/badge/Canton%20Evidence-Verified%20Update%20ID-blue.svg)](EVIDENCE.md)
[![Daml SDK](https://img.shields.io/badge/Daml%20SDK-3.4.11-blue.svg)]()
[![Canton](https://img.shields.io/badge/Canton-Network%20Enabled-blueviolet.svg)]()
[![License](https://img.shields.io/badge/License-Apache%202.0-yellow.svg)](LICENSE)

---

## 1. Executive Summary

In traditional finance and current Web3 debt protocols, loan refinancing suffers from two critical flaws:
1. **Public Exposure**: Lenders can inspect competitors' interest rates, maturity dates, and borrower balance sheets.
2. **Settlement Counterparty Risk**: Collateral release and payoff funding are fragmented into separate asynchronous steps, creating bridge risk where either a lender releases collateral without payoff or a borrower defaults before pledging.

The **Canton Private Refinancing Application** solves this by leveraging **Canton’s sub-transaction privacy and atomic composability**. 

A borrower (Alice) refinances an existing loan with an outgoing lender (**Lender A / LegacyBank**, $101,000 payoff) using fresh funds from an incoming lender (**Lender B / NeoCapital**, $100,000 commitment) plus $1,000 borrower equity. In **one single committed atomic ledger transaction**:
- $101,000 is transferred to Lender A.
- Loan A is archived and discharged.
- 150 test collateral units (`COLLAT-TEST`) are atomically repledged from securing Loan A to securing Loan B.
- Loan B is instantiated under negotiated terms.
- **Privacy is mathematically guaranteed**: Lender A cannot see Lender B's interest rate, terms, or identity. Lender B cannot see Lender A's historical interest rate or loan parameters.

---

## 2. Architecture & Transaction Flow

```
                      ┌───────────────────────────────────────────────┐
                      │              BORROWER (Alice)                 │
                      │   - 150 COLLAT-TEST locked for Loan A         │
                      │   - Contributes $1,000 USD-TEST equity        │
                      └──────────────┬─────────────────┬──────────────┘
                                     │                 │
           1. Issues Payoff Quote    │                 │  2. Commits Replacement Offer
             ($101,000 Payoff)       │                 │     ($100,000 Loan B @ 7.5%)
                                     ▼                 ▼
             ┌─────────────────────────┐             ┌─────────────────────────┐
             │   LENDER A (LegacyBank) │             │  LENDER B (NeoCapital)  │
             │   Loan A ($100k @ 8.5%) │             │  Allocates $100,000 cash│
             └─────────────────────────┘             └─────────────────────────┘
                                     │                 │
                                     └────────┬────────┘
                                              │
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │            ATOMIC CLOSING CHOICE              │
                      │                                               │
                      │  1. Transfers $101k to Lender A ($100k B + $1k)│
                      │  2. Archives Loan A                           │
                      │  3. Repledges 150 COLLAT-TEST to Lender B     │
                      │  4. Creates Active Loan B                     │
                      │  5. Emits Role-Filtered Closing Receipts      │
                      └───────────────────────────────────────────────┘
```

### Canton Sub-Transaction Privacy Matrix

| Contract / Data | Alice (Borrower) | Lender A (LegacyBank) | Lender B (NeoCapital) | Operator |
| :--- | :---: | :---: | :---: | :---: |
| **Loan A Terms ($100k, 8.5%)** | Visible | **Visible** | ❌ **Hidden** | Visible |
| **Payoff Quote ($101k)** | Visible | **Visible** | ❌ **Hidden** | Visible |
| **Loan B Terms ($100k, 7.5%)** | Visible | ❌ **Hidden** | **Visible** | Visible |
| **Replacement Offer ($100k)** | Visible | ❌ **Hidden** | **Visible** | Visible |
| **Atomic Settlement** | Visible | Paid $101k, Collateral Freed | Received Collateral, Loan B Active | Sequenced |

---

## 3. Project Structure

```
.
├── daml/                        # Daml Smart Contracts
│   ├── Assets.daml              # Collateral & Cash token models with enforced locking
│   ├── Loan.daml                # LoanInterface adapter + LoanA (Bullet) & LoanB (Amortizing)
│   ├── Approvals.daml           # PayoffQuote and ReplacementOffer binding commitments
│   ├── Closing.daml             # ClosingRequest and atomic Execute choice
│   ├── Setup.daml               # Deterministic ledger initialization script
│   └── TestRefinancing.daml     # Comprehensive test suite (Happy path, failures, race conditions)
├── backend/                     # Backend Gateway & Projection Service
│   ├── daml-js/                 # Generated TypeScript bindings (daml codegen js)
│   ├── src/
│   │   ├── types/               # TypeScript interfaces for ledger domain & responses
│   │   ├── config/              # Financial parameters and baseline constants
│   │   ├── services/            # AtomicClosing, CantonPrivacyEngine & LedgerStore
│   │   ├── routes/              # Express API routers (quotes, offers, closing, state)
│   │   ├── ledger.ts            # Domain facade coordinating ledger operations
│   │   └── server.ts            # Express REST server & static web app host
│   └── package.json
├── frontend/                    # Modern Web Application
│   ├── index.html               # Semantic HTML5 layout with Role Switcher & Modals
│   ├── style.css                # Dark mode design system (glassmorphism, vibrant accents)
│   ├── app.js                   # Application coordinator & event dispatcher
│   └── js/
│       ├── api.js               # Centralized async API client
│       ├── components/          # Toast, Privacy Modal, Audit Log Modal
│       └── views/               # Borrower, Lender A & Lender B view controllers
├── scripts/                     # Developer tooling
│   └── generate_bindings.sh     # Daml codegen wrapper script
├── daml.yaml                    # Daml package definition (SDK 3.4.11)
├── package.json                 # Root script runner
└── README.md                    # This document
```

---

## 4. Quick Start & Reproduction Guide

### Prerequisites
- **Daml SDK**: `3.4.11` (or Daml 3.x)
- **Node.js**: `>= 18.0.0`
- **Java JDK**: `>= 17` (required by Daml compiler)

### Step 1: Install Daml SDK (if not already installed)
```bash
curl -sSL https://get.daml.com/ | sh
export PATH="$HOME/.daml/bin:$PATH"
daml version
```

### Step 2: Build Daml Contracts
Compile the DAR package:
```bash
npm run daml:build
# Generates .daml/dist/ref-canton-0.0.1.dar
```

### Step 3: Run the Automated Test Suite
Execute the Daml contract tests and backend security regression suite:
```bash
npm test
```
**Test Coverage Includes (17 Daml Tests + 5 Backend Security Suites):**
- **Smart Contract Security & Invariants**:
  - `testRefinancingLifecycle`: Complete happy-path atomic swap and balance verification.
  - `testUnauthorizedCollateralReleaseFails`: Rejects attempts to unlock collateral without lender authorization.
  - `testPaymentFreeReleaseFails`: Rejects collateral release through quotes if payment cash is omitted.
  - `testWrongAssetFails`: Rejects settlement when counterfeit or unexpected asset instruments are used.
  - `testCorrectAssetNameWrongIssuerFails`: Rejects tokens matching the asset symbol but minted by an unauthorized operator.
  - `testExcessFundingReturnsChange`: Verifies excess cash disbursed by Lender B is returned as change via `TransferPartial`.
  - `testCollateralReuseWithFreshOffersFails`: Prevents multiple loans from securing against the same collateral.
  - `testReplayAttackFails`: Ensures double-spend and replay attacks on archived contracts fail immediately.
  - `testExpiredApprovalFails` & `testInsufficientBorrowerFundsFails`: Enforces deadlines and equity requirements.
  - `testQuoteRevocationFails`, `testOfferWithdrawalFails`, `testBorrowerCancelFails`: Choice authorization rules.
  - `auditParticipant2` & `auditParticipant3`: Multi-participant sub-transaction privacy assertions.
- **Backend API & Authentication Tests**:
  - HTTP 401 unauthenticated request rejection across all endpoints.
  - HTTP 403 cross-party snooping rejection (e.g. Borrower accessing Lender A state).
  - Authenticated party-isolated transaction history filtering.
  - HTTP 503 fail-closed rejection when Canton ledger nodes are offline.

### Step 4: Run Live Canton API Integration & Privacy Test
With the cluster running, execute the end-to-end integration test through the HTTP API Gateway:
```bash
./scripts/test_live_api_closing.sh
```
This tests genuine authentication, quote issuance, offer commitment, atomic closing on Canton returning a committed `updateId`, and verifies post-closing privacy across isolated lender sessions.

### Step 5: Start the Application
```bash
npm start
```
The server will start on: **`http://localhost:4000`**

Open `http://localhost:4000` in your web browser.

---

## 5. End-to-End Demo Walkthrough

### Act 1: Initial State Review (Borrower Dashboard)
1. Navigate to `http://localhost:4000`.
2. By default, the active role is **Borrower (Alice)**.
3. Review Alice's initial state:
   - Cash Balance: **$1,000 USD-TEST** (Equity contribution ready).
   - Collateral: **150 COLLAT-TEST** locked securing Loan A.
   - Active Debt: **$100,000 USD-TEST** with Lender A at **8.5% interest**.

### Act 2: Outgoing Lender A Issues Payoff Quote
1. Switch role to **Outgoing Lender A (LegacyBank)** using the top role switcher.
2. Note that Lender A cannot see any data about Lender B.
3. Click **"Issue Payoff Quote"** ($101,000 payoff = $100k principal + $1k accrued interest).
4. The Payoff Quote is confirmed on-ledger.

### Act 3: Incoming Lender B Commits Replacement Offer
1. Switch role to **Incoming Lender B (NeoCapital)**.
2. Note that Lender B cannot see Lender A's 8.5% interest rate.
3. Click **"Commit Offer & Capital"** ($100k offer @ 7.5% interest).
4. Lender B's cash is allocated to escrow and the replacement offer is confirmed on-ledger.

### Act 4: Borrower Executes Atomic Closing
1. Switch back to **Borrower (Alice)**.
2. The pipeline status displays: **"Ready to Close"**.
3. Review terms comparison:
   - Old Rate: **8.5%** ➔ New Rate: **7.5%** (100 bps savings!).
   - Net Borrower Equity Required: **$1,000 USD-TEST**.
4. Click **"Execute Atomic Close"**.
5. Within 1 block confirmation:
   - $101,000 settles to Lender A.
   - Loan A is archived.
   - 150 COLLAT-TEST is repledged to Lender B.
   - Active Loan B is created.
   - Closing Receipt `RCP-REF-894102` is issued.

### Act 5: Verify Canton Privacy Isolation
1. Click the **"Privacy Inspector"** button in the header.
2. Inspect the live 3-column projection matrix:
   - **Lender A view**: Sees their payoff quote and received payment. Loan B terms, rates, and identity are **`REDACTED (Canton Sub-transaction Privacy)`**.
   - **Lender B view**: Sees their new loan facility and received collateral pledge. Loan A historical rates and payoff details are **`REDACTED (Canton Sub-transaction Privacy)`**.
   - **Borrower view**: Complete visibility across both legs of the refinancing.

---

## 6. Canton Participant Node Topology

In a production Canton deployment, each party operates their own Canton participant node connected to a shared synchronizer (sequencer + mediator):

```
┌─────────────────────────────────────────────────────────────┐
│                 CANTON SYNCHRONIZER DOMAIN                  │
│               [Sequencer] ◄───► [Mediator]                  │
└──────┬──────────────────────┬──────────────────────┬────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Alice Node  │       │ LegacyBank   │       │  NeoCapital  │
│(Participant) │       │(Participant) │       │(Participant) │
│  [Borrower]  │       │  [Lender A]  │       │  [Lender B]  │
└──────────────┘       └──────────────┘       └──────────────┘
```

### Running with Docker Compose (Recommended)
RefCanton includes a containerized multi-participant Canton cluster and fullstack web application orchestrated via Docker Compose:

```bash
# Option A: One-touch launcher script
./scripts/run_docker.sh

# Option B: Standard Docker Compose
docker compose up --build -d
```

#### Container Architecture & Ports:
| Service / Node | Component | Host Port | Protocol | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`refcanton-app`** | Web UI & API Gateway | `4000` | HTTP | Fullstack RefCanton application |
| **`canton-network`** | Sequencer Public | `5001` | gRPC | Canton Synchronizer Sequencer |
| **`canton-network`** | Sequencer Admin | `5002` | gRPC | Canton Sequencer Admin API |
| **`canton-network`** | Mediator Admin | `5003` | gRPC | Canton Synchronizer Mediator |
| **`participant1`** | Borrower (Alice) | `5011` / `5014` | gRPC / HTTP | Isolated node hosting Alice |
| **`participant2`** | Lender A (LegacyBank) | `5021` / `5024` | gRPC / HTTP | Isolated node hosting Lender A |
| **`participant3`** | Lender B (NeoCapital) | `5031` / `5034` | gRPC / HTTP | Isolated node hosting Lender B |

#### Management Commands:
```bash
# View live logs
docker compose logs -f

# Check container status
docker compose ps

# Teardown cluster
docker compose down
```

### Manual Host Deployment
If running Canton directly on your host machine:
1. Start Canton Console:
   ```bash
   canton -c canton/canton.conf --bootstrap canton/bootstrap.canton
   ```
2. Start the Application Gateway:
   ```bash
   npm start
   ```

### Demonstration Video Walkthrough
An end-to-end MP4 demonstration video walking through the full lifecycle — borrower onboarding, quote and offer commitments, atomic execution on Canton, privacy inspector verification, and failure modes — is available locally in the repository:
- **Path**: [`demo/refcanton_master_walkthrough.mp4`](file:///mnt/data/Projects/ref_canton/demo/refcanton_master_walkthrough.mp4)
- **Format**: MP4 (1080p, H.264)
- **Content**: Complete 3-party workflow showing role switching, atomic settlement with Canton update ID, and live privacy validation across lender views.

---

## 7. Scope & Limitations (Disclaimers)

In strict adherence to the problem definition:
- **Test Assets**: All assets (`USD-TEST`, `COLLAT-TEST`) are simulated on-ledger test tokens. They carry no real-world monetary value.
- **Fixed Negotiated Terms**: Rates and terms are fixed bilaterally between borrower and lenders. Dynamic lender auction orderbooks, AMM liquidity pools, and AI underwriting are excluded from this MVP.
- **Legal Discharge**: On-ledger execution archives the Daml smart contract debt obligations. Real-world legal UCC filings and lien releases must be coordinated by off-ledger legal counsel.

---

## 8. License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
