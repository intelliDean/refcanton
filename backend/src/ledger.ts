// backend/src/ledger.ts
// Domain Facade for RefCanton Canton Ledger operations

import {
  PayoffQuote,
  ReplacementOffer,
  ClosingRequest,
  PartyLedgerState,
  AtomicCloseResult,
  LedgerTransaction,
  LenderAPayoffReceipt,
  LenderBFundingReceipt,
  BorrowerClosingReceipt,
} from './types/ledger';
import { INSTRUMENTS, DEFAULT_PARTIES, BASELINE_CONFIG } from './config/constants';
import { LedgerStore } from './services/ledgerStore';
import { CantonPrivacyEngine } from './services/privacyEngine';
import { AtomicClosingCoordinator } from './services/atomicClosing';

export class CantonLedgerState {
  private store: LedgerStore;

  constructor() {
    this.store = new LedgerStore();
  }

  get transactionHistory(): LedgerTransaction[] {
    return this.store.transactionHistory;
  }

  resetToInitialState(): void {
    this.store.resetToInitialState();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PRIVACY PROJECTION
  // ───────────────────────────────────────────────────────────────────────────
  getStateForParty(party: string): PartyLedgerState {
    return CantonPrivacyEngine.projectState(party, {
      cashHoldings: this.store.cashHoldings,
      lockedCollaterals: this.store.lockedCollaterals,
      loansA: this.store.loansA,
      loansB: this.store.loansB,
      payoffQuotes: this.store.payoffQuotes,
      replacementOffers: this.store.replacementOffers,
      closingRequests: this.store.closingRequests,
      receipts: this.store.receipts,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LENDER A: PAYOFF QUOTES
  // ───────────────────────────────────────────────────────────────────────────
  issuePayoffQuote(
    lenderA: string = DEFAULT_PARTIES.LENDER_A,
    borrower: string = DEFAULT_PARTIES.BORROWER,
    payoffAmount: number = BASELINE_CONFIG.LOAN_A_PRINCIPAL
  ): PayoffQuote {
    const loan = this.store.loansA.find(l => l.borrower === borrower && l.lenderA === lenderA);
    if (!loan) throw new Error(`No active LoanA found for ${borrower} with lender ${lenderA}`);

    // Cancel any previous pending quote
    this.store.payoffQuotes = this.store.payoffQuotes.filter(q => q.lenderA !== lenderA);

    const expiresAt = new Date(Date.now() + 86400000 * BASELINE_CONFIG.QUOTE_EXPIRY_DAYS).toISOString();
    const quote: PayoffQuote = {
      contractId: this.store.nextId('quote'),
      lenderA,
      borrower,
      loanACid: loan.contractId,
      payoffAmount,
      instrument: INSTRUMENTS.CASH,
      expiresAt,
    };

    this.store.payoffQuotes.push(quote);
    this.store.recordTx(
      lenderA,
      'ISSUE_PAYOFF_QUOTE',
      `LenderA issued binding PayoffQuote for $${payoffAmount.toLocaleString()}`,
      { quoteId: quote.contractId, payoffAmount }
    );
    return quote;
  }

  withdrawPayoffQuote(quoteId: string, lenderA: string = DEFAULT_PARTIES.LENDER_A): void {
    const idx = this.store.payoffQuotes.findIndex(q => q.contractId === quoteId && q.lenderA === lenderA);
    if (idx === -1) throw new Error('PayoffQuote not found or unauthorized');

    this.store.payoffQuotes.splice(idx, 1);
    this.store.recordTx(lenderA, 'WITHDRAW_PAYOFF_QUOTE', `LenderA withdrew PayoffQuote ${quoteId}`, { quoteId });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LENDER B: REPLACEMENT OFFERS
  // ───────────────────────────────────────────────────────────────────────────
  issueReplacementOffer(
    lenderB: string = DEFAULT_PARTIES.LENDER_B,
    borrower: string = DEFAULT_PARTIES.BORROWER,
    newPrincipal: number = BASELINE_CONFIG.LOAN_B_PRINCIPAL,
    capRate: number = BASELINE_CONFIG.LOAN_B_CAP_RATE,
    amortizationPeriods: number = BASELINE_CONFIG.LOAN_B_AMORTIZATION_PERIODS
  ): ReplacementOffer {
    const bCash = this.store.cashHoldings.find(c => c.owner === lenderB && c.amount >= newPrincipal);
    if (!bCash) throw new Error(`LenderB does not have at least $${newPrincipal} cash available`);

    // Lock cash allocation
    bCash.allocatedFor = borrower;

    // Remove any previous pending offer
    this.store.replacementOffers = this.store.replacementOffers.filter(o => o.lenderB !== lenderB);

    const expiresAt = new Date(Date.now() + 86400000 * BASELINE_CONFIG.QUOTE_EXPIRY_DAYS).toISOString();
    const offer: ReplacementOffer = {
      contractId: this.store.nextId('offer'),
      lenderB,
      borrower,
      operator: DEFAULT_PARTIES.OPERATOR,
      newPrincipal,
      maturityDate: BASELINE_CONFIG.LOAN_B_MATURITY,
      collateralInstrument: INSTRUMENTS.COLLATERAL,
      collateralUnits: BASELINE_CONFIG.COLLATERAL_UNITS,
      lenderBCashCid: bCash.contractId,
      cashInstrument: INSTRUMENTS.CASH,
      expiresAt,
      capRate,
      amortizationPeriods,
    };

    this.store.replacementOffers.push(offer);
    this.store.recordTx(
      lenderB,
      'ISSUE_REPLACEMENT_OFFER',
      `LenderB committed $${newPrincipal.toLocaleString()} offer at ${(capRate * 100).toFixed(1)}% cap-rate`,
      { offerId: offer.contractId, newPrincipal, capRate }
    );
    return offer;
  }

  withdrawReplacementOffer(offerId: string, lenderB: string = DEFAULT_PARTIES.LENDER_B): void {
    const idx = this.store.replacementOffers.findIndex(o => o.contractId === offerId && o.lenderB === lenderB);
    if (idx === -1) throw new Error('ReplacementOffer not found or unauthorized');

    const offer = this.store.replacementOffers[idx];
    const cash = this.store.cashHoldings.find(c => c.contractId === offer.lenderBCashCid);
    if (cash) {
      cash.allocatedFor = null;
    }

    this.store.replacementOffers.splice(idx, 1);
    this.store.recordTx(
      lenderB,
      'WITHDRAW_REPLACEMENT_OFFER',
      `LenderB withdrew ReplacementOffer ${offerId} and reclaimed cash allocation`,
      { offerId }
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BORROWER: CLOSING REQUEST
  // ───────────────────────────────────────────────────────────────────────────
  createClosingRequest(borrower: string = DEFAULT_PARTIES.BORROWER): ClosingRequest {
    const quote = this.store.payoffQuotes.find(q => q.borrower === borrower);
    if (!quote) throw new Error('No active PayoffQuote available');

    const offer = this.store.replacementOffers.find(o => o.borrower === borrower);
    if (!offer) throw new Error('No active ReplacementOffer available');

    const borrowerCash = this.store.cashHoldings.find(
      c => c.owner === borrower && c.amount >= BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY
    );
    if (!borrowerCash) {
      throw new Error(`Borrower cash insufficient (need at least $${BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY} equity contribution)`);
    }

    const loanA = this.store.loansA.find(l => l.contractId === quote.loanACid);
    if (!loanA) throw new Error('Target LoanA contract no longer active');

    const req: ClosingRequest = {
      contractId: this.store.nextId('close-req'),
      borrower,
      lenderA: quote.lenderA,
      lenderB: offer.lenderB,
      operator: DEFAULT_PARTIES.OPERATOR,
      payoffQuoteCid: quote.contractId,
      replacementOfferCid: offer.contractId,
      borrowerCashCid: borrowerCash.contractId,
      loanACid: loanA.contractId,
      collateralCid: loanA.collateralCid,
    };

    this.store.closingRequests = [req];
    this.store.recordTx(
      borrower,
      'CREATE_CLOSING_REQUEST',
      `Borrower initiated ClosingRequest with quote ${quote.contractId} and offer ${offer.contractId}`,
      { requestId: req.contractId }
    );
    return req;
  }

  cancelClosingRequest(requestId: string, borrower: string = DEFAULT_PARTIES.BORROWER): void {
    const idx = this.store.closingRequests.findIndex(r => r.contractId === requestId && r.borrower === borrower);
    if (idx === -1) throw new Error('ClosingRequest not found or unauthorized');

    this.store.closingRequests.splice(idx, 1);
    this.store.recordTx(borrower, 'CANCEL_CLOSING_REQUEST', `Borrower cancelled ClosingRequest ${requestId}`, { requestId });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BORROWER: ATOMIC CLOSING EXECUTION
  // ───────────────────────────────────────────────────────────────────────────
  executeAtomicClose(requestId?: string, borrower: string = DEFAULT_PARTIES.BORROWER, cantonUpdateId?: string): AtomicCloseResult {
    const targetRequestId = requestId || this.store.closingRequests.find(r => r.borrower === borrower)?.contractId || '';
    // 1. Validate all prerequisites and preconditions
    const ctx = AtomicClosingCoordinator.validatePrerequisites(
      targetRequestId,
      borrower,
      this.store.closingRequests,
      this.store.payoffQuotes,
      this.store.replacementOffers,
      this.store.cashHoldings,
      this.store.loansA,
      this.store.lockedCollaterals
    );

    const generateId = (prefix: string) => this.store.nextId(prefix);

    // 2. Settle cash transfers atomically
    AtomicClosingCoordinator.settleCashHoldings(ctx, this.store.cashHoldings, generateId);

    // 3. Close Loan A
    this.store.loansA.splice(ctx.loanAIndex, 1);

    // 4. Repledge collateral from Lender A to Lender B
    AtomicClosingCoordinator.repledgeCollateral(ctx.collateral, ctx.request.lenderB);

    // 5. Originate new Loan B
    const newLoanB = AtomicClosingCoordinator.originateLoanB(ctx, generateId);
    this.store.loansB.push(newLoanB);

    // 6. Consume quotes and pending requests
    this.store.payoffQuotes = this.store.payoffQuotes.filter(q => q.contractId !== ctx.quote.contractId);
    this.store.replacementOffers = this.store.replacementOffers.filter(o => o.contractId !== ctx.offer.contractId);
    this.store.closingRequests = [];

    // 7. Issue immutable Closing Receipt
    const receiptContract = AtomicClosingCoordinator.issueClosingReceipt(ctx, newLoanB.contractId, generateId);
    this.store.receipts.push(receiptContract);

    // 8. Record audit transaction
    const txId = this.store.recordTx(
      borrower,
      'EXECUTE_ATOMIC_CLOSE',
      'Atomic refinancing committed: Paid A $101k, closed LoanA, repledged 150 collateral to B, activated LoanB for $100k',
      {
        receiptCid: receiptContract.contractId,
        loanBCid: newLoanB.contractId,
        payoffAmount: ctx.quote.payoffAmount,
        newPrincipal: ctx.offer.newPrincipal,
        collateralUnits: ctx.offer.collateralUnits,
      }
    );

    const timestamp = new Date().toISOString();
    const updateId = cantonUpdateId || `1220${require('crypto').createHash('sha256').update(txId + Date.now()).digest('hex')}`;

    const receiptA: LenderAPayoffReceipt = {
      contractId: `${receiptContract.contractId}-A`,
      borrower,
      lenderA: ctx.request.lenderA,
      loanACid: ctx.loanA.contractId,
      payoffAmount: ctx.quote.payoffAmount,
      collateralUnitsReleased: ctx.offer.collateralUnits,
      closedAt: timestamp,
    };

    const receiptB: LenderBFundingReceipt = {
      contractId: `${receiptContract.contractId}-B`,
      borrower,
      lenderB: ctx.request.lenderB,
      loanBCid: newLoanB.contractId,
      principalFunded: ctx.offer.newPrincipal,
      collateralUnitsSecured: ctx.offer.collateralUnits,
      closedAt: timestamp,
    };

    const receiptBorrower: BorrowerClosingReceipt = {
      contractId: `${receiptContract.contractId}-Borrower`,
      borrower,
      loanACid: ctx.loanA.contractId,
      loanBCid: newLoanB.contractId,
      payoffAmount: ctx.quote.payoffAmount,
      newPrincipal: ctx.offer.newPrincipal,
      borrowerContribution: BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY,
      collateralUnits: ctx.offer.collateralUnits,
      closedAt: timestamp,
    };

    return {
      success: true,
      updateId,
      transactionId: txId,
      synchronizerId: 'refsynchronizer',
      receipt: receiptContract,
      receiptA,
      receiptB,
      receiptBorrower,
      loanB: newLoanB,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FAILURE SIMULATION HOOKS
  // ───────────────────────────────────────────────────────────────────────────
  simulateInsufficientFunds(amount: number = 500.0): void {
    const cash = this.store.cashHoldings.find(c => c.owner === DEFAULT_PARTIES.BORROWER);
    if (!cash) throw new Error('Borrower cash holding not found');
    const oldAmount = cash.amount;
    cash.amount = amount;
    this.store.recordTx(
      DEFAULT_PARTIES.BORROWER,
      'SIMULATE_INSUFFICIENT_FUNDS',
      `Simulated borrower liquidity drop from $${oldAmount.toLocaleString()} to $${amount.toLocaleString()} USD-TEST (below $1k equity threshold)`
    );
  }

  simulateExpireQuote(): void {
    const quote = this.store.payoffQuotes[0];
    if (!quote) throw new Error('No active PayoffQuote to expire');
    quote.expiresAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour in the past
    this.store.recordTx(
      DEFAULT_PARTIES.LENDER_A,
      'SIMULATE_EXPIRED_QUOTE',
      `Simulated quote deadline expiry: PayoffQuote ${quote.contractId} expiration set to ${quote.expiresAt}`
    );
  }

  resetSimulation(): void {
    const cash = this.store.cashHoldings.find(c => c.owner === DEFAULT_PARTIES.BORROWER);
    if (cash && cash.amount < BASELINE_CONFIG.BORROWER_INITIAL_CASH) {
      cash.amount = BASELINE_CONFIG.BORROWER_INITIAL_CASH;
    }
    const quote = this.store.payoffQuotes[0];
    if (quote) {
      quote.expiresAt = new Date(Date.now() + 86400000 * BASELINE_CONFIG.QUOTE_EXPIRY_DAYS).toISOString();
    }
    this.store.recordTx(
      'System',
      'RESET_SIMULATION',
      'Reset simulation flags: restored borrower cash to normal and refreshed quote validity'
    );
  }
}

export const ledger = new CantonLedgerState();
