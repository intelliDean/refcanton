// backend/src/types/ledger.ts
// Domain models and ledger contract interfaces for RefCanton

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

export interface PrivacyAudits {
  canSeeLoanA: boolean;
  canSeeLoanB: boolean;
  canSeeLenderARate: boolean;
  canSeeLenderBCapRate: boolean;
  canSeePayoffQuote: boolean;
  canSeeReplacementOffer: boolean;
}

export interface PartyLedgerState {
  party: string;
  cash: CashHolding[];
  collateral: LockedCollateralHolding[];
  loansA: LoanA[];
  loansB: LoanB[];
  payoffQuotes: PayoffQuote[];
  replacementOffers: ReplacementOffer[];
  closingRequests: ClosingRequest[];
  receipts: ClosingReceiptContract[];
  privacyAudits: PrivacyAudits;
}

export interface AtomicCloseResult {
  success: boolean;
  transactionId: string;
  receipt: ClosingReceiptContract;
  loanB: LoanB;
}
