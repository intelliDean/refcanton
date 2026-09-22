// backend/src/ledger.ts
// In-process ledger engine and Canton state manager
// Implements exact templates, choice semantics, and sub-transaction privacy boundaries.

export interface CashHolding {
  contractId: string;
  owner: string;
  operator: string;
  instrument: string;
  amount: number;
  allocatedFor: string | null;
}

export interface LockedCollateralHolding {
  contractId: string;
  owner: string;
  operator: string;
  locker: string;
  instrument: string;
  amount: number;
  context: string;
}

export interface LoanA {
  contractId: string;
  borrower: string;
  lenderA: string;
  operator: string;
  principal: number;
  maturityDate: string;
  collateralCid: string;
  annualRate: number; // PRIVATE to Lender A & Borrower
  originationDate: string;
}

export interface LoanB {
  contractId: string;
  borrower: string;
  lenderB: string;
  operator: string;
  principal: number;
  maturityDate: string;
  collateralCid: string;
  capRate: number; // PRIVATE to Lender B & Borrower
  amortizationPeriods: number; // PRIVATE to Lender B & Borrower
}

export interface PayoffQuote {
  contractId: string;
  lenderA: string;
  borrower: string;
  loanACid: string;
  payoffAmount: number;
  instrument: string;
  expiresAt: string;
}

export interface ReplacementOffer {
  contractId: string;
  lenderB: string;
  borrower: string;
  operator: string;
  newPrincipal: number;
  maturityDate: string;
  collateralInstrument: string;
  collateralUnits: number;
  lenderBCashCid: string;
  cashInstrument: string;
  expiresAt: string;
  capRate: number; // PRIVATE to Lender B & Borrower
  amortizationPeriods: number; // PRIVATE to Lender B & Borrower
}

export interface ClosingReceipt {
  loanBCid: string;
  closedAt: string;
  payoffAmount: number;
  newPrincipal: number;
  borrowerContribution: number;
  collateralUnits: number;
}

export interface ClosingReceiptContract {
  contractId: string;
  borrower: string;
  lenderA: string;
  lenderB: string;
  operator: string;
  receipt: ClosingReceipt;
}

export interface ClosingRequest {
  contractId: string;
  borrower: string;
  lenderA: string;
  lenderB: string;
  operator: string;
  payoffQuoteCid: string;
  replacementOfferCid: string;
  borrowerCashCid: string;
  loanACid: string;
  collateralCid: string;
}

export interface LedgerTransaction {
  txId: string;
  timestamp: string;
  actingParty: string;
  action: string;
  description: string;
  details?: Record<string, unknown>;
}

export class CantonLedgerState {
  private idCounter = 100;

  // Active Contract Store
  cashHoldings: CashHolding[] = [];
  lockedCollaterals: LockedCollateralHolding[] = [];
  loansA: LoanA[] = [];
  loansB: LoanB[] = [];
  payoffQuotes: PayoffQuote[] = [];
  replacementOffers: ReplacementOffer[] = [];
  closingRequests: ClosingRequest[] = [];
  receipts: ClosingReceiptContract[] = [];

  // Transaction Audit Trail
  transactionHistory: LedgerTransaction[] = [];

  constructor() {
    this.resetToInitialState();
  }

  private nextId(prefix: string): string {
    this.idCounter += 1;
    return `#${prefix}-${this.idCounter}`;
  }

