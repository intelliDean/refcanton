// backend/src/services/ledgerStore.ts
// Active contract storage, ID sequencing, and audit trail ledger

import {
  CashHolding,
  LockedCollateralHolding,
  LoanA,
  LoanB,
  PayoffQuote,
  ReplacementOffer,
  ClosingRequest,
  ClosingReceiptContract,
  LedgerTransaction,
} from '../types/ledger';
import { INSTRUMENTS, DEFAULT_PARTIES, BASELINE_CONFIG } from '../config/constants';

export class LedgerStore {
  private idCounter = 100;

  cashHoldings: CashHolding[] = [];
  lockedCollaterals: LockedCollateralHolding[] = [];
  loansA: LoanA[] = [];
  loansB: LoanB[] = [];
  payoffQuotes: PayoffQuote[] = [];
  replacementOffers: ReplacementOffer[] = [];
  closingRequests: ClosingRequest[] = [];
  receipts: ClosingReceiptContract[] = [];
  transactionHistory: LedgerTransaction[] = [];

  constructor() {
    this.resetToInitialState();
  }

  nextId(prefix: string): string {
    this.idCounter += 1;
    return `#${prefix}-${this.idCounter}`;
  }

  recordTx(actingParty: string, action: string, description: string, details?: Record<string, unknown>): string {
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
      owner: DEFAULT_PARTIES.BORROWER,
      operator: DEFAULT_PARTIES.OPERATOR,
      instrument: INSTRUMENTS.CASH,
      amount: BASELINE_CONFIG.BORROWER_INITIAL_CASH,
      allocatedFor: null,
    });

    // 2. Lender B cash: 100,000 USD-TEST ready to deploy
    this.cashHoldings.push({
      contractId: this.nextId('cash'),
      owner: DEFAULT_PARTIES.LENDER_B,
      operator: DEFAULT_PARTIES.OPERATOR,
      instrument: INSTRUMENTS.CASH,
      amount: BASELINE_CONFIG.LENDER_B_INITIAL_CASH,
      allocatedFor: null,
    });

    // 3. 150 COLLAT-TEST units locked to Lender A securing Loan A
    const colId = this.nextId('collat');
    this.lockedCollaterals.push({
      contractId: colId,
      owner: DEFAULT_PARTIES.BORROWER,
      operator: DEFAULT_PARTIES.OPERATOR,
      locker: DEFAULT_PARTIES.LENDER_A,
      instrument: INSTRUMENTS.COLLATERAL,
      amount: BASELINE_CONFIG.COLLATERAL_UNITS,
      context: 'LoanA-collateral',
    });

    // 4. Loan A: $101,000 principal at 8.5% bullet
    this.loansA.push({
      contractId: this.nextId('loanA'),
      borrower: DEFAULT_PARTIES.BORROWER,
      lenderA: DEFAULT_PARTIES.LENDER_A,
      operator: DEFAULT_PARTIES.OPERATOR,
      principal: BASELINE_CONFIG.LOAN_A_PRINCIPAL,
      maturityDate: BASELINE_CONFIG.LOAN_A_MATURITY,
      collateralCid: colId,
      annualRate: BASELINE_CONFIG.LOAN_A_RATE,
      originationDate: BASELINE_CONFIG.LOAN_A_ORIGINATION,
    });

    this.recordTx(
      'System',
      'INITIALIZE',
      'Ledger reset to baseline fixed example state (LoanA: $101k, 150 collateral locked to A, Borrower: $5k, LenderB: $100k)'
    );
  }
}
