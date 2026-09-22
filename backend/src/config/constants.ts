// backend/src/config/constants.ts
// Financial instruments, baseline amounts, and network defaults

export const INSTRUMENTS = {
  CASH: 'USD-TEST',
  COLLATERAL: 'COLLAT-TEST',
} as const;

export const DEFAULT_PARTIES = {
  OPERATOR: 'Operator',
  BORROWER: 'Borrower',
  LENDER_A: 'LenderA',
  LENDER_B: 'LenderB',
} as const;

export const BASELINE_CONFIG = {
  BORROWER_INITIAL_CASH: 5000.0,
  BORROWER_REQUIRED_EQUITY: 1000.0,
  LENDER_B_INITIAL_CASH: 100000.0,
  LOAN_A_PRINCIPAL: 101000.0,
  LOAN_A_RATE: 0.085, // 8.5% Bullet
  LOAN_A_MATURITY: '2027-06-30',
  LOAN_A_ORIGINATION: '2024-06-30',
  LOAN_B_PRINCIPAL: 100000.0,
  LOAN_B_CAP_RATE: 0.075, // 7.5% Cap Rate Amortizing
  LOAN_B_MATURITY: '2029-12-31',
  LOAN_B_AMORTIZATION_PERIODS: 24,
  COLLATERAL_UNITS: 150.0,
  QUOTE_EXPIRY_DAYS: 2,
} as const;