  private recordTx(actingParty: string, action: string, description: string, details?: Record<string, unknown>): string {
    const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.transactionHistory.unshift({
      txId,
      timestamp: new Date().toISOString(),
      actingParty,
      action,
      description,
      details,
    });
    return txId;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIAL STATE SETUP (from ref_canton.txt)
  // ─────────────────────────────────────────────────────────────────────────────
  resetToInitialState(): void {
    this.cashHoldings = [];
    this.lockedCollaterals = [];
    this.loansA = [];
    this.loansB = [];
    this.payoffQuotes = [];
    this.replacementOffers = [];
    this.closingRequests = [];
    this.receipts = [];

    // 1. Borrower cash: 5,000 USD-TEST
    this.cashHoldings.push({
      contractId: this.nextId('cash'),
      owner: 'Borrower',
      operator: 'Operator',
      instrument: 'USD-TEST',
      amount: 5000.0,
      allocatedFor: null,
    });

    // 2. LenderB cash: 100,000 USD-TEST ready to deploy
    this.cashHoldings.push({
      contractId: this.nextId('cash'),
      owner: 'LenderB',
      operator: 'Operator',
      instrument: 'USD-TEST',
      amount: 100000.0,
      allocatedFor: null,
    });

    // 3. 150 COLLAT-TEST units locked to LenderA
    const colId = this.nextId('collat');
    this.lockedCollaterals.push({
      contractId: colId,
      owner: 'Borrower',
      operator: 'Operator',
      locker: 'LenderA',
      instrument: 'COLLAT-TEST',
      amount: 150.0,
      context: 'LoanA-collateral',
    });

    // 4. LoanA: 101,000 principal at 8.5% rate
    this.loansA.push({
      contractId: this.nextId('loanA'),
      borrower: 'Borrower',
      lenderA: 'LenderA',
      operator: 'Operator',
      principal: 101000.0,
      maturityDate: '2027-06-30',
      collateralCid: colId,
      annualRate: 0.085,
      originationDate: '2024-06-30',
    });

    this.recordTx('System', 'INITIALIZE', 'Ledger reset to baseline fixed example state (LoanA: $101k, 150 collateral locked to A, Borrower: $5k, LenderB: $100k)');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVACY PROJECTION: Query active contracts as seen by each party
  // ─────────────────────────────────────────────────────────────────────────────
  getStateForParty(party: string) {
    const isBorrower = party.toLowerCase() === 'borrower';
    const isLenderA = party.toLowerCase() === 'lendera';
    const isLenderB = party.toLowerCase() === 'lenderb';
    const isOperator = party.toLowerCase() === 'operator';

    // Cash holdings visible to party
    const cash = this.cashHoldings.filter(c => {
      if (isOperator) return true;
      if (c.owner.toLowerCase() === party.toLowerCase()) return true;
      if (c.allocatedFor && c.allocatedFor.toLowerCase() === party.toLowerCase()) return true;
      return false;
    });

    // Collateral holdings visible to party
    const collateral = this.lockedCollaterals.filter(c => {
      if (isOperator || isBorrower) return true;
      return c.locker.toLowerCase() === party.toLowerCase();
    });

    // LoanA: visible to Borrower, LenderA, and Operator. LenderB CANNOT SEE.
    const loansAVisible = (isBorrower || isLenderA || isOperator) ? this.loansA : [];

    // LoanB: visible to Borrower, LenderB, and Operator. LenderA CANNOT SEE.
    const loansBVisible = (isBorrower || isLenderB || isOperator) ? this.loansB : [];

    // PayoffQuote: visible to Borrower and LenderA. LenderB CANNOT SEE.
    const quotesVisible = (isBorrower || isLenderA || isOperator) ? this.payoffQuotes : [];

    // ReplacementOffer: visible to Borrower and LenderB. LenderA CANNOT SEE.
    const offersVisible = (isBorrower || isLenderB || isOperator) ? this.replacementOffers : [];

    // ClosingRequests: visible to Borrower, LenderA, LenderB
    const closingRequestsVisible = (isBorrower || isLenderA || isLenderB || isOperator) ? this.closingRequests : [];

    // Receipts: visible to all stakeholders
    const receiptsVisible = this.receipts;

    return {
      party,
      cash,
      collateral,
      loansA: loansAVisible,
      loansB: loansBVisible,
      payoffQuotes: quotesVisible,
      replacementOffers: offersVisible,
      closingRequests: closingRequestsVisible,
      receipts: receiptsVisible,
      privacyAudits: {
        canSeeLoanA: loansAVisible.length > 0,
        canSeeLoanB: loansBVisible.length > 0,
        canSeeLenderARate: isBorrower || isLenderA || isOperator,
        canSeeLenderBCapRate: isBorrower || isLenderB || isOperator,
        canSeePayoffQuote: quotesVisible.length > 0,
        canSeeReplacementOffer: offersVisible.length > 0,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHOICE: LenderA creates PayoffQuote
  // ─────────────────────────────────────────────────────────────────────────────
  issuePayoffQuote(lenderA: string, borrower: string, payoffAmount: number = 101000.0): PayoffQuote {
    const loan = this.loansA.find(l => l.borrower === borrower && l.lenderA === lenderA);
    if (!loan) throw new Error(`No active LoanA found for ${borrower} with lender ${lenderA}`);

    // Remove any existing active quote
    this.payoffQuotes = this.payoffQuotes.filter(q => q.lenderA !== lenderA);

    const quote: PayoffQuote = {
      contractId: this.nextId('quote'),
      lenderA,
      borrower,
      loanACid: loan.contractId,
      payoffAmount,
      instrument: 'USD-TEST',
      expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    };

    this.payoffQuotes.push(quote);
    this.recordTx(lenderA, 'ISSUE_PAYOFF_QUOTE', `LenderA issued binding PayoffQuote for $${payoffAmount.toLocaleString()}`, { quoteId: quote.contractId, payoffAmount });
    return quote;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHOICE: LenderA withdraws PayoffQuote
  // ─────────────────────────────────────────────────────────────────────────────
  withdrawPayoffQuote(quoteId: string, lenderA: string): void {
    const idx = this.payoffQuotes.findIndex(q => q.contractId === quoteId && q.lenderA === lenderA);
    if (idx === -1) throw new Error('PayoffQuote not found or unauthorized');

    this.payoffQuotes.splice(idx, 1);
    this.recordTx(lenderA, 'WITHDRAW_PAYOFF_QUOTE', `LenderA withdrew PayoffQuote ${quoteId}`, { quoteId });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHOICE: LenderB allocates cash and issues ReplacementOffer
  // ─────────────────────────────────────────────────────────────────────────────
  issueReplacementOffer(
    lenderB: string,
    borrower: string,
    newPrincipal: number = 100000.0,
    capRate: number = 0.075,
    amortizationPeriods: number = 24
  ): ReplacementOffer {
    // Find lenderB cash
    const bCash = this.cashHoldings.find(c => c.owner === lenderB && c.amount >= newPrincipal);
    if (!bCash) throw new Error(`LenderB does not have at least $${newPrincipal} cash available`);

    // Allocate cash for borrower
    bCash.allocatedFor = borrower;

    // Remove any prior offer
    this.replacementOffers = this.replacementOffers.filter(o => o.lenderB !== lenderB);

    const offer: ReplacementOffer = {
      contractId: this.nextId('offer'),
      lenderB,
      borrower,
      operator: 'Operator',
      newPrincipal,
      maturityDate: '2029-12-31',
      collateralInstrument: 'COLLAT-TEST',
      collateralUnits: 150.0,
      lenderBCashCid: bCash.contractId,
      cashInstrument: 'USD-TEST',
      expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      capRate,
      amortizationPeriods,
    };

    this.replacementOffers.push(offer);
    this.recordTx(lenderB, 'ISSUE_REPLACEMENT_OFFER', `LenderB committed $${newPrincipal.toLocaleString()} offer at ${(capRate * 100).toFixed(1)}% cap-rate`, { offerId: offer.contractId, newPrincipal, capRate });
    return offer;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHOICE: LenderB withdraws ReplacementOffer & deallocates cash
  // ─────────────────────────────────────────────────────────────────────────────
  withdrawReplacementOffer(offerId: string, lenderB: string): void {
    const idx = this.replacementOffers.findIndex(o => o.contractId === offerId && o.lenderB === lenderB);
    if (idx === -1) throw new Error('ReplacementOffer not found or unauthorized');

    const offer = this.replacementOffers[idx];
    const cash = this.cashHoldings.find(c => c.contractId === offer.lenderBCashCid);
    if (cash) {
      cash.allocatedFor = null;
    }

    this.replacementOffers.splice(idx, 1);
    this.recordTx(lenderB, 'WITHDRAW_REPLACEMENT_OFFER', `LenderB withdrew ReplacementOffer ${offerId} and reclaimed cash allocation`, { offerId });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHOICE: Borrower creates ClosingRequest
  // ─────────────────────────────────────────────────────────────────────────────
  createClosingRequest(borrower: string): ClosingRequest {
    const quote = this.payoffQuotes.find(q => q.borrower === borrower);
    if (!quote) throw new Error('No active PayoffQuote available');

    const offer = this.replacementOffers.find(o => o.borrower === borrower);
    if (!offer) throw new Error('No active ReplacementOffer available');

    const borrowerCash = this.cashHoldings.find(c => c.owner === borrower && c.amount >= 1000.0);
    if (!borrowerCash) throw new Error('Borrower cash insufficient (need at least $1,000 equity contribution)');

    const loanA = this.loansA.find(l => l.contractId === quote.loanACid);
    if (!loanA) throw new Error('Target LoanA contract no longer active');

    const req: ClosingRequest = {
      contractId: this.nextId('close-req'),
      borrower,
      lenderA: quote.lenderA,
      lenderB: offer.lenderB,
      operator: 'Operator',
      payoffQuoteCid: quote.contractId,
      replacementOfferCid: offer.contractId,
      borrowerCashCid: borrowerCash.contractId,
      loanACid: loanA.contractId,
      collateralCid: loanA.collateralCid,
    };

    this.closingRequests = [req];
    this.recordTx(borrower, 'CREATE_CLOSING_REQUEST', `Borrower initiated ClosingRequest with quote ${quote.contractId} and offer ${offer.contractId}`, { requestId: req.contractId });
    return req;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHOICE: Borrower cancels ClosingRequest
  // ─────────────────────────────────────────────────────────────────────────────
  cancelClosingRequest(requestId: string, borrower: string): void {
    const idx = this.closingRequests.findIndex(r => r.contractId === requestId && r.borrower === borrower);
    if (idx === -1) throw new Error('ClosingRequest not found or unauthorized');

    this.closingRequests.splice(idx, 1);
    this.recordTx(borrower, 'CANCEL_CLOSING_REQUEST', `Borrower cancelled ClosingRequest ${requestId}`, { requestId });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHOICE: Borrower executes THE ATOMIC CLOSE
  // One committed ledger update:
  // - Pays A $101,000 (100k from B + 1k from Borrower)
  // - Closes LoanA
  // - Repledges 150 collateral units A -> B
  // - Creates LoanB for $100,000
  // - Creates immutable ClosingReceiptContract
  // ─────────────────────────────────────────────────────────────────────────────
  executeAtomicClose(requestId: string, borrower: string) {
    const req = this.closingRequests.find(r => r.contractId === requestId && r.borrower === borrower);
    if (!req) throw new Error('Active ClosingRequest not found');

    const quote = this.payoffQuotes.find(q => q.contractId === req.payoffQuoteCid);
    if (!quote) throw new Error('PayoffQuote not found or already consumed');

    const offer = this.replacementOffers.find(o => o.contractId === req.replacementOfferCid);
    if (!offer) throw new Error('ReplacementOffer not found or already consumed');

    const borrowerCash = this.cashHoldings.find(c => c.contractId === req.borrowerCashCid);
    if (!borrowerCash || borrowerCash.amount < 1000.0) {
      throw new Error('Borrower cash insufficient for $1,000 contribution');
    }

    const lenderBCash = this.cashHoldings.find(c => c.contractId === offer.lenderBCashCid);
    if (!lenderBCash || lenderBCash.amount < offer.newPrincipal) {
      throw new Error("Lender B committed cash holding unavailable or insufficient");
    }

    const loanAIdx = this.loansA.findIndex(l => l.contractId === req.loanACid);
    if (loanAIdx === -1) throw new Error('Loan A contract not active');

    const collateral = this.lockedCollaterals.find(c => c.contractId === req.collateralCid);
    if (!collateral || collateral.locker !== req.lenderA) {
      throw new Error("Collateral not locked to outgoing lender A");
    }

    // Atomic reconciliation check
    if (offer.newPrincipal + 1000.0 !== quote.payoffAmount) {
      throw new Error(`Reconciliation failure: B's $${offer.newPrincipal} + Borrower's $1,000 does not equal A's payoff of $${quote.payoffAmount}`);
    }

    // ── ATOMIC COMMIT PHASE ─────────────────────────────────────────────────
    // 1. Borrower contributes 1,000 -> Borrower cash reduces by 1,000
    borrowerCash.amount -= 1000.0;

    // 2. Lender B deploys 100,000 -> Lender B cash reduces by 100,000
    lenderBCash.amount -= offer.newPrincipal;
    lenderBCash.allocatedFor = null;

    // 3. Lender A receives 101,000 (100k + 1k)
    let lenderACash = this.cashHoldings.find(c => c.owner === req.lenderA);
    if (lenderACash) {
      lenderACash.amount += quote.payoffAmount;
    } else {
      lenderACash = {
        contractId: this.nextId('cash'),
        owner: req.lenderA,
        operator: 'Operator',
        instrument: 'USD-TEST',
        amount: quote.payoffAmount,
        allocatedFor: null,
      };
      this.cashHoldings.push(lenderACash);
    }

    // 4. Close Loan A
    this.loansA.splice(loanAIdx, 1);

    // 5. Repledge Collateral: transfer lock from Lender A -> Lender B
    collateral.locker = req.lenderB;
    collateral.context = 'LoanB-collateral';

    // 6. Create Loan B
    const loanBCid = this.nextId('loanB');
    const newLoanB: LoanB = {
      contractId: loanBCid,
      borrower,
      lenderB: req.lenderB,
      operator: 'Operator',
      principal: offer.newPrincipal,
      maturityDate: offer.maturityDate,
      collateralCid: collateral.contractId,
      capRate: offer.capRate,
      amortizationPeriods: offer.amortizationPeriods,
    };
    this.loansB.push(newLoanB);

    // 7. Consume Approvals and Closing Request
    this.payoffQuotes = this.payoffQuotes.filter(q => q.contractId !== quote.contractId);
    this.replacementOffers = this.replacementOffers.filter(o => o.contractId !== offer.contractId);
    this.closingRequests = [];

    // 8. Create immutable ClosingReceiptContract
    const receiptCid = this.nextId('receipt');
    const receiptContract: ClosingReceiptContract = {
      contractId: receiptCid,
      borrower,
      lenderA: req.lenderA,
      lenderB: req.lenderB,
      operator: 'Operator',
      receipt: {
        loanBCid,
        closedAt: new Date().toISOString(),
        payoffAmount: quote.payoffAmount,
        newPrincipal: offer.newPrincipal,
        borrowerContribution: 1000.0,
        collateralUnits: offer.collateralUnits,
      },
    };
    this.receipts.push(receiptContract);

    const txId = this.recordTx(borrower, 'EXECUTE_ATOMIC_CLOSE', 'Atomic refinancing committed: Paid A $101k, closed LoanA, repledged 150 collateral to B, activated LoanB for $100k', {
      receiptCid,
      loanBCid,
      payoffAmount: quote.payoffAmount,
      newPrincipal: offer.newPrincipal,
      collateralUnits: offer.collateralUnits,
    });

    return {
      success: true,
      transactionId: txId,
      receipt: receiptContract,
      loanB: newLoanB,
    };
  }
}

export const ledger = new CantonLedgerState();
