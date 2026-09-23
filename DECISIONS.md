# DECISIONS.md — Ref Canton: Private Refinancing App
# Architectural Decision Record
# Last updated: 2026-09-22

---

## D1 — Loan Model Differentiation

**Question:** What makes Model A different from Model B?

**Decision:**

### Model A — Fixed-Rate Bullet Loan
Represents a simple term loan where interest + principal are paid in full at maturity.

Fields:
  borrower        : Party
  lenderA         : Party
  principal       : Decimal          -- 101,000 at setup (from prior lending)
  annualRate      : Decimal          -- e.g. 0.085 (8.5%) — PRIVATE to A
  originationDate : Date             -- PRIVATE to A (A's historical terms)
  maturityDate    : Date             -- e.g. 2027-06-30
  collateralCid   : ContractId LockedCollateralHolding

Payoff = principal + (principal * annualRate * daysHeld / 365.0)
For the test scenario, the payoff amount is FIXED at 101,000 — agreed in the PayoffQuote.

### Model B — Floating-Cap Amortizing Loan
Represents a loan with a floating rate capped at a maximum, with periodic repayment periods.

Fields:
  borrower           : Party
  lenderB            : Party
  principal          : Decimal       -- 100,000
  capRate            : Decimal       -- e.g. 0.075 (7.5% cap) — PRIVATE to B
  amortizationPeriods: Int           -- e.g. 24 monthly periods — PRIVATE to B
  maturityDate       : Date          -- e.g. 2028-09-30
  collateralCid      : ContractId LockedCollateralHolding

### Common LoanInterface
Both templates implement a shared Daml interface:
  getPayoffAmount     : Date -> Decimal
  getCollateralCid    : ContractId LockedCollateralHolding
  getPrincipal        : Decimal
  getLender           : Party
  getBorrower         : Party
  choice CloseByRefinancing : ()     -- consuming, called in the atomic close

Rationale: The two models are distinct in their interest/repayment structure.
The interface cleanly models the "adapter" requirement. Neither model simulates
actual repayments — only the closing/payoff logic matters for MVP.

---

## D2 — Token Standard

**Decision:** Use Daml Finance interfaces for both assets.

  Test cash (USD-TEST):    Daml.Finance.Holding.Fungible
                           Interfaces: Fungible, Transferable, Holding

  Test collateral (COLLAT-TEST): Daml.Finance.Holding.Transferable + Lockable
                                 Interfaces: Transferable, Lockable, Holding

Rationale:
- "Supported test cash asset" means CIP-0056 compliant — judges will know the difference
- Lockable interface provides enforced ledger locks out of the box
- "See the privacy model and token interfaces" (line 26) references Daml Finance
- Hand-rolled holdings would NOT satisfy "actual ledger holdings and enforced locks"

Asset identifiers (used in all approval contracts):
  Cash instrument:       Id { unpack = "USD-TEST" }
  Collateral instrument: Id { unpack = "COLLAT-TEST" }

---

## D3 — Party Setup and Token Issuance

**Decision:** 4 named parties. operator doubles as assetAdmin.

  operator  — deploys DARs, creates Daml Finance factories, issues tokens
  lenderA   — outgoing lender; creates LoanA_Agreement, PayoffQuote
  lenderB   — incoming lender; creates ReplacementOffer, funds the closing
  borrower  — refinancing party; creates ClosingRequest, executes close

Each party gets their own Canton party identity and signing key.
operator and assetAdmin are the same party credential.

### Starting Balances (seeded by Setup.daml)

  lenderA   : 0 cash, 0 collateral (will receive 101,000 at closing)
  lenderB   : 110,000 cash (100,000 to lend + 10,000 buffer), 0 collateral
  borrower  : 2,000 cash (1,000 contribution + 1,000 buffer), 150 collateral units (locked to LoanA)

### Setup Script Order (Setup.daml)
1. operator creates HoldingFactory, InstrumentFactory for both asset types
2. operator mints: 110,000 cash to lenderB; 2,000 cash to borrower; 150 collateral units to borrower
3. operator + lenderA co-create LoanA_Agreement (principal=101000, rate=0.085, maturity=2027-06-30)
4. borrower locks 150 collateral units via Lockable.Lock -> LockedCollateralHolding
   reference stored in LoanA_Agreement.collateralCid
5. Assert: borrower cannot exercise choices on the locked collateral directly

---

## D4 — Privacy Field Mapping

### LoanA_Agreement — visible to: borrower + lenderA ONLY

  principal       : Shared (borrower + A know this)
  annualRate      : PRIVATE — lenderA only (A's commercial terms)
  originationDate : PRIVATE — lenderA only (A's historical terms)
  maturityDate    : Shared (borrower + A)
  collateralCid   : Shared (borrower + A) — lenderB must NEVER see this CId
  borrower, lenderA: Shared

### LoanB_Agreement — visible to: borrower + lenderB ONLY

  principal          : Shared (borrower + B)
  capRate            : PRIVATE — lenderB only (B's commercial terms)
  amortizationPeriods: PRIVATE — lenderB only
  maturityDate       : Shared (borrower + B)
  collateralCid      : Shared (borrower + B)
  borrower, lenderB  : Shared

### Daml enforcement mechanism:
  LoanA: signatory borrower, lenderA  — lenderB is not signatory/observer
  LoanB: signatory borrower, lenderB  — lenderA is not signatory/observer
  Privacy is structural. Canton never delivers a contract to a node that is not a stakeholder.

### Privacy tests (PrivacyCheck.daml):
  As lenderA: queryContractKey @LoanB_Agreement lenderA (...) -> must return None
  As lenderB: queryContractKey @LoanA_Agreement lenderB (...) -> must return None

---

## D5 — Closing Authorization Pattern

**Decision:** Explicit Authorization via Pre-Signed Approval Contracts

Avoids conjunction choices (which require simultaneous API submission — impractical for UI).
All three parties pre-authorize by signing their respective contracts.
Only the borrower needs to submit the final Execute command.

### Three-Contract Chain

--- PayoffQuote (lenderA's binding release offer) ---
  signatory: lenderA
  observer:  borrower
  fields:
    lenderA, borrower
    loanACid       : ContractId LoanA_Agreement   -- pins exact loan state
    payoffAmount   : Decimal    -- 101,000
    cashInstrument : Id         -- "USD-TEST"
    lenderAAccount : AccountKey -- where to send payment
    expiresAt      : Time       -- time-bounded
  choice Withdraw : ()          -- controller: lenderA (revocation)
  choice Release : PayoffRelease -- controller: borrower (borrower triggers in Execute)
    -- validates expiry, archives self, returns authorization struct

--- ReplacementOffer (lenderB's binding funding commitment) ---
  signatory: lenderB
  observer:  borrower
  fields:
    lenderB, borrower
    newPrincipal        : Decimal    -- 100,000
    capRate             : Decimal    -- PRIVATE (only B + borrower see this offer)
    amortizationPeriods : Int        -- PRIVATE
    maturityDate        : Date
    cashInstrument      : Id
    collateralInstrument: Id
    collateralUnits     : Decimal    -- 150
    lenderBCashCid      : ContractId FungibleHolding
    expiresAt           : Time
  choice Withdraw : ()           -- controller: lenderB (revocation)
  choice Commit : ReplacementCommit  -- controller: borrower (triggers in Execute)
    -- validates expiry, archives self, returns authorization struct

--- ClosingRequest (borrower creates; triggers the atomic close) ---
  signatory: borrower
  observer:  lenderA, lenderB   -- both observe but don't sign
  fields:
    borrower, lenderA, lenderB
    payoffQuoteCid     : ContractId PayoffQuote
    replacementOfferCid: ContractId ReplacementOffer
    borrowerCashCid    : ContractId FungibleHolding  -- borrower's 1,000
    loanACid           : ContractId LoanA_Agreement
  choice Cancel : ()             -- controller: borrower
  choice Execute : ClosingReceipt -- controller: borrower — THE ATOMIC CLOSE
    do
      -- 1. Validate + consume lenderA's authorization
      PayoffRelease{..} <- exercise payoffQuoteCid Release
      -- 2. Validate + consume lenderB's authorization
      ReplacementCommit{..} <- exercise replacementOfferCid Commit
      -- 3. Transfer 100,000 from lenderB to lenderA
      exercise lenderBCashCid Transfer to lenderAAccount
      -- 4. Transfer 1,000 from borrower to lenderA
      exercise borrowerCashCid Transfer to lenderAAccount
      -- 5. Archive LoanA (via LoanInterface.CloseByRefinancing)
      loanA <- fetch loanACid
      exercise (toInterface @LoanInterface loanACid) CloseByRefinancing
      -- 6. Release collateral lock (was locked to A)
      newCollateralCid <- exercise loanA.collateralCid Unlock
      -- 7. Re-lock collateral to lenderB
      newLockedCid <- exercise newCollateralCid Lock with
        locker = lenderB; context = "LoanB-collateral"
      -- 8. Create LoanB
      loanBCid <- create LoanB with
        borrower; lenderB
        principal = 100000.0
        capRate = commit.capRate
        amortizationPeriods = commit.amortizationPeriods
        maturityDate = commit.maturityDate
        collateralCid = newLockedCid
      -- 9. Return receipt
      now <- getTime
      return ClosingReceipt { loanBCid; closedAt = now; payoffAmount = 101000.0 }

### Properties satisfied:
  Atomic           YES — single Execute choice, all-or-nothing
  LenderA authorizes YES — PayoffQuote is a signed contract; Release consumes it
  LenderB authorizes YES — ReplacementOffer is a signed contract; Commit consumes it
  Borrower authorizes YES — borrower is signatory on ClosingRequest + controller of Execute
  Replay impossible  YES — all approval contracts are consuming (second attempt: not active)
  Privacy preserved  YES — lenderA never sees ReplacementOffer; lenderB never sees PayoffQuote
  Single submitter   YES — only borrower submits Execute (works with standard Ledger API)

---

## D6 — Borrower Contribution Mechanics

  LenderB cash (100,000) --+
                            +--> LenderA receives 101,000
  Borrower cash  (1,000)  --+

  New debt: LoanB.principal = 100,000
            (borrower owes B exactly 100,000)
            (borrower's 1,000 is a direct payment to A, not part of the new loan)

Validations in Execute choice:
  assertMsg "Payoff amounts must reconcile" $ payoffAmount == 101000.0
  assertMsg "Borrower cash insufficient"    $ borrowerCash.amount >= 1000.0
  assertMsg "Lender B cash insufficient"   $ lenderBCash.amount >= 100000.0
  assertMsg "Collateral units must match"  $ collateralUnits == 150.0

---

## D7 — Frontend Screen Specification

Architecture:
  Browser (React + TypeScript, custom fetch layer — NO @daml/react)
    -> Backend (Node.js/Express)
       -> Canton JSON HTTP API (per-party JWT token)
          -> Canton Participant Node

JWTs are issued per-party, stored server-side.
Frontend passes ?role=lenderA header; backend selects correct token.

--- SCREEN A: Lender A Dashboard (/lender-a) ---

Section: Active Loan
  Show LoanA_Agreement: principal, maturity date
  Rate field displays: "[Rate: PRIVATE — your internal record]"
  (demonstrates privacy in the UI itself)

Section: Issue Payoff Quote
  Form fields:
    Payoff Amount: pre-filled 101,000 (editable)
    Expires at: datetime picker (suggest: +48 hours)
    Your account: pre-filled from party config
  Submit -> POST /api/lender-a/payoff-quotes -> creates PayoffQuote on ledger

Section: Active Quotes
  Table: Amount | Expiry (countdown) | Status | [Revoke]
  [Revoke] -> exercises Withdraw on PayoffQuote ContractId
  Expired rows: red badge, [Revoke] disabled with tooltip

Section: Receipts
  Table: Amount Received | Ledger TX ID | Timestamp
  (populated after closing executes)

--- SCREEN B: Lender B Dashboard (/lender-b) ---

Section: Funding Balance
  Shows lenderB's FungibleHolding balance (USD-TEST)

Section: Create Replacement Offer
  Form fields:
    New Principal: pre-filled 100,000
    Cap Rate %: number input (e.g. 7.5)
    Amortization Periods: integer input (e.g. 24)
    Maturity Date: date picker
    Collateral Units: pre-filled 150
    Expires at: datetime picker
  Client-side validation: balance must be >= principal
  Submit -> creates ReplacementOffer on ledger

Section: Active Offers
  Table: Principal | Maturity | Expiry | [Withdraw]
  [Withdraw] -> exercises Withdraw on ReplacementOffer ContractId

Section: Active Loan (post-close)
  Shows LoanB_Agreement: principal, collateral secured, borrower, maturity

--- SCREEN C: Borrower Dashboard (/borrower) ---

Section: Current Loan (LoanA)
  Card: principal, maturity date
  Payoff Quote status: "Active — 101,000 due by [expiry]" or "None available"

Section: Incoming Offer (from B)
  Card: new principal, maturity, collateral units
  Rate field: "[Lender B's private terms — visible only to you and Lender B]"

Section: Your Contribution
  Your balance: [X] USD-TEST
  Required: 1,000 USD-TEST
  Status: green checkmark (sufficient) or red warning (insufficient)

Section: Execute Refinancing
  Side-by-side table:
    Current: principal 101,000 | rate [hidden] | maturity 2027-06-30
    New:     principal 100,000 | rate [hidden] | maturity 2028-09-30
  [Execute Closing] button — disabled until: PayoffQuote active + ReplacementOffer active + balance >= 1,000
  On click -> POST /api/borrower/execute -> exercises Execute on ClosingRequest

Section: Status (shown during/after execution)
  Loading: "Submitting to ledger..."
  Success: "Closed — Ledger TX: [updateId] at [timestamp]"
  Failure: one of the error messages below

Section: History
  Table: Closed At | TX ID | Old Principal | New Principal | Contribution

Error messages by failure case:
  Insufficient borrower funds   -> "Closing failed: Balance insufficient. Have: X, Need: 1,000"
  Expired PayoffQuote           -> "Closing failed: Payoff quote expired. Ask Lender A to reissue."
  Expired ReplacementOffer      -> "Closing failed: Replacement offer expired. Ask Lender B to reissue."
  Loan state changed            -> "Closing failed: Loan A is no longer active. Please refresh."
  Concurrent close race         -> "Closing failed: Required contracts were consumed. Please refresh."
  Wrong asset                   -> "Closing failed: Asset type mismatch. Contact support."

---

## D8 — SDK Version Policy

Rule: Pin ALL versions to whatever cn-quickstart ships on Day 1. Document here.
Do NOT upgrade during the build. If a bug requires upgrade, record date + reason.

Record these after initializing the repo:
  Daml SDK version:                      3.4.11
  Canton Version:                        3.4.11 (multi-participant cluster)
  Canton Docker image tag:               refcanton-canton:3.4.11
  App Docker image tag:                  refcanton-app:latest
  Node.js version:                       20-alpine

---

## D9 — Operator Disclosure + Labels

### Party access table (include in submission)

  operator          Deploys DARs, creates factories, mints tokens
                    Sees: factory contracts, initial holdings

  lenderA           Signatory on LoanA
                    Sees: LoanA_Agreement, PayoffQuote, ClosingRequest (observer), receipts
                    Cannot see: LoanB_Agreement, ReplacementOffer contents

  lenderB           Signatory on LoanB
                    Sees: ReplacementOffer, ClosingRequest (observer), LoanB_Agreement
                    Cannot see: LoanA_Agreement, PayoffQuote contents, annualRate, originationDate

  borrower          Signatory on both loans + ClosingRequest
                    Sees: both loan contracts, both approval contracts, own holdings

  Canton DevNet     Network infrastructure — sees only encrypted transaction blobs
  synchronizer      No plaintext contract data. No global state.

### Required labels in submission and UI:
  "USD-TEST is a test asset created for this demo. It does not represent real currency."
  "COLLAT-TEST is a synthetic test collateral asset."
  "LoanA and LoanB are reference loan models built for this project."
  "These are not integrations with real lending institutions."
  "This application is not production-ready and does not legally discharge any real loans."

---

## Build Order (start here)

daml/
  Assets.daml           -- LockedCollateralHolding (or import Daml Finance Lockable)
  Loan.daml             -- LoanInterface, LoanA template, LoanB template
  Approvals.daml        -- PayoffQuote, ReplacementOffer
  Closing.daml          -- ClosingRequest with Execute choice, ClosingReceipt data type
  Setup.daml            -- Daml Script: party setup + initial state

daml-test/
  HappyPath.daml        -- Phase 1 proof: full closing with fixed test numbers
  FailureCases.daml     -- All 7 must-fail scenarios
  PrivacyCheck.daml     -- Cross-party visibility assertions

Write Assets.daml first. Then Loan.daml. Then Approvals.daml. Then Closing.daml.
Do not write Setup.daml until all four contract files compile.
Do not write frontend until HappyPath.daml passes.
