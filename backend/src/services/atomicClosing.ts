// backend/src/services/atomicClosing.ts
// Decomposed Atomic Refinancing Settlement Coordinator

import {
  CashHolding,
  LockedCollateralHolding,
  LoanA,
  LoanB,
  PayoffQuote,
  ReplacementOffer,
  ClosingRequest,
  ClosingReceiptContract,
  AtomicCloseResult,
} from '../types/ledger';
import { INSTRUMENTS, BASELINE_CONFIG } from '../config/constants';

export interface AtomicClosingContext {
  request: ClosingRequest;
  quote: PayoffQuote;
  offer: ReplacementOffer;
  borrowerCash: CashHolding;
  lenderBCash: CashHolding;
  loanA: LoanA;
  loanAIndex: number;
  collateral: LockedCollateralHolding;
}

export class AtomicClosingCoordinator {
  /**
   * Validates all contract prerequisites before executing the atomic transaction.
   */
  static validatePrerequisites(
    requestId: string,
    borrower: string,
    closingRequests: ClosingRequest[],
    payoffQuotes: PayoffQuote[],
    replacementOffers: ReplacementOffer[],
    cashHoldings: CashHolding[],
    loansA: LoanA[],
    lockedCollaterals: LockedCollateralHolding[]
  ): AtomicClosingContext {
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Valid requestId is required to execute atomic closing');
    }
    const request = closingRequests.find(r => r.contractId === requestId && r.borrower === borrower);
    if (!request) {
      throw new Error(`Active ClosingRequest not found for request ${requestId} and borrower ${borrower}`);
    }

    const quote = payoffQuotes.find(q => q.contractId === request.payoffQuoteCid);
    if (!quote) {
      throw new Error('PayoffQuote not found or already consumed');
    }

    const offer = replacementOffers.find(o => o.contractId === request.replacementOfferCid);
    if (!offer) {
      throw new Error('ReplacementOffer not found or already consumed');
    }

    // Expiry check: Canton contract deadline enforcement
    const nowIso = new Date().toISOString();
    if (quote.expiresAt < nowIso) {
      throw new Error(`PayoffQuote ${quote.contractId} has expired (expired at ${quote.expiresAt})`);
    }
    if (offer.expiresAt < nowIso) {
      throw new Error(`ReplacementOffer ${offer.contractId} has expired (expired at ${offer.expiresAt})`);
    }

    const borrowerCash = cashHoldings.find(c => c.contractId === request.borrowerCashCid);
    if (!borrowerCash || borrowerCash.amount < BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY) {
      throw new Error(`Borrower cash insufficient for $${BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY} equity contribution (available: $${borrowerCash ? borrowerCash.amount : 0})`);
    }

    const lenderBCash = cashHoldings.find(c => c.contractId === offer.lenderBCashCid);
    if (!lenderBCash || lenderBCash.amount < offer.newPrincipal) {
      throw new Error('Lender B committed cash holding unavailable or insufficient');
    }

    const loanAIndex = loansA.findIndex(l => l.contractId === request.loanACid);
    if (loanAIndex === -1) {
      throw new Error('Target Loan A contract not active');
    }
    const loanA = loansA[loanAIndex];

    const collateral = lockedCollaterals.find(c => c.contractId === request.collateralCid);
    if (!collateral || collateral.locker !== request.lenderA) {
      throw new Error('Collateral not locked to outgoing lender A');
    }

    // Amount reconciliation: incoming principal + borrower equity == payoff quote
    this.reconcileAmounts(offer.newPrincipal, BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY, quote.payoffAmount);

    return {
      request,
      quote,
      offer,
      borrowerCash,
      lenderBCash,
      loanA,
      loanAIndex,
      collateral,
    };
  }

  /**
   * Reconciles that the incoming sources equal outgoing requirements.
   */
  static reconcileAmounts(incomingPrincipal: number, borrowerEquity: number, requiredPayoff: number): void {
    const totalSources = incomingPrincipal + borrowerEquity;
    if (totalSources !== requiredPayoff) {
      throw new Error(
        `Reconciliation failure: Lender B's $${incomingPrincipal} + Borrower equity $${borrowerEquity} ($${totalSources}) does not match Payoff Quote $${requiredPayoff}`
      );
    }
  }

  /**
   * Settles cash movements atomically across borrower, lender B, and lender A.
   */
  static settleCashHoldings(
    ctx: AtomicClosingContext,
    cashHoldings: CashHolding[],
    generateId: (prefix: string) => string
  ): void {
    // 1. Deduct borrower equity contribution
    ctx.borrowerCash.amount -= BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY;

    // 2. Deduct lender B deployed capital and release allocation lock
    ctx.lenderBCash.amount -= ctx.offer.newPrincipal;
    ctx.lenderBCash.allocatedFor = null;

    // 3. Credit payoff funds to outgoing lender A
    let lenderACash = cashHoldings.find(c => c.owner === ctx.request.lenderA && c.instrument === INSTRUMENTS.CASH);
    if (lenderACash) {
      lenderACash.amount += ctx.quote.payoffAmount;
    } else {
      lenderACash = {
        contractId: generateId('cash'),
        owner: ctx.request.lenderA,
        operator: ctx.request.operator,
        instrument: INSTRUMENTS.CASH,
        amount: ctx.quote.payoffAmount,
        allocatedFor: null,
      };
      cashHoldings.push(lenderACash);
    }
  }

  /**
   * Repledges the collateral from outgoing lender A to incoming lender B.
   */
  static repledgeCollateral(collateral: LockedCollateralHolding, newLender: string): void {
    collateral.locker = newLender;
    collateral.context = 'LoanB-collateral';
  }

  /**
   * Instantiates the new Loan B facility under negotiated terms.
   */
  static originateLoanB(
    ctx: AtomicClosingContext,
    generateId: (prefix: string) => string
  ): LoanB {
    return {
      contractId: generateId('loanB'),
      borrower: ctx.request.borrower,
      lenderB: ctx.request.lenderB,
      operator: ctx.request.operator,
      principal: ctx.offer.newPrincipal,
      maturityDate: ctx.offer.maturityDate,
      collateralCid: ctx.collateral.contractId,
      capRate: ctx.offer.capRate,
      amortizationPeriods: ctx.offer.amortizationPeriods,
    };
  }

  /**
   * Creates an immutable closing receipt.
   */
  static issueClosingReceipt(
    ctx: AtomicClosingContext,
    loanBCid: string,
    generateId: (prefix: string) => string
  ): ClosingReceiptContract {
    return {
      contractId: generateId('receipt'),
      borrower: ctx.request.borrower,
      lenderA: ctx.request.lenderA,
      lenderB: ctx.request.lenderB,
      operator: ctx.request.operator,
      receipt: {
        loanBCid,
        closedAt: new Date().toISOString(),
        payoffAmount: ctx.quote.payoffAmount,
        newPrincipal: ctx.offer.newPrincipal,
        borrowerContribution: BASELINE_CONFIG.BORROWER_REQUIRED_EQUITY,
        collateralUnits: ctx.offer.collateralUnits,
      },
    };
  }
}
