// backend/src/services/privacyEngine.ts
// Canton sub-transaction privacy projection engine
// Projects active contracts and visible attributes strictly on a need-to-know basis.

import {
  CashHolding,
  LockedCollateralHolding,
  LoanA,
  LoanB,
  PayoffQuote,
  ReplacementOffer,
  ClosingRequest,
  ClosingReceiptContract,
  PartyLedgerState,
} from '../types/ledger';

export interface LedgerSnapshot {
  cashHoldings: CashHolding[];
  lockedCollaterals: LockedCollateralHolding[];
  loansA: LoanA[];
  loansB: LoanB[];
  payoffQuotes: PayoffQuote[];
  replacementOffers: ReplacementOffer[];
  closingRequests: ClosingRequest[];
  receipts: ClosingReceiptContract[];
}

export class CantonPrivacyEngine {
  /**
   * Projects active ledger state according to Canton sub-transaction privacy rules.
   *
   * Visibility Matrix:
   * - Borrower: Sees all contracts directly involving them.
   * - Lender A: Sees Loan A, Payoff Quote, collateral while locked to A, received payoff cash, receipts.
   *             Cannot see Loan B, Cap Rate, or Replacement Offer.
   * - Lender B: Sees Loan B, Replacement Offer, collateral when repledged to B, deployed cash, receipts.
   *             Cannot see Loan A historical rate or Payoff Quote.
   * - Operator: System orchestrator view (all contracts).
   */
  static projectState(party: string, snapshot: LedgerSnapshot): PartyLedgerState {
    const p = party.toLowerCase();
    const isBorrower = p === 'borrower';
    const isLenderA = p === 'lendera';
    const isLenderB = p === 'lenderb';
    const isOperator = p === 'operator';

    // 1. Cash Holdings: visible to owner or allocated party
    const cash = snapshot.cashHoldings.filter(c => {
      if (isOperator) return true;
      if (c.owner.toLowerCase() === p) return true;
      if (c.allocatedFor && c.allocatedFor.toLowerCase() === p) return true;
      return false;
    });

    // 2. Collateral Holdings: visible to owner (Borrower) or active locker
    const collateral = snapshot.lockedCollaterals.filter(c => {
      if (isOperator || isBorrower) return true;
      return c.locker.toLowerCase() === p;
    });

    // 3. Loan A: visible to Borrower, Lender A, and Operator. Lender B CANNOT SEE.
    const loansA = (isBorrower || isLenderA || isOperator) ? snapshot.loansA : [];

    // 4. Loan B: visible to Borrower, Lender B, and Operator. Lender A CANNOT SEE.
    const loansB = (isBorrower || isLenderB || isOperator) ? snapshot.loansB : [];

    // 5. Payoff Quote: visible to Borrower and Lender A. Lender B CANNOT SEE.
    const payoffQuotes = (isBorrower || isLenderA || isOperator) ? snapshot.payoffQuotes : [];

    // 6. Replacement Offer: visible to Borrower and Lender B. Lender A CANNOT SEE.
    const replacementOffers = (isBorrower || isLenderB || isOperator) ? snapshot.replacementOffers : [];

    // 7. Closing Requests: visible to direct participants
    const closingRequests = (isBorrower || isLenderA || isLenderB || isOperator) ? snapshot.closingRequests : [];

    // 8. Receipts: visible to all counterparties
    const receipts = snapshot.receipts;

    return {
      party,
      cash,
      collateral,
      loansA,
      loansB,
      payoffQuotes,
      replacementOffers,
      closingRequests,
      receipts,
      privacyAudits: {
        canSeeLoanA: loansA.length > 0,
        canSeeLoanB: loansB.length > 0,
        canSeeLenderARate: isBorrower || isLenderA || isOperator,
        canSeeLenderBCapRate: isBorrower || isLenderB || isOperator,
        canSeePayoffQuote: payoffQuotes.length > 0,
        canSeeReplacementOffer: replacementOffers.length > 0,
      },
    };
  }
}
